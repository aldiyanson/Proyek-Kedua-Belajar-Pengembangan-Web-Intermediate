import { getData, isLoggedIn } from '../../data/api.js';

export default class ProfileModel {
  isLoggedIn() {
    return isLoggedIn();
  }
  getUserData() {
    return JSON.parse(localStorage.getItem('auth'));
  }
  async fetchStories(page = 1, size = 100) {
    return getData(page, size);
  }
}