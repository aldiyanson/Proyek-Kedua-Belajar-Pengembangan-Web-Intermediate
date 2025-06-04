import { addStory, isOnline, getOfflineStatus } from '../../data/api-adapter.js';

export default class AddModel {
  async submitStory(description, photoBlob, latitude, longitude) {
    try {
      console.log('[AddModel] Submitting story...');
      console.log('[AddModel] Online status:', isOnline());
      
      const result = await addStory(description, photoBlob, latitude, longitude);
      
      // Add submission info to result
      if (result && typeof result === 'object') {
        result.submissionInfo = {
          isOnline: isOnline(),
          source: result.source || 'unknown',
          offline: result.offline || false,
          timestamp: new Date().toISOString()
        };
        
        // Log submission details
        if (result.offline) {
          console.log('[AddModel] Story queued for offline sync');
        } else {
          console.log('[AddModel] Story submitted successfully online');
        }
      }
      
      return result;
    } catch (error) {
      console.error('[AddModel] Error submitting story:', error);
      
      return {
        error: true,
        message: error.message || 'Failed to submit story',
        submissionInfo: {
          isOnline: isOnline(),
          source: 'error',
          offline: !isOnline(),
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Check if we can submit stories (online or offline queue available)
  canSubmitStory() {
    // Always return true since offline queue handles offline submissions
    return true;
  }

  // Get current submission capabilities
  async getSubmissionStatus() {
    try {
      const offlineStatus = await getOfflineStatus();
      
      return {
        canSubmit: true,
        isOnline: isOnline(),
        queueLength: offlineStatus.queueLength || 0,
        syncInProgress: offlineStatus.syncInProgress || false,
        mode: isOnline() ? 'online' : 'offline'
      };
    } catch (error) {
      console.error('[AddModel] Error getting submission status:', error);
      
      return {
        canSubmit: true,
        isOnline: navigator.onLine,
        queueLength: 0,
        syncInProgress: false,
        mode: navigator.onLine ? 'online' : 'offline'
      };
    }
  }

  // Validate story data before submission
  validateStoryData(description, photoBlob, latitude, longitude) {
    const errors = [];
    
    if (!description || description.trim().length === 0) {
      errors.push('Story description is required');
    }
    
    if (description && description.length > 1000) {
      errors.push('Story description is too long (max 1000 characters)');
    }
    
    if (!photoBlob) {
      errors.push('Photo is required');
    }
    
    if (photoBlob && photoBlob.size > 5 * 1024 * 1024) { // 5MB limit
      errors.push('Photo file is too large (max 5MB)');
    }
    
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      errors.push('Invalid latitude value');
    }
    
    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      errors.push('Invalid longitude value');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get file size in human readable format
  getFileSizeString(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}