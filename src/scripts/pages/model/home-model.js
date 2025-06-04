import { getData, isLoggedIn, getOfflineStatus, isOnline, createCachedImageElement } from '../../data/api-adapter.js';

export default class HomeModel {
  async fetchStories(page = 1, size = 10) {
    try {
      console.log(`[HomeModel] Fetching stories - page: ${page}, size: ${size}`);
      const result = await getData(page, size);
      
      // Add offline status information
      if (result && typeof result === 'object') {
        const offlineStatus = await getOfflineStatus();
        result.offlineInfo = {
          isOnline: isOnline(),
          source: result.source || 'unknown',
          queueLength: offlineStatus.queueLength || 0,
          isOffline: result.isOffline || false
        };
        
        // Log source information
        console.log(`[HomeModel] Stories loaded from: ${result.source || 'unknown'}`);
        if (!isOnline()) {
          console.log('[HomeModel] Using cached data (offline mode)');
        }
      }
      
      return result;
    } catch (error) {
      console.error('[HomeModel] Error fetching stories:', error);
      
      // Return empty result with offline info
      return {
        stories: [],
        pagination: { page, size, totalPages: 0, hasMore: false },
        error: true,
        message: error.message,
        offlineInfo: {
          isOnline: isOnline(),
          source: 'error',
          queueLength: 0,
          isOffline: !isOnline()
        }
      };
    }
  }

  checkLogin() {
    return isLoggedIn();
  }

  // Get offline status for UI
  async getOfflineStatus() {
    try {
      return await getOfflineStatus();
    } catch (error) {
      console.error('[HomeModel] Error getting offline status:', error);
      return {
        isOnline: navigator.onLine,
        queueLength: 0,
        syncInProgress: false,
        cacheStats: {}
      };
    }
  }

  // Check if app is running in offline mode
  isOfflineMode() {
    return !navigator.onLine;
  }

  // Check if we have cached data available
  async hasCachedData() {
    try {
      const result = await this.fetchStories(1, 1);
      return result && result.stories && result.stories.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Create cached image element for story
  async createStoryImageElement(story, options = {}) {
    if (!story || !story.photoUrl) {
      return null;
    }

    try {
      console.log(`[HomeModel] Creating cached image element for story: ${story.id}`);
      
      const imageOptions = {
        alt: story.description || 'Story image',
        loading: 'lazy',
        ...options
      };
      
      const imageElement = await createCachedImageElement(story.photoUrl, story.id, imageOptions);
      
      // Add story-specific styling classes
      imageElement.classList.add('story-image');
      if (story.id) {
        imageElement.classList.add(`story-image-${story.id}`);
      }
      
      return imageElement;
    } catch (error) {
      console.error('[HomeModel] Error creating cached image element:', error);
      
      // Fallback to regular image element
      const img = document.createElement('img');
      img.src = story.photoUrl;
      img.alt = story.description || 'Story image';
      img.loading = 'lazy';
      img.classList.add('story-image', 'image-fallback');
      
      return img;
    }
  }

  // Batch create cached image elements for multiple stories
  async createMultipleStoryImageElements(stories, options = {}) {
    if (!stories || stories.length === 0) {
      return [];
    }

    console.log(`[HomeModel] Creating cached image elements for ${stories.length} stories`);
    
    const imagePromises = stories.map(story => this.createStoryImageElement(story, options));
    
    try {
      const imageElements = await Promise.allSettled(imagePromises);
      
      return imageElements.map((result, index) => ({
        story: stories[index],
        imageElement: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error('[HomeModel] Error creating multiple cached image elements:', error);
      return [];
    }
  }

  // Check if story images are cached
  async getStoriesWithImageCacheInfo(stories) {
    if (!stories || stories.length === 0) {
      return [];
    }

    try {
      const { isImageCached } = await import('../../data/api-adapter.js');
      
      const storiesWithCacheInfo = await Promise.all(
        stories.map(async (story) => {
          let imageCached = false;
          
          if (story.photoUrl) {
            try {
              // Note: We'll need to add isImageCached to api-adapter
              imageCached = false; // Placeholder - implement if needed
            } catch (error) {
              console.error('[HomeModel] Error checking image cache status:', error);
            }
          }
          
          return {
            ...story,
            imageCache: {
              cached: imageCached,
              url: story.photoUrl
            }
          };
        })
      );
      
      return storiesWithCacheInfo;
    } catch (error) {
      console.error('[HomeModel] Error getting stories with cache info:', error);
      return stories; // Return original stories as fallback
    }
  }
}