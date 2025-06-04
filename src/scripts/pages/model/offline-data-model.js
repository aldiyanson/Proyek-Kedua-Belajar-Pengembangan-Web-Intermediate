import { storyDB } from '../../data/indexed-db.js';

export default class OfflineDataModel {
  constructor() {
    this.db = storyDB;
  }

  /**
   * Save sample data to IndexedDB
   */
  async saveSampleData(sampleStories) {
    try {
      await this.db.ensureInitialized();
      
      // Add sample stories
      for (const story of sampleStories) {
        await this.db.addStory(story);
      }

      // Add sample offline queue items
      await this.db.addToOfflineQueue('create_story', {
        title: 'Demo Story Offline',
        description: 'Cerita yang dibuat saat offline'
      }, 'normal');

      await this.db.addToOfflineQueue('update_story', {
        id: 'demo_story_1',
        description: 'Update cerita offline'
      }, 'high');

      // Add sample user cache
      await this.db.cacheUserData('demo_profile', {
        id: 'demo_user',
        name: 'Demo User',
        email: 'demo@example.com'
      }, 24);

      // Add sample app settings
      await this.db.saveSetting('offline_mode', true);
      await this.db.saveSetting('demo_setting', 'Demo Value');

      console.log('[OfflineDataModel] Sample data saved successfully');
      return { success: true, message: 'Data sample berhasil disimpan!' };
    } catch (error) {
      console.error('[OfflineDataModel] Failed to save sample data:', error);
      return { success: false, message: 'Gagal menyimpan data sample: ' + error.message };
    }
  }

  /**
   * Get all offline data from IndexedDB
   */
  async getAllOfflineData() {
    try {
      await this.db.ensureInitialized();

      const data = {
        stories: [],
        offlineQueue: [],
        userCache: [],
        appSettings: []
      };

      // Get stories
      data.stories = await this.db.getStories(50, 0);

      // Get offline queue
      data.offlineQueue = await this.db.getOfflineQueue();

      // Get user cache - we need to get all manually since there's no getAll method
      const transaction = this.db.db.transaction(['userCache'], 'readonly');
      const userStore = transaction.objectStore('userCache');
      const userCacheRequest = userStore.getAll();
      
      data.userCache = await new Promise((resolve, reject) => {
        userCacheRequest.onsuccess = () => resolve(userCacheRequest.result);
        userCacheRequest.onerror = () => reject(userCacheRequest.error);
      });

      // Get app settings
      const settingsTransaction = this.db.db.transaction(['appSettings'], 'readonly');
      const settingsStore = settingsTransaction.objectStore('appSettings');
      const settingsRequest = settingsStore.getAll();
      
      data.appSettings = await new Promise((resolve, reject) => {
        settingsRequest.onsuccess = () => resolve(settingsRequest.result);
        settingsRequest.onerror = () => reject(settingsRequest.error);
      });

      console.log('[OfflineDataModel] Offline data retrieved successfully');
      return { success: true, data };
    } catch (error) {
      console.error('[OfflineDataModel] Failed to get offline data:', error);
      return { success: false, message: 'Gagal mengambil data offline: ' + error.message };
    }
  }

  /**
   * Delete all offline data
   */
  async deleteAllOfflineData() {
    try {
      await this.db.ensureInitialized();
      await this.db.clearAllData();
      
      console.log('[OfflineDataModel] All offline data deleted successfully');
      return { success: true, message: 'Semua data offline berhasil dihapus!' };
    } catch (error) {
      console.error('[OfflineDataModel] Failed to delete offline data:', error);
      return { success: false, message: 'Gagal menghapus data offline: ' + error.message };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      await this.db.ensureInitialized();
      const stats = await this.db.getStats();
      
      console.log('[OfflineDataModel] Database stats retrieved successfully');
      return { success: true, stats };
    } catch (error) {
      console.error('[OfflineDataModel] Failed to get database stats:', error);
      return { success: false, message: 'Gagal mengambil statistik database: ' + error.message };
    }
  }

  /**
   * Export data as JSON
   */
  async exportData() {
    try {
      const result = await this.getAllOfflineData();
      if (!result.success) {
        return result;
      }

      const exportData = {
        exported_at: new Date().toISOString(),
        app_name: 'DiCerita PWA',
        version: '1.0.0',
        data: result.data
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dicerita-offline-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('[OfflineDataModel] Data exported successfully');
      return { success: true, message: 'Data berhasil diekspor!' };
    } catch (error) {
      console.error('[OfflineDataModel] Failed to export data:', error);
      return { success: false, message: 'Gagal mengekspor data: ' + error.message };
    }
  }

  /**
   * Clear specific data type
   */
  async clearDataType(dataType) {
    try {
      await this.db.ensureInitialized();
      
      switch (dataType) {
        case 'stories':
          // Clear all stories
          const stories = await this.db.getStories(1000, 0);
          for (const story of stories) {
            await this.db.deleteStory(story.id);
          }
          break;
          
        case 'offlineQueue':
          await this.db.clearCompletedOfflineQueue();
          // Clear pending items too
          const pendingItems = await this.db.getOfflineQueue();
          for (const item of pendingItems) {
            await this.db.updateOfflineQueueItem(item.id, 'cancelled');
          }
          break;
          
        case 'userCache':
          const transaction = this.db.db.transaction(['userCache'], 'readwrite');
          const store = transaction.objectStore('userCache');
          await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          break;
          
        case 'imageCache':
          await this.db.clearAllImages();
          break;
          
        default:
          throw new Error('Unknown data type: ' + dataType);
      }

      console.log(`[OfflineDataModel] ${dataType} cleared successfully`);
      return { success: true, message: `Data ${dataType} berhasil dihapus!` };
    } catch (error) {
      console.error(`[OfflineDataModel] Failed to clear ${dataType}:`, error);
      return { success: false, message: `Gagal menghapus ${dataType}: ` + error.message };
    }
  }

  /**
   * Get cache size and performance info
   */
  async getCacheInfo() {
    try {
      await this.db.ensureInitialized();
      
      const stats = await this.db.getStats();
      const imageCacheStats = await this.db.getImageCacheStats();
      
      // Calculate estimated storage usage
      const estimatedSize = {
        stories: (stats.stories || 0) * 2, // ~2KB per story estimate
        offlineQueue: (stats.offlineQueue || 0) * 1, // ~1KB per queue item
        userCache: (stats.userCache || 0) * 0.5, // ~0.5KB per cache item
        appSettings: (stats.appSettings || 0) * 0.1, // ~0.1KB per setting
        images: parseFloat(imageCacheStats.totalSizeMB || 0)
      };

      const totalSizeMB = Object.values(estimatedSize).reduce((a, b) => a + b, 0);

      return {
        success: true,
        info: {
          ...stats,
          imageCacheStats,
          estimatedSize,
          totalSizeMB: totalSizeMB.toFixed(2)
        }
      };
    } catch (error) {
      console.error('[OfflineDataModel] Failed to get cache info:', error);
      return { success: false, message: 'Gagal mengambil info cache: ' + error.message };
    }
  }
}