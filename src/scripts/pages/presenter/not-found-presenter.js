import NotFoundView from '../view/not-found-view.js';

export default class NotFoundPresenter {
  constructor() {
    this.view = new NotFoundView();
  }

  async render() {
    return this.view.renderSection();
  }

  async afterRender() {
    this.view.afterRender();
    this.view.trackNotFoundError();
    this.handleContextualError();
  }

  /**
   * Handle different types of 404 errors with contextual messages
   */
  handleContextualError() {
    const currentPath = window.location.hash.substring(1) || '/';
    const pathParts = currentPath.split('/');
    
    let errorContext = {
      originalUrl: window.location.href,
      errorType: 'page_not_found',
      suggestion: null
    };

    // Analyze the path to provide better error context
    if (pathParts[1] === 'story' && pathParts[2]) {
      // Invalid story ID
      errorContext.errorType = 'invalid_story_id';
      errorContext.suggestion = {
        name: 'Daftar Semua Cerita',
        url: '#/'
      };
    } else if (this.isProtectedRoute(currentPath)) {
      // Unauthorized access
      errorContext.errorType = 'unauthorized_access';
      errorContext.suggestion = {
        name: 'Halaman Login',
        url: '#/login'
      };
    } else if (this.isSimilarRoute(currentPath)) {
      // Suggest similar route
      const suggestion = this.getSimilarRoute(currentPath);
      if (suggestion) {
        errorContext.suggestion = suggestion;
      }
    }

    this.view.setErrorContext(errorContext);
  }

  /**
   * Check if the route requires authentication
   */
  isProtectedRoute(path) {
    const protectedRoutes = ['/profile', '/add'];
    return protectedRoutes.some(route => path.startsWith(route));
  }

  /**
   * Check if there's a similar route that might be what user intended
   */
  isSimilarRoute(path) {
    const availableRoutes = [
      '/', '/about', '/add', '/login', '/register', 
      '/profile', '/map', '/push-notifications', '/offline-data'
    ];
    
    return availableRoutes.some(route => 
      this.calculateSimilarity(path, route) > 0.5
    );
  }

  /**
   * Get similar route suggestion
   */
  getSimilarRoute(path) {
    const routes = [
      { path: '/', name: 'Beranda' },
      { path: '/about', name: 'Tentang' },
      { path: '/add', name: 'Tambah Cerita' },
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' },
      { path: '/profile', name: 'Profil' },
      { path: '/map', name: 'Peta Lokasi' },
      { path: '/push-notifications', name: 'Push Notification' },
      { path: '/offline-data', name: 'Data Offline' }
    ];

    let bestMatch = null;
    let highestSimilarity = 0;

    routes.forEach(route => {
      const similarity = this.calculateSimilarity(path, route.path);
      if (similarity > highestSimilarity && similarity > 0.3) {
        highestSimilarity = similarity;
        bestMatch = {
          name: route.name,
          url: '#' + route.path
        };
      }
    });

    return bestMatch;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  calculateSimilarity(str1, str2) {
    const matrix = [];
    const n = str1.length;
    const m = str2.length;

    if (n === 0) return m === 0 ? 1 : 0;
    if (m === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= n; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= m; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[n][m];
    const maxLength = Math.max(n, m);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Method to be called when a specific error occurs
   */
  static handleSpecificError(errorType, additionalData = {}) {
    // This can be called from router when specific errors occur
    window.location.hash = '#/404';
    
    // Store error context for the 404 page to use
    sessionStorage.setItem('404_context', JSON.stringify({
      errorType,
      ...additionalData,
      timestamp: Date.now()
    }));
  }

  /**
   * Get stored error context from session storage
   */
  getStoredErrorContext() {
    try {
      const stored = sessionStorage.getItem('404_context');
      if (stored) {
        const context = JSON.parse(stored);
        
        // Clear stored context
        sessionStorage.removeItem('404_context');
        
        // Check if context is not too old (5 minutes)
        if (Date.now() - context.timestamp < 5 * 60 * 1000) {
          return context;
        }
      }
    } catch (error) {
      console.error('Error reading stored 404 context:', error);
    }
    
    return null;
  }
}