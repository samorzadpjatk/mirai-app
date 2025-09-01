/**
 * Background Sync utilities for offline functionality
 * Provides helper functions to register background sync tasks
 */

/**
 * Check if Background Sync API is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'sync' in (window as any).ServiceWorkerRegistration?.prototype
  );
}

/**
 * Register a background sync task
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  try {
    if (!isBackgroundSyncSupported()) {
      console.warn('Background Sync not supported, using fallback');
      return triggerManualSync();
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log(`Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error('Failed to register background sync:', error);
    return false;
  }
}

/**
 * Trigger manual sync for browsers that don't support Background Sync
 */
export async function triggerManualSync(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };
        
        registration.active?.postMessage(
          { type: 'MANUAL_SYNC' },
          [messageChannel.port2]
        );
      });
    }
    return false;
  } catch (error) {
    console.error('Failed to trigger manual sync:', error);
    return false;
  }
}

/**
 * Register sync for coin transactions
 */
export async function syncCoinTransactions(): Promise<boolean> {
  return registerBackgroundSync('coin-transactions');
}

/**
 * Register sync for user data
 */
export async function syncUserData(): Promise<boolean> {
  return registerBackgroundSync('user-data');
}

/**
 * Register sync for notifications
 */
export async function syncNotifications(): Promise<boolean> {
  return registerBackgroundSync('notifications');
}

/**
 * Store offline transaction for later sync
 */
export function storeOfflineTransaction(transaction: any): void {
  // This would typically use IndexedDB
  // For now, store in localStorage as a simple implementation
  try {
    const stored = localStorage.getItem('offlineTransactions') || '[]';
    const transactions = JSON.parse(stored);
    transactions.push({
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    localStorage.setItem('offlineTransactions', JSON.stringify(transactions));
    
    // Register background sync to process this transaction
    syncCoinTransactions();
  } catch (error) {
    console.error('Failed to store offline transaction:', error);
  }
}
