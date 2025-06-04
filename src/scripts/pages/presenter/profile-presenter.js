import ProfileModel from '../model/profile-model.js';
import ProfileView from '../view/profile-view.js';

export default class ProfilePresenter {
  constructor() {
    this.model = new ProfileModel();
    this.view = new ProfileView();
  }

  async render() {
    if (!this.model.isLoggedIn()) {
      this.view.redirectToLogin();
      return `<div>Redirecting to login...</div>`;
    }
    const userData = this.model.getUserData();
    return this.view.renderSection(userData);
  }

  async afterRender() {
    this.view.setupViewTransitions();
    this.view.setupTabNavigation();

    try {
      this.view.showLoading();
      const userData = this.model.getUserData();
      if (!userData?.token) {
        throw new Error('User not authenticated');
      }
      const response = await this.model.fetchStories(1, 100);
      if (!response || !response.stories) {
        throw new Error('Invalid response from server');
      }
      const userStories = response.stories.filter(story => story.name === userData.name);
      this.view.updateStoriesCount(userStories.length);
      this.view.showStories(userStories);
    } catch (e) {
      this.view.showError(e.message, e.message === 'User not authenticated');
    }
  }
}