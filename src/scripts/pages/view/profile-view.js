export default class ProfileView {
  renderSection(userData) {
    return `
      <section class="container">
        <div class="profile-container">
          <div class="profile-header">
            <div class="profile-avatar">
              <i class="fa-solid fa-user-circle fa-6x" aria-hidden="true"></i>
            </div>
            <div class="profile-info">
              <h1>${userData.name}</h1>
              <p>Pengguna DiCerita</p>
            </div>
          </div>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-number" id="stories-count">0</span>
              <span class="stat-label">Cerita</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">0</span>
              <span class="stat-label">Pengikut</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">0</span>
              <span class="stat-label">Mengikuti</span>
            </div>
          </div>
          <div class="profile-actions">
            <button class="btn-primary">
              <i class="fa-solid fa-edit" aria-hidden="true"></i> Edit Profil
            </button>
            <a href="#/settings" class="btn-secondary">
              <i class="fa-solid fa-cog" aria-hidden="true"></i> Pengaturan
            </a>
          </div>
          <div class="profile-tabs">
            <button class="tab-button active" data-tab="stories">
              <i class="fa-solid fa-book-open" aria-hidden="true"></i> Cerita Saya
            </button>
            <button class="tab-button" data-tab="saved">
              <i class="fa-solid fa-bookmark" aria-hidden="true"></i> Tersimpan
            </button>
            <button class="tab-button" data-tab="likes">
              <i class="fa-solid fa-heart" aria-hidden="true"></i> Disukai
            </button>
          </div>
          <div id="profile-content">
            <div class="tab-content" id="stories-tab">
              <h2>Cerita Saya</h2>
              <div class="loading-spinner">
                <i class="fa-solid fa-spinner fa-spin fa-2x" aria-hidden="true"></i>
                <span>Memuat cerita...</span>
              </div>
              <div id="user-stories-list" class="profile-stories-grid"></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  showLoading() {
    const loadingSpinner = document.querySelector('.loading-spinner');
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
    const storiesList = document.getElementById('user-stories-list');
    if (storiesList) storiesList.style.display = 'none';
  }

  showStories(stories) {
    const loadingSpinner = document.querySelector('.loading-spinner');
    const storiesList = document.getElementById('user-stories-list');
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (storiesList) {
      storiesList.style.display = 'grid';
      if (stories.length === 0) {
        storiesList.innerHTML = `
          <p class="empty-state">
            Anda belum memiliki cerita.
            <a href="#/add" class="link-primary">Buat cerita baru!</a>
          </p>`;
      } else {
        storiesList.innerHTML = stories.map(item => `
          <article class="profile-story-item">
            <a href="#/story/${item.id}" class="story-link">
              <img src="${item.photoUrl}" alt="Foto cerita oleh ${item.name}" class="profile-story-img" loading="lazy"/>
              <div class="profile-story-overlay">
                <p class="profile-story-description">${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</p>
                <time class="profile-story-time" datetime="${item.createdAt}">${new Date(item.createdAt).toLocaleDateString()}</time>
              </div>
            </a>
          </article>
        `).join('');
      }
    }
  }

  showError(message, isAuthError = false) {
    const loadingSpinner = document.querySelector('.loading-spinner');
    const storiesList = document.getElementById('user-stories-list');
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (storiesList) {
      storiesList.style.display = 'block';
      storiesList.innerHTML = `
        <p class="error-message">
          Gagal memuat data cerita.
          ${isAuthError
            ? '<a href="#/login" class="link-primary">Silakan login kembali</a>'
            : 'Silakan coba lagi nanti'}
        </p>`;
    }
  }

  updateStoriesCount(count) {
    const countEl = document.getElementById('stories-count');
    if (countEl) countEl.textContent = count;
  }
  setupViewTransitions() {
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.href.includes('#/')) {
        if (document.startViewTransition) {
          e.preventDefault();
          document.startViewTransition(() => {
            window.location.href = e.target.href;
          });
        }
      }
    });
  }

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const tabName = button.getAttribute('data-tab');
        if (tabName !== 'stories') {
          document.getElementById('profile-content').innerHTML = `
            <div class="tab-content">
              <h2>${tabName === 'saved' ? 'Cerita Tersimpan' : 'Cerita yang Disukai'}</h2>
              <p class="empty-state">Tidak ada cerita untuk ditampilkan</p>
            </div>
          `;
        }
      });
    });
  }
  redirectToLogin() {
    window.location.hash = '#/login';
  }
}