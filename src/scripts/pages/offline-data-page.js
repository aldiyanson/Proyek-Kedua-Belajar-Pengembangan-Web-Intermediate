import OfflineDataPresenter from './presenter/offline-data-presenter.js';

export default class OfflineDataPage {
  constructor() {
    this.presenter = new OfflineDataPresenter();
  }

  async render() {
    return this.presenter.render();
  }

  async afterRender() {
    return this.presenter.afterRender();
  }
}