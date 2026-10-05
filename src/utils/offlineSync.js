/**
 * Offline Sync & Background Sync Utility for PWA
 * - Manages local queue of offline ticket submissions & status updates.
 * - Supports Native Background Sync API (SyncManager) in Chromium/Android.
 * - Supports Intelligent Lifecycle Sync Engine as Firefox/Safari fallback.
 */

const OFFLINE_QUEUE_KEY = 'kendala_client_offline_queue';

/**
 * Check Background Sync API capabilities in current browser
 */
export const checkBackgroundSyncSupport = () => {
  const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasSyncManager = typeof window !== 'undefined' && 'SyncManager' in window;
  return {
    hasSW,
    hasSyncManager,
    mode: hasSyncManager ? 'native_syncmanager' : 'firefox_lifecycle_fallback',
    browserLabel: hasSyncManager ? 'Native SyncManager (Chromium/Android)' : 'Firefox/Safari Lifecycle Fallback'
  };
};

/**
 * Register Background Sync with Service Worker
 */
export const registerBackgroundSync = async (tag = 'sync-kendala-tickets') => {
  const support = checkBackgroundSyncSupport();

  if (support.hasSyncManager && support.hasSW) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register(tag);
      console.log(`[BackgroundSync] Native Background Sync terdaftar untuk tag: "${tag}"`);
      return {
        success: true,
        mode: 'native',
        tag,
        message: `Native Background Sync berhasil didaftarkan (Tag: ${tag}).`
      };
    } catch (err) {
      console.warn('[BackgroundSync] Gagal mendaftarkan native sync:', err);
    }
  }

  // Firefox / Safari Fallback: Lifecycle & Event-driven
  console.log('[BackgroundSync] Firefox Mode: Mengaktifkan Lifecycle Sync Engine.');
  return {
    success: true,
    mode: 'firefox_lifecycle',
    tag,
    message: 'Firefox Mode: Background Sync dijadwalkan via Lifecycle & Online Event Engine.'
  };
};

/**
 * Save action to local queue when offline
 */
export const queueOfflineAction = (type, payload) => {
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    const newItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    existing.push(newItem);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
    console.log('[OfflineSync] Action queued:', newItem);

    // Otomatis daftarkan background sync jika offline
    registerBackgroundSync('sync-kendala-tickets').catch(() => {});

    return newItem;
  } catch (err) {
    console.error('[OfflineSync] Error saving to queue:', err);
    return null;
  }
};

/**
 * Get all queued offline actions
 */
export const getOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch (err) {
    return [];
  }
};

/**
 * Sync queued actions to server when connection is restored
 */
export const syncOfflineQueue = async (handlerMap) => {
  const queue = getOfflineQueue();
  if (!queue.length) return { success: true, count: 0 };

  console.log(`[OfflineSync] Syncing ${queue.length} items to server...`);
  const remaining = [];
  let syncedCount = 0;

  for (const item of queue) {
    const handler = handlerMap[item.type];
    if (typeof handler === 'function') {
      try {
        await handler(item.payload);
        syncedCount++;
      } catch (err) {
        console.error(`[OfflineSync] Failed to sync item ${item.id}:`, err);
        remaining.push(item);
      }
    } else {
      console.warn(`[OfflineSync] No handler registered for action type: ${item.type}`);
      remaining.push(item);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  return { success: true, count: syncedCount, remaining: remaining.length };
};

/**
 * Clear all offline queue items
 */
export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

/**
 * Simulate background sync via Service Worker thread (Ideal for Testing Lab)
 */
export const simulateBackgroundSyncExecution = async (queueLength = 1) => {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve({
          success: true,
          source: 'Service Worker Worker Thread',
          data: event.data
        });
      };

      navigator.serviceWorker.controller.postMessage(
        {
          type: 'TRIGGER_BG_SYNC_SIMULATION',
          count: queueLength
        },
        [messageChannel.port2]
      );

      // Fallback timeout
      setTimeout(() => {
        resolve({
          success: true,
          source: 'Lifecycle Event Engine (Firefox)',
          data: {
            message: 'Background Sync simulasi dieksekusi via Firefox Lifecycle Engine.',
            itemsCount: queueLength,
            timestamp: new Date().toLocaleTimeString('id-ID')
          }
        });
      }, 700);
    } else {
      setTimeout(() => {
        resolve({
          success: true,
          source: 'Client Event Engine',
          data: {
            message: 'Background Sync diproses oleh Local Engine.',
            itemsCount: queueLength,
            timestamp: new Date().toLocaleTimeString('id-ID')
          }
        });
      }, 500);
    }
  });
};
