import React, { useState, useEffect } from 'react';
import { Download, Wifi, WifiOff, CheckCircle2, Smartphone, ShieldCheck, RefreshCw, FlaskConical, Share, Plus, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { getOfflineQueue, syncOfflineQueue } from '../utils/offlineSync';
import { PWATestingLab } from './PWATestingLab';

export const PWAStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showTestingLab, setShowTestingLab] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
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

    // Phase 4: Detect iOS Safari
    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isIosDevice && !isInStandalone) {
      setIsIos(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Phase 4: Dynamic Theme Color Adaptation (changes meta theme-color based on online/offline state)
  useEffect(() => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', isOnline ? '#0f172a' : '#b45309');
  }, [isOnline]);

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

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowTestingLab(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            title="Buka PWA Testing Lab Simulator"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Test Lab</span>
          </button>

          {isIos && !isInstalled && (
            <button
              onClick={() => setShowIosPrompt(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/30 shrink-0 cursor-pointer"
              title="Panduan Install di iOS Safari"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS Install</span>
            </button>
          )}

          {deferredPrompt && !isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
          )}

          <button
            onClick={() => setShowBanner(false)}
            className="text-slate-400 hover:text-slate-200 text-xs ml-1 cursor-pointer"
            title="Tutup Indikator"
          >
            ✕
          </button>
        </div>
      </div>

      {/* iOS Safari Add to Home Screen Guidance Modal */}
      {showIosPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Pasang di iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-400">Panduan iOS Safari</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosPrompt(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    Ketuk tombol Share <Share className="w-3.5 h-3.5 text-sky-400 inline" />
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Di bilah menu bawah browser Safari (ikon kotak dengan panah ke atas).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    Pilih "Add to Home Screen" <Plus className="w-3.5 h-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Gulir daftar opsi ke bawah hingga menemukan <em>"Tambahkan ke Layar Utama"</em>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-200">Ketuk "Tambah" (Add)</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Aplikasi akan terpasang di Home Screen iPhone Anda seperti aplikasi App Store!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosPrompt(false)}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-600/30 cursor-pointer mt-1 text-center"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Interactive PWA Testing Lab Modal */}
      <PWATestingLab
        isOpen={showTestingLab}
        onClose={() => setShowTestingLab(false)}
      />
    </div>
  );
};
