import { 
  initializePushNotifications, 
  testPushNotification,
  VAPID_PUBLIC_KEY,
  STORY_NOTIFICATION_SCHEMA
} from './data/api.js';

/**
 * Demo script to test push notifications
 * Open browser console to see all the logs
 */
console.log('Push Notification Demo Script Loaded');
console.log('================================================');

// Display push notification configuration
console.group('Push Notification Configuration');
console.log('Notification Schema:', STORY_NOTIFICATION_SCHEMA);
console.groupEnd();

// Add functions to window for manual testing
window.pushNotificationDemo = {
  // Initialize push notifications
  async init() {
    console.group('Initializing Push Notifications');
    const result = await initializePushNotifications();
    console.log('Initialization result:', result);
    console.groupEnd();
    return result;
  },
  
  // Test local notification
  test(description = 'Testing push notification dari console') {
    console.group('Testing Local Notification');
    const notification = testPushNotification(description);
    console.log('Test notification result:', notification);
    console.groupEnd();
    return notification;
  },
  
  // Check notification permission status
  checkPermission() {
    console.group('Checking Notification Permission');
    if ('Notification' in window) {
      console.log('Notification permission:', Notification.permission);
      console.log('Browser supports notifications: Yes');
    } else {
      console.log('Browser does not support notifications: No');
    }
    
    if ('serviceWorker' in navigator) {
      console.log('Service Worker supported: Yes');
    } else {
      console.log('Service Worker not supported: No');
    }
    
    if ('PushManager' in window) {
      console.log('Push Manager supported: Yes');
    } else {
      console.log('Push Manager not supported: No');
    }
    console.groupEnd();
  },
  
  // Request permission manually
  async requestPermission() {
    console.group('Requesting Notification Permission');
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      console.groupEnd();
      return permission;
    } else {
      console.log('Notifications not supported');
      console.groupEnd();
      return 'not-supported';
    }
  }
};

// Auto-check capabilities when script loads
console.group('Auto-checking Push Notification Capabilities');
window.pushNotificationDemo.checkPermission();
console.groupEnd();

console.log('================================================');
console.log('Available demo functions:');
console.log('- pushNotificationDemo.init() - Initialize push notifications');
console.log('- pushNotificationDemo.test() - Test local notification');
console.log('- pushNotificationDemo.checkPermission() - Check browser support');
console.log('- pushNotificationDemo.requestPermission() - Request permission');
console.log('================================================');