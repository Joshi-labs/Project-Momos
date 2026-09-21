import PocketBase from 'pocketbase';

// Default to the provided production PocketBase URL, or environment override if provided
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://pb.momoos.shop';

export const pb = new PocketBase(PB_URL);

// Helper to format PocketBase errors into human-readable strings
export function formatPbError(err) {
  if (!err) return 'An unexpected error occurred.';
  if (err.data && typeof err.data === 'object' && Object.keys(err.data).length > 0) {
    const fieldErrors = Object.entries(err.data)
      .map(([field, detail]) => {
        if (typeof detail === 'object' && detail.message) {
          return `${field}: ${detail.message}`;
        }
        return `${field}: ${detail}`;
      })
      .join(', ');
    if (fieldErrors) return `${err.message || 'Error'}: ${fieldErrors}`;
  }
  return err.message || 'PocketBase request failed.';
}

// Target collection name: 'stamps' (with fallback support for 'tickets')
const STAMPS_COLLECTION = 'stamps';

export const api = {
  // Auth API
  async login(identity, password) {
    try {
      const authData = await pb.collection('users').authWithPassword(identity, password);
      return { token: authData.token, user: authData.record };
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async register(email, password, passwordConfirm, name) {
    try {
      const record = await pb.collection('users').create({
        email,
        password,
        passwordConfirm: passwordConfirm || password,
        name: name || '',
        role: 'user',
      });
      return { success: true, record };
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  // Same-window OAuth2 redirect flow (no popup)
  // Step 1: Redirect user to Google in the same tab
  async loginWithGoogleRedirect() {
    try {
      const authMethods = await pb.collection('users').listAuthMethods();
      const providers = authMethods?.oauth2?.providers || [];
      const google = providers.find((p) => p.name === 'google');
      if (!google) {
        throw new Error('Google OAuth2 is not configured in PocketBase. Enable it in Settings → Auth providers.');
      }

      // Use our app's URL as the redirect target (same window)
      const redirectUrl = window.location.origin + window.location.pathname;

      // Store verifier + provider so we can complete the exchange when Google sends us back
      localStorage.setItem('pb_oauth_provider', google.name);
      localStorage.setItem('pb_oauth_verifier', google.codeVerifier);
      localStorage.setItem('pb_oauth_redirect', redirectUrl);

      // Rewrite redirect_uri in the auth URL to point back to our app
      const authUrl = new URL(google.authURL);
      authUrl.searchParams.set('redirect_uri', redirectUrl);

      // Navigate in the same tab
      window.location.href = authUrl.toString();
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  // Step 2: Called on page load to complete the OAuth exchange if code is present
  async handleOAuthRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return null;

    const provider = localStorage.getItem('pb_oauth_provider');
    const codeVerifier = localStorage.getItem('pb_oauth_verifier');
    const redirectUrl = localStorage.getItem('pb_oauth_redirect');

    if (!provider || !codeVerifier || !redirectUrl) {
      // No stored OAuth state — clear the URL and bail
      window.history.replaceState({}, '', window.location.pathname + (window.location.hash || ''));
      return null;
    }

    // Clean up stored OAuth state
    localStorage.removeItem('pb_oauth_provider');
    localStorage.removeItem('pb_oauth_verifier');
    localStorage.removeItem('pb_oauth_redirect');

    // Clean the URL so the code doesn't linger
    window.history.replaceState({}, '', window.location.pathname + '#/user');

    try {
      const authData = await pb.collection('users').authWithOAuth2Code(
        provider,
        code,
        codeVerifier,
        redirectUrl,
        { role: 'user' }, // createData for new users
      );
      return { token: authData.token, user: authData.record };
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  // Legacy alias kept for compatibility
  async loginWithGoogle() {
    return this.loginWithGoogleRedirect();
  },

  async getMe() {
    try {
      if (!pb.authStore.isValid) return null;
      const refreshed = await pb.collection('users').authRefresh();
      return refreshed.record;
    } catch {
      return pb.authStore.record || null;
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
      try {
        return await pb.collection(STAMPS_COLLECTION).create({
          user: pb.authStore.record.id,
          category,
          status: 'pending',
        });
      } catch (err) {
        // Fallback to 'tickets' collection if 'stamps' collection does not exist yet
        if (err.status === 404) {
          return await pb.collection('tickets').create({
            user: pb.authStore.record.id,
            category,
            status: 'pending',
          });
        }
        throw err;
      }
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async getMyStamps() {
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return [];
    }
    try {
      try {
        return await pb.collection(STAMPS_COLLECTION).getFullList({
          filter: pb.filter('user = {:userId}', { userId: pb.authStore.record.id }),
          sort: '-created',
        });
      } catch (err) {
        if (err.status === 404) {
          return await pb.collection('tickets').getFullList({
            filter: pb.filter('user = {:userId}', { userId: pb.authStore.record.id }),
            sort: '-created',
          });
        }
        throw err;
      }
    } catch (err) {
      console.error('Error getting stamps:', formatPbError(err));
      return [];
    }
  },

  async getAdminPendingStamps() {
    try {
      try {
        return await pb.collection(STAMPS_COLLECTION).getFullList({
          filter: 'status = "pending"',
          sort: 'created',
          expand: 'user',
        });
      } catch (err) {
        if (err.status === 404) {
          return await pb.collection('tickets').getFullList({
            filter: 'status = "pending"',
            sort: 'created',
            expand: 'user',
          });
        }
        throw err;
      }
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async getAdminHistoryStamps(limit = 30) {
    try {
      try {
        const result = await pb.collection(STAMPS_COLLECTION).getList(1, limit, {
          filter: 'status != "pending"',
          sort: '-updated',
          expand: 'user',
        });
        return result.items || [];
      } catch (err) {
        if (err.status === 404) {
          const result = await pb.collection('tickets').getList(1, limit, {
            filter: 'status != "pending"',
            sort: '-updated',
            expand: 'user',
          });
          return result.items || [];
        }
        throw err;
      }
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  async updateStampStatus(stampId, status) {
    try {
      try {
        return await pb.collection(STAMPS_COLLECTION).update(stampId, { status });
      } catch (err) {
        if (err.status === 404) {
          return await pb.collection('tickets').update(stampId, { status });
        }
        throw err;
      }
    } catch (err) {
      throw new Error(formatPbError(err));
    }
  },

  // Real-time SSE subscriptions
  subscribeStamps(callback) {
    try {
      try {
        return pb.collection(STAMPS_COLLECTION).subscribe('*', callback);
      } catch {
        return pb.collection('tickets').subscribe('*', callback);
      }
    } catch (err) {
      console.warn('Real-time subscription notice:', err);
      return null;
    }
  },

  unsubscribeStamps() {
    try {
      pb.collection(STAMPS_COLLECTION).unsubscribe('*');
      pb.collection('tickets').unsubscribe('*');
    } catch (err) {
      console.warn('Unsubscribe error:', err);
    }
  },

  // Backward-compatibility aliases for tickets
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
