import React from 'react';
import { Link } from 'react-router-dom';
import { Award, QrCode, UtensilsCrossed, ChevronRight, Sparkles, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-10 pb-16">
      {/* Boxy Modern Split Hero */}
      <section className="relative rounded-2xl bg-[#111319] border-2 border-zinc-800 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Bold Headline & Kick Action */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-700 font-mono text-[11px] font-bold text-amber-400 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DIGITAL LOYALTY CARD // v2.0</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] uppercase font-mono">
              Eat Hot Momos. <br />
              <span className="bg-amber-400 text-black px-2 py-0.5 inline-block my-1">
                Collect 5 Stamps.
              </span> <br />
              Get 1 Free Plate.
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              No torn paper cards. Order Steam Veg, Afghani, or Fried momos at the food truck, tap claim on your phone, and get stamped instantly by the chef.
            </p>

            {/* Boxy Tactile Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 font-mono">
              <Link
                to={user ? '/user' : '/auth'}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>{user ? 'Open Stamp Card' : 'Sign In & Collect Stamps'}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                to="/menu"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 text-white font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                <span>View Truck Menu</span>
              </Link>
            </div>

            {/* Boxy Specs Grid */}
            <div className="grid grid-cols-3 gap-3 pt-5 border-t border-zinc-800 font-mono text-xs">
              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg">
                <span className="font-black text-amber-400 block text-sm">5 STAMPS</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">= 1 Free Plate</span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg">
                <span className="font-black text-emerald-400 block text-sm">1-TAP</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Chef Verified</span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg">
                <span className="font-black text-orange-400 block text-sm">3 STYLES</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Steam / Afghani / Fried</span>
              </div>
            </div>
          </div>

          {/* Right Column: Boxy Street Food Pass Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-[#161822] border-2 border-zinc-700 rounded-xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] relative">
              <div className="flex items-center justify-between border-b-2 border-dashed border-zinc-700 pb-3 mb-4 font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-amber-400 text-black font-black flex items-center justify-center text-xs">
                    M
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block uppercase">MOMO_PASS // #088</span>
                    <span className="text-[10px] text-zinc-400">COUNTER DIGITAL TICKET</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 my-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-amber-400 text-black border-2 border-black flex flex-col items-center justify-center font-mono font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                  >
                    <span className="text-base leading-none">🥟</span>
                    <span className="text-[8px] font-black uppercase mt-0.5">STAMP</span>
                  </div>
                ))}
                <div className="aspect-square rounded-lg bg-[#0d0e12] border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 font-mono">
                  <span className="text-xs font-bold text-zinc-400">05</span>
                  <span className="text-[7px] text-amber-400 font-bold uppercase">FREE</span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-zinc-700 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  4/5 Stamps Filled
                </span>
                <span className="text-amber-400 font-bold">Next Plate Free →</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            How You Earn Free Momos
          </h2>
          <span className="text-xs font-mono text-zinc-500 uppercase">RULE // 5 STAMPS = 1 REWARD</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#12141a] border-2 border-zinc-800 p-5 rounded-xl flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
            <div>
              <span className="font-mono text-xs font-black text-amber-400 px-2 py-1 bg-zinc-900 rounded border border-zinc-800 inline-block mb-3">
                STEP // 01
              </span>
              <h3 className="text-sm font-bold text-white mb-1.5 uppercase font-mono">Order at Counter</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose any plate from Steam Veg, Afghani Tandoori, or Crispy Fried momos hot from the truck.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 uppercase">
              1 Plate = 1 Stamp Ticket
            </div>
          </div>

          <div className="bg-[#12141a] border-2 border-zinc-800 p-5 rounded-xl flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
            <div>
              <span className="font-mono text-xs font-black text-orange-400 px-2 py-1 bg-zinc-900 rounded border border-zinc-800 inline-block mb-3">
                STEP // 02
              </span>
              <h3 className="text-sm font-bold text-white mb-1.5 uppercase font-mono">One-Tap Claim</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Select your category and submit claim on your smartphone. The chef verifies it in seconds.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 uppercase">
              Live Real-Time Confirmation
            </div>
          </div>

          <div className="bg-[#12141a] border-2 border-zinc-800 p-5 rounded-xl flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
            <div>
              <span className="font-mono text-xs font-black text-emerald-400 px-2 py-1 bg-zinc-900 rounded border border-zinc-800 inline-block mb-3">
                STEP // 03
              </span>
              <h3 className="text-sm font-bold text-white mb-1.5 uppercase font-mono">Get Free Plate</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Reach 5 stamps in any category to unlock your free plate pass. Show to the chef to redeem!
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 uppercase">
              100% Free Plate Unlocked
            </div>
          </div>
        </div>
      </section>

      {/* Eligible Momo Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-white uppercase font-mono tracking-tight">
            Eligible Momo Categories
          </h2>
          <Link
            to="/menu"
            className="text-xs font-mono font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            Full Menu <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#12141a] border-2 border-zinc-800 hover:border-emerald-500/80 p-5 rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 font-mono">
                <span className="text-3xl">🥟</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                  Classic Veg
                </span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono mb-1">Steam Veg Momos</h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Hand-rolled dumplings filled with mountain greens, ginger, and garlic with spicy sesame sauce.
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">₹100 // 8 PCS</span>
              <Link to="/user?category=Steam%20Veg" className="text-amber-400 font-bold hover:underline">
                [ Claim Stamp → ]
              </Link>
            </div>
          </div>

          <div className="bg-[#12141a] border-2 border-zinc-800 hover:border-amber-500/80 p-5 rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 font-mono">
                <span className="text-3xl">🥘</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700 uppercase">
                  Chef Special
                </span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono mb-1">Afghani Momos</h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Tandoor-charred dumplings smothered in rich cashew-cream, malai herbs, and melted butter.
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">₹150 // 8 PCS</span>
              <Link to="/user?category=Afghani" className="text-amber-400 font-bold hover:underline">
                [ Claim Stamp → ]
              </Link>
            </div>
          </div>

          <div className="bg-[#12141a] border-2 border-zinc-800 hover:border-orange-500/80 p-5 rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 font-mono">
                <span className="text-3xl">🔥</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-700 uppercase">
                  Extra Crispy
                </span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase font-mono mb-1">Fried Momos</h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Crisp golden exterior with juicy spiced filling inside, tossed in peri-peri seasonings.
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">₹120 // 8 PCS</span>
              <Link to="/user?category=Fried" className="text-amber-400 font-bold hover:underline">
                [ Claim Stamp → ]
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Truck Info Box */}
      <section className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-orange-400 shrink-0" />
          <div>
            <span className="font-bold text-white uppercase block">Momo Food Truck Spot</span>
            <span className="text-zinc-400">Counter Pickup &amp; Digital Loyalty Verification</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-zinc-300">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>4:30 PM – 10:30 PM Daily</span>
        </div>
      </section>
    </div>
  );
}
