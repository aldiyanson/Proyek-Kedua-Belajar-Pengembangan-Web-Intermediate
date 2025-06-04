import { 
  initializePushNotifications, 
  testPushNotification, 
  VAPID_PUBLIC_KEY,
  STORY_NOTIFICATION_SCHEMA 
} from '../../data/api.js';

export default class PushNotificationView {
  constructor() {
    this.isSubscribed = false;
    this.subscription = null;
  }

  renderSection() {
    return `
      <section class="container">
        <div class="push-notification-header">
          <h1>Push Notification</h1>
          <p class="subtitle">Kelola notifikasi push untuk mendapatkan update terbaru</p>
        </div>
        
        <div class="notification-status-card">
          <div class="status-icon">
            <i id="status-icon" class="fa-solid fa-bell-slash"></i>
          </div>
          <div class="status-content">
            <h3 id="status-title">Status Notifikasi</h3>
            <p id="status-description">Memuat status notifikasi...</p>
          </div>
        </div>

        <div class="notification-actions">
          <div class="action-group">
            <h3>Pengaturan Notifikasi</h3>
            <div class="buttons-grid">
              <button id="enable-notifications-btn" class="action-btn primary">
                <i class="fa-solid fa-bell"></i>
                Aktifkan Notifikasi
              </button>
              <button id="disable-notifications-btn" class="action-btn danger" disabled>
                <i class="fa-solid fa-bell-slash"></i>
                Nonaktifkan Notifikasi
              </button>
              <button id="test-notification-btn" class="action-btn secondary" disabled>
                <i class="fa-solid fa-paper-plane"></i>
                Test Notifikasi
              </button>
            </div>
          </div>
          
          <div class="action-group">
            <h3>Informasi Teknis</h3>
            <div class="buttons-grid">
              <button id="check-support-btn" class="action-btn info">
                <i class="fa-solid fa-info-circle"></i>
                Cek Dukungan Browser
              </button>
              <button id="show-subscription-btn" class="action-btn secondary" disabled>
                <i class="fa-solid fa-code"></i>
                Lihat Data Subscription
              </button>
              <button id="show-vapid-btn" class="action-btn info">
                <i class="fa-solid fa-key"></i>
                Lihat VAPID Key
              </button>
            </div>
          </div>
        </div>

        <div id="status-message" class="status-message hidden"></div>
        <div id="technical-info" class="technical-info hidden"></div>
      </section>
    `;
  }

  renderBrowserSupport(supportInfo) {
    const supportItems = Object.entries(supportInfo).map(([feature, supported]) => {
      const icon = supported ? 'fa-check-circle' : 'fa-times-circle';
      const status = supported ? 'supported' : 'not-supported';
      return `
        <div class="support-item ${status}">
          <i class="fa-solid ${icon}"></i>
          <span>${this.getFeatureName(feature)}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="browser-support">
        <h3><i class="fa-solid fa-browser"></i> Dukungan Browser</h3>
        <div class="support-grid">
          ${supportItems}
        </div>
      </div>
    `;
  }

  renderSubscriptionInfo(subscription) {
    if (!subscription) {
      return `
        <div class="subscription-info">
          <h3><i class="fa-solid fa-code"></i> Data Subscription</h3>
          <p class="no-subscription">Belum ada subscription aktif</p>
        </div>
      `;
    }

    return `
      <div class="subscription-info">
        <h3><i class="fa-solid fa-code"></i> Data Subscription</h3>
        <div class="subscription-details">
          <div class="detail-item">
            <strong>Endpoint:</strong>
            <code class="endpoint">${this.truncateText(subscription.endpoint, 60)}</code>
          </div>
          <div class="detail-item">
            <strong>P256DH Key:</strong>
            <code>${subscription.keys?.p256dh || 'N/A'}</code>
          </div>
          <div class="detail-item">
            <strong>Auth Key:</strong>
            <code>${subscription.keys?.auth || 'N/A'}</code>
          </div>
        </div>
      </div>
    `;
  }

  renderVapidInfo() {
    return `
      <div class="vapid-info">
        <h3><i class="fa-solid fa-key"></i> VAPID Public Key</h3>
        <div class="vapid-details">
          <p class="vapid-description">
            VAPID (Voluntary Application Server Identification) key digunakan untuk mengidentifikasi aplikasi server.
          </p>
          <div class="vapid-key-container">
            <code class="vapid-key">${VAPID_PUBLIC_KEY}</code>
            <button id="copy-vapid-btn" class="copy-btn" title="Copy VAPID Key">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderNotificationSchema() {
    return `
      <div class="notification-schema">
        <h3><i class="fa-solid fa-template"></i> Template Notifikasi</h3>
        <div class="schema-details">
          <div class="schema-item">
            <strong>Title:</strong>
            <span class="schema-value">${STORY_NOTIFICATION_SCHEMA.title}</span>
          </div>
          <div class="schema-item">
            <strong>Body Template:</strong>
            <span class="schema-value">${STORY_NOTIFICATION_SCHEMA.options.body}</span>
          </div>
        </div>
      </div>
    `;
  }

  updateNotificationStatus(permission, isSubscribed, subscription = null) {
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusDescription = document.getElementById('status-description');
    const statusCard = document.querySelector('.notification-status-card');

    // Update button states
    const enableBtn = document.getElementById('enable-notifications-btn');
    const disableBtn = document.getElementById('disable-notifications-btn');
    const testBtn = document.getElementById('test-notification-btn');
    const showSubscriptionBtn = document.getElementById('show-subscription-btn');

    this.isSubscribed = isSubscribed;
    this.subscription = subscription;

    // Remove existing status classes
    statusCard.classList.remove('status-enabled', 'status-disabled', 'status-denied');

    if (permission === 'granted' && isSubscribed) {
      // Notifications enabled and subscribed
      statusIcon.className = 'fa-solid fa-bell';
      statusTitle.textContent = 'Notifikasi Aktif';
      statusDescription.textContent = 'Push notification telah diaktifkan dan berlangganan server.';
      statusCard.classList.add('status-enabled');
      
      enableBtn.disabled = true;
      disableBtn.disabled = false;
      testBtn.disabled = false;
      showSubscriptionBtn.disabled = false;
    } else if (permission === 'granted' && !isSubscribed) {
      // Permission granted but not subscribed
      statusIcon.className = 'fa-solid fa-bell-slash';
      statusTitle.textContent = 'Izin Diberikan';
      statusDescription.textContent = 'Izin notifikasi telah diberikan, tetapi belum berlangganan server.';
      statusCard.classList.add('status-disabled');
      
      enableBtn.disabled = false;
      disableBtn.disabled = true;
      testBtn.disabled = true;
      showSubscriptionBtn.disabled = true;
    } else if (permission === 'denied') {
      // Permission denied
      statusIcon.className = 'fa-solid fa-ban';
      statusTitle.textContent = 'Izin Ditolak';
      statusDescription.textContent = 'Izin notifikasi ditolak. Aktifkan melalui pengaturan browser.';
      statusCard.classList.add('status-denied');
      
      enableBtn.disabled = true;
      disableBtn.disabled = true;
      testBtn.disabled = true;
      showSubscriptionBtn.disabled = true;
    } else {
      // Default state
      statusIcon.className = 'fa-solid fa-bell-slash';
      statusTitle.textContent = 'Tidak Aktif';
      statusDescription.textContent = 'Push notification belum diaktifkan.';
      statusCard.classList.add('status-disabled');
      
      enableBtn.disabled = false;
      disableBtn.disabled = true;
      testBtn.disabled = true;
      showSubscriptionBtn.disabled = true;
    }
  }

  showMessage(message, type = 'info') {
    const messageEl = document.getElementById('status-message');
    if (messageEl) {
      messageEl.className = `status-message ${type}`;
      messageEl.innerHTML = `
        <div class="message-content">
          <i class="fa-solid fa-${this.getMessageIcon(type)}"></i>
          <span>${message}</span>
        </div>
      `;
      messageEl.classList.remove('hidden');
      
      // Auto hide after 5 seconds for success messages
      if (type === 'success') {
        setTimeout(() => {
          messageEl.classList.add('hidden');
        }, 5000);
      }
    }
  }

  getMessageIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle', 
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  showTechnicalInfo(content) {
    const techEl = document.getElementById('technical-info');
    if (techEl) {
      techEl.innerHTML = content;
      techEl.classList.remove('hidden');
    }
  }

  hideTechnicalInfo() {
    const techEl = document.getElementById('technical-info');
    if (techEl) {
      techEl.classList.add('hidden');
    }
  }

  getFeatureName(feature) {
    const names = {
      serviceWorker: 'Service Worker',
      pushManager: 'Push Manager',
      notification: 'Notification API',
      permissions: 'Permissions API'
    };
    return names[feature] || feature;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showMessage('VAPID key berhasil disalin ke clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showMessage('Gagal menyalin ke clipboard', 'error');
    }
  }

  getBrowserSupportInfo() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      permissions: 'permissions' in navigator
    };
  }

  async getCurrentSubscription() {
    try {
      if (!('serviceWorker' in navigator)) return null;
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('Error getting current subscription:', error);
      return null;
    }
  }

  // Generate sample notification for demo
  createSampleNotification() {
    return testPushNotification('Ini adalah contoh notifikasi push dari DiCerita PWA');
  }
}