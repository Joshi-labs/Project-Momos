import React from 'react';
import { AlertCircle } from 'lucide-react';
import { isSupabaseConfigured } from '../supabaseClient';

export default function ConfigBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Supabase Setup Needed:</strong> Add your Supabase URL &amp; Key in{' '}
            <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 font-mono">.env</code>
          </span>
        </div>
      </div>
    </div>
  );
}
