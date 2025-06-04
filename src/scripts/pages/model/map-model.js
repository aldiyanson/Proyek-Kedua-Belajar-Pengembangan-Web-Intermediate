import { getData } from '../../data/api.js';

export default class MapModel {
  async fetchStories(page = 1, pageSize = 20, withLocation = 1) {
    return getData(page, pageSize, withLocation);
  }
}