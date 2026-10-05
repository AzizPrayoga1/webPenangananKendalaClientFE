/**
 * Custom Service Worker Extensions for Penanganan Kendala Client PWA
 * - Background Sync Event Listener (SyncManager)
 * - Intelligent Cross-Context Message Channel (Firefox Fallback)
 * - Notification Click & Background Processing
 */

// 1. Native Background Sync Listener (Supported in Chromium / Android)
self.addEventListener('sync', (event) => {
  console.log('[SW Background Sync] Event dipicu:', event.tag);
  if (event.tag === 'sync-kendala-tickets' || event.tag === 'sync-tickets') {
    event.waitUntil(
      (async () => {
        console.log('[SW Background Sync] Menjalankan proses sinkronisasi di latar belakang...');
        
        // Kirim sinyal ke semua client/tab yang terhubung
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        for (const client of clients) {
          client.postMessage({
            type: 'BACKGROUND_SYNC_TRIGGERED',
            tag: event.tag,
            timestamp: new Date().toISOString()
          });
        }
      })()
    );
  }
});

// 2. Periodic Background Sync (PWA Advanced)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW Periodic Sync] Event periodik dipicu:', event.tag);
});

// 3. Service Worker Message Channel (Dukungan Penuh untuk Firefox & Simulasi Lab)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'PING_SW') {
    if (event.source) {
      event.source.postMessage({
        type: 'PONG_SW',
        timestamp: Date.now(),
        status: 'active'
      });
    }
  }

  if (event.data.type === 'TRIGGER_BG_SYNC_SIMULATION') {
    console.log('[SW Background Sync] Menjalankan simulasi background sync dari Testing Lab...');
    // Simulasi delay eksekusi di latar belakang
    setTimeout(() => {
      if (event.source) {
        event.source.postMessage({
          type: 'BG_SYNC_SIMULATION_COMPLETED',
          message: 'Background Sync berhasil dieksekusi di Service Worker worker thread.',
          itemsCount: event.data.count || 1,
          timestamp: new Date().toLocaleTimeString('id-ID')
        });
      }
    }, 600);
  }
});
