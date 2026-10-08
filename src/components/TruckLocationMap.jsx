import React from 'react';
import { Navigation, ExternalLink } from 'lucide-react';

const LAT = 23.183469;
const LON = 79.975397;
const MAP_EMBED_URL = `https://www.google.com/maps?q=${LAT}%2C+${LON}&z=15&t=m&hl=en&output=embed`;
const GOOGLE_MAPS_LINK = `https://www.google.com/maps?q=${LAT},${LON}`;
const DIRECTIONS_LINK = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LON}`;

export default function TruckLocationMap() {
  return (
    <section className="space-y-3 sm:space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center justify-center sm:justify-start gap-2.5">
          <div>
            <h2 className="text-center sm:text-left text-base sm:text-lg lg:text-xl font-black text-white uppercase font-mono tracking-tight">
              Momo Food Truck Spot
            </h2>
          </div>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
        {/* Responsive Map Frame */}
        <div className="relative w-full h-[280px] sm:h-[380px] bg-zinc-950">
          <iframe
            src={MAP_EMBED_URL}
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Map of Momo Food Truck Spot (23.183469, 79.975397)"
            className="w-full h-full filter contrast-[1.05]"
          />
        </div>

        {/* Bottom Actions & Location Details (Optimized for Mobile) */}
        <div className="p-3.5 sm:p-5 bg-[#161822] border-t-2 border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 font-mono">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-tight">
                Momo Food Truck Counter
              </span>
              <span className="hidden sm:inline-block text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400">
                Pickup &amp; Instant Stamps
              </span>
            </div>
            <p className="text-zinc-500 text-[10px] sm:text-[11px]">
              GPS: 23.183469, 79.975397 · Hot steam &amp; tandoor momos
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto shrink-0">
            <a
              href={DIRECTIONS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-[11px] tracking-wide transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </a>

            <a
              href={GOOGLE_MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold uppercase text-[11px] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Open Map</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
