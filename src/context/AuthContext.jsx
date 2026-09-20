import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, pb } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage or PocketBase authStore
  useEffect(() => {
    const initSession = async () => {
      const stored = api.getStoredSession();
      if (stored && stored.user) {
        setUser(stored.user);
        setProfile({
          id: stored.user.id,
          email: stored.user.email,
          name: stored.user.name,
          role: stored.user.role || 'user',
        });

        // Optionally verify / refresh profile in the background
        try {
          const fresh = await api.getMe();
          if (fresh && fresh.id) {
            setUser((prev) => ({ ...prev, ...fresh }));
            setProfile(fresh);
          }
        } catch {
          // If token expired, clear session
          // api.logout();
          // setUser(null);
          // setProfile(null);
        }
      }
      setLoading(false);
    };

    initSession();
  }, []);

  const signIn = async (email, password) => {
    const res = await api.login(email, password);
    if (res && res.user) {
      setUser(res.user);
      const userProfile = {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role || 'user',
      };
      setProfile(userProfile);
      return res;
    }
  };

  const signUp = async (email, password, name) => {
    const res = await api.register(email, password, name);
    // After registration, auto-login
    if (res && res.success) {
      return await signIn(email, password);
    }
    return res;
  };

  const signInWithGoogle = async () => {
    try {
      // Direct PocketBase OAuth2 flow
      const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });
      if (authData?.token) {
        localStorage.setItem('momo_auth_token', authData.token);
        localStorage.setItem('momo_user_data', JSON.stringify(authData.record));
        setUser(authData.record);
        setProfile({
          id: authData.record.id,
          email: authData.record.email,
          role: authData.record.role || 'user',
        });
      }
      return authData;
    } catch (err) {
      console.error('Google OAuth error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    api.logout();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const fresh = await api.getMe();
      if (fresh && fresh.id) {
        setUser((prev) => ({ ...prev, ...fresh }));
        setProfile(fresh);
      }
    } catch (e) {
      console.warn('Could not refresh profile:', e);
    }
  };

  const isAdmin = (profile?.role === 'admin') || (user?.role === 'admin');

  const value = {
    user,
    profile,
    isAdmin,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshProfile,
    isSupabaseConfigured: true, // Compatibility flag for existing UI banners
    isConfigured: true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
