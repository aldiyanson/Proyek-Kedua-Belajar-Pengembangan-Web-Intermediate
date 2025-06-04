// src/scripts/components/header.js
import { isLoggedIn, logout } from '../data/api';
import { headerLoggedInTemplate, headerLoggedOutTemplate } from './header-template';

class Header {
  constructor() {
    this.drawerButton = document.getElementById('drawer-button');
    this.navigationDrawer = document.getElementById('navigation-drawer');
    this.userDropdownButton = document.getElementById('user-dropdown-button');
    this.userDropdown = document.getElementById('user-dropdown');
    this.dropdownUserName = document.getElementById('dropdown-user-name');
    this.dropdownLogoutButton = document.getElementById('dropdown-logout-button');
    
    this._init();
  }

  _init() {
    this._setupDrawer();
    this._setupUserDropdown();
    this._setupLogoutHandlers();
    this._updateAuthUI();
    
    // Force desktop menu styling for large screens (except on login/register pages)
    this._handleWindowResize();
    window.addEventListener('resize', this._handleWindowResize.bind(this));
    
    // Handle hash changes to update header styling when navigating between pages
    window.addEventListener('hashchange', this._handleWindowResize.bind(this));
  }
  
  _handleWindowResize() {
    const isDesktop = window.innerWidth > 1000;
    const headerElement = document.querySelector('header');
    const currentPath = window.location.hash;
    
    // Check if we're on login or register pages
    const isAuthPage = currentPath.includes('#/login') || currentPath.includes('#/register');
    
    if (headerElement) {
      if (isDesktop && !isAuthPage) {
        headerElement.classList.add('desktop-view');
        if (!isLoggedIn()) {
          headerElement.classList.add('logged-out');
        } else {
          headerElement.classList.remove('logged-out');
        }
      } else {
        headerElement.classList.remove('desktop-view');
        if (!isLoggedIn()) {
          headerElement.classList.add('logged-out');
        } else {
          headerElement.classList.remove('logged-out');
        }
      }
    }
  }

  _setupDrawer() {
    if (!this.drawerButton || !this.navigationDrawer) return;

    this.drawerButton.addEventListener('click', () => {
      this.navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.navigationDrawer.contains(event.target) && !this.drawerButton.contains(event.target)) {
        this.navigationDrawer.classList.remove('open');
      }

      this.navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  _setupUserDropdown() {
    // Toggle dropdown visibility when button is clicked
    if (this.userDropdownButton) {
      this.userDropdownButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.userDropdown.classList.toggle('show');
        
        // Update aria-expanded attribute
        const isExpanded = this.userDropdown.classList.contains('show');
        this.userDropdownButton.setAttribute('aria-expanded', isExpanded);
      });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (this.userDropdown && 
          this.userDropdownButton && 
          !this.userDropdown.contains(event.target) && 
          !this.userDropdownButton.contains(event.target)) {
        this.userDropdown.classList.remove('show');
        this.userDropdownButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  _setupLogoutHandlers() {
    const handleLogout = (e) => {
      e.preventDefault();
      logout();
      this._updateAuthUI();
      
      // Redirect to login page
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          window.location.hash = '#/login';
        });
      } else {
        window.location.hash = '#/login';
      }
    };
    
    // Attach logout handler to dropdown button
    if (this.dropdownLogoutButton) {
      this.dropdownLogoutButton.addEventListener('click', handleLogout);
    }
  }

  _updateAuthUI() {
    const mainNav = document.getElementById('main-nav');
    const navList = document.getElementById('nav-list');
    const userDropdownContainer = document.querySelector('.user-dropdown-container');
    const header = document.querySelector('.main-header');
// Remove any existing auth elements (both in drawer and outside)
if (navList) {
  navList.querySelectorAll('.auth-nav-item').forEach(item => item.remove());
}
const existingAuthButtons = document.querySelector('.auth-buttons-container');
if (existingAuthButtons) existingAuthButtons.remove();

// Check if we're on an auth page (login or register)
const isAuthPage = window.location.hash.includes('#/login') ||
                  window.location.hash.includes('#/register');
const isAboutPage = window.location.hash.includes('#/about');
const isMapPage = window.location.hash.includes('#/map');
if (isAuthPage) {
  document.body.classList.add('auth-page');
} else {
  document.body.classList.remove('auth-page');
}
if (isAboutPage) {
  document.body.classList.add('about-page');
} else {
  document.body.classList.remove('about-page');
}
if (isMapPage) {
  document.body.classList.add('map-page');
} else {
  document.body.classList.remove('map-page');
}



    const headerElement = document.querySelector('header'); // Get the header element

    if (isLoggedIn()) {
      // User is logged in
      if (headerElement) headerElement.classList.add('logged-in'); // Add logged-in class

      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const userName = auth.name || 'User';

      // Update username in dropdown
      if (this.dropdownUserName) {
        this.dropdownUserName.textContent = userName;
      }

      // Show main navigation (controlled by CSS)
      // if (mainNav) mainNav.style.display = 'block';

      // Show user dropdown when logged in
      if (userDropdownContainer) {
        userDropdownContainer.style.display = 'block';
      }
    } else {
      // User is logged out
      if (headerElement) {
        headerElement.classList.remove('logged-in');
        // Add special class for consistent styling on desktop
        headerElement.classList.add('logged-out');
        // Hide main-nav if in desktop mode
        const isDesktop = window.innerWidth > 1000;
        const mainNav = document.getElementById('main-nav');
        if (isDesktop && mainNav) {
          mainNav.style.display = 'none';
        } else if (mainNav) {
          mainNav.style.display = '';
        }
      }
      
      // Check if we're on an auth page
      const isAuthPage = window.location.hash.includes('#/login') ||
                         window.location.hash.includes('#/register');
      const isAboutPage = window.location.hash.includes('#/about');
      const isMapPage = window.location.hash.includes('#/map');
      if (isAuthPage) {
        document.body.classList.add('auth-page');
      }
  
      // Hide user dropdown when logged out
      if (userDropdownContainer) userDropdownContainer.style.display = 'none';
  
      // Create login and register links
      const loginLink = document.createElement('a');
      loginLink.href = '#/login';
      loginLink.innerHTML = '<i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> <span>Masuk</span>';
      loginLink.className = 'login-btn';
  
      const registerLink = document.createElement('a');
      registerLink.href = '#/register';
      registerLink.innerHTML = '<i class="fa-solid fa-user-plus" aria-hidden="true"></i> <span>Daftar</span>';
      registerLink.className = 'register-btn';
  
      // Add login/register links to the navigation drawer (hamburger) ONLY if:
      // - not in desktop mode on login, register, about, or map page
      // - OR always in mobile mode
      const isDesktop = window.innerWidth > 1000;
      if (
        navList &&
        (!isDesktop || (!isAuthPage && !isAboutPage && !isMapPage))
      ) {
        const loginNavItem = document.createElement('li');
        loginNavItem.className = 'auth-nav-item';
        loginNavItem.appendChild(loginLink.cloneNode(true));

        const registerNavItem = document.createElement('li');
        registerNavItem.className = 'auth-nav-item';
        registerNavItem.appendChild(registerLink.cloneNode(true));

        navList.appendChild(loginNavItem);
        navList.appendChild(registerNavItem);
      }
  
      // Add login/register buttons to header (for desktop) ALWAYS before login
      if (header) {
        const authButtonsContainer = document.createElement('div');
        authButtonsContainer.className = 'auth-buttons-container';

        authButtonsContainer.appendChild(loginLink);
        authButtonsContainer.appendChild(registerLink);

        // Insert before the drawer button
        const drawerButton = document.querySelector('#drawer-button');
        if (drawerButton) {
          header.insertBefore(authButtonsContainer, drawerButton);
        } else {
          header.appendChild(authButtonsContainer);
        }
      }
    }
  }

  updateAuthState() {
    // Replace header DOM with the correct template and re-initialize event listeners
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = isLoggedIn() ? headerLoggedInTemplate : headerLoggedOutTemplate;
    }
    // Re-initialize the Header class to reattach event listeners
    this.drawerButton = document.getElementById('drawer-button');
    this.navigationDrawer = document.getElementById('navigation-drawer');
    this.userDropdownButton = document.getElementById('user-dropdown-button');
    this.userDropdown = document.getElementById('user-dropdown');
    this.dropdownUserName = document.getElementById('dropdown-user-name');
    this.dropdownLogoutButton = document.getElementById('dropdown-logout-button');
    this._init();
  }
}

export default Header;

// Patch updateAuthState to use dynamic headerLoggedOutTemplate
Header.prototype.updateAuthState = function () {
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    if (isLoggedIn()) {
      headerContainer.innerHTML = headerLoggedInTemplate;
    } else {
      headerContainer.innerHTML = headerLoggedOutTemplate(window.location.hash);
    }
  }
  this.drawerButton = document.getElementById('drawer-button');
  this.navigationDrawer = document.getElementById('navigation-drawer');
  this.userDropdownButton = document.getElementById('user-dropdown-button');
  this.userDropdown = document.getElementById('user-dropdown');
  this.dropdownUserName = document.getElementById('dropdown-user-name');
  this.dropdownLogoutButton = document.getElementById('dropdown-logout-button');
  this._init();
};