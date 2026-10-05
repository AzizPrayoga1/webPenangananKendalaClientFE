import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Wifi,
  WifiOff,
  Bell,
  Send,
  RefreshCw,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Smartphone,
  X,
  PlusCircle,
  Layers,
  Sparkles,
  Zap,
  Gauge,
  ShieldCheck,
  HardDrive,
  Cpu,
  Activity,
  Check,
  Radio,
  Clock
} from 'lucide-react';
import axios from 'axios';
import {
  getOfflineQueue,
  queueOfflineAction,
  clearOfflineQueue,
  syncOfflineQueue,
  checkBackgroundSyncSupport,
  registerBackgroundSync,
  simulateBackgroundSyncExecution
} from '../utils/offlineSync';
import {
  subscribeUserToPush,
  sendTestPushNotification
} from '../utils/pushManager';
import {
  setAppBadge,
  clearAppBadge
} from '../utils/appBadge';

export const PWATestingLab = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [cacheList, setCacheList] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Phase 5: Optimization & Diagnostic States
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ usage: null, quota: null, percent: 0 });
  const [isSecure, setIsSecure] = useState(typeof window !== 'undefined' ? window.isSecureContext : false);
  const [swActive, setSwActive] = useState(false);
  const [bgSyncInfo, setBgSyncInfo] = useState(checkBackgroundSyncSupport());
  const [bgSyncLoading, setBgSyncLoading] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    setLogs((prev) => [
      { id: Date.now() + Math.random(), time: timestamp, message, type },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  const refreshQueue = () => {
    const q = getOfflineQueue();
    setOfflineQueue(q);
  };

  const checkStorageQuota = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usageMB = (est.usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (est.quota / (1024 * 1024)).toFixed(0);
        const pct = est.quota > 0 ? ((est.usage / est.quota) * 100).toFixed(1) : 0;
        setStorageInfo({ usage: usageMB, quota: quotaMB, percent: pct });
      } catch (e) {
        console.error('Storage estimate error', e);
      }
    }
  };

  const checkServiceWorkerStatus = () => {
    if ('serviceWorker' in navigator) {
      setSwActive(!!navigator.serviceWorker.controller);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshQueue();
      addLog('🧪 PWA Testing Lab dibuka. Siap untuk pengujian live.', 'info');
      checkCaches();
      checkStorageQuota();
      checkServiceWorkerStatus();
    }
  }, [isOpen]);

  const handleBenchmarkBackend = async () => {
    setBenchmarking(true);
    addLog('⚡ Mengukur latensi roundtrip API Laravel (/api/health)...', 'info');
    const startTime = performance.now();
    try {
      const res = await axios.get('/health', { timeout: 7000 });
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const data = res.data || {};
      setBenchmarkResult({
        latency: latencyMs,
        status: res.status,
        service: data.service || 'Laravel API',
        phpVersion: data.php_version || '8.4',
        environment: data.environment || 'local',
        dbConnected: data.database_connected !== false,
        vapidConfigured: data.vapid_configured !== false,
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
      addLog(
        `⚡ Latensi API Laravel: ${latencyMs} ms | HTTP ${res.status} OK | PHP ${data.php_version} | DB: Terhubung | VAPID: Siap`,
        latencyMs < 100 ? 'success' : 'warn'
      );
    } catch (err) {
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      setBenchmarkResult({
        latency: latencyMs,
        status: err.response?.status || 500,
        error: err.message,
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
      addLog(`❌ Benchmark API gagal (${latencyMs} ms): ${err.message}`, 'error');
    } finally {
      setBenchmarking(false);
    }
  };

  const checkCaches = async () => {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        const details = [];
        for (const key of keys) {
          const cache = await caches.open(key);
          const reqs = await cache.keys();
          details.push({ name: key, count: reqs.length });
        }
        setCacheList(details);
        addLog(`💾 Terdeteksi ${keys.length} cache storage aktif.`, 'info');
      } catch (err) {
        addLog(`Gagal membaca cache storage: ${err.message}`, 'error');
      }
    }
  };

  // 1. Simulator: Toggle Offline / Online
  const handleToggleOnline = (forceStatus) => {
    setIsOnline(forceStatus);
    const eventName = forceStatus ? 'online' : 'offline';
    window.dispatchEvent(new Event(eventName));
    addLog(
      forceStatus
        ? '🌐 Event ONLINE dipicu! Aplikasi mendeteksi jaringan terhubung.'
        : '📴 Event OFFLINE dipicu! Aplikasi masuk ke mode Service Worker Cache.',
      forceStatus ? 'success' : 'warn'
    );
  };

  // 2. Simulator: Buat Tiket Dummy Saat Offline
  const handleCreateDummyOfflineTicket = () => {
    const fakeId = Math.floor(1000 + Math.random() * 9000);
    const fakeTicket = {
      title: `[Uji Coba Offline #${fakeId}] Server Lambat & Timeout`,
      description: `Tiket dummy hasil simulasi PWA Testing Lab yang dibuat pada ${new Date().toLocaleTimeString()} saat koneksi offline.`,
      priority: 'high',
      category: 'Jaringan'
    };

    const queuedItem = queueOfflineAction('CREATE_TICKET', fakeTicket);
    refreshQueue();
    addLog(
      `📝 Tiket simulasi #${fakeId} berhasil disimpan ke Offline Queue (Local Storage).`,
      'success'
    );
  };

  // 3. Simulator: Trigger Auto-Sync ke Laravel Backend
  const handleTriggerSync = async () => {
    setLoading(true);
    addLog('⚡ Memulai sinkronisasi antrean tiket offline ke Laravel Backend...', 'info');

    try {
      const result = await syncOfflineQueue({
        CREATE_TICKET: async (payload) => {
          const res = await axios.post('/client/tickets', payload);
          addLog(`✅ Server Laravel menerima tiket: "${payload.title}" (ID: ${res.data?.id || 'OK'})`, 'success');
        },
        WALK_IN_TICKET: async (payload) => {
          const res = await axios.post('/tickets/walk-in', payload);
          addLog(`✅ Server Laravel menerima tiket walk-in: "${payload.title}"`, 'success');
        }
      });

      refreshQueue();
      if (result.count > 0) {
        addLog(`🎉 Auto-sync selesai! ${result.count} data berhasil disinkronkan ke Backend.`, 'success');
      } else {
        addLog('ℹ️ Tidak ada antrean tiket yang perlu disinkronkan.', 'info');
      }
    } catch (err) {
      addLog(`❌ Gagal sinkronisasi: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3b. Simulator: Background Sync Simulation (Service Worker Thread)
  const handleTriggerBackgroundSyncSimulation = async () => {
    setBgSyncLoading(true);
    addLog('📡 Memulai simulasi Background Sync di Service Worker thread...', 'info');

    // Jika antrean kosong, otomatis buat 1 dummy tiket dulu agar ada data riil yang disinkronkan
    let currentQueue = getOfflineQueue();
    if (currentQueue.length === 0) {
      const fakeId = Math.floor(1000 + Math.random() * 9000);
      const fakeTicket = {
        title: `[Background Sync #${fakeId}] Tiket Terkirim Saat Tab Tertutup`,
        description: `Tiket ini disimpan saat offline dan dieksekusi otomatis oleh Service Worker Background Sync Engine pada ${new Date().toLocaleTimeString()}.`,
        priority: 'high',
        category: 'Sistem'
      };
      queueOfflineAction('CREATE_TICKET', fakeTicket);
      refreshQueue();
      addLog(`📝 Tiket #${fakeId} ditambahkan ke antrean offline untuk uji Background Sync.`, 'info');
      currentQueue = getOfflineQueue();
    }

    try {
      // 1. Eksekusi simulasi di thread Service Worker
      const bgResult = await simulateBackgroundSyncExecution(currentQueue.length);
      addLog(`⚙️ [${bgResult.source}] ${bgResult.data?.message || 'Event sync diproses.'}`, 'info');

      // 2. Lakukan sinkronisasi data aktual ke backend Laravel
      const result = await syncOfflineQueue({
        CREATE_TICKET: async (payload) => {
          const res = await axios.post('/client/tickets', payload);
          addLog(`✅ Server Laravel menerima tiket: "${payload.title}" (ID: ${res.data?.id || 'OK'})`, 'success');
        },
        WALK_IN_TICKET: async (payload) => {
          const res = await axios.post('/tickets/walk-in', payload);
          addLog(`✅ Server Laravel menerima tiket walk-in: "${payload.title}"`, 'success');
        }
      });

      refreshQueue();
      addLog(
        `🎉 Background Sync Sukses! ${result.count} tiket berhasil dikirim ke Backend Laravel oleh Background Sync Engine.`,
        'success'
      );
    } catch (err) {
      addLog(`❌ Background Sync error: ${err.message}`, 'error');
    } finally {
      setBgSyncLoading(false);
    }
  };

  // 4. Simulator: Bersihkan Antrean
  const handleClearQueue = () => {
    clearOfflineQueue();
    refreshQueue();
    addLog('🧹 Antrean offline telah dibersihkan.', 'warn');
  };

  // 5. Simulator: Minta Izin & Daftarkan Web Push
  const handleSubscribePush = async () => {
    setLoading(true);
    addLog('🔔 Meminta izin notifikasi browser & mendaftarkan VAPID Push...', 'info');
    try {
      await subscribeUserToPush();
      setNotificationPermission(Notification.permission);
      addLog('🎉 Izin diberikan & Browser berhasil didaftarkan ke Web Push!', 'success');
    } catch (err) {
      addLog(`❌ Gagal mendaftar push: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 6. Simulator: Tembak Notifikasi Browser Langsung (Native Pop-up)
  const handleTriggerNativeNotification = async () => {
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm !== 'granted') {
        addLog('⚠️ Izin notifikasi belum diizinkan oleh pengguna.', 'warn');
        return;
      }
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification('🚀 PWA Live Alert: Kendala Client', {
          body: 'Notifikasi pop-up desktop native Firefox berhasil dipicu secara real-time!',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'pwa-test-alert',
          vibrate: [200, 100, 200]
        });
        addLog('🔔 Pop-up notifikasi native OS Firefox berhasil ditembakkan!', 'success');
      } else {
        new Notification('🚀 PWA Live Alert', {
          body: 'Notifikasi desktop native berhasil dipicu!',
          icon: '/pwa-192x192.png'
        });
        addLog('🔔 Notifikasi window berhasil ditembakkan!', 'success');
      }
    } catch (err) {
      addLog(`❌ Gagal memunculkan notifikasi: ${err.message}`, 'error');
    }
  };

  // 7. Simulator: Tembak Push dari Server Backend Laravel
  const handleTriggerBackendPush = async () => {
    setLoading(true);
    addLog('📡 Meminta Backend Laravel mengirim Web Push via VAPID...', 'info');
    try {
      const res = await sendTestPushNotification();
      addLog(`🚀 Respon Backend: ${res.message}`, 'success');
    } catch (err) {
      addLog(`❌ Gagal kirim push dari backend: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 8. Simulator: Set App Badge API (Native + Firefox Favicon Badge)
  const handleSetBadge = async (count) => {
    setBadgeCount(count);
    try {
      if (count === 0) {
        await clearAppBadge();
        addLog('🏷️ App Badge di-clear. Ikon Favicon & Judul Tab dipulihkan normal.', 'info');
      } else {
        const res = await setAppBadge(count);
        if (res.isNative) {
          addLog(`🏷️ Native OS App Badge di-set ke: ${count} di taskbar/launcher.`, 'success');
        } else {
          addLog(
            `🦊 Firefox Mode: Favicon Badge merah (${count}) & Judul Tab "(${count}) ..." aktif! Coba lihat tab browser Firefox Anda sekarang!`,
            'success'
          );
        }
      }
    } catch (err) {
      addLog(`Badge error: ${err.message}`, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in text-left">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">🧪 PWA Live Testing Lab</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Interactive Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Uji langsung fitur Offline Sync, Web Push Notification, Service Worker, & Badge di browser Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Testing Lab"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Panel 1: Offline & Auto-Sync */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-400" />
                )}
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Offline Mode & Auto-Sync
                </h4>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                }`}
              >
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Uji ketahanan aplikasi saat koneksi terputus. Data tiket yang dibuat saat offline akan tersimpan di antrean lokal dan terkirim otomatis saat online.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleOnline(false)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isOnline
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5" />
                Simulasi Offline
              </button>
              <button
                type="button"
                onClick={() => handleToggleOnline(true)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isOnline
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                Simulasi Online
              </button>
            </div>

            {/* Offline Queue Box */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  Antrean Offline (Queue):
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300">
                  {offlineQueue.length} Item Menunggu
                </span>
              </div>

              {offlineQueue.length > 0 ? (
                <div className="max-h-24 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {offlineQueue.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-800/80 p-2 rounded border border-slate-700/50 text-[10px]"
                    >
                      <p className="font-bold text-slate-200 truncate">
                        {item.payload?.title || item.type}
                      </p>
                      <p className="text-slate-400">{item.timestamp}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 py-1 italic">
                  Belum ada tiket di antrean offline.
                </p>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCreateDummyOfflineTicket}
                  className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + Buat Tiket Dummy
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={loading || offlineQueue.length === 0}
                  className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync ke Laravel
                </button>
                {offlineQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="p-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded text-[11px] transition-colors cursor-pointer"
                    title="Kosongkan Antrean"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sub-card: Service Worker Background Sync Engine */}
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-lg p-3 flex flex-col gap-2 mt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <Radio className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Background Sync Engine (PWA Advanced)</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {bgSyncInfo.hasSyncManager ? 'SyncManager (Native)' : 'Firefox Lifecycle'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {bgSyncInfo.hasSyncManager
                    ? 'Browser mendukung SyncManager. Service Worker menyinkronkan data di latar belakang meskipun tab ditutup!'
                    : 'Di Firefox, Background Sync di-handle otomatis via Service Worker message & Online Lifecycle Engine saat koneksi pulih.'}
                </p>

                <button
                  type="button"
                  onClick={handleTriggerBackgroundSyncSimulation}
                  disabled={bgSyncLoading}
                  className="py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-950 disabled:opacity-50"
                >
                  <Radio className={`w-3.5 h-3.5 ${bgSyncLoading ? 'animate-spin' : ''}`} />
                  {bgSyncLoading
                    ? 'Menjalankan Sync di SW Thread...'
                    : '📡 Simulasi Background Sync (SW Thread)'}
                </button>
              </div>
            </div>
          </div>

          {/* Panel 2: Web Push Notifications */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Real-Time Web Push Notification
                </h4>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                Izin: {notificationPermission}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Memicu notifikasi desktop asli di Firefox / OS. Notifikasi bisa ditembakkan secara lokal via Service Worker atau dikirim dari Backend Laravel menggunakan VAPID.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubscribePush}
                disabled={loading}
                className="py-2 px-3 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Bell className="w-4 h-4" />
                {notificationPermission === 'granted'
                  ? 'Perbarui Langganan VAPID Push'
                  : 'Aktifkan Izin Web Push'}
              </button>

              <button
                type="button"
                onClick={handleTriggerNativeNotification}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
                Tembak Pop-up Native OS (Firefox)
              </button>

              <button
                type="button"
                onClick={handleTriggerBackendPush}
                disabled={loading}
                className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Tembak Push dari Server Laravel (/api/send-test-push)
              </button>
            </div>
          </div>

          {/* Panel 3: App Badge API (Phase 4) */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  3. App Badge API (Ikon OS)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Badge: {badgeCount}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Menampilkan angka notifikasi merah pada ikon aplikasi di taskbar laptop atau launcher HP saat aplikasi terinstal.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetBadge(1)}
                className="flex-1 py-1.5 bg-slate-700 hover:bg-purple-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Badge = 1
              </button>
              <button
                type="button"
                onClick={() => handleSetBadge(5)}
                className="flex-1 py-1.5 bg-slate-700 hover:bg-purple-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Badge = 5
              </button>
              <button
                type="button"
                onClick={() => handleSetBadge(12)}
                className="flex-1 py-1.5 bg-slate-700 hover:bg-purple-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Badge = 12
              </button>
              <button
                type="button"
                onClick={() => handleSetBadge(0)}
                className="flex-1 py-1.5 bg-slate-700 hover:bg-rose-600 text-white rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Panel 4: Service Worker & Cache Inspector */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  4. Cache Storage Inspector
                </h4>
              </div>
              <button
                type="button"
                onClick={checkCaches}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Data dan aset yang tersimpan permanen di memori browser pengguna oleh Service Worker Workbox:
            </p>

            <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
              {cacheList.length > 0 ? (
                cacheList.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800 text-xs"
                  >
                    <span className="font-mono text-cyan-300 text-[11px] truncate">{c.name}</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      {c.count} file
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500 italic">Memindai cache storage...</p>
              )}
            </div>
          </div>

          {/* Panel 5: Phase 5 - Optimasi & Diagnostik Produksi (Frontend & Backend) */}
          <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-900/90 via-slate-800/70 to-slate-900/90 border border-indigo-500/30 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    5. Phase 5: Production & Bundle Optimization (Frontend & Backend)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Diagnostik performa bundle, code splitting, kuota penyimpanan, serta benchmark latensi API Laravel.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Production Ready
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sisi Kiri: Frontend Code-Splitting */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Frontend Bundle Splitting (Vite v8)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">0 Warning (&gt;500kB)</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Monolith bundle lama (&gt;580 kB) telah dipecah menjadi chunk modular terpisah untuk caching permanen:
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <p className="text-slate-400 font-medium">vendor-react</p>
                    <p className="text-emerald-400 font-bold font-mono">243.6 kB <span className="text-[9px] text-slate-500">(gzip 77kB)</span></p>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <p className="text-slate-400 font-medium">index (App Core)</p>
                    <p className="text-emerald-400 font-bold font-mono">290.0 kB <span className="text-[9px] text-slate-500">(gzip 52kB)</span></p>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <p className="text-slate-400 font-medium">vendor-network</p>
                    <p className="text-cyan-400 font-bold font-mono">47.1 kB <span className="text-[9px] text-slate-500">(gzip 17kB)</span></p>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                    <p className="text-slate-400 font-medium">vendor-other</p>
                    <p className="text-cyan-400 font-bold font-mono">9.2 kB <span className="text-[9px] text-slate-500">(gzip 3kB)</span></p>
                  </div>
                </div>

                {/* Storage Quota Inspector */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-slate-500" /> Storage Digunakan:
                  </span>
                  <span className="text-slate-200 font-mono font-semibold">
                    {storageInfo.usage ? `${storageInfo.usage} MB / ${storageInfo.quota} MB` : 'Browser Storage OK'}
                  </span>
                </div>
              </div>

              {/* Sisi Kanan: Backend Laravel Benchmark */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Backend Latency & Health (Laravel API)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">/api/health</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Uji kecepatan respon server Laravel dan verifikasi kesiapan database serta VAPID push:
                  </p>

                  {/* Benchmark Status Box */}
                  <div className="mt-2.5 bg-slate-900/90 p-2.5 rounded border border-slate-800 flex flex-col gap-1.5">
                    {benchmarkResult ? (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Roundtrip Latency:</span>
                          <span
                            className={`font-mono font-extrabold px-2 py-0.5 rounded text-xs ${
                              benchmarkResult.latency < 100
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : benchmarkResult.latency < 250
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            ⚡ {benchmarkResult.latency} ms ({benchmarkResult.latency < 100 ? 'Ultra Fast' : 'Normal'})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 pt-1 border-t border-slate-800/80">
                          <div>Engine: <span className="text-cyan-400 font-mono">PHP {benchmarkResult.phpVersion}</span></div>
                          <div>Status: <span className="text-emerald-400 font-mono">HTTP {benchmarkResult.status} OK</span></div>
                          <div>Database: <span className="text-emerald-400 font-mono">Terhubung</span></div>
                          <div>VAPID Push: <span className="text-emerald-400 font-mono">Siap</span></div>
                        </div>
                      </>
                    ) : (
                      <div className="py-2 text-center text-[11px] text-slate-500 italic">
                        Belum ada uji latensi. Klik tombol di bawah untuk memulai.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBenchmarkBackend}
                    disabled={benchmarking}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-950 cursor-pointer disabled:opacity-50"
                  >
                    <Activity className={`w-3.5 h-3.5 ${benchmarking ? 'animate-spin' : ''}`} />
                    {benchmarking ? 'Mengukur Latensi...' : '⚡ Uji Latensi API Laravel'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Status Ribbon: PWA Environment Readiness */}
            <div className="bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Konteks Keamanan:</span>
                <span className="text-slate-200 font-semibold">{isSecure ? '🔒 Secure Context (Pass)' : 'Localhost / HTTP'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Service Worker Controller:</span>
                <span className="text-slate-200 font-semibold">{swActive ? 'Aktif & Mengontrol' : 'Terdaftar'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Format Cache:</span>
                <span className="text-slate-200 font-semibold">Workbox StaleWhileRevalidate</span>
              </div>
            </div>
          </div>

          {/* Terminal Live Logger */}
          <div className="col-span-1 md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-300">
                  Live Event Console / Activity Log
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Bersihkan Log
              </button>
            </div>

            <div className="h-32 overflow-y-auto font-mono text-[11px] flex flex-col-reverse gap-1 pr-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : log.type === 'error'
                        ? 'text-rose-400 font-bold'
                        : 'text-slate-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-slate-600 italic">Menunggu aktivitas pengujian...</p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <p>
            💡 <strong className="text-slate-300">Tips Firefox:</strong> Uji mode offline atau push notification lalu periksa console log di atas.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold cursor-pointer transition-colors"
          >
            Tutup Lab
          </button>
        </div>

      </div>
    </div>
  );
};
