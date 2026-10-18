import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Award, Flame, PlusCircle, Clock, Gift, RefreshCw, X, Loader2 } from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Steam Veg',
    icon: '🥟',
    image: '/momos_iconpack/st_vg.jpg',
    code: 'STM',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-700',
    stampBg: 'bg-amber-400 text-black border-2 border-black font-black',
  },
  {
    name: 'Afghani',
    icon: '🥘',
    image: '/momos_iconpack/fr.jpg',
    code: 'AFG',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-700',
    stampBg: 'bg-amber-400 text-black border-2 border-black font-black',
  },
  {
    name: 'Fried',
    icon: '🔥',
    image: '/momos_iconpack/kr.jpg',
    code: 'FRD',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-700',
    stampBg: 'bg-amber-400 text-black border-2 border-black font-black',
  },
];

const transparentCache = new Map();

function TransparentMomoImage({ src, alt, className }) {
  const [cleanSrc, setCleanSrc] = useState(() => transparentCache.get(src) || null);

  useEffect(() => {
    if (!src) return;
    if (transparentCache.has(src)) {
      setCleanSrc(transparentCache.get(src));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width || 512;
        const height = img.naturalHeight || img.height || 512;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Flood fill from edges to remove outer white background without touching artwork highlights
        const visited = new Uint8Array(width * height);
        const queue = [];

        const isWhite = (idx) => data[idx] > 235 && data[idx + 1] > 235 && data[idx + 2] > 235;

        for (let x = 0; x < width; x++) {
          if (isWhite(x * 4)) {
            queue.push(x);
            visited[x] = 1;
          }
          const btm = (height - 1) * width + x;
          if (isWhite(btm * 4)) {
            queue.push(btm);
            visited[btm] = 1;
          }
        }

        for (let y = 0; y < height; y++) {
          const left = y * width;
          if (!visited[left] && isWhite(left * 4)) {
            queue.push(left);
            visited[left] = 1;
          }
          const right = y * width + (width - 1);
          if (!visited[right] && isWhite(right * 4)) {
            queue.push(right);
            visited[right] = 1;
          }
        }

        let head = 0;
        while (head < queue.length) {
          const p = queue[head++];
          const px = p % width;
          const py = Math.floor(p / width);
          const idx = p * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const minVal = Math.min(r, g, b);

          if (minVal > 248) {
            data[idx + 3] = 0;
          } else {
            data[idx + 3] = Math.round(((248 - minVal) / 13) * 255);
          }

          if (px > 0 && !visited[p - 1] && isWhite((p - 1) * 4)) {
            visited[p - 1] = 1;
            queue.push(p - 1);
          }
          if (px < width - 1 && !visited[p + 1] && isWhite((p + 1) * 4)) {
            visited[p + 1] = 1;
            queue.push(p + 1);
          }
          if (py > 0 && !visited[p - width] && isWhite((p - width) * 4)) {
            visited[p - width] = 1;
            queue.push(p - width);
          }
          if (py < height - 1 && !visited[p + width] && isWhite((p + width) * 4)) {
            visited[p + width] = 1;
            queue.push(p + width);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        transparentCache.set(src, dataUrl);
        setCleanSrc(dataUrl);
      } catch (err) {
        console.error('Error removing background from image:', err);
        setCleanSrc(src);
      }
    };

    img.onerror = () => {
      setCleanSrc(src);
    };
  }, [src]);

  return (
    <img
      src={cleanSrc || src}
      alt={alt}
      className={`${className} transition-opacity duration-150 ${cleanSrc ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

function UserDashboardContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      window.location.replace('/auth');
    }
  }, [loading, user]);

  const [selectedCategory, setSelectedCategory] = useState('Steam Veg');
  const [stamps, setStamps] = useState([]);
  const [stampCount, setStampCount] = useState(1);
  const [isQuantityOpen, setIsQuantityOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeVoucherCategory, setActiveVoucherCategory] = useState(null);

  const fetchMyStamps = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getMyStamps();
      setStamps((prev) => (prev === data ? prev : (data || [])));
    } catch (err) {
      console.error('Failed to load stamps:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchMyStamps();

    const unsub = api.subscribeStamps((e) => {
      // Don't refetch on local free plate intent broadcasts (stamps haven't changed)
      if (e.action === 'free_plate_intent') return;
      if (e.record && (!e.record.user || e.record.user === user?.id)) {
        fetchMyStamps();
      }
    });

    const interval = setInterval(fetchMyStamps, 2500);

    return () => {
      clearInterval(interval);
      if (typeof unsub === 'function') {
        unsub();
      } else {
        api.unsubscribeStamps();
      }
    };
  }, [fetchMyStamps, user?.id]);

  // Derive all stamp metrics in one clean pass
  const stampCounts = { 'Steam Veg': 0, Afghani: 0, Fried: 0 };
  let pendingClaim = null;

  for (const s of stamps) {
    if (s.status === 'pending' && !pendingClaim) {
      pendingClaim = s;
    } else if (s.status === 'approved' && !s.claimed && stampCounts[s.category] !== undefined) {
      stampCounts[s.category] += 1;
    }
  }

  const totalStampsAll = stampCounts['Steam Veg'] + stampCounts['Afghani'] + stampCounts['Fried'];
  const totalFreePlatesAvailable =
    Math.floor(stampCounts['Steam Veg'] / 5) +
    Math.floor(stampCounts['Afghani'] / 5) +
    Math.floor(stampCounts['Fried'] / 5);

  const recentStamps = [...stamps]
    .sort((a, b) => new Date(b.created || b.created_at || 0) - new Date(a.created || a.created_at || 0))
    .slice(0, 5);

  const hasPendingClaim = Boolean(pendingClaim);

  const handleClaimStamp = async () => {
    if (!user || submitting || hasPendingClaim) return;
    setSubmitting(true);
    try {
      await api.claimStamp(selectedCategory, stampCount);
      await fetchMyStamps();
    } catch (err) {
      console.error('Failed to claim stamp:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const start = Date.now();
    try {
      await fetchMyStamps();
    } finally {
      const elapsed = Date.now() - start;
      setTimeout(() => {
        setIsRefreshing(false);
      }, Math.max(0, 1000 - elapsed));
    }
  };

  const handleClaimFreePlate = (categoryName) => {
    setActiveVoucherCategory(categoryName);
    api.intentToGetFreePlate().catch((err) => {
      console.error('Failed to register free plate intent:', err);
    });
  };



  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="text-xs font-bold tracking-widest uppercase">[ LOADING SESSION ]</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-5 sm:p-7 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3 min-w-0 max-w-full">

            <div className="w-14 h-14 rounded-lg border-2 border-black overflow-hidden shrink-0">
              <img
                src={`https://api.dicebear.com/10.x/avataaars/svg?backgroundColor=ffbe47&seed=${encodeURIComponent(user?.name || user?.email || 'M')}`}
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-black text-white uppercase truncate">
                  MOMO LOYALTY CARD
                </span>
              </div>
              <p
                className="text-xs text-zinc-400 font-mono truncate max-w-full"
                title={`ID: ${user?.email || ''}`}
              >
                ID: {user?.email || 'N/A'}
              </p>
              <p
                className="text-xs text-zinc-400 font-mono truncate max-w-full"
                title={`NAME: ${user?.name || ''}`}
              >
                NAME: {user?.name || 'N/A'}
              </p>
            </div>
          </div>


          <div className="grid grid-cols-2 sm:flex sm:items-stretch gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">

            {/* Approved Stamps */}
            <div className="min-w-0 sm:min-w-[140px] bg-zinc-900 border-2 border-zinc-800 px-3 py-2.5 rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-bold truncate">
                Approved Stamps
              </span>
              <span className="text-base font-black text-white">
                {totalStampsAll}
              </span>
            </div>

            {/* Free Plates */}
            <div className="min-w-0 sm:min-w-[140px] bg-zinc-900 border-2 border-zinc-800 px-3 py-2.5 rounded-lg flex flex-col justify-center items-center text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-bold truncate">
                Free Plates
              </span>
              <span className="text-base font-black text-amber-400 truncate">
                {totalFreePlatesAvailable} READY
              </span>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="col-span-2 sm:col-span-1 min-h-10 sm:min-h-0 sm:w-11 sm:shrink-0 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 border-2 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 active:scale-95 transition-all disabled:opacity-50"
              title="Refresh Stamps"
              aria-label="Refresh stamps"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isRefreshing ? 'animate-spin text-amber-400' : ''
                }`}
              />
              <span className="text-xs font-bold sm:hidden">
                {isRefreshing ? 'Refreshing...' : 'Refresh Stamps'}
              </span>
            </button>

          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2 mb-2 font-mono">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Claim Stamps
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Standing at the truck counter? Tap the momo style you ordered to submit a stamp verification request.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-5 font-mono">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`py-3 px-2 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-amber-400 text-black border-black font-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {cat.image ? (
                      <TransparentMomoImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <span className="text-2xl">{cat.icon}</span>
                    )}
                    <span className="text-[11px] font-bold uppercase leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Stamp Quantity Slider (1 to 5) - Collapsible Dropdown */}
            <div className="mb-5 bg-zinc-900 border-2 border-zinc-800 rounded-lg font-mono transition-all overflow-hidden">
              <button
                type="button"
                onClick={() => setIsQuantityOpen((prev) => !prev)}
                className="w-full p-3.5 flex items-center justify-between text-left select-none cursor-pointer hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors"
                title={isQuantityOpen ? 'Collapse quantity slider' : 'Expand quantity slider'}
              >
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Quantity {isQuantityOpen ? ':' : '▼'}</span>
                </span>
                <span className="text-xs font-black bg-amber-400 text-black px-2.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)]">
                  {stampCount} {stampCount === 1 ? 'STAMP' : 'STAMPS'}
                </span>
              </button>

              {isQuantityOpen && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStampCount((prev) => Math.max(1, prev - 1))}
                      disabled={stampCount <= 1}
                      className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center border border-zinc-700 active:scale-95 transition-all shrink-0 cursor-pointer"
                      title="Decrease stamps"
                    >
                      -
                    </button>

                    <div className="flex-1 space-y-1">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={stampCount}
                        onChange={(e) => setStampCount(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-500 font-bold px-0.5 select-none">
                        <span>1</span>
                        <span>5</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStampCount((prev) => Math.min(10, prev + 1))}
                      disabled={stampCount >= 5}
                      className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center border border-zinc-700 active:scale-95 transition-all shrink-0 cursor-pointer"
                      title="Increase stamps"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleClaimStamp}
              disabled={submitting || hasPendingClaim}
              className={`w-full py-3.5 px-4 rounded-lg font-black font-mono text-xs uppercase tracking-wider border-2 transition-all flex items-center justify-center gap-2 ${
                hasPendingClaim
                  ? 'bg-zinc-900 border-zinc-700 text-amber-400/80 cursor-not-allowed opacity-80'
                  : 'bg-amber-400 hover:bg-amber-300 text-black border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50'
              }`}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : hasPendingClaim ? (
                <>
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>
                    [ REQUEST PENDING ]
                  </span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 fill-black" />
                  <span>
                    [ SUBMIT {stampCount > 1 ? `${stampCount} ` : ''}{selectedCategory.toUpperCase()} STAMP{stampCount > 1 ? 'S' : ''} ]
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 space-y-1">
            <span className="text-amber-400 font-bold block uppercase">COUNTER NOTICE:</span>
            {hasPendingClaim ? (
              <p className="text-[11px] leading-relaxed text-amber-300">
                You have a pending request for {pendingClaim.count || 1}x {pendingClaim.category} momos awaiting approval on the chef's counter screen.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed">
                Submitting claims creates a live pending stamp request on the chef's counter screen. Once verified, you will get the stamps automatically.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between font-mono">
            <h2 className="text-sm sm:text-base font-black text-white uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Loyalty Punch Cards
            </h2>
            <span className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
              5 STAMPS = 1 FREE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CATEGORIES.map((cat) => {
              const totalApproved = stampCounts[cat.name] || 0;
              const currentCycleStamps = totalApproved % 5;
              const freePlatesAvailable = Math.floor(totalApproved / 5);
              const hasReward = totalApproved >= 5;

              return (
                <div
                  key={cat.name}
                  className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-zinc-800 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <h3 className="text-xs font-black uppercase text-white">{cat.name}</h3>
                          <span className="text-[10px] text-zinc-400">{totalApproved} Approved</span>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-400">
                        {totalApproved % 5 === 0 && totalApproved > 0 ? '5/5' : `${currentCycleStamps}/5`}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 my-4">
                      {[1, 2, 3, 4, 5].map((slot) => {
                        const isStamped =
                          totalApproved > 0 &&
                          (currentCycleStamps >= slot || (totalApproved % 5 === 0 && totalApproved > 0));

                        return (
                          <div
                            key={slot}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center ${
                              isStamped
                                ? `${cat.stampBg} shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)]`
                                : 'bg-zinc-900 border-2 border-dashed border-zinc-800 text-zinc-600 font-mono'
                            }`}
                          >
                            {isStamped ? (
                              <>
                                <span className="text-base leading-none">🥟</span>
                                <span className="text-[8px] font-black uppercase mt-0.5">stamp</span>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold">0{slot}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-dashed border-zinc-800 mt-2 font-mono">
                    {hasReward ? (
                      <button
                        type="button"
                        onClick={() => handleClaimFreePlate(cat.name)}
                        className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Claim Free Plate ({freePlatesAvailable})</span>
                      </button>
                    ) : (
                      <div className="text-center text-[10px] text-zinc-500 font-mono uppercase">
                        [{5 - currentCycleStamps} Stamps Until Free Plate]
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
            <h3 className="text-xs font-black text-white uppercase font-mono mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Stamp Activity Log (last 5)
            </h3>

            {recentStamps.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                [ NO STAMPS LOGGED YET ]
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {recentStamps.map((s) => {
                  const timestamp = s.created || s.created_at;
                  const d = timestamp ? new Date(timestamp) : null;
                  const dateStr = d && !isNaN(d.getTime())
                    ? `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Recent';

                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">
                          {s.category === 'Steam Veg' ? '🥟' : s.category === 'Afghani' ? '🥘' : '🔥'}
                        </span>
                        <div>
                          <p className="font-bold text-zinc-200">{s.category}</p>
                          <span className="text-[10px] text-zinc-500">{dateStr}</span>
                        </div>
                      </div>

                      <div>
                        {s.status === 'pending' && (
                          <span className="px-3 py-1 rounded text-[10px] font-bold bg-amber-950 border border-amber-700 text-amber-300">
                            PENDING {s.count && s.count > 1 ? `(${s.count})` : ''}
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {activeVoucherCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141a] border-2 border-amber-400 rounded-xl p-6 sm:p-8 max-w-md w-full relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] font-mono">
            <button
              type="button"
              onClick={() => setActiveVoucherCategory(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
                  Free {activeVoucherCategory} Plate
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Show this digital pass to the chef at the truck counter to redeem.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-zinc-900 border-2 border-dashed border-zinc-700 space-y-2 mb-6">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>VOUCHER // PASS-CODE</span>
                  <span className="text-emerald-400 font-bold">VERIFIED</span>
                </div>
                <p className="text-base sm:text-lg font-black text-amber-400 tracking-wider">
                  MOMO-FREE-{activeVoucherCategory.substring(0, 3).toUpperCase()}-PASS
                </p>
                <div className="text-[10px] text-zinc-400 border-t border-zinc-800 pt-2 flex items-center justify-between">
                  <span>HOLDER: {user?.email}</span>
                  <span>5/5 STAMPS</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVoucherCategory(null)}
                className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black"
              >
                [ Close Voucher ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserDashboard(props) {
  return (
    <AuthProvider>
      <UserDashboardContent {...props} />
    </AuthProvider>
  );
}

