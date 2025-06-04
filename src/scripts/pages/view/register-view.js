export default class RegisterView {
  renderSection() {
    return `
      <section class="container">
        <div class="auth-container">
          <h1><i class="fa-solid fa-user-plus" aria-hidden="true"></i> Daftar Akun DiCerita</h1>
          <form id="register-form" autocomplete="off">
            <div class="form-group">
              <label for="name">Nama Lengkap</label>
              <input type="text" id="name" name="name" placeholder="Nama Lengkap" required />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="Email Anda" required />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Minimal 8 karakter"
                minlength="8"
                required 
              />
              <small class="form-text">Password minimal 8 karakter</small>
            </div>
            <div class="form-group">
              <label for="password-confirm">Konfirmasi Password</label>
              <input 
                type="password" 
                id="password-confirm" 
                name="passwordConfirm" 
                placeholder="Ketik ulang password Anda"
                minlength="8" 
                required 
              />
            </div>
            <div class="form-submit">
              <button type="submit" id="submit-btn">
                <i class="fa-solid fa-user-plus" aria-hidden="true"></i> Daftar
              </button>
            </div>
            <p class="auth-link">Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
          </form>
          <div id="register-message" aria-live="polite"></div>
        </div>
      </section>
    `;
  }

  showMessage(type, message) {
    const messageArea = document.getElementById('register-message');
    if (!messageArea) return;
    let icon = '';
    let alertClass = '';
    if (type === 'success') {
      icon = '<i class="fa-solid fa-check-circle" aria-hidden="true"></i>';
      alertClass = 'alert-success';
    } else if (type === 'warning') {
      icon = '<i class="fa-solid fa-check-circle" aria-hidden="true"></i>';
      alertClass = 'alert-warning';
    } else {
      icon = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
      alertClass = 'alert-error';
    }
    messageArea.innerHTML = `<div class="alert ${alertClass}">${icon} ${message}</div>`;
  }
  setAuthPageClass(enable) {
    if (enable) {
      document.body.classList.add('auth-page');
    } else {
      document.body.classList.remove('auth-page');
    }
  }

  onHashChange(callback) {
    window.addEventListener('hashchange', callback, { once: true });
  }

  setupViewTransitions() {
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.href.includes('#/')) {
        if (document.startViewTransition) {
          e.preventDefault();
          document.startViewTransition(() => {
            window.location.href = e.target.href;
          });
        }
      }
    });
  }

  onFormSubmit(callback) {
    const form = document.getElementById('register-form');
    if (form) {
      form.addEventListener('submit', callback);
    }
  }

  setSubmitButtonState(loading) {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Mendaftar...';
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-user-plus" aria-hidden="true"></i> Daftar';
      }
    }
  }

  navigateTo(url, delay = 0) {
    setTimeout(() => {
      window.location.href = url;
    }, delay);
  }
}