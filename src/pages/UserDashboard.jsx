import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  Award,
  Flame,
  PlusCircle,
  CheckCircle2,
  Clock,
  Gift,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Steam Veg',
    icon: '🥟',
    code: 'STM',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    stampBg: 'bg-emerald-400 text-black border-2 border-black font-black',
  },
  {
    name: 'Afghani',
    icon: '🥘',
    code: 'AFG',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-700',
    stampBg: 'bg-amber-400 text-black border-2 border-black font-black',
  },
  {
    name: 'Fried',
    icon: '🔥',
    code: 'FRD',
    badgeClass: 'bg-orange-950 text-orange-300 border-orange-700',
    stampBg: 'bg-orange-500 text-black border-2 border-black font-black',
  },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const preselect = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState(
    preselect && CATEGORIES.some((c) => c.name === preselect) ? preselect : 'Steam Veg'
  );

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [redeemModal, setRedeemModal] = useState(null);

  const fetchMyTickets = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoadingTickets(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyTickets();
    const interval = setInterval(() => {
      fetchMyTickets();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchMyTickets]);

  const stampCounts = useMemo(() => {
    const counts = { 'Steam Veg': 0, Afghani: 0, Fried: 0 };
    tickets.forEach((t) => {
      if (t.status === 'approved' && counts[t.category] !== undefined) {
        counts[t.category] += 1;
      }
    });
    return counts;
  }, [tickets]);

  const totalStampsAll = useMemo(() => {
    return Object.values(stampCounts).reduce((a, b) => a + b, 0);
  }, [stampCounts]);

  const totalFreePlatesAvailable = useMemo(() => {
    return Object.values(stampCounts).reduce((acc, count) => acc + Math.floor(count / 5), 0);
  }, [stampCounts]);

  const handleClaimTicket = async () => {
    if (!user) return;
    setFeedback(null);

    if (!isSupabaseConfigured) {
      setFeedback({
        type: 'error',
        text: 'Supabase credentials missing in .env. Please check configuration.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('tickets').insert([
        {
          user_id: user.id,
          category: selectedCategory,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      setFeedback({
        type: 'success',
        text: `Claim submitted for ${selectedCategory}! The truck chef will approve it in seconds.`,
      });

      await fetchMyTickets();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to submit claim ticket. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-5 sm:p-7 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-amber-400 text-black font-black text-lg border-2 border-black flex items-center justify-center shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-white uppercase">
                  MOMO LOYALTY CARD
                </span>
                <span className="text-[10px] bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-emerald-400 font-bold">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono truncate max-w-sm">
                ID: {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
            <div className="bg-zinc-900 border-2 border-zinc-800 px-3.5 py-2 rounded-lg text-center">
              <span className="text-[10px] text-zinc-400 block uppercase font-bold">Approved Stamps</span>
              <span className="text-base font-black text-white">{totalStampsAll}</span>
            </div>

            <div className="bg-zinc-900 border-2 border-zinc-800 px-3.5 py-2 rounded-lg text-center">
              <span className="text-[10px] text-zinc-400 block uppercase font-bold">Free Plates</span>
              <span className="text-base font-black text-amber-400">{totalFreePlatesAvailable} READY</span>
            </div>

            <button
              type="button"
              onClick={fetchMyTickets}
              disabled={loadingTickets}
              className="p-3 rounded-lg bg-zinc-900 border-2 border-zinc-700 text-zinc-300 hover:text-white active:scale-95 transition-all shrink-0"
              title="Refresh Stamps"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin text-amber-400' : ''}`} />
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
                Claim Purchase Ticket
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Standing at the truck counter? Tap the momo style you ordered to submit a stamp verification ticket.
            </p>

            {feedback && (
              <div
                className={`mb-5 p-3 rounded-lg border font-mono text-xs flex items-start gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                    : 'bg-red-950/60 border-red-700 text-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

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
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-[11px] font-bold uppercase leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleClaimTicket}
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black font-mono text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Flame className="w-4 h-4 fill-black" />
                  <span>[ SUBMIT {selectedCategory.toUpperCase()} CLAIM ]</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 space-y-1">
            <span className="text-amber-400 font-bold block uppercase">// COUNTER NOTICE:</span>
            <p className="text-[11px] leading-relaxed">
              Submitting claims creates a live pending ticket on the chef’s counter screen. Once verified, this card stamps automatically.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between font-mono">
            <h2 className="text-sm sm:text-base font-black text-white uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Loyalty Punch Cards (3 Categories)
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
                  className="bg-[#12141a] border-2 border-zinc-800 hover:border-zinc-700 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] flex flex-col justify-between transition-all"
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
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                              isStamped
                                ? `${cat.stampBg} shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)]`
                                : 'bg-zinc-900 border-2 border-dashed border-zinc-800 text-zinc-600 font-mono'
                            }`}
                          >
                            {isStamped ? (
                              <>
                                <span className="text-xs leading-none">🥟</span>
                                <span className="text-[7px] font-black uppercase mt-0.5">OK</span>
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
                        onClick={() =>
                          setRedeemModal({
                            category: cat.name,
                            count: totalApproved,
                          })
                        }
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
              Ticket Claim Activity Log
            </h3>

            {tickets.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                [ NO CLAIMS LOGGED YET // ORDER AT COUNTER TO START ]
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {tickets.slice(0, 6).map((t) => {
                  const dateStr = new Date(t.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">
                          {t.category === 'Steam Veg' ? '🥟' : t.category === 'Afghani' ? '🥘' : '🔥'}
                        </span>
                        <div>
                          <p className="font-bold text-zinc-200">{t.category}</p>
                          <span className="text-[10px] text-zinc-500">{dateStr}</span>
                        </div>
                      </div>

                      <div>
                        {t.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-700 text-amber-300">
                            PENDING
                          </span>
                        )}
                        {t.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                            +1 STAMP
                          </span>
                        )}
                        {t.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-700 text-red-300">
                            REJECTED
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

      {redeemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141a] border-2 border-amber-400 rounded-xl p-6 sm:p-8 max-w-md w-full relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] font-mono">
            <button
              onClick={() => setRedeemModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <span className="text-amber-400 text-xs font-black uppercase tracking-wider block mb-1">
                // COMPLIMENTARY VOUCHER UNLOCKED
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
                Free {redeemModal.category} Plate
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
                MOMO-FREE-{redeemModal.category.substring(0, 3).toUpperCase()}-PASS
              </p>
              <div className="text-[10px] text-zinc-400 border-t border-zinc-800 pt-2 flex items-center justify-between">
                <span>HOLDER: {user?.email}</span>
                <span>5/5 STAMPS</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRedeemModal(null)}
              className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black"
            >
              [ Close Voucher ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
