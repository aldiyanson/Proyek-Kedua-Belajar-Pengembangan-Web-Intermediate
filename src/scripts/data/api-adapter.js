/**
 * API Adapter Layer for DiCerita PWA
 * Bridges existing API functions with new offline-first functionality
 * Maintains backward compatibility while adding PWA features
 */

import { offlineAPI } from './offline-first-api.js';
import * as originalAPI from './api.js';
import { imageCacheManager } from '../utils/image-cache.js';

/**
 * Enhanced API functions that use offline-first approach
 * Falls back to original API if offline functionality fails
 */

// Auth functions with offline support
export async function loginUser(email, password, isDemo = false) {
  console.log('[API Adapter] Login attempt with offline support');
  
  try {
    // Try offline-first login
    if (!isDemo) {
      const offlineResult = await offlineAPI.login(email, password);
      
      if (!offlineResult.error) {
        // Update localStorage to match original API format
        if (offlineResult.loginResult) {
          localStorage.setItem('auth', JSON.stringify({
            token: offlineResult.loginResult.token,
            name: offlineResult.loginResult.name,
            userId: offlineResult.loginResult.userId,
          }));
        }
        
        return offlineResult;
      }
      
      // If offline API fails and we're online, fall back to original
      if (navigator.onLine) {
        console.log('[API Adapter] Falling back to original login API');
        return await originalAPI.loginUser(email, password, isDemo);
      }
      
      return offlineResult;
    }
    
    // For demo login, use original API
    return await originalAPI.loginUser(email, password, isDemo);
  } catch (error) {
    console.error('[API Adapter] Login error:', error);
    
    // Fallback to original API
    return await originalAPI.loginUser(email, password, isDemo);
  }
}

export async function registerUser(name, email, password) {
  console.log('[API Adapter] Register attempt with offline support');
  
  try {
    // Try offline-first registration
    const offlineResult = await offlineAPI.register(name, email, password);
    
    if (!offlineResult.error || offlineResult.isOffline) {
      return offlineResult;
    }
    
    // If offline API fails and we're online, fall back to original
    if (navigator.onLine) {
      console.log('[API Adapter] Falling back to original register API');
      return await originalAPI.registerUser(name, email, password);
    }
    
    return offlineResult;
  } catch (error) {
    console.error('[API Adapter] Register error:', error);
    
    // Fallback to original API
    return await originalAPI.registerUser(name, email, password);
  }
}

// Story functions with offline support
export async function getData(page = 1, size = 10, needLocation = 1) {
  console.log('[API Adapter] Getting stories with offline support');
  
  try {
    // Try offline-first approach
    const offlineResult = await offlineAPI.getStories(page, size, needLocation);
    
    if (!offlineResult.error && offlineResult.listStory) {
      // Transform to match original API format
      return {
        stories: offlineResult.listStory.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          photoUrl: item.photoUrl,
          createdAt: item.createdAt,
          lat: item.lat,
          lng: item.lon || item.lng
        })),
        pagination: {
          page: offlineResult.page || page,
          size: offlineResult.size || size,
          totalPages: Math.ceil((offlineResult.totalItems || offlineResult.listStory.length) / size),
          hasMore: offlineResult.listStory.length === size
        },
        source: offlineResult.source,
        isOffline: offlineResult.isOffline
      };
    }
    
    // If offline API fails and we're online, fall back to original
    if (navigator.onLine) {
      console.log('[API Adapter] Falling back to original getData API');
      const originalResult = await originalAPI.getData(page, size, needLocation);
      
      // Add source information
      if (originalResult && originalResult.stories) {
        originalResult.source = 'network';
        originalResult.isOffline = false;
      }
      
      return originalResult;
    }
    
    // Return empty result for offline
    return { 
      stories: [], 
      pagination: { page, size, totalPages: 0, hasMore: false },
      source: 'cache',
      isOffline: true,
      error: true,
      message: 'No data available offline'
    };
  } catch (error) {
    console.error('[API Adapter] getData error:', error);
    
    // Fallback to original API
    return await originalAPI.getData(page, size, needLocation);
  }
}

export async function addStory(description, photoBlob, lat, lon) {
  console.log('[API Adapter] Adding story with offline support');
  
  try {
    // Try offline-first approach
    const offlineResult = await offlineAPI.addStory(description, photoBlob, lat, lon);
    
    if (!offlineResult.error) {
      return offlineResult;
    }
    
    // If offline API fails and we're online, fall back to original
    if (navigator.onLine) {
      console.log('[API Adapter] Falling back to original addStory API');
      const originalResult = await originalAPI.addStory(description, photoBlob, lat, lon);
      
      // Add source information
      if (originalResult && !originalResult.error) {
        originalResult.source = 'network';
        originalResult.offline = false;
      }
      
      return originalResult;
    }
    
    return offlineResult;
  } catch (error) {
    console.error('[API Adapter] addStory error:', error);
    
    // Fallback to original API
    return await originalAPI.addStory(description, photoBlob, lat, lon);
  }
}

export async function getStoryDetail(id) {
  console.log('[API Adapter] Getting story detail with offline support');
  
  try {
    // Try offline-first approach
    const offlineResult = await offlineAPI.getStoryById(id);
    
    if (!offlineResult.error && offlineResult.story) {
      return offlineResult.story;
    }
    
    // If offline API fails and we're online, fall back to original
    if (navigator.onLine) {
      console.log('[API Adapter] Falling back to original getStoryDetail API');
      return await originalAPI.getStoryDetail(id);
    }
    
    return null;
  } catch (error) {
    console.error('[API Adapter] getStoryDetail error:', error);
    
    // Fallback to original API
    return await originalAPI.getStoryDetail(id);
  }
}

// Utility functions - pass through to original API
export const getToken = originalAPI.getToken;
export const isLoggedIn = originalAPI.isLoggedIn;
export const logout = originalAPI.logout;

// Push notification functions - pass through to original API
export const VAPID_PUBLIC_KEY = originalAPI.VAPID_PUBLIC_KEY;
export const STORY_NOTIFICATION_SCHEMA = originalAPI.STORY_NOTIFICATION_SCHEMA;
export const subscribeWebPush = originalAPI.subscribeWebPush;
export const unsubscribeWebPush = originalAPI.unsubscribeWebPush;
export const initializePushNotifications = originalAPI.initializePushNotifications;
export const testPushNotification = originalAPI.testPushNotification;

// PWA-specific functions
export async function getOfflineStatus() {
  try {
    return await offlineAPI.getOfflineStatus();
  } catch (error) {
    console.error('[API Adapter] Error getting offline status:', error);
    return {
      isOnline: navigator.onLine,
      queueLength: 0,
      syncInProgress: false,
      cacheStats: {}
    };
  }
}

export async function syncOfflineData() {
  try {
    return await offlineAPI.syncOfflineQueue();
  } catch (error) {
    console.error('[API Adapter] Error syncing offline data:', error);
    return false;
  }
}

export async function clearOfflineCache() {
  try {
    await offlineAPI.clearOldCache();
    return true;
  } catch (error) {
    console.error('[API Adapter] Error clearing offline cache:', error);
    return false;
  }
}

export async function refreshCache() {
  try {
    await offlineAPI.refreshCachedStories();
    return true;
  } catch (error) {
    console.error('[API Adapter] Error refreshing cache:', error);
    return false;
  }
}

// Enhanced logout with cache clearing
export function logoutWithCacheClean() {
  try {
    // Clear auth data
    originalAPI.logout();
    
    // Clear user-specific cached data
    if (offlineAPI && offlineAPI.storyDB) {
      offlineAPI.storyDB.removeCachedUserData('currentUser').catch(console.error);
    }
    
    console.log('[API Adapter] Logout completed with cache cleanup');
    return true;
  } catch (error) {
    console.error('[API Adapter] Error during logout:', error);
    return false;
  }
}

// Network status helpers
export function isOnline() {
  return navigator.onLine;
}

export function isOffline() {
  return !navigator.onLine;
}

// Cache management helpers
export async function getCacheStats() {
  try {
    if (offlineAPI && offlineAPI.storyDB) {
      return await offlineAPI.storyDB.getStats();
    }
    return {};
  } catch (error) {
    console.error('[API Adapter] Error getting cache stats:', error);
    return {};
  }
}

export async function clearAllCache() {
  try {
    if (offlineAPI && offlineAPI.storyDB) {
      await offlineAPI.storyDB.clearAllData();
      console.log('[API Adapter] All cache cleared');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[API Adapter] Error clearing all cache:', error);
    return false;
  }
}

// Initialize offline functionality
export async function initializeOfflineSupport() {
  try {
    console.log('[API Adapter] Initializing offline support...');
    
    // Initialize offline API
    await offlineAPI.init();
    
    // Setup periodic cache cleanup (once per hour)
    setInterval(() => {
      if (navigator.onLine) {
        offlineAPI.clearOldCache().catch(console.error);
      }
    }, 60 * 60 * 1000);
    
    console.log('[API Adapter] Offline support initialized successfully');
    return true;
  } catch (error) {
    console.error('[API Adapter] Failed to initialize offline support:', error);
    return false;
  }
}

// PWA Installation helpers
export function isPWAInstalled() {
  return window.navigator.standalone || 
         window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches;
}

export function getPWADisplayMode() {
  if (window.navigator.standalone) {
    return 'standalone-ios';
  }
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  
  return 'browser';
}

// Enhanced error handling
export function handleAPIError(error, context = 'API call') {
  console.error(`[API Adapter] ${context} error:`, error);
  
  const errorInfo = {
    message: error.message || 'Unknown error',
    context,
    isOnline: navigator.onLine,
    timestamp: new Date().toISOString()
  };
  
  // Store error for debugging
  try {
    const errors = JSON.parse(localStorage.getItem('pwa_errors') || '[]');
    errors.push(errorInfo);
    
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }
    
    localStorage.setItem('pwa_errors', JSON.stringify(errors));
  } catch (storageError) {
    console.error('[API Adapter] Failed to store error info:', storageError);
  }
  
  return errorInfo;
}

export function getStoredErrors() {
  try {
    return JSON.parse(localStorage.getItem('pwa_errors') || '[]');
  } catch (error) {
    console.error('[API Adapter] Failed to get stored errors:', error);
    return [];
  }
}

export function clearStoredErrors() {
  try {
    localStorage.removeItem('pwa_errors');
    return true;
  } catch (error) {
    console.error('[API Adapter] Failed to clear stored errors:', error);
    return false;
  }
}

// Image cache management functions
export async function getCachedImage(url, storyId = null) {
  try {
    return await imageCacheManager.getImage(url, storyId);
  } catch (error) {
    console.error('[API Adapter] Error getting cached image:', error);
    return null;
  }
}

export async function createCachedImageElement(url, storyId = null, options = {}) {
  try {
    return await imageCacheManager.createCachedImageElement(url, storyId, options);
  } catch (error) {
    console.error('[API Adapter] Error creating cached image element:', error);
    
    // Fallback to regular image element
    const img = document.createElement('img');
    img.src = url;
    img.alt = options.alt || 'Story image';
    img.loading = options.loading || 'lazy';
    return img;
  }
}

export async function preloadStoryImages(story) {
  try {
    return await imageCacheManager.preloadStoryImages(story);
  } catch (error) {
    console.error('[API Adapter] Error preloading story images:', error);
    return false;
  }
}

export async function getImageCacheStats() {
  try {
    return await imageCacheManager.getCacheStats();
  } catch (error) {
    console.error('[API Adapter] Error getting image cache stats:', error);
    return { count: 0, totalSize: 0, totalSizeMB: '0.00' };
  }
}

export async function clearImageCache() {
  try {
    return await imageCacheManager.clearAllCache();
  } catch (error) {
    console.error('[API Adapter] Error clearing image cache:', error);
    return false;
  }
}

export function revokeImageURL(url) {
  try {
    imageCacheManager.revokeImageURL(url);
    return true;
  } catch (error) {
    console.error('[API Adapter] Error revoking image URL:', error);
    return false;
  }
}

console.log('[API Adapter] API Adapter loaded with offline support and image caching');

// Auto-initialize offline support
initializeOfflineSupport().catch(error => {
  console.error('[API Adapter] Auto-initialization failed:', error);
});