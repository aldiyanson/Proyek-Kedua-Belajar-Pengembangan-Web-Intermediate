/**
 * Image Cache Utility for DiCerita PWA
 * Handles automatic image downloading and caching for offline access
 */

import { storyDB } from '../data/indexed-db.js';

export class ImageCacheManager {
  constructor() {
    this.cachingQueue = new Set(); // Prevent duplicate downloads
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB cache limit
    this.supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  }

  /**
   * Get image with automatic caching
   * Returns cached version if available, downloads and caches if not
   */
  async getImage(url, storyId = null) {
    try {
      console.log(`[ImageCache] Attempting to get image: ${url}`);
      
      // Check if image is already cached
      const cachedBlob = await storyDB.getCachedImage(url);
      if (cachedBlob) {
        console.log(`[ImageCache] Image found in cache for URL: ${url}`);
        return this.createImageURL(cachedBlob);
      }
      
      // If not cached and we're offline, return null
      if (!navigator.onLine) {
        console.log(`[ImageCache] Image not cached and offline. Cannot fetch: ${url}`);
        return null;
      }
      
      // Download and cache the image
      console.log(`[ImageCache] Image not in cache, attempting to download: ${url}`);
      return await this.downloadAndCacheImage(url, storyId);
    } catch (error) {
      console.error(`[ImageCache] Error in getImage for URL: ${url}`, error);
      return null;
    }
  }

  /**
   * Download image and cache it
   */
  async downloadAndCacheImage(url, storyId = null) {
    // Prevent duplicate downloads
    if (this.cachingQueue.has(url)) {
      console.log(`[ImageCache] Image already being downloaded: ${url}`);
      return null;
    }

    this.cachingQueue.add(url);

    try {
      console.log(`[ImageCache] Downloading image: ${url}`);
      
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'default'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Validate image type
      if (!this.isValidImageType(blob.type)) {
        console.warn(`[ImageCache] Unsupported image type: ${blob.type}`);
        return this.createImageURL(blob); // Still return the image but don't cache
      }

      // Check cache size limit
      const canCache = await this.canCacheImage(blob.size);
      if (!canCache) {
        console.warn(`[ImageCache] Cache size limit reached, not caching: ${url}`);
        return this.createImageURL(blob); // Return image without caching
      }

      // Cache the image
      await storyDB.cacheImage(url, blob, storyId);
      console.log(`[ImageCache] Image cached successfully: ${url}`);
      
      return this.createImageURL(blob);
    } catch (error) {
      console.error(`[ImageCache] Failed to download image: ${url}`, error);
      return null;
    } finally {
      this.cachingQueue.delete(url);
    }
  }

  /**
   * Preload images for a story (background caching)
   */
  async preloadStoryImages(story) {
    if (!story || !story.photoUrl) {
      return;
    }

    try {
      console.log(`[ImageCache] Starting preload for story ID: ${story.id}, Image URL: ${story.photoUrl}`);
      
      // Preload main story image
      // Use downloadAndCacheImage directly to ensure caching happens
      await this.downloadAndCacheImage(story.photoUrl, story.id);
      
      console.log(`[ImageCache] Preloading completed for story ID: ${story.id}`);
    } catch (error) {
      console.error(`[ImageCache] Error preloading story images for ID: ${story.id}`, error);
    }
  }

  /**
   * Batch preload images for multiple stories
   */
  async preloadMultipleStories(stories, maxConcurrent = 3) {
    if (!stories || stories.length === 0) {
      console.log('[ImageCache] No stories to batch preload.');
      return;
    }

    console.log(`[ImageCache] Starting batch preloading for ${stories.length} story images...`);
    
    // Process in batches to avoid overwhelming the network
    const results = [];
    for (let i = 0; i < stories.length; i += maxConcurrent) {
      const batch = stories.slice(i, i + maxConcurrent);
      console.log(`[ImageCache] Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(stories.length / maxConcurrent)} with ${batch.length} stories.`);
      
      const promises = batch.map(story => this.preloadStoryImages(story));
      
      try {
        const batchResults = await Promise.allSettled(promises);
        results.push(...batchResults);
      } catch (error) {
        console.error('[ImageCache] Error in batch preloading:', error);
      }
      
      // Small delay between batches
      if (i + maxConcurrent < stories.length) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay slightly
      }
    }
    
    console.log(`[ImageCache] Batch preloading completed. Processed ${results.length} images.`);
  }

  /**
   * Create object URL from blob for display
   */
  createImageURL(blob) {
    try {
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('[ImageCache] Error creating object URL:', error);
      return null;
    }
  }

  /**
   * Revoke object URL to free memory
   */
  revokeImageURL(url) {
    try {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[ImageCache] Error revoking object URL:', error);
    }
  }

  /**
   * Check if image type is supported for caching
   */
  isValidImageType(mimeType) {
    return this.supportedFormats.includes(mimeType);
  }

  /**
   * Check if we can cache an image (size limits)
   */
  async canCacheImage(imageSize) {
    try {
      console.log(`[ImageCache] Checking cache capacity for image size: ${imageSize} bytes`);
      const stats = await storyDB.getImageCacheStats();
      const currentCacheSize = stats.totalSize || 0;
      console.log(`[ImageCache] Current image cache size: ${currentCacheSize} bytes, Max limit: ${this.maxCacheSize} bytes`);
      
      // Check if adding this image would exceed the cache limit
      if (currentCacheSize + imageSize > this.maxCacheSize) {
        console.warn(`[ImageCache] Cache limit potentially exceeded. Current + new: ${currentCacheSize + imageSize} bytes. Attempting cleanup.`);
        // Try to clean up old images first
        const cleanedCount = await this.cleanupOldImages();
        console.log(`[ImageCache] Cleanup removed ${cleanedCount} old images.`);
        
        // Check again after cleanup
        const newStats = await storyDB.getImageCacheStats();
        const newCacheSize = newStats.totalSize || 0;
        console.log(`[ImageCache] Image cache size after cleanup: ${newCacheSize} bytes.`);
        
        const canCacheAfterCleanup = newCacheSize + imageSize <= this.maxCacheSize;
        if (!canCacheAfterCleanup) {
          console.warn(`[ImageCache] Still exceeding cache limit after cleanup. Cannot cache this image.`);
        }
        return canCacheAfterCleanup;
      }
      
      console.log('[ImageCache] Image can be cached within limit.');
      return true;
    } catch (error) {
      console.error('[ImageCache] Error checking cache capacity:', error);
      return true; // Default to allowing cache in case of error
    }
  }

  /**
   * Clean up old cached images
   */
  async cleanupOldImages() {
    try {
      console.log('[ImageCache] Starting cleanup of old cached images...');
      
      // Remove images older than 14 days
      const maxAge = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
      const deletedCount = await storyDB.clearOldImages(maxAge);
      
      console.log(`[ImageCache] Finished cleanup. Removed ${deletedCount} old images.`);
      return deletedCount;
    } catch (error) {
      console.error('[ImageCache] Error cleaning up old images:', error);
      return 0; // Return 0 deleted count on error
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      console.log('[ImageCache] Getting image cache statistics...');
      const stats = await storyDB.getImageCacheStats();
      console.log('[ImageCache] Image cache stats:', stats);
      return stats;
    } catch (error) {
      console.error('[ImageCache] Error getting image cache stats:', error);
      return { count: 0, totalSize: 0, totalSizeMB: '0.00' }; // Return default stats on error
    }
  }

  /**
   * Clear all cached images
   */
  async clearAllCache() {
    try {
      console.log('[ImageCache] Clearing all cached images...');
      await storyDB.clearAllImages();
      console.log('[ImageCache] All cached images cleared successfully.');
      return true;
    } catch (error) {
      console.error('[ImageCache] Error clearing image cache:', error);
      return false; // Return false on error
    }
  }

  /**
   * Check if image is cached
   */
  async isImageCached(url) {
    try {
      console.log(`[ImageCache] Checking if image is cached: ${url}`);
      const isCached = await storyDB.isImageCached(url);
      console.log(`[ImageCache] Image ${url} is cached: ${isCached}`);
      return isCached;
    } catch (error) {
      console.error(`[ImageCache] Error checking if image is cached for URL: ${url}`, error);
      return false; // Return false on error
    }
  }

  /**
   * Enhanced image element creation with caching
   */
  async createCachedImageElement(url, storyId = null, options = {}) {
    console.log(`[ImageCache] Creating cached image element for URL: ${url}`);
    const img = document.createElement('img');
    
    // Set default attributes
    img.alt = options.alt || 'Story image';
    img.loading = options.loading || 'lazy';
    
    // Add loading class for styling
    img.classList.add('image-loading');
    
    try {
      // Get cached or download image
      const imageURL = await this.getImage(url, storyId);
      
      if (imageURL) {
        console.log(`[ImageCache] Image URL obtained for element: ${imageURL}`);
        img.src = imageURL;
        img.classList.remove('image-loading');
        img.classList.add('image-loaded');
        
        // Store original URL for cleanup
        img.dataset.originalUrl = url;
        img.dataset.blobUrl = imageURL; // Store the blob URL for revoking
        
        // Auto-revoke URL when image is removed from DOM
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === img && img.dataset.blobUrl) {
                console.log(`[ImageCache] Revoking blob URL for removed image element: ${img.dataset.blobUrl}`);
                this.revokeImageURL(img.dataset.blobUrl);
                observer.disconnect(); // Stop observing once removed
              }
            });
          });
        });
        
        // Start observing if the element is already in the DOM
        if (img.parentNode) {
          observer.observe(img.parentNode, { childList: true });
        } else {
          // If not in DOM yet, observe when it's added
          const parentObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                if (node === img && img.parentNode) {
                  console.log(`[ImageCache] Image element added to DOM, starting observer for URL: ${url}`);
                  observer.observe(img.parentNode, { childList: true });
                  parentObserver.disconnect(); // Stop observing for parent addition
                }
              });
            });
          });
          parentObserver.observe(document.body, { childList: true, subtree: true });
        }

      } else {
        console.warn(`[ImageCache] Could not get image URL for element: ${url}. Using fallback.`);
        // Fallback for failed image loading
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
        img.classList.remove('image-loading');
        img.classList.add('image-error');
      }
    } catch (error) {
      console.error(`[ImageCache] Error creating cached image element for URL: ${url}`, error);
      img.classList.remove('image-loading');
      img.classList.add('image-error');
    }
    
    return img;
  }

  /**
   * Cleanup memory when component unmounts
   */
  cleanup() {
    // Revoke any remaining object URLs
    this.cachingQueue.clear();
  }
}

// Create and export singleton instance
export const imageCacheManager = new ImageCacheManager();

// Auto-cleanup old images on module load
imageCacheManager.cleanupOldImages().catch(error => {
  console.error('[ImageCache] Auto-cleanup failed:', error);
});

console.log('[ImageCache] Image Cache Manager initialized');