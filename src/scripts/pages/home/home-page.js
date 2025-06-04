import HomePresenter from '../presenter/home-presenter.js';

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter();
  }

  async render() {
    return this.presenter.render();
  }

  async afterRender() {
    return this.presenter.afterRender();
  }
}
