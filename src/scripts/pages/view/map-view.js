export default class MapView {
  renderSection() {
    return `
      <section class="container">
        <div class="map-page-container">
          <h1><i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> Peta Cerita</h1>
          <p class="map-description">Berikut adalah peta yang menunjukkan lokasi cerita dari semua pengguna DiCerita.</p>
          <div id="story-map" class="story-map"></div>
          <div class="map-filters">
            <h3>Filter Tampilan</h3>
            <div class="filter-options">
              <button class="filter-btn active" data-filter="all">Semua</button>
              <button class="filter-btn" data-filter="mine">Cerita Saya</button>
              <button class="filter-btn" data-filter="recent">Terbaru</button>
            </div>
          </div>
          <div id="map-stories-list" class="map-stories-list">
            <div class="loading-spinner">
              <i class="fa-solid fa-spinner fa-spin fa-2x" aria-hidden="true"></i>
              <span>Memuat cerita...</span>
            </div>
          </div>
          <div id="pagination-container" class="pagination-container"></div>
        </div>
      </section>
    `;
  }

  showError(message) {
    const mapElement = document.getElementById('story-map');
    if (mapElement) {
      mapElement.innerHTML = `<p class="error-message">${message}</p>`;
    }
  }

  showLoading() {
    const storiesList = document.getElementById('map-stories-list');
    if (storiesList) {
      storiesList.innerHTML = `
        <div class="loading-spinner">
          <i class="fa-solid fa-spinner fa-spin fa-2x" aria-hidden="true"></i>
          <span>Memuat cerita...</span>
        </div>
      `;
    }
  }

  showEmpty() {
    const storiesList = document.getElementById('map-stories-list');
    if (storiesList) {
      storiesList.innerHTML = '<p class="empty-state">Tidak ada cerita dengan lokasi untuk ditampilkan.</p>';
    }
  }
  renderStoriesList(stories, markersByStory, mapInstance) {
    const storiesList = document.getElementById('map-stories-list');
    if (!storiesList) return;
    storiesList.innerHTML = '';
    stories.forEach(item => {
      if (item.lat && item.lng) {
        const storyElement = document.createElement('div');
        storyElement.className = 'map-story-item';
        storyElement.setAttribute('data-story-id', item.id);
        storyElement.innerHTML = `
          <img src="${item.photoUrl}" alt="Foto cerita oleh ${item.name}" class="map-story-img" />
          <div class="map-story-info">
            <h3>${item.name}</h3>
            <p>${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
            <a href="#/story/${item.id}" class="view-story-btn">Baca Cerita</a>
          </div>
        `;
        storyElement.addEventListener('mouseenter', () => {
          const marker = markersByStory[item.id];
          if (marker) {
            marker.openPopup();
            mapInstance.panTo(marker.getLatLng());
          }
        });
        storiesList.appendChild(storyElement);
      }
    });
  }

  updatePagination(pagination, showAllStories, loadMoreCallback) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    const currentPage = pagination.page || 1;
    const totalPages = pagination.totalPages || 1;

    if (showAllStories) {
      paginationContainer.innerHTML = '<div class="page-info">Menampilkan semua cerita</div>';
      return;
    }

    const hasMore = typeof pagination.hasMore !== 'undefined'
      ? pagination.hasMore
      : (pagination.page < pagination.totalPages);

    if (hasMore && !showAllStories) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'load-more-btn';
      loadMoreBtn.innerHTML = 'Muat Lebih Banyak';
      loadMoreBtn.addEventListener('click', loadMoreCallback);
      paginationContainer.appendChild(loadMoreBtn);
    }

    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    paginationContainer.appendChild(pageInfo);
  }

  setupFilters(currentFilter, allStories, markersByStory, mapInstance, filterCallback) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const filterType = button.getAttribute('data-filter');
        filterCallback(filterType);
      });
    });
  }

  showFilteredStories(filteredStories, markersByStory, mapInstance) {
    const storiesList = document.getElementById('map-stories-list');
    if (!storiesList) return;
    storiesList.innerHTML = '';
    if (filteredStories.length === 0) {
      storiesList.innerHTML = '<p class="empty-state">Tidak ada cerita yang cocok dengan filter ini.</p>';
      return;
    }
    filteredStories.forEach(item => {
      if (item.lat && item.lng) {
        const storyElement = document.createElement('div');
        storyElement.className = 'map-story-item';
        storyElement.setAttribute('data-story-id', item.id);
        storyElement.innerHTML = `
          <img src="${item.photoUrl}" alt="Foto cerita oleh ${item.name}" class="map-story-img" />
          <div class="map-story-info">
            <h3>${item.name}</h3>
            <p>${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
            <a href="#/story/${item.id}" class="view-story-btn">Baca Cerita</a>
          </div>
        `;
        storyElement.addEventListener('mouseenter', () => {
          const marker = markersByStory[item.id];
          if (marker) {
            marker.openPopup();
            mapInstance.panTo(marker.getLatLng());
          }
        });
        storiesList.appendChild(storyElement);
      }
    });
  }

  setPaginationVisibility(visible) {
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
      paginationContainer.style.display = visible ? 'block' : 'none';
    }
  }
}