import { registerUser, loginUser } from '../../data/api.js';

export default class RegisterModel {
  async register(name, email, password) {
    return registerUser(name, email, password);
  }
  async login(email, password) {
    return loginUser(email, password);
  }
}