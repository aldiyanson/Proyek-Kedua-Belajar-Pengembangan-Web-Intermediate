import PushNotificationPresenter from './presenter/push-notification-presenter.js';

export default class PushNotificationPage {
  constructor() {
    this.presenter = new PushNotificationPresenter();
  }

  async render() {
    return this.presenter.render();
  }

  async afterRender() {
    return this.presenter.afterRender();
  }
}