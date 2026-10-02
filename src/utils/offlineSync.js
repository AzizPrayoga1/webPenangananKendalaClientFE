/**
 * Offline Sync Utility for PWA
 * Manages local queue of offline ticket submissions & status updates.
 */

const OFFLINE_QUEUE_KEY = 'kendala_client_offline_queue';

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
