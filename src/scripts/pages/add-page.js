// src/scripts/pages/add-page.js

import AddPresenter from './presenter/add-presenter.js';

const AddPage = {
  presenter: new AddPresenter(),

  async render() {
    return this.presenter.render();
  },

  async afterRender() {
    return this.presenter.afterRender();
  },

  async destroy() {
    if (typeof this.presenter.destroy === 'function') {
      await this.presenter.destroy();
    }
  }
};

export default AddPage;