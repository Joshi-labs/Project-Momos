import React from 'react';
import { Award, QrCode, ChevronRight, Check, Sparkles, Flame, Coffee } from 'lucide-react';

const MENU_ITEMS = [
  {
    category: 'Steam Veg',
    code: 'STM // 01',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    title: 'Steam Veg Momos',
    price: '₹50',
    servings: '8 PCS',
    spiceLevel: '🌶️ MILD & FRESH',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    description:
      'Hand-rolled dumplings packed with freshly shredded mountain greens, ginger, and aromatic spices. Steamed fresh to order and served piping hot with red chili sesame dip.',
    highlights: ['100% Vegetarian', 'Traditional Steamer', 'Low Calorie', 'Spicy Sesame Chutney'],
    link: '/user?category=Steam%20Veg',
  },
  {
    category: 'Afghani',
    code: 'AFG // 02',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
    title: 'Creamy Afghani Momos',
    price: '₹60',
    servings: '8 PCS',
    spiceLevel: '🌶️ CREAMY & SMOKY',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    description:
      'Tandoor-charred dumplings smothered in rich cashew-cream, malai herbs, chaat masala, and melted butter. Rich, luscious, and deeply satisfying.',
    highlights: ['Rich Cashew Malai', 'Tandoor Charred', 'Butter Drizzle', 'Chef Special'],
    link: '/user?category=Afghani',
  },
  {
    category: 'Fried',
    code: 'FRD // 03',
    badgeColor: 'bg-orange-950 text-orange-300 border-orange-700',
    title: 'Crispy Fried Momos',
    price: '₹60',
    servings: '8 PCS',
    spiceLevel: '🌶️🌶️ EXTRA CRISPY',
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80',
    description:
      'Crisp golden exterior with juicy seasoned vegetables inside. Dusted generously with fiery peri-peri spices and served with our fire dip and cool mayo.',
    highlights: ['Extra Crunchy', 'Peri-Peri Dusted', 'Fiery Dip Included', 'Fresh Made on Order'],
    link: '/user?category=Fried',
  },
];

const ADDONS = [
  {
    name: 'Extra Sesame Chili Dip',
    price: 'FREE',
    tag: 'EXTRA SPICY',
    icon: Flame,
    desc: 'Signature roasted chili and sesame garlic chutney.',
  },
  {
    name: 'Cashew Malai Dip',
    price: 'FREE',
    tag: 'CREAMY',
    icon: Sparkles,
    desc: 'Rich velvety cashew-cream sauce with fresh coriander.',
  },
  {
    name: 'Chilled Cold Drink',
    price: 'FREE',
    tag: 'BEVERAGE',
    icon: Coffee,
    desc: 'Chilled soda can (Thums Up / Sprite) 250ml.',
  },
];

export default function Menu() {
  return (
    <div className="space-y-8 pb-16">

      {/* Main Dishes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h2 className="text-lg sm:text-xl font-black text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span>Signature Plates</span>
            <span className="text-xs text-amber-400 font-mono font-normal">
              [ STAMP ELIGIBLE ]
            </span>
          </h2>
          <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block">
            Made Fresh Daily
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MENU_ITEMS.map((item) => (
            <div
              key={item.category}
              className="bg-[#12141a] border-2 border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] transition-all group"
            >
              <div>
                {/* Photo container matching Home art style */}
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 mb-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <span
                    className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border font-mono ${item.badgeColor}`}
                  >
                    {item.code}
                  </span>

                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-950/80 backdrop-blur-sm text-zinc-300 border border-zinc-700/80 uppercase font-mono">
                    {item.spiceLevel}
                  </span>
                </div>

                {/* Title & Pricing Header */}
                <div className="flex items-start justify-between gap-2 mb-2 font-mono">
                  <h3 className="text-base font-black text-white uppercase tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-amber-400 block leading-none">
                      {item.price}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                      {item.servings}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Highlights tags */}
                <div className="flex flex-wrap gap-1.5 mb-5 font-mono">
                  {item.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Stamp Action Bar */}
              <div className="pt-3.5 border-t-2 border-dashed border-zinc-800 flex items-center justify-between gap-2 font-mono">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                  <span className="w-5 h-5 rounded bg-amber-400 text-black flex items-center justify-center text-[10px] font-black border border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)]">
                    🥟
                  </span>
                  <span className="text-zinc-300">+1 Stamp</span>
                </div>

                <a
                  href={item.link}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <span>Claim Stamp</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Counter Add-ons & Extra Dips */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h2 className="text-base sm:text-lg font-black text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span>Sides & Add-ons</span>
            <span className="text-xs text-zinc-500 font-mono font-normal">
              [ COUNTER EXTRAS ]
            </span>
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">Available at Food Truck</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ADDONS.map((addon) => {
            const Icon = addon.icon;
            return (
              <div
                key={addon.name}
                className="bg-[#12141a] border-2 border-zinc-800 hover:border-zinc-700/80 p-4 rounded-xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] font-mono transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold uppercase inline-block mb-1">
                      {addon.tag}
                    </span>
                    <h4 className="text-xs font-bold text-white uppercase">{addon.name}</h4>
                    <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">{addon.desc}</p>
                  </div>
                </div>

                <span className="text-sm font-black text-amber-400 pl-3 shrink-0">{addon.price}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

