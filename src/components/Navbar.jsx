import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Flame, UtensilsCrossed, Award, LogOut, LogIn, Menu, X } from 'lucide-react';

function NavbarContent({ currentPath = '' }) {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setMobileMenuOpen(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getIsActive = (path) => {
    const activePath = (currentPath || (typeof window !== 'undefined' ? window.location.pathname : '')).replace(/\/$/, '') || '/';
    const targetPath = path.replace(/\/$/, '') || '/';
    return activePath === targetPath;
  };

  const getNavLinkClass = (path) => {
    const active = getIsActive(path);
    return `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase font-mono transition-all border ${
      active
        ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
        : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
    }`;
  };

  const getMobileNavLinkClass = (path) => {
    const active = getIsActive(path);
    return `flex items-center justify-between px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all border ${
      active
        ? 'bg-amber-400 text-black border-amber-400'
        : 'text-zinc-300 hover:text-white bg-zinc-900 border-zinc-800'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0d0e12]/95 backdrop-blur-sm border-b-2 border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="/"
          className="flex items-center gap-3 group transition-transform active:scale-95"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-400 text-black border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
            <Flame className="w-6 h-6 fill-black" />
          </div>
          <div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white block uppercase leading-none font-mono">
              MOMOOS TRUCK
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          <a href="/" className={getNavLinkClass('/')}>
            <Flame className="w-3.5 h-3.5" />
            Home
          </a>

          <a href="/menu" className={getNavLinkClass('/menu')}>
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Menu
          </a>

          <a href="/user" className={getNavLinkClass('/user')}>
            <Award className="w-3.5 h-3.5" />
            Stamps
          </a>
        </nav>

        {/* Desktop User / Auth controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161820] border border-zinc-700/80 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-zinc-200 truncate max-w-[160px]">{user.email}</span>
                {profile?.role === 'admin' && (
                  <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-700 font-black">
                    ADMIN
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-300 hover:text-white active:scale-95 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit
              </button>
            </div>
          ) : (
            <a
              href="/auth"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs font-mono tracking-wider uppercase border border-amber-300 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </a>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white active:scale-90 transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto px-4 pb-4 pt-3 bg-[#0d0e12] border-b-2 border-zinc-800">
          <nav className="flex flex-col gap-2">
            <a href="/" className={getMobileNavLinkClass('/')} onClick={() => setMobileMenuOpen(false)}>
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Home Truck
              </span>
              <span>→</span>
            </a>

            <a href="/menu" className={getMobileNavLinkClass('/menu')} onClick={() => setMobileMenuOpen(false)}>
              <span className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                Food Truck Menu
              </span>
              <span>→</span>
            </a>

            <a href="/user" className={getMobileNavLinkClass('/user')} onClick={() => setMobileMenuOpen(false)}>
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                My Stamp Card
              </span>
              <span>→</span>
            </a>

            <div className="pt-2 mt-2 border-t border-zinc-800">
              {user ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="truncate max-w-[190px]">
                    <span className="text-xs font-mono font-bold text-zinc-200 block truncate">
                      {user.email}
                    </span>
                    <span className="text-[10px] text-amber-400 uppercase font-mono">
                      Role: {profile?.role || 'Member'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-red-400 font-bold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <a
                  href="/auth"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-amber-400 text-black font-black font-mono text-xs uppercase"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In / Create Account
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default function Navbar(props) {
  return (
    <AuthProvider>
      <NavbarContent {...props} />
    </AuthProvider>
  );
}
