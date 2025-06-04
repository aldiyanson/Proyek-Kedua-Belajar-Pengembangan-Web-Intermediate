// src/scripts/components/footer.js
import footerTemplate from './footer-template';

class Footer {
  constructor() {
    this.footerContainer = document.getElementById('footer-container');
    this._init();
  }

  _init() {
    this._renderFooter();
  }

  _renderFooter() {
    if (this.footerContainer) {
      this.footerContainer.innerHTML = footerTemplate;
    }
  }

  // This method can be expanded if we need to add dynamic content to the footer
  updateFooter(data = {}) {
    // For example, update copyright year dynamically
    const copyrightEl = document.querySelector('.copyright');
    if (copyrightEl && data.year) {
      copyrightEl.textContent = copyrightEl.textContent.replace(/\d{4}/, data.year);
    }
  }
}

export default Footer;