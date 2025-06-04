// Push Notification Subscription Handler
// Pastikan untuk meng-include file ini di index.html atau entry point utama aplikasi Anda

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'; // VAPID key dari dokumentasi Dicoding

async function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator)) {
    alert('Service Worker not supported!');
    return;
  }
  if (!('PushManager' in window)) {
    alert('PushManager not supported!');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Format payload sesuai spesifikasi API
    const payload = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
      }
    };

    // Kirim ke endpoint subscribe API
    const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      alert('Gagal subscribe: ' + (error.message || response.statusText));
    } else {
      alert('Berhasil subscribe push notification!');
    }
  } catch (err) {
    alert('Error subscribe: ' + err.message);
  }
}

// Panggil fungsi ini setelah service worker terdaftar
// subscribeUserToPush();

export { subscribeUserToPush };