import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, pb } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sync React state on any PocketBase auth change (login, logout, refresh)
    const unsubscribe = pb.authStore.onChange((token, record) => {
      setUser(record);
    }, true);

    // Initial check: if valid token exists, attempt refresh in background to verify validity
    const verifySession = async () => {
      if (pb.authStore.isValid && pb.authStore.token) {
        try {
          const freshUser = await api.getMe();
          setUser(freshUser);
        } catch {
          // Token expired or invalidated
          api.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifySession();

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    return res;
  };

  const signUp = async (email, password, passwordConfirm, name) => {
    const res = await api.register(email, password, passwordConfirm, name);
    if (res && res.success) {
      // Auto sign-in after registration
      return await signIn(email, password);
    }
    return res;
  };

  const signInWithGoogle = async () => {
    const res = await api.loginWithGoogle();
    setUser(res.user);
    return res;
  };

  const signOut = () => {
    api.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const fresh = await api.getMe();
      if (fresh) {
        setUser(fresh);
      }
    } catch (e) {
      console.warn('Could not refresh profile:', e);
    }
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    profile: user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshProfile,
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
