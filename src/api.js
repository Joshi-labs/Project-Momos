import PocketBase from 'pocketbase';

// In production, FastAPI serves both static frontend and /api from the same host
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8090');

export const pb = new PocketBase(PB_URL);

// Helper for authenticated fetch requests to FastAPI backend
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('momo_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth API
  async login(identity, password) {
    // 1. Try FastAPI auth endpoint
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identity, password }),
      });
      if (res.token) {
        localStorage.setItem('momo_auth_token', res.token);
        localStorage.setItem('momo_user_data', JSON.stringify(res.user));
        pb.authStore.save(res.token, res.user);
        return { token: res.token, user: res.user };
      }
    } catch (apiErr) {
      // Fallback directly to PocketBase SDK if backend is in maintenance
      try {
        const authData = await pb.collection('users').authWithPassword(identity, password);
        localStorage.setItem('momo_auth_token', authData.token);
        localStorage.setItem('momo_user_data', JSON.stringify(authData.record));
        return { token: authData.token, user: authData.record };
      } catch {
        throw apiErr;
      }
    }
  },

  async register(email, password, name) {
    return await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  async getMe() {
    return await apiFetch('/api/auth/me');
  },

  logout() {
    localStorage.removeItem('momo_auth_token');
    localStorage.removeItem('momo_user_data');
    pb.authStore.clear();
  },

  getStoredSession() {
    const token = localStorage.getItem('momo_auth_token');
    const userStr = localStorage.getItem('momo_user_data');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return { token, user };
      } catch {
        return null;
      }
    }
    return null;
  },

  // Tickets API
  async claimTicket(category) {
    return await apiFetch('/api/tickets/claim', {
      method: 'POST',
      body: JSON.stringify({ category }),
    });
  },

  async getMyTickets() {
    const data = await apiFetch('/api/tickets/my');
    return data.tickets || [];
  },

  async getAdminPendingTickets() {
    const data = await apiFetch('/api/tickets/admin/pending');
    return data.pending || [];
  },

  async getAdminHistoryTickets(limit = 30) {
    const data = await apiFetch(`/api/tickets/admin/history?limit=${limit}`);
    return data.history || [];
  },

  async updateTicketStatus(ticketId, status) {
    return await apiFetch(`/api/tickets/admin/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getStatsSummary() {
    return await apiFetch('/api/stats/summary');
  },
};
