import { loginUser, isOnline, logoutWithCacheClean } from '../../data/api-adapter.js';

export default class LoginModel {
  async login(email, password) {
    try {
      console.log('[LoginModel] Attempting login...');
      console.log('[LoginModel] Online status:', isOnline());
      
      // Validate input
      const validation = this.validateLoginData(email, password);
      if (!validation.isValid) {
        return {
          error: true,
          message: validation.errors[0],
          source: 'validation'
        };
      }
      
      const result = await loginUser(email, password);
      
      // Add login info to result
      if (result && typeof result === 'object') {
        result.loginInfo = {
          isOnline: isOnline(),
          source: result.source || 'unknown',
          isOffline: result.isOffline || false,
          timestamp: new Date().toISOString()
        };
        
        // Log login details
        if (result.isOffline) {
          console.log('[LoginModel] Logged in using cached credentials (offline)');
        } else if (!result.error) {
          console.log('[LoginModel] Login successful (online)');
        }
      }
      
      return result;
    } catch (error) {
      console.error('[LoginModel] Login error:', error);
      
      return {
        error: true,
        message: error.message || 'Login failed',
        loginInfo: {
          isOnline: isOnline(),
          source: 'error',
          isOffline: !isOnline(),
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Enhanced logout with cache cleanup
  logout() {
    try {
      console.log('[LoginModel] Logging out with cache cleanup...');
      const success = logoutWithCacheClean();
      
      if (success) {
        console.log('[LoginModel] Logout successful');
      }
      
      return success;
    } catch (error) {
      console.error('[LoginModel] Logout error:', error);
      return false;
    }
  }

  // Validate login data
  validateLoginData(email, password) {
    const errors = [];
    
    if (!email || email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!password || password.trim().length === 0) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check if email format is valid
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check login capabilities
  getLoginCapabilities() {
    return {
      canLogin: true, // Always true since we support offline login with cached credentials
      isOnline: isOnline(),
      mode: isOnline() ? 'online' : 'offline',
      supportsOfflineLogin: true
    };
  }

  // Check if user has cached credentials (for offline login)
  async hasCachedCredentials() {
    // This would check if there are cached credentials available
    // For security reasons, we don't expose the actual credentials
    try {
      // You could implement this to check IndexedDB for cached user data
      return false; // Default to false for security
    } catch (error) {
      console.error('[LoginModel] Error checking cached credentials:', error);
      return false;
    }
  }

  // Get demo login credentials (for testing purposes)
  getDemoCredentials() {
    return {
      email: 'demo@example.com',
      password: 'password123',
      note: 'Demo credentials for testing'
    };
  }
}