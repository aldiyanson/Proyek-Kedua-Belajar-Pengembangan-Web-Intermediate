/**
 * IndexedDB Database Layer for DiCerita PWA
 * Provides offline-first data storage and management
 */

export class StoryDatabase {
  constructor() {
    this.dbName = 'DiCeritaDB';
    this.version = 1;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the IndexedDB database
   * Creates object stores for stories, offline queue, and user cache
   */
  async init() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      console.log('[IndexedDB] Initializing database...');
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('[IndexedDB] Database opened successfully');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        console.log('[IndexedDB] Database upgrade needed, creating stores...');
        const db = event.target.result;
        
        // Stories store - for caching API stories
        if (!db.objectStoreNames.contains('stories')) {
          const storyStore = db.createObjectStore('stories', { keyPath: 'id' });
          storyStore.createIndex('createdAt', 'createdAt', { unique: false });
          storyStore.createIndex('userId', 'userId', { unique: false });
          storyStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('[IndexedDB] Stories store created');
        }
        
        // Offline queue store - for actions performed while offline
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('action', 'action', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
          console.log('[IndexedDB] Offline queue store created');
        }
        
        // User cache store - for user profiles and auth data
        if (!db.objectStoreNames.contains('userCache')) {
          const userStore = db.createObjectStore('userCache', { keyPath: 'key' });
          userStore.createIndex('expiry', 'expiry', { unique: false });
          console.log('[IndexedDB] User cache store created');
        }

        // App settings store - for PWA settings and preferences
        if (!db.objectStoreNames.contains('appSettings')) {
          const settingsStore = db.createObjectStore('appSettings', { keyPath: 'key' });
          console.log('[IndexedDB] App settings store created');
        }

        // Image cache store - for offline image storage (stores actual image blobs)
        if (!db.objectStoreNames.contains('imageCache')) {
          const imageStore = db.createObjectStore('imageCache', { keyPath: 'url' });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
          imageStore.createIndex('size', 'size', { unique: false });
          imageStore.createIndex('storyId', 'storyId', { unique: false });
          imageStore.createIndex('type', 'type', { unique: false });
          console.log('[IndexedDB] Image cache store created - stores binary image data');
        }
      };
    });
  }

  /**
   * Story Management Methods
   */

  // Add single story to cache
  async addStory(story) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      
      // Add timestamp for cache management
      const storyWithTimestamp = {
        ...story,
        timestamp: Date.now(),
        cached: true
      };
      
      const result = await this.promiseFromRequest(store.put(storyWithTimestamp));
      console.log('[IndexedDB] Story added to cache:', story.id);
      return result;
    } catch (error) {
      console.error('[IndexedDB] Failed to add story:', error);
      throw error;
    }
  }

  // Add multiple stories to cache (bulk operation)
  async addStories(stories) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      const timestamp = Date.now();
      
      const promises = stories.map(story => {
        const storyWithTimestamp = {
          ...story,
          timestamp,
          cached: true
        };
        return this.promiseFromRequest(store.put(storyWithTimestamp));
      });
      
      await Promise.all(promises);
      console.log(`[IndexedDB] ${stories.length} stories added to cache`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to add stories:', error);
      throw error;
    }
  }

  // Get stories from cache with pagination
  async getStories(limit = 10, offset = 0) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const index = store.index('createdAt');
      
      const stories = [];
      let cursor = await this.promiseFromRequest(index.openCursor(null, 'prev'));
      let count = 0;
      let skipped = 0;
      
      while (cursor && stories.length < limit) {
        if (skipped >= offset) {
          stories.push(cursor.value);
        } else {
          skipped++;
        }
        cursor = await this.promiseFromRequest(cursor.continue());
      }
      
      console.log(`[IndexedDB] Retrieved ${stories.length} stories from cache`);
      return stories;
    } catch (error) {
      console.error('[IndexedDB] Failed to get stories:', error);
      return [];
    }
  }

  // Get single story by ID
  async getStoryById(id) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const result = await this.promiseFromRequest(store.get(id));
      
      if (result) {
        console.log('[IndexedDB] Story found in cache:', id);
      }
      return result;
    } catch (error) {
      console.error('[IndexedDB] Failed to get story:', error);
      return null;
    }
  }

  // Update story in cache
  async updateStory(story) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      
      const updatedStory = {
        ...story,
        timestamp: Date.now(),
        cached: true
      };
      
      const result = await this.promiseFromRequest(store.put(updatedStory));
      console.log('[IndexedDB] Story updated in cache:', story.id);
      return result;
    } catch (error) {
      console.error('[IndexedDB] Failed to update story:', error);
      throw error;
    }
  }

  // Delete story from cache
  async deleteStory(id) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      const result = await this.promiseFromRequest(store.delete(id));
      console.log('[IndexedDB] Story deleted from cache:', id);
      return result;
    } catch (error) {
      console.error('[IndexedDB] Failed to delete story:', error);
      throw error;
    }
  }

  // Clear old cached stories (cache management)
  async clearOldStories(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    await this.ensureInitialized();
    
    try {
      const cutoffTime = Date.now() - maxAge;
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      const index = store.index('timestamp');
      
      let cursor = await this.promiseFromRequest(index.openCursor(IDBKeyRange.upperBound(cutoffTime)));
      let deletedCount = 0;
      
      while (cursor) {
        await this.promiseFromRequest(cursor.delete());
        deletedCount++;
        cursor = await this.promiseFromRequest(cursor.continue());
      }
      
      console.log(`[IndexedDB] Cleared ${deletedCount} old stories from cache`);
      return deletedCount;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear old stories:', error);
      throw error;
    }
  }

  /**
   * Offline Queue Management Methods
   */

  // Add action to offline queue
  async addToOfflineQueue(action, data, priority = 'normal') {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      
      const queueItem = {
        action,
        data,
        priority,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0,
        maxRetries: 3
      };
      
      const result = await this.promiseFromRequest(store.add(queueItem));
      console.log('[IndexedDB] Action added to offline queue:', action);
      return result;
    } catch (error) {
      console.error('[IndexedDB] Failed to add to offline queue:', error);
      throw error;
    }
  }

  // Get pending items from offline queue
  async getOfflineQueue() {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const index = store.index('status');
      
      const items = [];
      let cursor = await this.promiseFromRequest(index.openCursor('pending'));
      
      while (cursor) {
        items.push(cursor.value);
        cursor = await this.promiseFromRequest(cursor.continue());
      }
      
      // Sort by priority and timestamp
      items.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.timestamp - b.timestamp;
      });
      
      console.log(`[IndexedDB] Retrieved ${items.length} items from offline queue`);
      return items;
    } catch (error) {
      console.error('[IndexedDB] Failed to get offline queue:', error);
      return [];
    }
  }

  // Update offline queue item status
  async updateOfflineQueueItem(id, status, error = null) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      
      const item = await this.promiseFromRequest(store.get(id));
      if (item) {
        item.status = status;
        item.lastAttempt = Date.now();
        if (error) {
          item.error = error;
          item.retryCount = (item.retryCount || 0) + 1;
        }
        
        await this.promiseFromRequest(store.put(item));
        console.log(`[IndexedDB] Offline queue item ${id} updated to ${status}`);
      }
      
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to update offline queue item:', error);
      throw error;
    }
  }

  // Remove completed items from offline queue
  async clearCompletedOfflineQueue() {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const index = store.index('status');
      
      let cursor = await this.promiseFromRequest(index.openCursor('completed'));
      let deletedCount = 0;
      
      while (cursor) {
        await this.promiseFromRequest(cursor.delete());
        deletedCount++;
        cursor = await this.promiseFromRequest(cursor.continue());
      }
      
      console.log(`[IndexedDB] Cleared ${deletedCount} completed items from offline queue`);
      return deletedCount;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear completed offline queue:', error);
      throw error;
    }
  }

  /**
   * User Cache Management Methods
   */

  // Cache user data with expiry
  async cacheUserData(key, data, expiryHours = 24) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['userCache'], 'readwrite');
      const store = transaction.objectStore('userCache');
      
      const cacheItem = {
        key,
        data,
        timestamp: Date.now(),
        expiry: Date.now() + (expiryHours * 60 * 60 * 1000)
      };
      
      await this.promiseFromRequest(store.put(cacheItem));
      console.log(`[IndexedDB] User data cached for ${key}`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to cache user data:', error);
      throw error;
    }
  }

  // Get cached user data
  async getCachedUserData(key) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['userCache'], 'readonly');
      const store = transaction.objectStore('userCache');
      const result = await this.promiseFromRequest(store.get(key));
      
      if (result && result.expiry > Date.now()) {
        console.log(`[IndexedDB] User data found in cache: ${key}`);
        return result.data;
      } else if (result) {
        // Data expired, remove it
        await this.removeCachedUserData(key);
        console.log(`[IndexedDB] Expired user data removed: ${key}`);
      }
      
      return null;
    } catch (error) {
      console.error('[IndexedDB] Failed to get cached user data:', error);
      return null;
    }
  }

  // Remove cached user data
  async removeCachedUserData(key) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['userCache'], 'readwrite');
      const store = transaction.objectStore('userCache');
      await this.promiseFromRequest(store.delete(key));
      console.log(`[IndexedDB] User data removed from cache: ${key}`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to remove cached user data:', error);
      throw error;
    }
  }

  /**
   * Image Cache Management Methods
   */

  // Cache image data
  async cacheImage(url, blob, storyId = null) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['imageCache'], 'readwrite');
      const store = transaction.objectStore('imageCache');
      
      const imageData = {
        url,
        blob,
        storyId,
        timestamp: Date.now(),
        size: blob.size,
        type: blob.type
      };
      
      await this.promiseFromRequest(store.put(imageData));
      console.log(`[IndexedDB] Image cached: ${url}`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to cache image:', error);
      throw error;
    }
  }

  // Get cached image
  async getCachedImage(url) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['imageCache'], 'readonly');
      const store = transaction.objectStore('imageCache');
      const result = await this.promiseFromRequest(store.get(url));
      
      if (result) {
        console.log(`[IndexedDB] Image found in cache: ${url}`);
        return result.blob;
      }
      
      return null;
    } catch (error) {
      console.error('[IndexedDB] Failed to get cached image:', error);
      return null;
    }
  }

  // Check if image is cached
  async isImageCached(url) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['imageCache'], 'readonly');
      const store = transaction.objectStore('imageCache');
      const result = await this.promiseFromRequest(store.get(url));
      
      return !!result;
    } catch (error) {
      console.error('[IndexedDB] Failed to check image cache:', error);
      return false;
    }
  }

  // Get all cached images for a story
  async getCachedImagesForStory(storyId) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['imageCache'], 'readonly');
      const store = transaction.objectStore('imageCache');
      const index = store.index('storyId');
      
      const images = [];
      let cursor = await this.promiseFromRequest(index.openCursor(storyId));
      
      while (cursor) {
        images.push({
          url: cursor.value.url,
          blob: cursor.value.blob,
          size: cursor.value.size,
          type: cursor.value.type,
          timestamp: cursor.value.timestamp
        });
        cursor = await this.promiseFromRequest(cursor.continue());
      }
      
      console.log(`[IndexedDB] Found ${images.length} cached images for story ${storyId}`);
      return images;
    } catch (error) {
      console.error('[IndexedDB] Failed to get cached images for story:', error);
      return [];
    }
  }

  // Clear old cached images (cache management)
  async clearOldImages(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
    await this.ensureInitialized();
    
    try {
      const cutoffTime = Date.now() - maxAge;
      const transaction = this.db.transaction(['imageCache'], 'readwrite');
      const store = transaction.objectStore('imageCache');
      const index = store.index('timestamp');
      
      let cursor = await this.promiseFromRequest(index.openCursor(IDBKeyRange.upperBound(cutoffTime)));
      let deletedCount = 0;
      
      while (cursor) {
        await this.promiseFromRequest(cursor.delete());
        deletedCount++;
        cursor = await this.promiseFromRequest(cursor.continue());
      }
      
      console.log(`[IndexedDB] Cleared ${deletedCount} old images from cache`);
      return deletedCount;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear old images:', error);
      throw error;
    }
  }

  // Get image cache statistics
  async getImageCacheStats() {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['imageCache'], 'readonly');
      const store = transaction.objectStore('imageCache');
      
      const count = await this.promiseFromRequest(store.count());
      
      // Calculate total size
      let totalSize = 0;
      let cursor = await this.promiseFromRequest(store.openCursor());
      
      while (cursor) {
        totalSize += cursor.value.size || 0;
        cursor = await this.promiseFromRequest(cursor.continue());
      }
      
      const stats = {
        count,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      };
      
      console.log('[IndexedDB] Image cache stats:', stats);
      return stats;
    } catch (error) {
      console.error('[IndexedDB] Failed to get image cache stats:', error);
      return { count: 0, totalSize: 0, totalSizeMB: '0.00' };
    }
  }

  // Clear all cached images
  async clearAllImages() {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['imageCache'], 'readwrite');
      const store = transaction.objectStore('imageCache');
      
      await this.promiseFromRequest(store.clear());
      console.log('[IndexedDB] All cached images cleared');
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear all cached images:', error);
      throw error;
    }
  }

  /**
   * App Settings Management
   */

  // Save app setting
  async saveSetting(key, value) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['appSettings'], 'readwrite');
      const store = transaction.objectStore('appSettings');
      
      await this.promiseFromRequest(store.put({ key, value, timestamp: Date.now() }));
      console.log(`[IndexedDB] Setting saved: ${key}`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to save setting:', error);
      throw error;
    }
  }

  // Get app setting
  async getSetting(key, defaultValue = null) {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db.transaction(['appSettings'], 'readonly');
      const store = transaction.objectStore('appSettings');
      const result = await this.promiseFromRequest(store.get(key));
      
      return result ? result.value : defaultValue;
    } catch (error) {
      console.error('[IndexedDB] Failed to get setting:', error);
      return defaultValue;
    }
  }

  /**
   * Utility Methods
   */

  // Ensure database is initialized
  async ensureInitialized() {
    if (!this.isInitialized || !this.db) {
      await this.init();
    }
  }

  // Convert IndexedDB request to Promise
  promiseFromRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get database statistics
  async getStats() {
    await this.ensureInitialized();
    
    try {
      const stats = {};
      const storeNames = ['stories', 'offlineQueue', 'userCache', 'appSettings', 'imageCache'];
      
      for (const storeName of storeNames) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const count = await this.promiseFromRequest(store.count());
        stats[storeName] = count;
      }
      
      // Get image cache size info
      const imageCacheStats = await this.getImageCacheStats();
      stats.imageCacheSize = imageCacheStats.totalSizeMB;
      
      console.log('[IndexedDB] Database stats:', stats);
      return stats;
    } catch (error) {
      console.error('[IndexedDB] Failed to get stats:', error);
      return {};
    }
  }

  // Clear all data (for debugging/reset)
  async clearAllData() {
    await this.ensureInitialized();
    
    try {
      const storeNames = ['stories', 'offlineQueue', 'userCache', 'appSettings', 'imageCache'];
      const transaction = this.db.transaction(storeNames, 'readwrite');
      
      for (const storeName of storeNames) {
        const store = transaction.objectStore(storeName);
        await this.promiseFromRequest(store.clear());
      }
      
      console.log('[IndexedDB] All data cleared');
      return true;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear all data:', error);
      throw error;
    }
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[IndexedDB] Database connection closed');
    }
  }
}

// Create singleton instance
export const storyDB = new StoryDatabase();

// Initialize database when module is imported
storyDB.init().catch(error => {
  console.error('[IndexedDB] Failed to initialize database:', error);
});