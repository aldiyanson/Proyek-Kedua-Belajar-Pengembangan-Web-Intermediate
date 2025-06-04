import { storyDB } from '../../data/indexed-db.js';

export default class OfflineDataView {
  constructor() {
    this.currentData = null;
    this.currentStats = null;
  }

  renderSection() {
    return `
      <section class="container">
        <div class="offline-data-header">
          <h1>Manajemen Data Offline</h1>
          <p class="subtitle">Kelola data yang tersimpan secara offline di perangkat Anda</p>
        </div>
        
        <div class="offline-actions">
          <div class="action-group">
            <h3>Aksi Data</h3>
            <div class="buttons-grid">
              <button id="save-sample-data-btn" class="action-btn primary">
                <i class="fa-solid fa-download"></i>
                Simpan Data Sample
              </button>
              <button id="view-offline-data-btn" class="action-btn secondary">
                <i class="fa-solid fa-eye"></i>
                Lihat Data Offline
              </button>
              <button id="delete-offline-data-btn" class="action-btn danger">
                <i class="fa-solid fa-trash"></i>
                Hapus Data Offline
              </button>
            </div>
          </div>
          
          <div class="action-group">
            <h3>Statistik Database</h3>
            <div class="buttons-grid">
              <button id="show-stats-btn" class="action-btn info">
                <i class="fa-solid fa-chart-bar"></i>
                Tampilkan Statistik
              </button>
              <button id="export-data-btn" class="action-btn secondary">
                <i class="fa-solid fa-file-export"></i>
                Export Data
              </button>
              <button id="clear-all-data-btn" class="action-btn danger">
                <i class="fa-solid fa-database"></i>
                Reset Database
              </button>
            </div>
          </div>
        </div>

        <div id="status-message" class="status-message hidden"></div>
        <div id="data-display" class="data-display hidden"></div>
        <div id="stats-display" class="stats-display hidden"></div>
      </section>
    `;
  }

  renderOfflineData(data) {
    if (!data || Object.keys(data).length === 0) {
      return `
        <div class="no-data">
          <i class="fa-solid fa-database"></i>
          <h3>Tidak Ada Data Offline</h3>
          <p>Belum ada data yang tersimpan secara offline.</p>
        </div>
      `;
    }

    let content = '<div class="data-sections">';
    
    // Stories Section
    if (data.stories && data.stories.length > 0) {
      content += `
        <div class="data-section">
          <h3><i class="fa-solid fa-book-open"></i> Cerita Tersimpan (${data.stories.length})</h3>
          <div class="stories-list">
            ${data.stories.map(story => `
              <div class="story-item">
                <div class="story-header">
                  <strong>${story.name}</strong>
                  <span class="story-date">${this.formatDate(story.createdAt)}</span>
                </div>
                <p class="story-desc">${story.description.substring(0, 100)}...</p>
                <div class="story-meta">
                  <span class="story-id">ID: ${story.id}</span>
                  ${story.cached ? '<span class="cached-badge">Cached</span>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Offline Queue Section
    if (data.offlineQueue && data.offlineQueue.length > 0) {
      content += `
        <div class="data-section">
          <h3><i class="fa-solid fa-clock"></i> Antrian Offline (${data.offlineQueue.length})</h3>
          <div class="queue-list">
            ${data.offlineQueue.map(item => `
              <div class="queue-item">
                <div class="queue-header">
                  <strong>${item.action}</strong>
                  <span class="queue-status status-${item.status}">${item.status}</span>
                </div>
                <p class="queue-time">${this.formatDate(new Date(item.timestamp))}</p>
                <div class="queue-meta">
                  <span>Priority: ${item.priority}</span>
                  <span>Retries: ${item.retryCount || 0}/${item.maxRetries || 3}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // User Cache Section
    if (data.userCache && data.userCache.length > 0) {
      content += `
        <div class="data-section">
          <h3><i class="fa-solid fa-user"></i> Cache User (${data.userCache.length})</h3>
          <div class="cache-list">
            ${data.userCache.map(item => `
              <div class="cache-item">
                <strong>${item.key}</strong>
                <span class="cache-time">Expires: ${this.formatDate(new Date(item.expiry))}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    content += '</div>';
    return content;
  }

  renderStats(stats) {
    if (!stats) {
      return '<p class="error">Gagal memuat statistik database.</p>';
    }

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-book-open"></i>
          </div>
          <div class="stat-content">
            <h4>Cerita</h4>
            <p class="stat-number">${stats.stories || 0}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <div class="stat-content">
            <h4>Antrian Offline</h4>
            <p class="stat-number">${stats.offlineQueue || 0}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="stat-content">
            <h4>Cache User</h4>
            <p class="stat-number">${stats.userCache || 0}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-image"></i>
          </div>
          <div class="stat-content">
            <h4>Cache Gambar</h4>
            <p class="stat-number">${stats.imageCache || 0}</p>
            <p class="stat-detail">${stats.imageCacheSize || '0.00'} MB</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fa-solid fa-cog"></i>
          </div>
          <div class="stat-content">
            <h4>Pengaturan</h4>
            <p class="stat-number">${stats.appSettings || 0}</p>
          </div>
        </div>
      </div>
    `;
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
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        messageEl.classList.add('hidden');
      }, 5000);
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

  showData(data) {
    const dataEl = document.getElementById('data-display');
    if (dataEl) {
      dataEl.innerHTML = `
        <h2>Data Offline Tersimpan</h2>
        ${this.renderOfflineData(data)}
      `;
      dataEl.classList.remove('hidden');
    }
  }

  showStats(stats) {
    const statsEl = document.getElementById('stats-display');
    if (statsEl) {
      statsEl.innerHTML = `
        <h2>Statistik Database</h2>
        ${this.renderStats(stats)}
      `;
      statsEl.classList.remove('hidden');
    }
  }

  hideDisplays() {
    const dataEl = document.getElementById('data-display');
    const statsEl = document.getElementById('stats-display');
    
    if (dataEl) dataEl.classList.add('hidden');
    if (statsEl) statsEl.classList.add('hidden');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Sample data generator
  generateSampleData() {
    return [
      {
        id: `sample_${Date.now()}_1`,
        name: 'User Demo 1',
        description: 'Ini adalah contoh cerita yang disimpan secara offline untuk demonstrasi fitur IndexedDB. Data ini dapat diakses meski tanpa koneksi internet.',
        photoUrl: 'https://picsum.photos/400/300?random=1',
        createdAt: new Date().toISOString(),
        userId: 'demo_user_1'
      },
      {
        id: `sample_${Date.now()}_2`,
        name: 'User Demo 2', 
        description: 'Contoh cerita kedua yang menunjukkan kemampuan penyimpanan data offline menggunakan IndexedDB. Fitur ini memungkinkan aplikasi bekerja dalam mode offline.',
        photoUrl: 'https://picsum.photos/400/300?random=2',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        userId: 'demo_user_2'
      },
      {
        id: `sample_${Date.now()}_3`,
        name: 'User Demo 3',
        description: 'Cerita demo ketiga untuk menunjukkan fitur penyimpanan, tampil, dan hapus data offline sesuai dengan kriteria submission PWA.',
        photoUrl: 'https://picsum.photos/400/300?random=3', 
        createdAt: new Date(Date.now() - 120000).toISOString(),
        userId: 'demo_user_3'
      }
    ];
  }
}