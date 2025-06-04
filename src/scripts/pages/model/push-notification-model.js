import { 
  initializePushNotifications, 
  subscribeWebPush, 
  unsubscribeWebPush, 
  testPushNotification,
  VAPID_PUBLIC_KEY 
} from '../../data/api.js';

export default class PushNotificationModel {
  constructor() {
    this.subscription = null;
    this.registration = null;
  }

  /**
   * Check browser support for push notifications
   */
  checkBrowserSupport() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      permissions: 'permissions' in navigator
    };
  }

  /**
   * Get current notification permission status
   */
  getNotificationPermission() {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'not-supported';
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notification not supported in this browser');
      }

      const permission = await Notification.requestPermission();
      console.log('[PushNotificationModel] Permission result:', permission);
      
      return { success: true, permission };
    } catch (error) {
      console.error('[PushNotificationModel] Failed to request permission:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Initialize push notifications (subscribe to server)
   */
  async enablePushNotifications() {
    try {
      console.log('[PushNotificationModel] Enabling push notifications...');
      
      // Check browser support first
      const support = this.checkBrowserSupport();
      if (!support.serviceWorker || !support.pushManager) {
        throw new Error('Browser does not support push notifications');
      }

      // Request permission if not granted
      const permission = this.getNotificationPermission();
      if (permission !== 'granted') {
        const permissionResult = await this.requestNotificationPermission();
        if (!permissionResult.success || permissionResult.permission !== 'granted') {
          throw new Error('Notification permission not granted');
        }
      }

      // Use the centralized initialization function
      const result = await initializePushNotifications();
      
      if (result.success) {
        this.subscription = result.subscription;
        this.registration = await navigator.serviceWorker.ready;
        
        console.log('[PushNotificationModel] Push notifications enabled successfully');
        return { 
          success: true, 
          subscription: result.subscription,
          message: 'Push notification berhasil diaktifkan!'
        };
      } else {
        throw new Error(result.message || 'Failed to initialize push notifications');
      }
    } catch (error) {
      console.error('[PushNotificationModel] Failed to enable push notifications:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Disable push notifications (unsubscribe from server)
   */
  async disablePushNotifications() {
    try {
      console.log('[PushNotificationModel] Disabling push notifications...');
      
      const currentSubscription = await this.getCurrentSubscription();
      if (!currentSubscription) {
        return { success: true, message: 'Tidak ada subscription aktif untuk dihapus' };
      }

      // Unsubscribe from server
      const unsubscribeResult = await unsubscribeWebPush(currentSubscription.endpoint);
      console.log('[PushNotificationModel] Server unsubscribe result:', unsubscribeResult);

      // Unsubscribe from browser
      const unsubscribed = await currentSubscription.unsubscribe();
      
      if (unsubscribed) {
        this.subscription = null;
        console.log('[PushNotificationModel] Push notifications disabled successfully');
        return { 
          success: true, 
          message: 'Push notification berhasil dinonaktifkan!'
        };
      } else {
        throw new Error('Failed to unsubscribe from browser');
      }
    } catch (error) {
      console.error('[PushNotificationModel] Failed to disable push notifications:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current push subscription
   */
  async getCurrentSubscription() {
    try {
      if (!('serviceWorker' in navigator)) {
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error('[PushNotificationModel] Failed to get current subscription:', error);
      return null;
    }
  }

  /**
   * Check if currently subscribed to push notifications
   */
  async isSubscribed() {
    const subscription = await this.getCurrentSubscription();
    return !!subscription;
  }

  /**
   * Test push notification (local notification)
   */
  testNotification(message = 'Test notification dari DiCerita PWA') {
    try {
      const permission = this.getNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      const notification = testPushNotification(message);
      
      if (notification) {
        console.log('[PushNotificationModel] Test notification sent');
        return { success: true, message: 'Test notification berhasil dikirim!' };
      } else {
        throw new Error('Failed to create test notification');
      }
    } catch (error) {
      console.error('[PushNotificationModel] Failed to send test notification:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get notification status info
   */
  async getNotificationStatus() {
    try {
      const permission = this.getNotificationPermission();
      const isSubscribed = await this.isSubscribed();
      const subscription = await this.getCurrentSubscription();
      const support = this.checkBrowserSupport();

      return {
        permission,
        isSubscribed,
        subscription: subscription ? {
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys
        } : null,
        support,
        vapidKey: VAPID_PUBLIC_KEY
      };
    } catch (error) {
      console.error('[PushNotificationModel] Failed to get notification status:', error);
      return {
        permission: 'default',
        isSubscribed: false,
        subscription: null,
        support: this.checkBrowserSupport(),
        vapidKey: VAPID_PUBLIC_KEY,
        error: error.message
      };
    }
  }

  /**
   * Register service worker if not already registered
   */
  async registerServiceWorker() {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PushNotificationModel] Service Worker registered:', registration);
      
      this.registration = registration;
      return { success: true, registration };
    } catch (error) {
      console.error('[PushNotificationModel] Service Worker registration failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Helper function to convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
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
   * Subscribe to push notifications manually (low-level)
   */
  async subscribeManually() {
    try {
      console.log('[PushNotificationModel] Manual subscription process...');
      
      // Ensure service worker is registered
      const swResult = await this.registerServiceWorker();
      if (!swResult.success) {
        throw new Error('Service Worker registration failed');
      }

      const registration = swResult.registration;
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('[PushNotificationModel] Manual subscription created:', subscription);

      // Send subscription to server
      const subscribeResult = await subscribeWebPush(
        subscription.endpoint, 
        subscription.toJSON().keys
      );

      if (subscribeResult.error) {
        throw new Error(subscribeResult.message || 'Server subscription failed');
      }

      this.subscription = subscription;
      
      return { 
        success: true, 
        subscription,
        message: 'Subscription berhasil dibuat!'
      };
    } catch (error) {
      console.error('[PushNotificationModel] Manual subscription failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get subscription details for display
   */
  getSubscriptionDetails() {
    if (!this.subscription) {
      return null;
    }

    const subscriptionObject = this.subscription.toJSON();
    return {
      endpoint: this.subscription.endpoint,
      keys: subscriptionObject.keys,
      expirationTime: this.subscription.expirationTime,
      options: this.subscription.options
    };
  }

  /**
   * Check if notifications are enabled in browser settings
   */
  async checkBrowserNotificationSettings() {
    try {
      if (!('permissions' in navigator)) {
        return { available: false, message: 'Permissions API not supported' };
      }

      const permission = await navigator.permissions.query({ name: 'notifications' });
      
      return {
        available: true,
        state: permission.state,
        canPrompt: permission.state === 'prompt'
      };
    } catch (error) {
      console.error('[PushNotificationModel] Failed to check browser settings:', error);
      return { available: false, message: error.message };
    }
  }
}