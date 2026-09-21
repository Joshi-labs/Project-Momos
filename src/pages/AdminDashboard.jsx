import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  User,
  Check,
  X,
} from 'lucide-react';

export default function AdminDashboard() {
  const [pendingStamps, setPendingStamps] = useState([]);
  const [historyStamps, setHistoryStamps] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [countdown, setCountdown] = useState(10);
  const [toast, setToast] = useState(null);

  const fetchStamps = useCallback(async () => {
    try {
      // 1. Fetch pending stamps (FIFO queue)
      const pending = await api.getAdminPendingStamps();
      setPendingStamps(pending || []);

      // 2. Fetch recently processed stamps
      const history = await api.getAdminHistoryStamps(30);
      setHistoryStamps(history || []);

      setLastUpdated(new Date());
      setCountdown(10);
    } catch (err) {
      console.error('Error fetching admin stamps:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStamps();

    // Subscribe to real-time stamp events
    const unsub = api.subscribeStamps(() => {
      fetchStamps();
    });

    const pollInterval = setInterval(() => {
      fetchStamps();
    }, 10000);

    const timerInterval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 10));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
      if (typeof unsub === 'function') {
        unsub();
      } else {
        api.unsubscribeStamps();
      }
    };
  }, [fetchStamps]);

  const handleUpdateStatus = async (stampId, newStatus) => {
    setActionLoadingId(stampId);
    setToast(null);

    try {
      await api.updateStampStatus(stampId, newStatus);

      setToast({
        type: 'success',
        message: `STAMP #${stampId.slice(0, 8)} MARKED AS ${newStatus.toUpperCase()}!`,
      });

      setPendingStamps((prev) => prev.filter((s) => s.id !== stampId));
      await fetchStamps();
    } catch (err) {
      console.error('Update status error:', err);
      setToast({
        type: 'error',
        message: err.message || 'Failed to update stamp status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const approvedCount = historyStamps.filter((s) => s.status === 'approved').length;
  const rejectedCount = historyStamps.filter((s) => s.status === 'rejected').length;

  return (
    <div className="space-y-8 pb-20">
      {/* Boxy Chef Console Header */}
      <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-5 sm:p-7 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] font-mono">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-red-950 border-2 border-red-700 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white uppercase">
                  Chef Counter Console
                </h1>
                <span className="text-[10px] bg-red-900/60 text-red-300 border border-red-700 px-2 py-0.5 rounded font-black">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Approving stamps instantly punches the customer&apos;s digital pass (+1 stamp via PocketBase).
              </p>
            </div>
          </div>

          {/* Polling & Refresh */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE SYNC ({countdown}s)</span>
            </div>

            <button
              type="button"
              onClick={fetchStamps}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 text-xs font-bold text-white active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Poll</span>
            </button>
          </div>
        </div>

        {/* Boxy Metrics */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-zinc-800">
          <div className="bg-zinc-900 border-2 border-zinc-800 p-3 rounded-lg text-center">
            <span className="text-[10px] text-zinc-400 block uppercase font-bold">Pending Queue</span>
            <span className="text-xl font-black text-amber-400">{pendingStamps.length}</span>
          </div>

          <div className="bg-zinc-900 border-2 border-zinc-800 p-3 rounded-lg text-center">
            <span className="text-[10px] text-zinc-400 block uppercase font-bold">Approved</span>
            <span className="text-xl font-black text-emerald-400">{approvedCount}</span>
          </div>

          <div className="bg-zinc-900 border-2 border-zinc-800 p-3 rounded-lg text-center">
            <span className="text-[10px] text-zinc-400 block uppercase font-bold">Rejected</span>
            <span className="text-xl font-black text-zinc-400">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-3.5 rounded-lg border-2 font-mono text-xs flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-red-950/80 border-red-700 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Boxy Tabs */}
      <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2 font-mono">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 border ${
              activeTab === 'pending'
                ? 'bg-amber-400 text-black border-amber-400'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <span>Pending ({pendingStamps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 border ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <span>History ({historyStamps.length})</span>
          </button>
        </div>

        <span className="text-[10px] text-zinc-500 hidden sm:inline">
          SYNC: {lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      {/* TAB 1: PENDING STAMPS */}
      {activeTab === 'pending' && (
        <div>
          {pendingStamps.length === 0 ? (
            <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-10 text-center max-w-md mx-auto font-mono">
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 mx-auto flex items-center justify-center text-emerald-400 mb-3">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase mb-1">Queue Clear</h3>
              <p className="text-xs text-zinc-400">
                No customer stamp requests waiting. New orders appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingStamps.map((stamp) => {
                const isLoading = actionLoadingId === stamp.id;
                const timestamp = stamp.created || stamp.created_at;
                const customerDisplay =
                  stamp.expand?.user?.name || stamp.expand?.user?.email || stamp.user;

                return (
                  <div
                    key={stamp.id}
                    className="bg-[#12141a] border-2 border-amber-400/70 hover:border-amber-400 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex flex-col justify-between font-mono transition-all"
                  >
                    <div>
                      {/* Stamp Header */}
                      <div className="flex items-center justify-between mb-3 border-b-2 border-dashed border-zinc-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {stamp.category === 'Steam Veg'
                              ? '🥟'
                              : stamp.category === 'Afghani'
                              ? '🥘'
                              : '🔥'}
                          </span>
                          <div>
                            <h2 className="text-xs font-black uppercase text-white">{stamp.category} Momos</h2>
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {formatRelativeTime(timestamp)}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-700">
                          PENDING
                        </span>
                      </div>

                      <div className="bg-zinc-900 rounded p-2 border border-zinc-800 mb-4 text-[11px] text-zinc-400 flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">USER: {customerDisplay}</span>
                      </div>
                    </div>

                    {/* Boxy Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleUpdateStatus(stamp.id, 'rejected')}
                        className="py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 text-red-400 font-bold text-xs uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleUpdateStatus(stamp.id, 'approved')}
                        className="py-2.5 px-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Accept (+1)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROCESSED HISTORY */}
      {activeTab === 'history' && (
        <div className="font-mono">
          {historyStamps.length === 0 ? (
            <div className="bg-[#12141a] border-2 border-zinc-800 rounded-xl p-8 text-center text-xs text-zinc-500">
              [ NO PROCESSED STAMPS IN CURRENT LOG ]
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {historyStamps.map((s) => {
                const timestamp = s.updated || s.created || s.created_at;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-[#12141a] border-2 border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">
                        {s.category === 'Steam Veg' ? '🥟' : s.category === 'Afghani' ? '🥘' : '🔥'}
                      </span>
                      <div>
                        <p className="font-bold text-zinc-200">{s.category}</p>
                        <span className="text-[10px] text-zinc-500">{formatRelativeTime(timestamp)}</span>
                      </div>
                    </div>

                    <div>
                      {s.status === 'approved' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                          APPROVED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700">
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
      )}
    </div>
  );
}
