import NotFoundPresenter from './presenter/not-found-presenter.js';

export default class NotFoundPage {
  constructor() {
    this.presenter = new NotFoundPresenter();
  }

  async render() {
    return this.presenter.render();
  }

  async afterRender() {
    return this.presenter.afterRender();
  }
}