import LoginModel from '../model/login-model.js';
import LoginView from '../view/login-view.js';
import Header from '../../components/header';

export default class LoginPresenter {
  constructor() {
    this.model = new LoginModel();
    this.view = new LoginView();
  }

  async render() {
    return this.view.renderSection();
  }

  async afterRender() {
    this.view.setAuthPageClass(true);

    const cleanUp = () => {
      this.view.setAuthPageClass(false);
    };
    this.view.onHashChange(cleanUp);

    this.view.setupViewTransitions();

    this.view.onFormSubmit(async (e) => {
      e.preventDefault();

      const form = e.target;
      const email = form.email.value.trim();
      const password = form.password.value.trim();

      if (!email || !password) {
        this.view.showMessage('error', 'Email dan password harus diisi.');
        return;
      }

      this.view.setSubmitButtonState(true);

      try {
        const response = await this.model.login(email, password);

        if (response.error) {
          throw new Error(response.message || 'Terjadi kesalahan saat login');
        }

        this.view.showMessage('success', 'Login berhasil! Mengalihkan ke beranda...');
        const header = new Header();
        header.updateAuthState();

        this.view.navigateTo('#/', 1000);

      } catch (err) {
        this.view.showMessage('error', `Error: ${err.message || 'Terjadi kesalahan saat login'}`);
      } finally {
        this.view.setSubmitButtonState(false);
      }
    });
  }
}