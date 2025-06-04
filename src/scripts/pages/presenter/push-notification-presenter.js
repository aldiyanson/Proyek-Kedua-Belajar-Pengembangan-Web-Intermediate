import PushNotificationModel from '../model/push-notification-model.js';
import PushNotificationView from '../view/push-notification-view.js';

export default class PushNotificationPresenter {
  constructor() {
    this.model = new PushNotificationModel();
    this.view = new PushNotificationView();
  }

  async render() {
    return this.view.renderSection();
  }

  async afterRender() {
    await this.initializeStatus();
    this.bindEvents();
  }

  async initializeStatus() {
    try {
      const status = await this.model.getNotificationStatus();
      this.view.updateNotificationStatus(
        status.permission, 
        status.isSubscribed, 
        status.subscription
      );
      
      if (status.error) {
        this.view.showMessage(`Status error: ${status.error}`, 'warning');
      }
    } catch (error) {
      console.error('Error initializing status:', error);
      this.view.showMessage('Gagal memuat status notifikasi', 'error');
    }
  }

  bindEvents() {
    // Enable notifications button
    const enableBtn = document.getElementById('enable-notifications-btn');
    if (enableBtn) {
      enableBtn.addEventListener('click', () => this.handleEnableNotifications());
    }

    // Disable notifications button
    const disableBtn = document.getElementById('disable-notifications-btn');
    if (disableBtn) {
      disableBtn.addEventListener('click', () => this.handleDisableNotifications());
    }

    // Test notification button
    const testBtn = document.getElementById('test-notification-btn');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.handleTestNotification());
    }

    // Check support button
    const checkSupportBtn = document.getElementById('check-support-btn');
    if (checkSupportBtn) {
      checkSupportBtn.addEventListener('click', () => this.handleCheckSupport());
    }

    // Show subscription button
    const showSubscriptionBtn = document.getElementById('show-subscription-btn');
    if (showSubscriptionBtn) {
      showSubscriptionBtn.addEventListener('click', () => this.handleShowSubscription());
    }

    // Show VAPID button
    const showVapidBtn = document.getElementById('show-vapid-btn');
    if (showVapidBtn) {
      showVapidBtn.addEventListener('click', () => this.handleShowVapid());
    }

    // Copy VAPID button (will be added dynamically)
    document.addEventListener('click', (event) => {
      if (event.target.id === 'copy-vapid-btn' || event.target.closest('#copy-vapid-btn')) {
        this.handleCopyVapid();
      }
    });
  }

  async handleEnableNotifications() {
    try {
      this.setButtonLoading('enable-notifications-btn', true);
      this.view.showMessage('Mengaktifkan push notification...', 'info');
      
      const result = await this.model.enablePushNotifications();
      
      if (result.success) {
        this.view.showMessage(result.message, 'success');
        
        // Update status after successful enable
        await this.refreshStatus();
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      this.view.showMessage('Terjadi kesalahan saat mengaktifkan notifikasi', 'error');
    } finally {
      this.setButtonLoading('enable-notifications-btn', false);
    }
  }

  async handleDisableNotifications() {
    // Show confirmation dialog
    const confirmed = confirm(
      'Apakah Anda yakin ingin menonaktifkan push notification?\n\n' +
      'Anda tidak akan menerima notifikasi otomatis dari aplikasi.'
    );

    if (!confirmed) {
      return;
    }

    try {
      this.setButtonLoading('disable-notifications-btn', true);
      this.view.showMessage('Menonaktifkan push notification...', 'info');
      
      const result = await this.model.disablePushNotifications();
      
      if (result.success) {
        this.view.showMessage(result.message, 'success');
        
        // Update status after successful disable
        await this.refreshStatus();
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      this.view.showMessage('Terjadi kesalahan saat menonaktifkan notifikasi', 'error');
    } finally {
      this.setButtonLoading('disable-notifications-btn', false);
    }
  }

  async handleTestNotification() {
    try {
      this.setButtonLoading('test-notification-btn', true);
      
      const result = this.model.testNotification('🎉 Test notification berhasil! Fitur push notification bekerja dengan baik.');
      
      if (result.success) {
        this.view.showMessage(result.message, 'success');
      } else {
        this.view.showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      this.view.showMessage('Terjadi kesalahan saat mengirim test notification', 'error');
    } finally {
      this.setButtonLoading('test-notification-btn', false);
    }
  }

  async handleCheckSupport() {
    try {
      this.setButtonLoading('check-support-btn', true);
      
      const support = this.model.checkBrowserSupport();
      const browserSettings = await this.model.checkBrowserNotificationSettings();
      
      const content = this.view.renderBrowserSupport(support);
      
      // Add browser settings info if available
      const settingsInfo = browserSettings.available 
        ? `<p><strong>Browser Settings:</strong> ${browserSettings.state}</p>`
        : `<p><strong>Browser Settings:</strong> ${browserSettings.message}</p>`;
      
      this.view.showTechnicalInfo(content + settingsInfo);
      this.view.showMessage('Informasi dukungan browser berhasil dimuat', 'info');
    } catch (error) {
      console.error('Error checking support:', error);
      this.view.showMessage('Gagal memeriksa dukungan browser', 'error');
    } finally {
      this.setButtonLoading('check-support-btn', false);
    }
  }

  async handleShowSubscription() {
    try {
      this.setButtonLoading('show-subscription-btn', true);
      
      const subscription = await this.model.getCurrentSubscription();
      const content = this.view.renderSubscriptionInfo(subscription);
      
      this.view.showTechnicalInfo(content);
      this.view.showMessage('Data subscription berhasil dimuat', 'info');
    } catch (error) {
      console.error('Error showing subscription:', error);
      this.view.showMessage('Gagal memuat data subscription', 'error');
    } finally {
      this.setButtonLoading('show-subscription-btn', false);
    }
  }

  handleShowVapid() {
    try {
      this.setButtonLoading('show-vapid-btn', true);
      
      const vapidContent = this.view.renderVapidInfo();
      const schemaContent = this.view.renderNotificationSchema();
      
      this.view.showTechnicalInfo(vapidContent + schemaContent);
      this.view.showMessage('Informasi VAPID key berhasil dimuat', 'info');
    } catch (error) {
      console.error('Error showing VAPID:', error);
      this.view.showMessage('Gagal memuat informasi VAPID', 'error');
    } finally {
      this.setButtonLoading('show-vapid-btn', false);
    }
  }

  async handleCopyVapid() {
    try {
      const status = await this.model.getNotificationStatus();
      await this.view.copyToClipboard(status.vapidKey);
    } catch (error) {
      console.error('Error copying VAPID:', error);
      this.view.showMessage('Gagal menyalin VAPID key', 'error');
    }
  }

  async refreshStatus() {
    try {
      const status = await this.model.getNotificationStatus();
      this.view.updateNotificationStatus(
        status.permission, 
        status.isSubscribed, 
        status.subscription
      );
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  }

  setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
      if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        
        // Save original text and show loading
        if (!button.dataset.originalText) {
          button.dataset.originalText = button.innerHTML;
        }
        
        const icon = button.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-spinner fa-spin';
        }
        
        const text = button.querySelector('span') || button.childNodes[button.childNodes.length - 1];
        if (text && text.textContent) {
          text.textContent = ' Loading...';
        }
      } else {
        button.disabled = false;
        button.classList.remove('loading');
        
        // Restore original text
        if (button.dataset.originalText) {
          button.innerHTML = button.dataset.originalText;
        }
      }
    }
  }

  // Utility method to check notification status periodically
  async startStatusMonitoring(interval = 30000) {
    setInterval(async () => {
      try {
        await this.refreshStatus();
      } catch (error) {
        console.error('Error in status monitoring:', error);
      }
    }, interval);
  }

  // Method to handle service worker updates
  async handleServiceWorkerUpdate() {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              this.view.showMessage(
                'Update aplikasi tersedia. Refresh halaman untuk mendapatkan versi terbaru.',
                'info'
              );
            }
          });
        });
      }
    } catch (error) {
      console.error('Error handling service worker update:', error);
    }
  }

  // Auto-initialize if user has previously granted permission
  async autoInitializeIfPermitted() {
    try {
      const permission = this.model.getNotificationPermission();
      const isSubscribed = await this.model.isSubscribed();
      
      if (permission === 'granted' && !isSubscribed) {
        this.view.showMessage(
          'Izin notifikasi telah diberikan sebelumnya. Klik "Aktifkan Notifikasi" untuk berlangganan.',
          'info'
        );
      }
    } catch (error) {
      console.error('Error in auto-initialize:', error);
    }
  }
}