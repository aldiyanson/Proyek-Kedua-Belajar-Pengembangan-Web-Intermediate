import HomeModel from '../model/home-model.js';
import HomeView from '../view/home-view.js';

export default class HomePresenter {
  constructor() {
    this.model = new HomeModel();
    this.view = new HomeView();
  }

  async render() {
    return this.view.renderSection();
  }

  async afterRender() {
    try {
      const { stories } = await this.model.fetchStories(1, 10);
      this.view.updateStoriesList(stories);
    } catch (e) {
      this.view.showError();
    }
  }
}