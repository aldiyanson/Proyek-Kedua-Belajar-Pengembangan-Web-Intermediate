export default class NotFoundView {
  renderSection() {
    return `
      <section class="container">
        <div class="not-found-container">
          <div class="not-found-content">
            <div class="error-illustration">
              <div class="error-code">404</div>
              <div class="error-icon">
                <i class="fa-solid fa-face-sad-tear"></i>
              </div>
            </div>
            
            <div class="error-message">
              <h1>Halaman Tidak Ditemukan</h1>
              <p class="error-description">
                Maaf, halaman yang Anda cari tidak dapat ditemukan. 
                Mungkin halaman telah dipindahkan, dihapus, atau Anda salah mengetik alamat URL.
              </p>
            </div>

            <div class="error-actions">
              <a href="#/" class="action-btn primary">
                <i class="fa-solid fa-house"></i>
                Kembali ke Beranda
              </a>
              <button id="go-back-btn" class="action-btn secondary">
                <i class="fa-solid fa-arrow-left"></i>
                Halaman Sebelumnya
              </button>
            </div>

            <div class="helpful-links">
              <h3>Halaman yang Mungkin Anda Cari:</h3>
              <div class="links-grid">
                <a href="#/" class="helpful-link">
                  <i class="fa-solid fa-house"></i>
                  <span>Beranda</span>
                </a>
                <a href="#/add" class="helpful-link">
                  <i class="fa-solid fa-plus"></i>
                  <span>Tambah Cerita</span>
                </a>
                <a href="#/map" class="helpful-link">
                  <i class="fa-solid fa-map-location-dot"></i>
                  <span>Peta Lokasi</span>
                </a>
                <a href="#/profile" class="helpful-link">
                  <i class="fa-solid fa-user"></i>
                  <span>Profil</span>
                </a>
                <a href="#/push-notifications" class="helpful-link">
                  <i class="fa-solid fa-bell"></i>
                  <span>Push Notification</span>
                </a>
                <a href="#/offline-data" class="helpful-link">
                  <i class="fa-solid fa-database"></i>
                  <span>Data Offline</span>
                </a>
                <a href="#/about" class="helpful-link">
                  <i class="fa-solid fa-circle-info"></i>
                  <span>Tentang</span>
                </a>
              </div>
            </div>

            <div class="error-details">
              <details>
                <summary>Detail Teknis</summary>
                <div class="tech-details">
                  <p><strong>URL yang diakses:</strong> <code id="current-url"></code></p>
                  <p><strong>Timestamp:</strong> <span id="error-timestamp"></span></p>
                  <p><strong>User Agent:</strong> <code id="user-agent"></code></p>
                  <p><strong>Referrer:</strong> <code id="referrer-url"></code></p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  afterRender() {
    this.bindEvents();
    this.populateErrorDetails();
    this.addSearchFunctionality();
  }

  bindEvents() {
    // Go back button
    const goBackBtn = document.getElementById('go-back-btn');
    if (goBackBtn) {
      goBackBtn.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.hash = '#/';
        }
      });
    }

    // Add hover effects to helpful links
    const helpfulLinks = document.querySelectorAll('.helpful-link');
    helpfulLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        link.style.transform = 'translateY(-2px)';
      });
      
      link.addEventListener('mouseleave', () => {
        link.style.transform = 'translateY(0)';
      });
    });
  }

  populateErrorDetails() {
    // Current URL
    const currentUrlEl = document.getElementById('current-url');
    if (currentUrlEl) {
      currentUrlEl.textContent = window.location.href;
    }

    // Timestamp
    const timestampEl = document.getElementById('error-timestamp');
    if (timestampEl) {
      timestampEl.textContent = new Date().toLocaleString('id-ID');
    }

    // User Agent
    const userAgentEl = document.getElementById('user-agent');
    if (userAgentEl) {
      userAgentEl.textContent = navigator.userAgent;
    }

    // Referrer
    const referrerEl = document.getElementById('referrer-url');
    if (referrerEl) {
      referrerEl.textContent = document.referrer || 'Direct access';
    }
  }

  addSearchFunctionality() {
    // Add a search box for quick navigation
    const searchContainer = document.createElement('div');
    searchContainer.className = 'quick-search';
    searchContainer.innerHTML = `
      <div class="search-box">
        <h3>Cari Halaman:</h3>
        <div class="search-input-container">
          <input type="text" id="page-search" placeholder="Ketik untuk mencari halaman..." autocomplete="off">
          <i class="fa-solid fa-search search-icon"></i>
        </div>
        <div id="search-suggestions" class="search-suggestions hidden"></div>
      </div>
    `;

    // Insert search before helpful links
    const helpfulLinks = document.querySelector('.helpful-links');
    if (helpfulLinks) {
      helpfulLinks.parentNode.insertBefore(searchContainer, helpfulLinks);
    }

    // Search functionality
    const searchInput = document.getElementById('page-search');
    const suggestions = document.getElementById('search-suggestions');
    
    const pages = [
      { name: 'Beranda', url: '#/', keywords: ['home', 'beranda', 'utama'] },
      { name: 'Tambah Cerita', url: '#/add', keywords: ['add', 'tambah', 'cerita', 'story', 'buat'] },
      { name: 'Peta Lokasi', url: '#/map', keywords: ['map', 'peta', 'lokasi', 'tempat'] },
      { name: 'Profil', url: '#/profile', keywords: ['profile', 'profil', 'akun', 'user'] },
      { name: 'Push Notification', url: '#/push-notifications', keywords: ['push', 'notification', 'notifikasi', 'bell'] },
      { name: 'Data Offline', url: '#/offline-data', keywords: ['offline', 'data', 'cache', 'indexeddb'] },
      { name: 'Tentang', url: '#/about', keywords: ['about', 'tentang', 'info', 'informasi'] },
      { name: 'Login', url: '#/login', keywords: ['login', 'masuk', 'signin'] },
      { name: 'Register', url: '#/register', keywords: ['register', 'daftar', 'signup'] }
    ];

    if (searchInput && suggestions) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length === 0) {
          suggestions.classList.add('hidden');
          return;
        }

        const matches = pages.filter(page => 
          page.name.toLowerCase().includes(query) ||
          page.keywords.some(keyword => keyword.includes(query))
        );

        if (matches.length > 0) {
          suggestions.innerHTML = matches.map(page => `
            <a href="${page.url}" class="suggestion-item">
              <i class="fa-solid fa-arrow-right"></i>
              <span>${page.name}</span>
            </a>
          `).join('');
          suggestions.classList.remove('hidden');
        } else {
          suggestions.innerHTML = `
            <div class="no-suggestions">
              <i class="fa-solid fa-search"></i>
              <span>Tidak ada halaman yang cocok dengan "${query}"</span>
            </div>
          `;
          suggestions.classList.remove('hidden');
        }
      });

      // Hide suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
          suggestions.classList.add('hidden');
        }
      });
    }
  }

  // Method to handle different types of 404 errors
  setErrorContext(context = {}) {
    const { 
      originalUrl = window.location.href,
      errorType = 'page_not_found',
      suggestion = null 
    } = context;

    // Update error message based on context
    const errorMessage = document.querySelector('.error-description');
    if (errorMessage) {
      let message = 'Maaf, halaman yang Anda cari tidak dapat ditemukan. ';
      
      switch (errorType) {
        case 'invalid_story_id':
          message = 'Cerita dengan ID tersebut tidak ditemukan atau mungkin telah dihapus. ';
          break;
        case 'unauthorized_access':
          message = 'Anda tidak memiliki akses ke halaman tersebut. Silakan login terlebih dahulu. ';
          break;
        case 'route_not_found':
          message = 'Route yang Anda akses tidak terdaftar dalam aplikasi. ';
          break;
        default:
          message = 'Maaf, halaman yang Anda cari tidak dapat ditemukan. ';
      }
      
      message += 'Mungkin halaman telah dipindahkan, dihapus, atau Anda salah mengetik alamat URL.';
      
      if (suggestion) {
        message += ` Mungkin Anda mencari: <a href="${suggestion.url}">${suggestion.name}</a>?`;
      }
      
      errorMessage.innerHTML = message;
    }
  }

  // Method to track 404 errors for analytics
  trackNotFoundError() {
    try {
      // This could be integrated with analytics service
      console.log('404 Error tracked:', {
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      
      // Could send to analytics service here
      // analytics.track('404_error', { ... });
    } catch (error) {
      console.error('Failed to track 404 error:', error);
    }
  }
}