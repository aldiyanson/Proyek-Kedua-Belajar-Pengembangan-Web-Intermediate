import routes from '../routes/routes';
import { getActiveRoute, getActivePathname } from '../routes/url-parser';
import { isLoggedIn } from '../data/api';

// Pages that require authentication
const PROTECTED_ROUTES = [
  '/', // Add home route to protected routes
  '/add',
  '/story/:id'
];

// Pages accessible only for non-authenticated users
const AUTH_ROUTES = [
  '/login',
  '/register'
];

class App {
  #content = null;

  constructor({ content }) {
    this.#content = content;
  }

  // Track the previous page for teardown
  #previousPage = null;

  async renderPage() {
    const url = getActiveRoute();
    const currentPath = getActivePathname();
    const page = routes[url];

    // Teardown previous page if it has a destroy method
    if (this.#previousPage && typeof this.#previousPage.destroy === 'function') {
      try {
        await this.#previousPage.destroy();
      } catch (e) {
        // Ignore teardown errors
      }
    }

    // Auth check middleware
    const isAuthenticated = isLoggedIn();

    // Check if the current route is protected and user is not authenticated
    const isProtectedRoute = PROTECTED_ROUTES.some(route => {
      if (route.includes(':id')) {
        const baseRoute = route.split('/:')[0];
        return currentPath.startsWith(baseRoute);
      }
      return route === url;
    });

    // Check if the current route is auth-only (login/register) and user is authenticated
    const isAuthRoute = AUTH_ROUTES.includes(url);

    if (isProtectedRoute && !isAuthenticated) {
      // User is trying to access protected route without auth
      window.location.hash = '#/login';
      return;
    }

    if (isAuthRoute && isAuthenticated) {
      // User is already logged in but trying to access login/register
      window.location.hash = '#/';
      return;
    }

    if (!page) {
      console.error('Page not found:', url);
      // Redirect to 404 page instead of home
      window.location.hash = '#/404';
      return;
    }

    // Simplified renderContent without initial styling or animations
    const renderContent = async () => {
      // Apply initial styles for entrance animation
      this.#content.style.opacity = '0';
      this.#content.style.transform = 'translateY(30px)';

      this.#content.innerHTML = await page.render();
      await page.afterRender();

      // Apply entrance animation to the main content element
      this.#content.classList.add('animate-in');
      // Remove the initial styles after animation starts (or finishes)
      this.#content.addEventListener('animationend', () => {
        this.#content.style.opacity = '';
        this.#content.style.transform = '';
        this.#content.classList.remove('animate-in'); // Remove class after animation
      }, { once: true }); // Ensure listener is removed after one execution
    };

    // Render content without global animateOut or view transitions
    await renderContent();

    // Track the current page for next teardown
    this.#previousPage = page;
  }
}

export default App;
