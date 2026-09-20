import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import ConfigBanner from './components/ConfigBanner';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

import Home from './pages/Home';
import Menu from './pages/Menu';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes from Supabase (SIGNED_IN / INITIAL_SESSION)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.hash = '#/user';
        navigate('/user', { replace: true });
      } else if (event === 'INITIAL_SESSION' && session && window.location.hash.includes('access_token')) {
        window.location.hash = '#/user';
        navigate('/user', { replace: true });
      }
    });

    // Secondary fallback in case hash wasn't cleared before mount
    if (window.location.hash && window.location.hash.includes('access_token')) {
      const hash = window.location.hash.replace(/^[#/]+/, '');
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          .then(({ data }) => {
            if (data?.session) {
              window.location.hash = '#/user';
              navigate('/user', { replace: true });
            }
          });
      }
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
      {/* Banner if Supabase env credentials are not set */}
      <ConfigBanner />

      {/* Responsive Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/auth" element={<Auth />} />

          {/* User Protected Route */}
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route - wait for session resolution if OAuth tokens in hash */}
          <Route
            path="*"
            element={
              window.location.hash.includes('access_token') ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center font-mono text-xs text-amber-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-400" />
                  <span className="font-bold tracking-wider uppercase">[ VERIFYING GOOGLE SESSION... ]</span>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="font-semibold text-zinc-300">
              Momo Food Truck • Digital Loyalty Card
            </span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400 text-xs font-mono">
            <span>Buy 5 Plates = 1 Free Plate</span>
            <span>•</span>
            <a
              href="https://momos.vpjoshi.in"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 font-mono"
            >
              momos.vpjoshi.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}
