// Fast, lightweight API client connecting to Python FastAPI + PostgreSQL backend

const API_URL = import.meta.env.PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'https://api.momoos.shop';

const TOKEN_KEY = 'momo_auth_token';
const USER_KEY = 'momo_auth_user';

// In-memory ETag cache for conditional GET requests: cacheKey -> { etag, data }
const etagCache = new Map();

export function clearApiCache() {
  etagCache.clear();
}

// In-memory + LocalStorage Auth Store emulating session state
class SimpleAuthStore {
  constructor() {
    this.listeners = new Set();
  }

  get token() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  get record() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  get isValid() {
    return Boolean(this.token && this.record);
  }

  save(token, record) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (record) localStorage.setItem(USER_KEY, JSON.stringify(record));
    } catch (e) {
      console.warn('Could not save auth to localStorage:', e);
    }
    this._notify(token, record);
  }

  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Could not clear auth in localStorage:', e);
    }
    etagCache.clear();
    this._notify('', null);
  }

  onChange(callback, fireImmediately = false) {
    this.listeners.add(callback);
    if (fireImmediately) {
      callback(this.token, this.record);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  _notify(token, record) {
    for (const listener of this.listeners) {
      try {
        listener(token, record);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    }
  }
}

export const pb = {
  authStore: new SimpleAuthStore(),
};

// Helper to format API errors into human-readable strings
export function formatPbError(err) {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') return err;
  return err.message || 'Request failed. Please check the backend connection.';
}

export const formatError = formatPbError;

// Internal fetch request wrapper with auth header injection and ETag conditional GET
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = pb.authStore.token;
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Cache key is partitioned by user token and URL
  const cacheKey = `${token || 'anon'}:${url}`;

  if (method === 'GET') {
    const cached = etagCache.get(cacheKey);
    if (cached?.etag) {
      headers['If-None-Match'] = cached.etag;
    }
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new Error(
      `Unable to reach the server at ${API_URL}. Please check your connection and try again.`
    );
  }

  // HTTP 304 Not Modified: Return existing cached data directly without payload download
  if (response.status === 304) {
    const cached = etagCache.get(cacheKey);
    if (cached) {
      const newEtag = response.headers.get('etag');
      if (newEtag) cached.etag = newEtag;
      return cached.data;
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === 'object' && (data.detail || data.message || data.error)) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  if (method === 'GET') {
    const etag = response.headers.get('etag');
    if (etag) {
      etagCache.set(cacheKey, { etag, data });
    }
  } else {
    // If mutating records, clear stamp cache so next GET fetches fresh state
    for (const key of etagCache.keys()) {
      if (key.includes('/stamps') || key.includes('/admin/stamps')) {
        etagCache.delete(key);
      }
    }
  }

  return data;
}

// Local event subscriber bus for instant UI reaction across claims and approvals
const stampSubscribers = new Set();
function notifyStampSubscribers(event) {
  for (const cb of stampSubscribers) {
    try {
      cb(event);
    } catch (e) {
      console.error('Subscriber callback error:', e);
    }
  }
}

export const api = {
  // Auth API
  async login(identity, password) {
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: identity, password }),
      });
      pb.authStore.save(data.token, data.user);
      return { token: data.token, user: data.user };
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async register(email, password, passwordConfirm, name) {
    if (passwordConfirm && password !== passwordConfirm) {
      throw new Error('Passwords do not match.');
    }
    try {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      return { success: true, record: data.record };
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async loginWithGoogleRedirect() {
    try {
      const redirectUri = `${window.location.origin}/auth`;
      const data = await request(`/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`, {
        method: 'GET',
      });
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to obtain Google authentication URL from server.');
      }
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async handleOAuthRedirect() {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      window.history.replaceState({}, document.title, window.location.pathname);
      throw new Error(`Google authentication was cancelled or failed (${error}).`);
    }

    if (!code) return null;

    // Clean URL query parameters immediately to avoid re-exchanging one-time code on reload
    window.history.replaceState({}, document.title, window.location.pathname);

    const redirectUri = `${window.location.origin}/auth`;
    try {
      const data = await request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          code,
          redirect_uri: redirectUri,
        }),
      });
      if (data && data.token && data.user) {
        pb.authStore.save(data.token, data.user);
        return { token: data.token, user: data.user };
      }
      throw new Error('Invalid authentication response from server.');
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async loginWithGoogle() {
    return this.loginWithGoogleRedirect();
  },

  async getMe() {
    if (!pb.authStore.isValid) return null;
    try {
      const user = await request('/auth/me', { method: 'GET' });
      pb.authStore.save(pb.authStore.token, user);
      return user;
    } catch {
      pb.authStore.clear();
      return null;
    }
  },

  logout() {
    pb.authStore.clear();
  },

  getStoredSession() {
    if (pb.authStore.isValid && pb.authStore.record) {
      return {
        token: pb.authStore.token,
        user: pb.authStore.record,
      };
    }
    return null;
  },

  // Stamps API
  async claimStamp(category) {
    if (!pb.authStore.isValid || !pb.authStore.record) {
      throw new Error('You must be logged in to claim a stamp.');
    }
    try {
      const stamp = await request('/stamps/claim', {
        method: 'POST',
        body: JSON.stringify({ category }),
      });
      notifyStampSubscribers({ action: 'create', record: stamp });
      return stamp;
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async getMyStamps() {
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return [];
    }
    try {
      return await request('/stamps/my', { method: 'GET' });
    } catch (err) {
      console.error('Error getting stamps:', formatPbError(err));
      return [];
    }
  },

  async getAdminPendingStamps() {
    try {
      return await request('/admin/stamps/pending', { method: 'GET' });
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async getAdminHistoryStamps(limit = 30) {
    try {
      return await request(`/admin/stamps/history?limit=${limit}`, { method: 'GET' });
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async updateStampStatus(stampId, status) {
    try {
      const stamp = await request(`/admin/stamps/${stampId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      notifyStampSubscribers({ action: 'update', record: stamp });
      return stamp;
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  // Real-time notification callbacks
  subscribeStamps(callback) {
    stampSubscribers.add(callback);
    return () => {
      stampSubscribers.delete(callback);
    };
  },

  unsubscribeStamps() {
    stampSubscribers.clear();
  },

  // Backward-compatibility aliases
  claimTicket(category) {
    return this.claimStamp(category);
  },
  getMyTickets() {
    return this.getMyStamps();
  },
  getAdminPendingTickets() {
    return this.getAdminPendingStamps();
  },
  getAdminHistoryTickets(limit) {
    return this.getAdminHistoryStamps(limit);
  },
  updateTicketStatus(ticketId, status) {
    return this.updateStampStatus(ticketId, status);
  },
  subscribeTickets(callback) {
    return this.subscribeStamps(callback);
  },
  unsubscribeTickets() {
    return this.unsubscribeStamps();
  },
};
