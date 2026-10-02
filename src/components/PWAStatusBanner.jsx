import React, { useState, useEffect } from 'react';
import { Download, Wifi, WifiOff, CheckCircle2, Smartphone, ShieldCheck, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getOfflineQueue, syncOfflineQueue } from '../utils/offlineSync';

export const PWAStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [syncNotice, setSyncNotice] = useState('');

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      
      // Auto sync offline items
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        setSyncNotice(`Menyinkronkan ${queue.length} tiket offline ke server...`);
        const result = await syncOfflineQueue({
          CREATE_TICKET: async (payload) => {
            await axios.post('/client/tickets', payload);
          },
          WALK_IN_TICKET: async (payload) => {
            await axios.post('/tickets/walk-in', payload);
          },
          UPDATE_TICKET_STATUS: async (payload) => {
            await axios.post(`/tickets/${payload.ticketId}/status`, payload.data);
          },
          ASSIGN_TICKET: async (payload) => {
            await axios.post(`/tickets/${payload.ticketId}/assign`, payload.data);
          }
        });
        if (result.count > 0) {
          setSyncNotice(`✅ Sukses: ${result.count} tiket offline ter-sync ke server!`);
          setTimeout(() => setSyncNotice(''), 4000);
        }
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Capture PWA Install Prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if running as PWA (Standalone)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {/* Offline Sync Toast Notification */}
      {syncNotice && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 backdrop-blur-md shadow-2xl animate-pulse">
          <RefreshCw className="w-5 h-5 text-emerald-400 shrink-0 animate-spin" />
          <p className="text-xs font-medium">{syncNotice}</p>
        </div>
      )}

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 backdrop-blur-md shadow-2xl animate-bounce">
          <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-amber-300">Mode Offline (PWA Active)</p>
            <p className="text-amber-200/80">Koneksi terputus. Aplikasi tetap berjalan via Service Worker cache.</p>
          </div>
        </div>
      )}

      {/* PWA Feature Badge / Install Prompt */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-slate-200 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'}`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">PWA Ready</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Service Worker Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isInstalled
                ? 'Berjalan sebagai Aplikasi PWA Terinstal'
                : isOnline
                ? 'Status: Online (Siap Offline & Install)'
                : 'Status: Offline Mode'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {deferredPrompt && !isInstalled && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/30 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Install App
          </button>
        )}

        <button
          onClick={() => setShowBanner(false)}
          className="text-slate-400 hover:text-slate-200 text-xs ml-1"
          title="Tutup Indikator"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
