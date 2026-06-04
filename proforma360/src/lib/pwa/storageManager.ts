export const checkStoragePressure = async (): Promise<void> => {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;

    if (quota > 0) {
      const usagePercentage = (usage / quota) * 100;
      
      // If we are over 70% usage, we should start aggressive cleanup
      if (usagePercentage > 70) {
        console.warn(`[StorageManager] High storage pressure detected: ${usagePercentage.toFixed(2)}% used.`);
        await performEmergencyCleanup();
      } else {
        console.log(`[StorageManager] Storage healthy: ${usagePercentage.toFixed(2)}% used.`);
      }
    }
  } catch (error) {
    console.error('[StorageManager] Failed to estimate storage', error);
  }
};

const performEmergencyCleanup = async (): Promise<void> => {
  // 1. Clear old caches
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        // Clear caches that are not explicitly protected or current
        if (!cacheName.includes('static-font-assets') && !cacheName.includes('proforma360')) {
           await caches.delete(cacheName);
        }
      }
      console.log('[StorageManager] Cleaned up old caches.');
    } catch (e) {
      console.error('[StorageManager] Cache cleanup failed', e);
    }
  }

  // 2. Clear old telemetry logs or other non-critical IndexedDB stores
  // In the future: clear old action_queue dead_letters, etc.
};
