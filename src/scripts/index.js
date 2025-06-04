// CSS imports
import '../styles/styles.css';
import '../styles/header.css';  // Import header-specific styles
import '../styles/footer.css';  // Import footer-specific styles
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import App from './pages/app';
import Header from './components/header';
import Footer from './components/footer';
import { headerLoggedInTemplate, headerLoggedOutTemplate } from './components/header-template';
import { isLoggedIn, getData } from './data/api-adapter';
import { initializeOfflineSupport, getOfflineStatus } from './data/api-adapter';
import './test-push-notifications.js';

// Initialize the header component
const initHeader = () => {
  // Insert header HTML into the page based on login state
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    if (isLoggedIn()) {
      headerContainer.innerHTML = headerLoggedInTemplate;
    } else {
      headerContainer.innerHTML = headerLoggedOutTemplate(window.location.hash);
    }
  }
  
  // Initialize header functionality
  return new Header();
};

// Initialize the footer component
const initFooter = () => {
  // Footer is initialized directly by the class
  return new Footer();
};

// Service Worker Registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New service worker found:', newWorker);
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker installed, app will update on next page load');
            // Optional: Show update notification to user
            showUpdateNotification();
          }
        });
      });
      
      console.log('Service worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  } else {
    console.log('Service workers are not supported');
  }
};

// Show update notification (optional UI enhancement)
const showUpdateNotification = () => {
  // Simple console notification for now
  // In a real app, this could be a toast notification or modal
  console.log('App update available! Refresh the page to get the latest version.');
};

// Install prompt handling
const handleInstallPrompt = () => {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎉 Install prompt available - PWA is installable!');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button
    showInstallButton(deferredPrompt);
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ App was installed successfully');
    deferredPrompt = null;
    hideInstallButton();
    
    // Show success message
    showInstallSuccessMessage();
  });
  
  // Fallback: Check if app is already installed
  if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 App is running in standalone mode (already installed)');
  }
};

// Show install button (real implementation)
const showInstallButton = (deferredPrompt) => {
  console.log('Install button available - creating install UI');
  
  // Create install button
  const installButton = document.createElement('button');
  installButton.id = 'install-button';
  installButton.innerHTML = `
    <i class="fas fa-download"></i> Install DiCerita App
  `;
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
    transition: all 0.3s ease;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  // Add hover effect
  installButton.onmouseover = () => {
    installButton.style.transform = 'translateY(-2px)';
    installButton.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
  };
  
  installButton.onmouseleave = () => {
    installButton.style.transform = 'translateY(0)';
    installButton.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)';
  };
  
  // Handle install click
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      installButton.style.display = 'none'; // Hide button immediately
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User choice:', outcome);
      
      if (outcome === 'dismissed') {
        // Show button again if user dismissed
        setTimeout(() => {
          if (installButton.parentNode) {
            installButton.style.display = 'flex';
          }
        }, 3000);
      }
      
      deferredPrompt = null;
    }
  });
  
  // Add to page
  document.body.appendChild(installButton);
  
  // Auto-hide after 10 seconds if not clicked
  setTimeout(() => {
    if (installButton.parentNode && deferredPrompt) {
      installButton.style.opacity = '0.7';
    }
  }, 10000);
};

// Hide install button
const hideInstallButton = () => {
  console.log('Install button hidden - app is installed');
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      if (installButton.parentNode) {
        installButton.parentNode.removeChild(installButton);
      }
    }, 300);
  }
};

// Show install success message
const showInstallSuccessMessage = () => {
  const successMessage = document.createElement('div');
  successMessage.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
    z-index: 1001;
  `;
  successMessage.innerHTML = '✅ DiCerita berhasil diinstall!';
  
  document.body.appendChild(successMessage);
  
  setTimeout(() => {
    if (successMessage.parentNode) {
      successMessage.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (successMessage.parentNode) {
          successMessage.parentNode.removeChild(successMessage);
        }
      }, 300);
    }
  }, 3000);
};

// Add offline status indicator
const addOfflineStatusIndicator = () => {
  // Create offline status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'offline-status';
  statusIndicator.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #6c757d, #495057);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 12px;
    z-index: 1000;
    display: none;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  `;
  
  statusIndicator.innerHTML = `
    <span class="status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #ffc107;"></span>
    <span class="status-text">Offline Mode</span>
  `;
  
  document.body.appendChild(statusIndicator);
  
  // Update status based on network
  const updateStatus = async () => {
    const isOnline = navigator.onLine;
    const offlineStatus = await getOfflineStatus();
    
    if (isOnline) {
      statusIndicator.style.display = 'none';
    } else {
      statusIndicator.style.display = 'flex';
      
      // Update queue info if available
      if (offlineStatus.queueLength > 0) {
        statusIndicator.querySelector('.status-text').textContent =
          `Offline - ${offlineStatus.queueLength} pending`;
      } else {
        statusIndicator.querySelector('.status-text').textContent = 'Offline Mode';
      }
    }
  };
  
  // Initial status check
  updateStatus();
  
  // Listen for network changes
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  
  // Periodic status update
  setInterval(updateStatus, 30000); // Every 30 seconds
};

document.addEventListener('DOMContentLoaded', async () => {
  // Register service worker first
  await registerServiceWorker();
  
  // Handle install prompt
  handleInstallPrompt();
  
  // Add debugging info
  console.log('🔍 PWA Debug Info:');
  console.log('- Service Worker supported:', 'serviceWorker' in navigator);
  console.log('- Current URL:', window.location.href);
  console.log('- Is HTTPS:', window.location.protocol === 'https:');
  console.log('- Is localhost:', window.location.hostname === 'localhost');
  
  // Initialize offline support
  console.log('🔧 Initializing offline support...');
  await initializeOfflineSupport();
  
  // Add offline status indicator
  addOfflineStatusIndicator();
  
  // Initialize the header component
  const header = initHeader();
  
  // Initialize the footer component
  const footer = initFooter();
  
  // Initialize the app
  const app = new App({
    content: document.querySelector('#main-content')
  });
  await app.renderPage();

  // Handle page navigation
  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    // Update auth UI on each navigation
    header.updateAuthState();
  });
  
  // Handle view transitions for links
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
});
