// src/scripts/pages/map-page.js

import MapPresenter from './presenter/map-presenter.js';

const MapPage = {
  presenter: new MapPresenter(),

  async render() {
    return this.presenter.render();
  },

  async afterRender() {
    return this.presenter.afterRender();
  }
};

export default MapPage;