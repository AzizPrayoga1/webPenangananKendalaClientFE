import axios from 'axios';

/**
 * Convert URL-safe Base64 string to Uint8Array for VAPID Key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission and subscribe user to Web Push
 */
export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Web Push Notification tidak didukung oleh browser ini.');
  }

  // Request Permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi ditolak oleh pengguna.');
  }

  // Get Registration
  const registration = await navigator.serviceWorker.ready;

  // Fetch VAPID Public Key from Backend
  const { data } = await axios.get('/vapid-public-key');
  const publicKey = data.publicKey;
  const convertedKey = urlBase64ToUint8Array(publicKey);

  // Subscribe
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });
  }

  // Post subscription to backend
  await axios.post('/push-subscriptions', subscription.toJSON());

  return subscription;
}

/**
 * Trigger a test Web Push notification from backend
 */
export async function sendTestPushNotification() {
  const { data } = await axios.post('/send-test-push');
  return data;
}
