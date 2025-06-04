export default class StoryDetailView {
  renderSection() {
    return `
      <section class="container">
        <div class="story-detail-container">
          <div id="story-detail-content">
            <div class="loading-spinner">
              <i class="fa-solid fa-spinner fa-spin fa-2x" aria-hidden="true"></i>
              <span>Memuat cerita...</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  showError(message) {
    const contentContainer = document.getElementById('story-detail-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="alert alert-error">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          ${message}
        </div>
        <a href="#/" class="back-button">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Kembali ke Beranda
        </a>
      `;
    }
  }

  showDetail(story, createdAt) {
    const contentContainer = document.getElementById('story-detail-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="story-detail-header">
          <a href="#/" class="back-button">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Kembali
          </a>
          <h1>${story.name}</h1>
          <time datetime="${story.createdAt}">${createdAt}</time>
        </div>
        <div class="story-detail-image">
          <img 
            src="${story.photoUrl}" 
            alt="Foto cerita oleh ${story.name}" 
            class="full-width-img"
          />
        </div>
        <div class="story-detail-body">
          <p class="story-description">${story.description}</p>
        </div>
        ${story.lat && story.lon ? `
          <div class="story-detail-map">
            <h2>Lokasi</h2>
            <div id="detail-map" class="detail-location-map"></div>
          </div>
        ` : ''}
        <div class="story-actions full-width">
          <button class="action-btn" aria-label="Like">
            <i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> Suka
          </button>
          <button class="action-btn" aria-label="Comment">
            <i class="fa-solid fa-comment" aria-hidden="true"></i> Komentar
          </button>
          <button class="action-btn" aria-label="Share">
            <i class="fa-solid fa-share" aria-hidden="true"></i> Bagikan
          </button>
        </div>
      `;
    }
  }
}