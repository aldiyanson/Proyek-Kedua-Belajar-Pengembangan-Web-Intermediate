import RegisterModel from '../model/register-model.js';
import RegisterView from '../view/register-view.js';

export default class RegisterPresenter {
  constructor() {
    this.model = new RegisterModel();
    this.view = new RegisterView();
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
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value.trim();
      const passwordConfirm = form.passwordConfirm.value.trim();

      // Validation
      if (!name || !email || !password || !passwordConfirm) {
        this.view.showMessage('error', 'Semua kolom harus diisi.');
        return;
      }
      if (password.length < 8) {
        this.view.showMessage('error', 'Password harus minimal 8 karakter.');
        return;
      }
      if (password !== passwordConfirm) {
        this.view.showMessage('error', 'Password dan konfirmasi password tidak cocok.');
        return;
      }

      this.view.setSubmitButtonState(true);

      try {
        const response = await this.model.register(name, email, password);

        if (response.error) {
          throw new Error(response.message || 'Terjadi kesalahan saat mendaftar');
        }

        this.view.showMessage('success', 'Pendaftaran berhasil! Silakan tunggu sedang login otomatis...');

        // Auto login after successful registration
        try {
          await this.model.login(email, password);

          this.view.navigateTo('#/', 2000);
        } catch (loginError) {
          this.view.showMessage('warning', 'Pendaftaran berhasil tapi login gagal. <a href="#/login">Silakan login manual</a>.');
        }

      } catch (err) {
        this.view.showMessage('error', `Error: ${err.message || 'Terjadi kesalahan saat mendaftar'}`);
      } finally {
        this.view.setSubmitButtonState(false);
      }
    });
  }
}