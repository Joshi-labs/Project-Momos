import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ConfigBanner from './components/ConfigBanner';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Menu from './pages/Menu';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
          {/* Banner if Supabase env credentials are not set */}
          <ConfigBanner />

          {/* Mobile-First Header */}
          <Navbar />

          {/* Responsive App Container (Mobile & PC Friendly) */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/auth" element={<Auth />} />

              {/* User Protected Route (QR code landing & stamp card) */}
              <Route
                path="/user"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Route (10s auto-polling food truck queue) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Bottom Footer */}
          <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-zinc-300">
                  Momo Food Truck • Digital Loyalty Card
                </span>
              </div>
              <div className="flex items-center gap-4 text-zinc-400 text-xs">
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
      </HashRouter>
    </AuthProvider>
  );
}