import React from 'react';
import { Link } from 'react-router-dom';
import { Award, QrCode, UtensilsCrossed, ChevronRight, ArrowRight, ArrowDown, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TruckLocationMap from '../components/TruckLocationMap';

const STEPS = [
  {
    step: '01',
    title: 'Order at Counter',
    desc: 'Choose any plate from Steam Veg, Afghani Tandoori, or Crispy Fried momos hot from the truck.',
    meta: '1 Plate = 1 Stamp',
    icon: UtensilsCrossed,
  },
  {
    step: '02',
    title: 'One-Tap Claim',
    desc: 'Select your category and submit claim on your smartphone. The chef verifies it in seconds.',
    meta: 'Instant Verification',
    icon: Smartphone,
  },
  {
    step: '03',
    title: 'Get Free Plate',
    desc: 'Reach 5 stamps in any category to unlock your free plate pass. Show to the chef to redeem!',
    meta: '100% Free Plate Unlocked',
    icon: Award,
  },
];

const SIGNATURE_PLATES = [
  {
    name: 'Steam Veg Momos',
    price: '₹50 - 8 PCS',
    desc: 'Hand-rolled dumplings filled with mountain greens, ginger, and garlic with spicy sesame sauce.',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    link: '/user?category=Steam%20Veg',
  },
  {
    name: 'Afghani Momos',
    price: '₹60 - 8 PCS',
    desc: 'Tandoor-charred dumplings smothered in rich cashew-cream, malai herbs, and melted butter.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    link: '/user?category=Afghani',
  },
  {
    name: 'Fried Momos',
    price: '₹60 - 8 PCS',
    desc: 'Crisp golden exterior with juicy spiced filling inside, tossed in peri-peri seasonings.',
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80',
    link: '/user?category=Fried',
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-10 pb-16">
      {/* Boxy Modern Split Hero */}
      <br/>
      <section className="relative rounded-2xl bg-[#111319] border-2 border-zinc-800 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Bold Headline & Kick Action */}
          <div className="lg:col-span-7 space-y-6 text-left">

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] uppercase font-mono">
              Eat Hot Momos. <br />
              <span className="bg-amber-400 text-black px-2 py-0.5 inline-block my-1">
                Collect 5 Stamps.
              </span> <br />
              Get 1 Free Plate.
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Order Steam Veg, Afghani, or Fried momos at the food truck, tap claim on your phone, and get stamped instantly by the chef.
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


          </div>

          {/* Right Column: Boxy Street Food Pass Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-[#161822] border-2 border-zinc-700 rounded-xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] relative">
              <div className="flex items-center justify-between border-b-2 border-dashed border-zinc-700 pb-3 mb-4 font-mono">
                <div className="flex items-center gap-2">

                  <div>
                    <span className="text-xs font-black text-white block uppercase">MOMO_PASS #088</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 my-4">
                {[1, 2, 3, 4,].map((i) => (
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
                  <span className="text-[7px] text-amber-400 font-bold uppercase"></span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-zinc-700 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  4/5 Stamps Filled
                </span>
                <span className="text-amber-400 font-bold">Claim Plate Free →</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-4">
        <div className="flex items-center sm:justify-between justify-center">
          <h2 className="text-lg sm:text-xl font-black text-white uppercase font-mono tracking-tight flex items-center gap-2">
            Steps For Free Momoos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 relative">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-[#12141a] border-2 border-zinc-800 hover:border-zinc-700/80 p-5 rounded-xl flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono tracking-tight">
                      {item.title}
                    </h3>
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] font-mono text-zinc-400 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
                  <span>{item.meta}</span>
                </div>

                {index < STEPS.length - 1 && (
                  <>
                    {/* Desktop connector arrow */}
                    <div className="hidden md:flex absolute -right-3.5 lg:-right-4 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#161822] border-2 border-zinc-700 items-center justify-center shadow-md pointer-events-none">
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    {/* Mobile connector arrow */}
                    <div className="flex md:hidden absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-10 w-7 h-7 rounded-full bg-[#161822] border-2 border-zinc-700 items-center justify-center shadow-md pointer-events-none">
                      <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Signature Plates */}
      <section className="space-y-4">
        <div className="flex items-center sm:justify-between justify-center">
          <h2 className="text-lg sm:text-xl font-black text-white uppercase font-mono tracking-tight">
            Popular Plates
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SIGNATURE_PLATES.map((item) => (
            <div
              key={item.name}
              className="bg-[#12141a] border-2 border-zinc-800 hover:border-zinc-700 p-4 sm:p-5 rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 mb-3.5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-950/80 backdrop-blur-sm text-zinc-300 border border-zinc-700/80 uppercase font-mono">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono mb-1.5 tracking-tight">
                  {item.name}
                </h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 font-bold">{item.price}</span>
                <Link to={item.link} className="text-amber-400 font-bold hover:underline">
                  [ Claim Stamp → ]
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Momo Food Truck Spot Location Section */}
      <TruckLocationMap />
    </div>
  );
}
