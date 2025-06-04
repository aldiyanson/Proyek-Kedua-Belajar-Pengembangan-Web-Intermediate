// src/scripts/pages/login-page.js

import LoginPresenter from './presenter/login-presenter.js';

const LoginPage = {
  presenter: new LoginPresenter(),

  async render() {
    return this.presenter.render();
  },

  async afterRender() {
    return this.presenter.afterRender();
  }
};

export default LoginPage;