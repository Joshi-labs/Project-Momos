import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame, Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle, CheckCircle2, Award, QrCode } from 'lucide-react';

export default function Auth() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/user', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp && password !== passwordConfirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, passwordConfirm, name);
        navigate('/user', { replace: true });
      } else {
        await signIn(email, password);
        navigate('/user', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate('/user', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed. Ensure Google OAuth2 is configured in PocketBase.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="py-6 sm:py-12 max-w-4xl mx-auto font-mono">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Brand Story & Loyalty Highlights */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <div className="w-12 h-12 rounded-lg bg-amber-400 text-black border-2 border-black flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]">
            <Flame className="w-7 h-7 fill-black" />
          </div>

          <div className="space-y-1.5">
            <span className="text-amber-400 text-xs font-black uppercase tracking-wider block">
              // MEMBER LOGIN TERMINAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Momo Food Truck Pass
            </h1>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Sign in to collect stamps every time you grab a plate of momos at the truck counter.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 bg-[#12141a] border-2 border-zinc-800 p-3.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
              <Award className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white uppercase block">5 Stamps = 1 Free Plate</span>
                <span className="text-[11px] text-zinc-400 font-sans">Accumulate stamps across Steam Veg, Afghani, or Fried.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#12141a] border-2 border-zinc-800 p-3.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
              <QrCode className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white uppercase block">Live Counter Verification</span>
                <span className="text-[11px] text-zinc-400 font-sans">Chef accepts claims directly on their counter screen.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Boxy Auth Card */}
        <div className="lg:col-span-7">
          <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)]">
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1.5 rounded-lg border-2 border-zinc-800 mb-6 font-mono">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded transition-all ${
                  !isSignUp
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                [ Sign In ]
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded transition-all ${
                  isSignUp
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                [ Create Pass ]
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/80 border-2 border-red-700 flex items-start gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border-2 border-emerald-700 flex items-start gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 text-white font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 mb-5 transition-all"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center my-5">
              <div className="border-t-2 border-dashed border-zinc-800 w-full" />
              <span className="bg-[#12141a] px-3 text-[10px] uppercase tracking-widest text-zinc-500 font-bold absolute">
                OR WITH EMAIL
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1.5">
                    Your Name (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      autoComplete="name"
                      className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
                  />
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Loyalty Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Stamp Card</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
