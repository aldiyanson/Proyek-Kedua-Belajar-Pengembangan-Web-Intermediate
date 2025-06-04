// src/scripts/pages/register-page.js

import RegisterPresenter from './presenter/register-presenter.js';

const RegisterPage = {
  presenter: new RegisterPresenter(),

  async render() {
    return this.presenter.render();
  },

  async afterRender() {
    return this.presenter.afterRender();
  }
};

export default RegisterPage;