import AboutPresenter from '../presenter/about-presenter.js';

export default class AboutPage {
  constructor() {
    this.presenter = new AboutPresenter();
  }

  async render() {
    return this.presenter.render();
  }

  async afterRender() {
    // Removed entrance animation from here, now handled in app.js
  }
}
