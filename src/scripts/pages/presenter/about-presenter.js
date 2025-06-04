import AboutModel from '../model/about-model.js';
import AboutView from '../view/about-view.js';

export default class AboutPresenter {
  constructor() {
    this.model = new AboutModel();
    this.view = new AboutView();
  }

  async render() {
    // If dynamic data is needed, fetch from model here
    return this.view.render();
  }
}