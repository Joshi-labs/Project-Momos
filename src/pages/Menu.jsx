import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronRight, Check } from 'lucide-react';

const MENU_ITEMS = [
  {
    category: 'Steam Veg',
    icon: '🥟',
    badge: 'CLASSIC // 01',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    title: 'Himalayan Steam Veg Momos',
    price: '₹100',
    servings: '8 PCS',
    spiceLevel: '🌶️ MILD & SAVORY',
    description:
      'Hand-rolled dough filled with fresh cabbage, carrots, ginger, and hill herbs. Served piping hot with our spicy red chili-sesame dip.',
    highlights: ['100% Vegetarian', 'Traditional Steamer', 'Low Calorie'],
  },
  {
    category: 'Afghani',
    icon: '🥘',
    badge: 'CHEF SPECIAL // 02',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
    title: 'Creamy Tandoori Afghani Momos',
    price: '₹150',
    servings: '8 PCS',
    spiceLevel: '🌶️ CREAMY & SMOKY',
    description:
      'Momos roasted with a tandoori char, tossed in a velvety cream sauce of cashew nuts, fresh coriander, chaat masala, and melted butter.',
    highlights: ['Rich Cashew Malai', 'Tandoor Charred', 'Crowd Favorite'],
  },
  {
    category: 'Fried',
    icon: '🔥',
    badge: 'SUPER CRISP // 03',
    badgeColor: 'bg-orange-950 text-orange-300 border-orange-700',
    title: 'Golden Crunch Fried Momos',
    price: '₹120',
    servings: '8 PCS',
    spiceLevel: '🌶️🌶️ EXTRA CRISPY',
    description:
      'Deep fried to a crisp golden amber crunch with juicy spiced filling inside. Dusted with peri-peri seasonings with fire dip and cool mayo.',
    highlights: ['Extra Crunchy', 'Fiery Dip Included', 'Made on Order'],
  },
];

export default function Menu() {
  return (
    <div className="space-y-8 pb-16">
      <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold text-amber-400 tracking-wider uppercase block mb-1">
              [ OFFICIAL MENU // STREET COUNTER ]
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase">
              Fresh Food Truck Menu
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-lg">
              Every plate purchased in these categories earns 1 stamp toward your 5-stamp free plate reward.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-lg text-xs font-mono text-amber-400 shrink-0">
            <Award className="w-4 h-4" />
            <span>5 Stamps = Free Plate</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {MENU_ITEMS.map((item) => (
          <div
            key={item.category}
            className="bg-[#12141a] border-2 border-zinc-800 hover:border-zinc-700 rounded-xl p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4 font-mono">
                <div className="w-12 h-12 rounded-lg bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-2xl shadow-sm">
                  {item.icon}
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-amber-400 block leading-none">{item.price}</span>
                  <span className="text-[10px] text-zinc-400 font-bold">{item.servings}</span>
                </div>
              </div>

              <div className="space-y-1.5 mb-3 font-mono">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
                <h2 className="text-base font-bold text-white leading-snug">{item.title}</h2>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-6 font-mono">
                {item.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    {h}
                  </span>
                ))}
                <span className="text-[10px] text-zinc-400 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
                  {item.spiceLevel}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-zinc-800 flex items-center justify-between gap-2 font-mono">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-bold">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                +1 Stamp
              </span>

              <Link
                to={`/user?category=${encodeURIComponent(item.category)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <span>Claim Stamp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
