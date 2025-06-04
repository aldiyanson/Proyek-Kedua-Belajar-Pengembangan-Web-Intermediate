import MapModel from '../model/map-model.js';
import MapView from '../view/map-view.js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default class MapPresenter {
  constructor() {
    this.model = new MapModel();
    this.view = new MapView();
    this.currentPage = 1;
    this.pageSize = 20;
    this.showAllStories = false;
    this.currentFilter = 'all';
    this.allStories = [];
    this.allMarkers = L.featureGroup();
    this.markersByStory = {};
    this.map = null;
  }

  async render() {
    return this.view.renderSection();
  }

  async afterRender() {
    try {
      this.currentPage = 1;
      this.pageSize = 20;
      this.allMarkers = L.featureGroup();
      this.markersByStory = {};
      this.currentFilter = 'all';
      this.allStories = [];

      // Initialize map
      this.map = L.map('story-map').setView([-2.5, 118.0], 5);

      // Define tile layers
      const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      });
      const mapTiler = L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=Get_your_own_MapTiler_key', {
        attribution: '&copy; MapTiler &copy; OpenStreetMap contributors'
      });
      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });
      const terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });

      const baseLayers = {
        "OpenStreetMap": openStreetMap,
        "MapTiler Streets": mapTiler,
        "Satellite": satellite,
        "Terrain": terrain
      };

      openStreetMap.addTo(this.map);
      L.control.layers(baseLayers).addTo(this.map);

      await this.loadStories();
      this.setupFilters();
    } catch (e) {
      this.view.showError('Gagal memuat peta. Silakan coba lagi nanti.');
    }
  }

  async loadStories(page = 1) {
    this.view.showLoading();

    const response = await this.model.fetchStories(page, this.pageSize, 1);
    const { stories, pagination } = response;

    if (!stories || stories.length === 0) {
      this.view.showEmpty();
      return;
    }

    if (page === 1) {
      this.allStories = [];
      if (this.map.hasLayer(this.allMarkers)) {
        this.map.removeLayer(this.allMarkers);
      }
      this.allMarkers = L.featureGroup();
      this.markersByStory = {};
    }

    this.allStories = [...this.allStories, ...stories];

    const defaultIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconSize: [20, 32],
      iconAnchor: [10, 32],
      popupAnchor: [1, -28]
    });

    stories.forEach(item => {
      if (item.lat && item.lng) {
        const marker = L.marker([item.lat, item.lng], {icon: defaultIcon});
        marker.bindPopup(`
          <div style="text-align:center;">
            <strong>${item.name}</strong><br>
            <img src="${item.photoUrl}" alt="Foto cerita oleh ${item.name}" style="max-width:150px;margin:8px 0;border-radius:4px;"/><br>
            <p style="margin:5px 0;">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
            <a href="#/story/${item.id}" style="display:block;margin-top:8px;color:#1877f2;font-weight:bold;">Baca Selengkapnya</a>
          </div>
        `);
        this.allMarkers.addLayer(marker);
        this.markersByStory[item.id] = marker;
      }
    });

    if (this.allMarkers.getLayers().length > 0) {
      this.map.addLayer(this.allMarkers);
      if (page === 1) {
        this.map.fitBounds(this.allMarkers.getBounds(), { padding: [30, 30] });
      }
    }

    this.view.renderStoriesList(stories, this.markersByStory, this.map);

    this.view.updatePagination(
      pagination,
      this.showAllStories,
      () => this.loadStories((pagination.page || 1) + 1)
    );
  }

  // Pagination is now handled by the view's updatePagination method.

  setupFilters() {
    this.view.setupFilters(
      this.currentFilter,
      this.allStories,
      this.markersByStory,
      this.map,
      (filterType) => {
        this.currentFilter = filterType;
        let filteredStories = [];
        if (filterType === 'all') {
          filteredStories = this.allStories;
        } else if (filterType === 'mine') {
          const userData = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')) : null;
          const userName = userData ? userData.name : '';
          filteredStories = this.allStories.filter(story => story.name === userName);
        } else if (filterType === 'recent') {
          filteredStories = this.allStories.slice(0, 5);
        }
        this.view.showFilteredStories(filteredStories, this.markersByStory, this.map);
        this.view.setPaginationVisibility(filterType === 'all');
      }
    );
  }
}