/**
 * Offline-First API Layer for DiCerita PWA
 * Integrates with IndexedDB for seamless offline/online experience
 */

import { storyDB } from './indexed-db.js';
import { imageCacheManager } from '../utils/image-cache.js';

export class OfflineFirstAPI {
  constructor() {
    this.isOnline = navigator.onLine;
    this.baseURL = 'https://story-api.dicoding.dev/v1';
    this.syncInProgress = false;
    this.init();
  }

  async init() {
    // Ensure IndexedDB is initialized
    await storyDB.init();
    
    // Setup network event listeners
    this.setupNetworkHandlers();
    
    // Setup periodic sync check
    this.setupPeriodicSync();
    
    console.log('[OfflineFirstAPI] Initialized');
  }

  setupNetworkHandlers() {
    window.addEventListener('online', async () => {
      console.log('🌐 Network status: ONLINE');
      this.isOnline = true;
      this.showNetworkStatus('online');
      
      // Trigger sync when coming back online
      setTimeout(() => {
        this.syncOfflineQueue();
      }, 1000); // Small delay to ensure stable connection
    });
    
    window.addEventListener('offline', () => {
      console.log('📴 Network status: OFFLINE');
      this.isOnline = false;
      this.showNetworkStatus('offline');
    });
  }

  setupPeriodicSync() {
    // Check for sync opportunities every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineQueue();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Story Data Methods - Offline First Strategy
   */

  // Get stories with offline-first approach
  async getStories(page = 1, size = 10, location = 1) {
    console.log(`[OfflineFirstAPI] Getting stories - page: ${page}, size: ${size}`);
    
    if (this.isOnline) {
      try {
        // Try to fetch from network first
        const networkData = await this.fetchStoriesFromNetwork(page, size, location);
        
        // Cache the fetched stories
        if (networkData && networkData.listStory) {
          await storyDB.addStories(networkData.listStory);
          console.log(`[OfflineFirstAPI] Cached ${networkData.listStory.length} stories from network`);
          
          // Preload images for stories (background process)
          if (networkData.listStory.length > 0) {
            imageCacheManager.preloadMultipleStories(networkData.listStory, 2)
              .catch(error => {
                console.error('[OfflineFirstAPI] Error preloading story images:', error);
              });
          }
        }
        
        return {
          ...networkData,
          source: 'network',
          cached: true
        };
      } catch (error) {
        console.warn('[OfflineFirstAPI] Network fetch failed, falling back to cache:', error);
        return this.getStoriesFromCache(page, size);
      }
    } else {
      // Offline - get from cache
      return this.getStoriesFromCache(page, size);
    }
  }

  // Fetch stories from network (internal method)
  async fetchStoriesFromNetwork(page, size, location) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${this.baseURL}/stories?page=${page}&size=${size}&location=${location}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Network request failed: ${response.status}`);
    }

    return await response.json();
  }

  // Get stories from cache (internal method)
  async getStoriesFromCache(page, size) {
    try {
      const offset = (page - 1) * size;
      const cachedStories = await storyDB.getStories(size, offset);
      
      return {
        error: false,
        message: 'Stories retrieved from cache',
        listStory: cachedStories,
        source: 'cache',
        page,
        size,
        totalItems: cachedStories.length,
        isOffline: !this.isOnline
      };
    } catch (error) {
      console.error('[OfflineFirstAPI] Failed to get stories from cache:', error);
      return {
        error: true,
        message: 'Failed to retrieve stories',
        listStory: [],
        source: 'cache',
        isOffline: !this.isOnline
      };
    }
  }

  // Get single story by ID
  async getStoryById(id) {
    console.log(`[OfflineFirstAPI] Getting story by ID: ${id}`);
    
    // Check cache first
    const cachedStory = await storyDB.getStoryById(id);
    if (cachedStory) {
      console.log('[OfflineFirstAPI] Story found in cache');
      return {
        error: false,
        message: 'Story retrieved from cache',
        story: cachedStory,
        source: 'cache'
      };
    }

    // If online, try to fetch from network
    if (this.isOnline) {
      try {
        const networkStory = await this.fetchStoryFromNetwork(id);
        
        // Cache the story
        if (networkStory && networkStory.story) {
          await storyDB.addStory(networkStory.story);
          
          // Preload image for story detail (background process)
          imageCacheManager.preloadStoryImages(networkStory.story)
            .catch(error => {
              console.error('[OfflineFirstAPI] Error preloading story detail image:', error);
            });
        }
        
        return {
          ...networkStory,
          source: 'network'
        };
      } catch (error) {
        console.error('[OfflineFirstAPI] Failed to fetch story from network:', error);
        return {
          error: true,
          message: 'Story not found',
          source: 'network'
        };
      }
    }

    return {
      error: true,
      message: 'Story not available offline',
      source: 'cache',
      isOffline: true
    };
  }

  // Fetch single story from network
  async fetchStoryFromNetwork(id) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${this.baseURL}/stories/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch story: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Story Creation - Offline Queue Support
   */

  // Add new story with offline support
  async addStory(description, photoBlob, lat = null, lon = null) {
    console.log('[OfflineFirstAPI] Adding new story');
    
    const storyData = {
      description,
      photoBlob,
      lat,
      lon,
      timestamp: Date.now(),
      tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (this.isOnline) {
      try {
        // Try to add story directly
        const result = await this.addStoryToNetwork(storyData);
        console.log('[OfflineFirstAPI] Story added successfully online');
        
        // Refresh cached stories
        this.refreshCachedStories();
        
        return {
          ...result,
          source: 'network',
          offline: false
        };
      } catch (error) {
        console.warn('[OfflineFirstAPI] Failed to add story online, queuing for later:', error);
        // Fall through to offline queue
      }
    }

    // Add to offline queue
    await storyDB.addToOfflineQueue('addStory', storyData, 'high');
    
    // Show offline notification
    this.showOfflineNotification('Story saved offline. Will sync when online.');
    
    return {
      error: false,
      message: 'Story saved offline',
      source: 'offline',
      offline: true,
      tempId: storyData.tempId
    };
  }

  // Add story to network (internal method)
  async addStoryToNetwork(storyData) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('description', storyData.description);
    formData.append('photo', storyData.photoBlob);
    
    if (storyData.lat && storyData.lon) {
      formData.append('lat', storyData.lat);
      formData.append('lon', storyData.lon);
    }

    const response = await fetch(`${this.baseURL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to add story: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * User Authentication - Cache Support
   */

  // Login with caching
  async login(email, password) {
    console.log('[OfflineFirstAPI] Attempting login');
    
    if (!this.isOnline) {
      // Check for cached credentials (for demo purposes only - not secure)
      const cachedUser = await storyDB.getCachedUserData('currentUser');
      if (cachedUser && cachedUser.email === email) {
        console.log('[OfflineFirstAPI] Using cached login (offline mode)');
        return {
          error: false,
          message: 'Logged in offline (cached)',
          loginResult: cachedUser,
          source: 'cache',
          isOffline: true
        };
      }
      
      return {
        error: true,
        message: 'Cannot login while offline',
        isOffline: true
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      
      if (!result.error && result.loginResult) {
        // Cache user data and token
        localStorage.setItem('token', result.loginResult.token);
        await storyDB.cacheUserData('currentUser', {
          ...result.loginResult,
          email: email
        }, 168); // Cache for 1 week
        
        console.log('[OfflineFirstAPI] Login successful and cached');
      }
      
      return {
        ...result,
        source: 'network'
      };
    } catch (error) {
      console.error('[OfflineFirstAPI] Login failed:', error);
      return {
        error: true,
        message: 'Login failed',
        source: 'network'
      };
    }
  }

  // Register user
  async register(name, email, password) {
    console.log('[OfflineFirstAPI] Attempting registration');
    
    if (!this.isOnline) {
      // Queue registration for later
      await storyDB.addToOfflineQueue('register', { name, email, password }, 'high');
      
      return {
        error: false,
        message: 'Registration queued for when online',
        source: 'offline',
        isOffline: true
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const result = await response.json();
      return {
        ...result,
        source: 'network'
      };
    } catch (error) {
      console.error('[OfflineFirstAPI] Registration failed:', error);
      
      // Queue for retry
      await storyDB.addToOfflineQueue('register', { name, email, password }, 'high');
      
      return {
        error: true,
        message: 'Registration failed, queued for retry',
        source: 'network'
      };
    }
  }

  /**
   * Offline Queue Synchronization
   */

  // Sync offline queue when back online
  async syncOfflineQueue() {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log('[OfflineFirstAPI] Starting offline queue sync...');
    
    try {
      const queueItems = await storyDB.getOfflineQueue();
      
      if (queueItems.length === 0) {
        console.log('[OfflineFirstAPI] No items to sync');
        return;
      }

      console.log(`[OfflineFirstAPI] Syncing ${queueItems.length} queued items`);
      let syncedCount = 0;
      let failedCount = 0;

      for (const item of queueItems) {
        try {
          await this.processQueueItem(item);
          await storyDB.updateOfflineQueueItem(item.id, 'completed');
          syncedCount++;
        } catch (error) {
          console.error('[OfflineFirstAPI] Failed to sync item:', item, error);
          
          if (item.retryCount >= item.maxRetries) {
            await storyDB.updateOfflineQueueItem(item.id, 'failed', error.message);
            failedCount++;
          } else {
            await storyDB.updateOfflineQueueItem(item.id, 'pending', error.message);
          }
        }
      }

      // Clean up completed items
      await storyDB.clearCompletedOfflineQueue();
      
      if (syncedCount > 0) {
        this.showSyncNotification(`${syncedCount} offline actions synced successfully`);
      }
      
      if (failedCount > 0) {
        this.showSyncNotification(`${failedCount} actions failed to sync`, 'error');
      }
      
      console.log(`[OfflineFirstAPI] Sync completed: ${syncedCount} synced, ${failedCount} failed`);
    } catch (error) {
      console.error('[OfflineFirstAPI] Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual queue item
  async processQueueItem(item) {
    switch (item.action) {
      case 'addStory':
        return await this.addStoryToNetwork(item.data);
      
      case 'register':
        const response = await fetch(`${this.baseURL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        if (!response.ok) {
          throw new Error(`Registration failed: ${response.status}`);
        }
        
        return await response.json();
      
      default:
        console.warn('[OfflineFirstAPI] Unknown queue action:', item.action);
        throw new Error(`Unknown action: ${item.action}`);
    }
  }

  /**
   * Cache Management
   */

  // Refresh cached stories from network
  async refreshCachedStories() {
    if (!this.isOnline) return;
    
    try {
      console.log('[OfflineFirstAPI] Refreshing cached stories...');
      const networkData = await this.fetchStoriesFromNetwork(1, 20, 1);
      
      if (networkData && networkData.listStory) {
        await storyDB.addStories(networkData.listStory);
        console.log('[OfflineFirstAPI] Cached stories refreshed');
      }
    } catch (error) {
      console.error('[OfflineFirstAPI] Failed to refresh cached stories:', error);
    }
  }

  // Clear old cached data
  async clearOldCache() {
    try {
      const deletedStories = await storyDB.clearOldStories(7 * 24 * 60 * 60 * 1000); // 7 days
      console.log(`[OfflineFirstAPI] Cleared ${deletedStories} old cached stories`);
    } catch (error) {
      console.error('[OfflineFirstAPI] Failed to clear old cache:', error);
    }
  }

  /**
   * Utility Methods
   */

  // Show network status notification
  showNetworkStatus(status) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 14px;
      z-index: 1002;
      transition: all 0.3s ease;
      ${status === 'online' 
        ? 'background: linear-gradient(135deg, #28a745, #20c997); color: white;' 
        : 'background: linear-gradient(135deg, #ffc107, #fd7e14); color: #333;'
      }
    `;
    
    notification.innerHTML = status === 'online' 
      ? '🌐 Back online - syncing data...' 
      : '📴 You\'re offline - changes will sync later';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }

  // Show offline notification
  showOfflineNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #6c757d, #495057);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 14px;
      z-index: 1001;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    notification.innerHTML = `📴 ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 4000);
  }

  // Show sync notification
  showSyncNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' 
      ? 'linear-gradient(135deg, #dc3545, #c82333)' 
      : 'linear-gradient(135deg, #28a745, #20c997)';
    
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${bgColor};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      font-size: 14px;
      z-index: 1001;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    notification.innerHTML = `${type === 'error' ? '❌' : '✅'} ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }

  // Get offline queue status
  async getOfflineStatus() {
    const queueItems = await storyDB.getOfflineQueue();
    const stats = await storyDB.getStats();
    
    return {
      isOnline: this.isOnline,
      queueLength: queueItems.length,
      syncInProgress: this.syncInProgress,
      cacheStats: stats
    };
  }
}

// Create and export singleton instance
export const offlineAPI = new OfflineFirstAPI();

// Auto-initialize
offlineAPI.init().catch(error => {
  console.error('[OfflineFirstAPI] Failed to initialize:', error);
});