/**
 * Cache Buster Script
 * Add this to detect and clear stale authentication data
 */

const APP_VERSION = '2.0.0'; // Increment this with each deployment
const VERSION_KEY = 'app_version';

export const initCacheBuster = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  // If version doesn't match or doesn't exist, clear all app data
  if (storedVersion !== APP_VERSION) {
    console.log('🔄 New app version detected. Clearing cache...');
    
    // Clear auth data
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    
    // Clear any other app-specific data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.includes('i18nextLng')) { // Keep language preference
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      if (key !== VERSION_KEY) {
        localStorage.removeItem(key);
      }
    });
    
    // Set new version
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    console.log('✅ Cache cleared successfully');
    
    // Reload page if not on landing page
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }
};

// Call this before app initialization
initCacheBuster();
