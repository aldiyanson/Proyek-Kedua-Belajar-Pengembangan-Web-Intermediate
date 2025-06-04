// src/scripts/components/header-template.js

const headerLoggedInTemplate = `
<header>
  <div class="main-header container">
    <a class="brand-name" href="#/"><i class="fa-solid fa-book-open" aria-hidden="true"></i> DiCerita</a>

    <nav id="navigation-drawer" class="navigation-drawer" aria-label="Main navigation">
      <ul id="nav-list" class="nav-list">
        <div id="main-nav">
          <li><a href="#/"><i class="fa-solid fa-house" aria-hidden="true"></i> Beranda</a></li>
          <li><a href="#/add"><i class="fa-solid fa-plus" aria-hidden="true"></i> Tambah Cerita</a></li>
          <li><a href="#/map"><i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> Peta</a></li>
          <li><a href="#/profile"><i class="fa-solid fa-user" aria-hidden="true"></i> Profil</a></li>
          <li><a href="#/push-notifications"><i class="fa-solid fa-bell" aria-hidden="true"></i> Notifikasi</a></li>
          <li><a href="#/offline-data"><i class="fa-solid fa-database" aria-hidden="true"></i> Data Offline</a></li>
          <li><a href="#/about"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Tentang</a></li>
        </div>
      </ul>
    </nav>

    <!-- User Profile Dropdown -->
    <div class="user-dropdown-container">
      <button id="user-dropdown-button" class="user-dropdown-button" aria-expanded="false" aria-label="User menu">
        <i class="fa-solid fa-circle-user" aria-hidden="true"></i>
      </button>
      <div id="user-dropdown" class="user-dropdown-content">
        <div class="user-dropdown-header">
          <span id="dropdown-user-name">Username</span>
        </div>
        <div class="user-dropdown-menu">
          <a href="#/profile" class="dropdown-item">
            <i class="fa-solid fa-user" aria-hidden="true"></i> Profil
          </a>
          <a href="#/" id="dropdown-logout-button" class="dropdown-item">
            <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i> Keluar
          </a>
        </div>
      </div>
    </div>

    <button id="drawer-button" class="drawer-button" aria-label="Open navigation">
      <i class="fa-solid fa-bars" aria-hidden="true"></i>
    </button>
  </div>
</header>
`;


function headerLoggedOutTemplate(currentHash) {
  const isAuthPage = currentHash.includes('#/login') || currentHash.includes('#/register');
  return `
<header>
  <div class="main-header container">
    <a class="brand-name" href="#/"><i class="fa-solid fa-book-open" aria-hidden="true"></i> DiCerita</a>

    <nav id="navigation-drawer" class="navigation-drawer" aria-label="Main navigation">
      <ul id="nav-list" class="nav-list">
        ${!isAuthPage ? `
        <div id="main-nav">
          <li><a href="#/"><i class="fa-solid fa-house" aria-hidden="true"></i> Beranda</a></li>
          <li><a href="#/push-notifications"><i class="fa-solid fa-bell" aria-hidden="true"></i> Notifikasi</a></li>
          <li><a href="#/offline-data"><i class="fa-solid fa-database" aria-hidden="true"></i> Data Offline</a></li>
          <li><a href="#/about"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Tentang</a></li>
        </div>
        ` : ''}
        <li class="auth-nav-item"><a href="#/login" class="login-btn"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> <span>Masuk</span></a></li>
        <li class="auth-nav-item"><a href="#/register" class="register-btn"><i class="fa-solid fa-user-plus" aria-hidden="true"></i> <span>Daftar</span></a></li>
      </ul>
    </nav>

    <button id="drawer-button" class="drawer-button" aria-label="Open navigation">
      <i class="fa-solid fa-bars" aria-hidden="true"></i>
    </button>
  </div>
</header>
`;
}

export { headerLoggedInTemplate, headerLoggedOutTemplate };