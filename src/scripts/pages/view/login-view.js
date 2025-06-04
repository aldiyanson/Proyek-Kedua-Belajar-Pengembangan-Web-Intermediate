export default class LoginView {
  renderSection() {
    return `
      <section class="container">
        <div class="auth-container">
          <h1><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Masuk ke DiCerita</h1>
          <form id="login-form" autocomplete="off">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="Email Anda" required />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" placeholder="Password" required />
            </div>
            <div class="form-submit">
              <button type="submit" id="submit-btn">
                <i class="fa-solid fa-sign-in-alt" aria-hidden="true"></i> Masuk
              </button>
            </div>
            <p class="auth-link">Belum punya akun? <a href="#/register">Daftar di sini</a></p>
          </form>
          <div id="login-message" aria-live="polite"></div>
        </div>
      </section>
    `;
  }

  showMessage(type, message) {
    const messageArea = document.getElementById('login-message');
    if (!messageArea) return;
    let icon = '';
    if (type === 'success') {
      icon = '<i class="fa-solid fa-check-circle" aria-hidden="true"></i>';
      messageArea.innerHTML = `<div class="alert alert-success">${icon} ${message}</div>`;
    } else {
      icon = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
      messageArea.innerHTML = `<div class="alert alert-error">${icon} ${message}</div>`;
    }
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
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', callback);
    }
  }

  setSubmitButtonState(loading) {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Masuk...';
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-sign-in-alt" aria-hidden="true"></i> Masuk';
      }
    }
  }

  navigateTo(url, delay = 0) {
    setTimeout(() => {
      window.location.href = url;
    }, delay);
  }
}