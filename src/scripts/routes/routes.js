import HomePage from '../pages/home/home-page.js';
import AboutPage from '../pages/about/about-page.js';
import AddPage from '../pages/add-page.js';
import LoginPage from '../pages/login-page.js';
import RegisterPage from '../pages/register-page.js';
import StoryDetailPage from '../pages/story-detail-page.js';
import ProfilePage from '../pages/profile-page.js';
import MapPage from '../pages/map-page.js';
import OfflineDataPage from '../pages/offline-data-page.js';
import PushNotificationPage from '../pages/push-notification-page.js';
import NotFoundPage from '../pages/not-found-page.js';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/add': AddPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/story/:id': StoryDetailPage,
  '/profile': ProfilePage,
  '/map': MapPage,
  '/offline-data': new OfflineDataPage(),
  '/push-notifications': new PushNotificationPage(),
  '/404': new NotFoundPage(),
};

export default routes;
