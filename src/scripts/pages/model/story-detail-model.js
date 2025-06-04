import { getStoryDetail, isOnline, getCachedImage } from '../../data/api-adapter.js';

export default class StoryDetailModel {
  async fetchStoryDetail(storyId) {
    try {
      console.log(`[StoryDetailModel] Fetching story detail for ID: ${storyId}`);
      console.log('[StoryDetailModel] Online status:', isOnline());
      
      if (!storyId) {
        return {
          error: true,
          message: 'Story ID is required',
          source: 'validation'
        };
      }
      
      const story = await getStoryDetail(storyId);
      
      if (story) {
        // Add fetch info to story object
        const storyWithInfo = {
          ...story,
          fetchInfo: {
            isOnline: isOnline(),
            source: 'unknown', // Will be set by api-adapter
            timestamp: new Date().toISOString(),
            storyId
          }
        };
        
        console.log(`[StoryDetailModel] Story detail loaded successfully`);
        return storyWithInfo;
      } else {
        console.log(`[StoryDetailModel] Story not found: ${storyId}`);
        return {
          error: true,
          message: 'Story not found',
          source: isOnline() ? 'network' : 'cache',
          isOffline: !isOnline()
        };
      }
    } catch (error) {
      console.error('[StoryDetailModel] Error fetching story detail:', error);
      
      return {
        error: true,
        message: error.message || 'Failed to load story details',
        fetchInfo: {
          isOnline: isOnline(),
          source: 'error',
          timestamp: new Date().toISOString(),
          storyId
        }
      };
    }
  }

  // Validate story ID format
  validateStoryId(storyId) {
    if (!storyId) {
      return { isValid: false, error: 'Story ID is required' };
    }
    
    if (typeof storyId !== 'string') {
      return { isValid: false, error: 'Story ID must be a string' };
    }
    
    if (storyId.trim().length === 0) {
      return { isValid: false, error: 'Story ID cannot be empty' };
    }
    
    return { isValid: true };
  }

  // Check if story detail can be loaded
  canLoadStoryDetail() {
    // Always return true since we support offline caching
    return true;
  }

  // Get loading capabilities
  getLoadingCapabilities() {
    return {
      canLoad: true,
      isOnline: isOnline(),
      mode: isOnline() ? 'online' : 'offline',
      supportsOfflineAccess: true
    };
  }

  // Format story data for display
  formatStoryForDisplay(story) {
    if (!story || story.error) {
      return story;
    }
    
    return {
      ...story,
      // Format dates
      formattedCreatedAt: story.createdAt ? this.formatDate(story.createdAt) : 'Unknown date',
      
      // Format description
      formattedDescription: story.description ? story.description.trim() : 'No description',
      
      // Check if location is available
      hasLocation: !!(story.lat && story.lon),
      
      // Format location
      locationString: (story.lat && story.lon) ?
        `${parseFloat(story.lat).toFixed(6)}, ${parseFloat(story.lon).toFixed(6)}` :
        'Location not available'
    };
  }

  // Format date for display
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format for Indonesian locale
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('[StoryDetailModel] Error formatting date:', error);
      return 'Unknown date';
    }
  }

  // Check if story has valid image
  hasValidImage(story) {
    return story && story.photoUrl && typeof story.photoUrl === 'string' && story.photoUrl.trim().length > 0;
  }

  // Get image loading strategy based on network status
  getImageLoadingStrategy() {
    return {
      shouldLoadImages: true, // Always try to load images
      useCache: !isOnline(), // Use cached images when offline
      isOnline: isOnline(),
      strategy: isOnline() ? 'network-first' : 'cache-only'
    };
  }

  // Get cached image URL for story
  async getCachedImageURL(story) {
    if (!story || !story.photoUrl) {
      return null;
    }

    try {
      console.log(`[StoryDetailModel] Getting cached image for story: ${story.id}`);
      const cachedImageURL = await getCachedImage(story.photoUrl, story.id);
      
      if (cachedImageURL) {
        console.log(`[StoryDetailModel] Cached image found for story: ${story.id}`);
        return cachedImageURL;
      } else {
        console.log(`[StoryDetailModel] No cached image for story: ${story.id}`);
        return story.photoUrl; // Return original URL as fallback
      }
    } catch (error) {
      console.error('[StoryDetailModel] Error getting cached image:', error);
      return story.photoUrl; // Return original URL as fallback
    }
  }

  // Enhanced format story for display with cached images
  async formatStoryForDisplayWithCache(story) {
    if (!story || story.error) {
      return story;
    }

    const formattedStory = this.formatStoryForDisplay(story);
    
    // Get cached image URL if available
    const cachedImageURL = await this.getCachedImageURL(story);
    
    return {
      ...formattedStory,
      // Add cached image information
      cachedImageURL,
      hasCache: cachedImageURL !== story.photoUrl,
      imageLoadingStrategy: this.getImageLoadingStrategy()
    };
  }
}