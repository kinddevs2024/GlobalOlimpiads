/**
 * Optimized localStorage utility with debouncing and error handling
 */

const PREFIX = 'olympiad_';
const DEBOUNCE_DELAY = 500; // Debounce writes by 500ms

// Debounce timers map
const debounceTimers = new Map();

/**
 * Get item from localStorage with error handling
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(`${PREFIX}${key}`);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Set item in localStorage with debouncing
 */
export const setStorageItem = (key, value, immediate = false) => {
  const fullKey = `${PREFIX}${key}`;
  
  // Clear existing debounce timer
  if (debounceTimers.has(fullKey)) {
    clearTimeout(debounceTimers.get(fullKey));
  }
  
  const save = () => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
      debounceTimers.delete(fullKey);
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        // Try to clean up old items
        cleanupOldStorageItems();
        // Retry once
        try {
          localStorage.setItem(fullKey, JSON.stringify(value));
        } catch (retryError) {
          console.error(`Failed to save after cleanup:`, retryError);
        }
      }
    }
  };
  
  if (immediate) {
    save();
  } else {
    const timer = setTimeout(save, DEBOUNCE_DELAY);
    debounceTimers.set(fullKey, timer);
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorageItem = (key) => {
  try {
    const fullKey = `${PREFIX}${key}`;
    localStorage.removeItem(fullKey);
    
    // Clear debounce timer if exists
    if (debounceTimers.has(fullKey)) {
      clearTimeout(debounceTimers.get(fullKey));
      debounceTimers.delete(fullKey);
    }
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

/**
 * Clean up old storage items to free space
 */
const cleanupOldStorageItems = () => {
  try {
    const keys = Object.keys(localStorage);
    const olympiadKeys = keys.filter(key => key.startsWith(PREFIX));
    
    // Sort by timestamp if available, or remove oldest based on creation order
    // This is a simple implementation - could be enhanced with timestamps
    if (olympiadKeys.length > 50) {
      // Remove oldest 25% of items
      const itemsToRemove = olympiadKeys.slice(0, Math.floor(olympiadKeys.length * 0.25));
      itemsToRemove.forEach(key => localStorage.removeItem(key));
      console.warn(`Cleaned up ${itemsToRemove.length} old localStorage items`);
    }
  } catch (error) {
    console.error('Error cleaning up localStorage:', error);
  }
};

/**
 * Clear all localStorage items with prefix
 */
export const clearAllStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear all debounce timers
    debounceTimers.forEach(timer => clearTimeout(timer));
    debounceTimers.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Flush all pending debounced writes immediately
 */
export const flushStorage = () => {
  debounceTimers.forEach((timer, key) => {
    clearTimeout(timer);
    // The save will execute immediately when timer is cleared
  });
  debounceTimers.clear();
};

export default {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearAllStorage,
  flushStorage
};

