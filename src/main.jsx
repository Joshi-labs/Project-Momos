import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { supabase } from './supabaseClient';

// Intercept Supabase OAuth hash tokens before HashRouter parses the route
if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token=')) {
  try {
    const hash = window.location.hash.replace(/^[#/]+/, '');
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      // Rewrite hash cleanly to #/user so HashRouter routes directly to /user
      window.location.hash = '#/user';
    }
  } catch (err) {
    console.error('Failed to parse OAuth hash:', err);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
