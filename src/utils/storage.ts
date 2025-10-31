/**
 * Storage utilities for managing localStorage safely
 */

/**
 * Clear all creative-related localStorage keys
 * Use this to recover from QuotaExceededError
 */
export function clearCreativeStorage() {
  try {
    const keys = [
      'meta-creative-builder-storage',
      'meta-creative-autosave-snapshot',
    ];

    keys.forEach((key) => {
      try {
        localStorage.removeItem(key);
        console.log(`[Storage] Cleared: ${key}`);
      } catch (error) {
        console.error(`[Storage] Failed to clear ${key}:`, error);
      }
    });

    console.log('[Storage] All creative storage cleared');
    return true;
  } catch (error) {
    console.error('[Storage] Failed to clear storage:', error);
    return false;
  }
}

/**
 * Get the size of localStorage in bytes
 */
export function getStorageSize(): number {
  let total = 0;
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
  } catch (error) {
    console.error('[Storage] Failed to calculate size:', error);
  }
  return total;
}

/**
 * Get storage size in human-readable format
 */
export function getStorageSizeFormatted(): string {
  const bytes = getStorageSize();
  const kb = bytes / 1024;
  const mb = kb / 1024;

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  } else if (kb >= 1) {
    return `${kb.toFixed(2)} KB`;
  } else {
    return `${bytes} bytes`;
  }
}

/**
 * Check if localStorage is near quota (> 80% used)
 * Typical localStorage quota is 5-10MB
 */
export function isStorageNearQuota(quotaMB = 5): boolean {
  const bytes = getStorageSize();
  const mb = bytes / 1024 / 1024;
  const threshold = quotaMB * 0.8;

  return mb > threshold;
}

/**
 * Log storage usage for debugging
 */
export function logStorageUsage() {
  console.group('[Storage] Usage Report');
  console.log('Total size:', getStorageSizeFormatted());
  console.log('Near quota:', isStorageNearQuota() ? '⚠️ Yes' : '✅ No');

  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = (key.length + value.length) / 1024;
          console.log(`  ${key}: ${size.toFixed(2)} KB`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to log storage usage:', error);
  }

  console.groupEnd();
}
