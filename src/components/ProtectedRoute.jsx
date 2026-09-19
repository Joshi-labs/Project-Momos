import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="text-xs font-bold tracking-widest uppercase">[ LOADING SESSION // PLEASE WAIT ]</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center font-mono">
        <div className="bg-[#12141a] border-2 border-red-700/80 rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)]">
          <div className="w-14 h-14 rounded-lg bg-red-950 border-2 border-red-700 mx-auto flex items-center justify-center text-red-400 mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-red-400 text-xs font-bold uppercase tracking-wider block mb-1">
            // ACCESS RESTRICTED // 403
          </span>
          <h2 className="text-xl font-black text-white uppercase mb-2">Chef Admin Required</h2>
          <p className="text-xs text-zinc-400 font-sans max-w-sm mx-auto mb-6 leading-relaxed">
            This verification console is restricted to food truck managers and staff. Your account ({user.email}) is currently set as customer role.
          </p>

          <div className="space-y-4 text-left">
            <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <span className="text-amber-400 font-bold block mb-1">SQL COMMAND TO PROMOTE TO ADMIN:</span>
              <code className="text-zinc-200 block overflow-x-auto bg-black/40 p-2 rounded border border-zinc-800">
                UPDATE profiles SET role = &apos;admin&apos; WHERE id = &apos;{user.id}&apos;;
              </code>
            </div>

            <Link
              to="/user"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Customer Stamp Card</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
