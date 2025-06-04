import CONFIG from '../config';

const ENDPOINTS = {
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
  GET_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  DETAIL_STORY: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
};

// Auth functions
export async function registerUser(name, email, password) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });
  
  return await response.json();
}

export async function loginUser(email, password, isDemo = false) { // Added isDemo parameter
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const responseJson = await response.json();
  
  // Only save auth data to localStorage if it's not a demo login
  if (!isDemo && !responseJson.error && responseJson.loginResult) {
    localStorage.setItem('auth', JSON.stringify({
      token: responseJson.loginResult.token,
      name: responseJson.loginResult.name,
      userId: responseJson.loginResult.userId,
    }));
  }
  
  return responseJson;
}

export function getToken() {
  const auth = localStorage.getItem('auth');
  if (auth) {
    return JSON.parse(auth).token;
  }
  return null;
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem('auth');
}

// Story functions
export async function getData(page = 1, size = 10, needLocation = 1) {
  try {
    let token = getToken();

    // If not logged in, attempt to login/register demo user to fetch data
    if (!token) {
      const demoLoginResponse = await loginUser('demo@example.com', 'password123', true); // Pass true for isDemo
      if (demoLoginResponse.error) {
        // If demo login failed, try registering demo user and login again
        await registerUser('Demo User', 'demo@example.com', 'password123');
        const secondDemoLoginResponse = await loginUser('demo@example.com', 'password123', true); // Pass true for isDemo
        if (!secondDemoLoginResponse.error) {
          token = secondDemoLoginResponse.loginResult.token;
        }
      } else {
        token = demoLoginResponse.loginResult.token;
      }
    }
    
    const url = `${ENDPOINTS.GET_STORIES}?page=${page}&size=${size}&location=${needLocation}`;
    const options = {
      headers: {} // Start with empty headers
    };
    
    // Add Authorization header only if token exists (either user's or demo's)
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, options);
    const json = await response.json();
    
    console.log('API Response JSON:', json); // Log the entire response
    
    // Return both stories and pagination metadata with proper fallbacks
    if (json.listStory && Array.isArray(json.listStory)) {
      return {
        stories: json.listStory.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          photoUrl: item.photoUrl,
          createdAt: item.createdAt,
          lat: item.lat,
          lng: item.lon
        })),
        pagination: {
          page: json.page || page,
          size: json.size || size,
          totalPages: json.totalPages || 1,
          hasMore: json.page < json.totalPages
        }
      };
    }
    return { stories: [], pagination: { page, size, totalPages: 0, hasMore: false } };
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

export async function addStory(description, photoBlob, lat, lon) {
  try {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photoBlob);
    
    if (lat && lon) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }
    
    const token = getToken();
    const url = token ? ENDPOINTS.ADD_STORY : ENDPOINTS.ADD_STORY_GUEST;
    const headers = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error adding story:', error);
    return { error: true, message: error.message };
  }
}

export async function getStoryDetail(id) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(ENDPOINTS.DETAIL_STORY(id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const json = await response.json();
    
    if (json.error) {
      throw new Error(json.message);
    }
    
    return json.story;
  } catch (error) {
    console.error('Error fetching story detail:', error);
    return null;
  }
}

// --- Push Notification (Web Push) ---

export const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';


export const STORY_NOTIFICATION_SCHEMA = {
  title: 'Story berhasil dibuat',
  options: {
    body: 'Anda telah membuat story baru dengan deskripsi: <story description>',
  },
};

console.log('Push notification schema loaded:', STORY_NOTIFICATION_SCHEMA);

/**
 * Subscribe to web push notifications
 * @param {string} endpoint
 * @param {object} keys - { p256dh: string, auth: string }
 * @returns {Promise<object>}
 */
export async function subscribeWebPush(endpoint, keys) {
  console.log('Starting Web Push subscription...');
  console.log('Endpoint:', endpoint);
  console.log('Keys:', keys);
  
  const token = getToken();
  if (!token) {
    console.error('Authentication required for Web Push subscription');
    throw new Error('Authentication required');
  }
  
  console.log('Token found, proceeding with subscription');
  
  const requestBody = {
    endpoint,
    keys
  };
  
  console.log('Sending subscription request:', requestBody);
  
  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  const result = await response.json();
  console.log('Subscription response:', result);
  
  if (response.ok) {
    console.log('Web Push subscription successful');
  } else {
    console.error('Web Push subscription failed:', result);
  }
  
  return result;
}

/**
 * Unsubscribe from web push notifications
 * @param {string} endpoint
 * @returns {Promise<object>}
 */
export async function unsubscribeWebPush(endpoint) {
  console.log('Starting Web Push unsubscription...');
  console.log('Endpoint:', endpoint);
  
  const token = getToken();
  if (!token) {
    console.error('Authentication required for Web Push unsubscription');
    throw new Error('Authentication required');
  }
  
  console.log('Token found, proceeding with unsubscription');
  
  const requestBody = { endpoint };
  console.log('Sending unsubscription request:', requestBody);
  
  const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  const result = await response.json();
  console.log('Unsubscription response:', result);
  
  if (response.ok) {
    console.log('Web Push unsubscription successful');
  } else {
    console.error('Web Push unsubscription failed:', result);
  }
  
  return result;
}
/**
 * Helper function to initialize and test push notifications
 * This function will check browser support and request permission
 */
export async function initializePushNotifications() {
  console.log('Initializing Push Notifications...');
  
  // Check if browser supports push notifications
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported in this browser');
    return { error: true, message: 'Service Worker not supported' };
  }
  
  if (!('PushManager' in window)) {
    console.error('Push messaging not supported in this browser');
    return { error: true, message: 'Push messaging not supported' };
  }
  
  console.log('Browser supports push notifications');
  
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return { error: true, message: 'Permission not granted' };
    }
    
    console.log('Notification permission granted');
    
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    console.log('Push subscription created:', subscription);
    console.log('Endpoint:', subscription.endpoint);
    console.log('Keys:', subscription.toJSON().keys);
    
    // Send subscription to server
    const result = await subscribeWebPush(subscription.endpoint, subscription.toJSON().keys);
    console.log('Subscription sent to server:', result);
    
    return { success: true, subscription, result };
    
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return { error: true, message: error.message };
  }
}

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
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

/**
 * Helper function to test push notification
 */
export function testPushNotification(description = 'Test story description') {
  console.log('Testing push notification...');
  
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(STORY_NOTIFICATION_SCHEMA.title, {
      ...STORY_NOTIFICATION_SCHEMA.options,
      body: STORY_NOTIFICATION_SCHEMA.options.body.replace('<story description>', description),
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzE4NzdmMiIvPgo8cGF0aCBkPSJNMTYgMTZoOGw4IDE2LTggMTZIMTZWMTZaTTMyIDI0djE2aDhsOC0xNlYyNGgtMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
      badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzE4NzdmMiIvPgo8cGF0aCBkPSJNMTYgMTZoOGw4IDE2LTggMTZIMTZWMTZaTTMyIDI0djE2aDhsOC0xNlYyNGgtMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'
    });
    
    console.log('Test notification sent:', notification);
    
    notification.onclick = function() {
      console.log('Notification clicked');
      window.focus();
      notification.close();
    };
    
    return notification;
  } else {
    console.warn('Notifications not available or permission not granted');
    return null;
  }
}