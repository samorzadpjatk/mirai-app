/**
 * Offline Error Handler for tRPC mutations
 * Automatically stores failed requests for later retry
 */

import { storeOfflineTransaction, triggerManualSync } from './backgroundSync';

export interface OfflineRequest {
  id: string;
  type: string;
  input: any;
  timestamp: number;
  error: string;
  retryCount: number;
}

/**
 * Check if error is a network error that should trigger offline storage
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  const errorName = error.name || '';
  
  // Common network error patterns
  const networkErrorPatterns = [
    'NetworkError when attempting to fetch resource',
    'Failed to fetch',
    'Network request failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'TypeError: NetworkError',
    'Connection refused',
    'Timeout'
  ];
  
  return networkErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorName.includes(pattern)
  ) || error.cause?.name === 'TypeError';
}

/**
 * Store failed tRPC mutation for offline retry
 */
export function handleOfflineMutation(
  procedureName: string, 
  input: any, 
  error: any
): void {
  if (!isNetworkError(error)) {
    // Not a network error - don't store offline
    console.log('Not a network error, not storing offline:', error.message);
    return;
  }

  console.log(`Storing offline mutation: ${procedureName}`, { input, error: error.message });

  const offlineRequest: OfflineRequest = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: procedureName,
    input: input,
    timestamp: Date.now(),
    error: error.message,
    retryCount: 0
  };

  try {
    // Store in localStorage for immediate availability
    const stored = localStorage.getItem('offlineRequests') || '[]';
    const requests = JSON.parse(stored);
    requests.push(offlineRequest);
    localStorage.setItem('offlineRequests', JSON.stringify(requests));

    // Also use the existing offline transaction storage for backwards compatibility
    if (procedureName.includes('coin')) {
      storeOfflineTransaction({
        ...input,
        _offlineRequestId: offlineRequest.id,
        _procedureName: procedureName
      });
    }

    console.log(`Offline request stored: ${offlineRequest.id}`);

    // Show user notification (optional)
    showOfflineNotification(procedureName);

    // Try to sync if we're actually online (maybe temporary network issue)
    setTimeout(() => {
      if (navigator.onLine) {
        triggerManualSync();
      }
    }, 2000);

  } catch (storageError) {
    console.error('Failed to store offline request:', storageError);
  }
}

/**
 * Get all stored offline requests
 */
export function getOfflineRequests(): OfflineRequest[] {
  try {
    const stored = localStorage.getItem('offlineRequests') || '[]';
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get offline requests:', error);
    return [];
  }
}

/**
 * Remove successfully synced request
 */
export function removeOfflineRequest(requestId: string): void {
  try {
    const stored = localStorage.getItem('offlineRequests') || '[]';
    const requests = JSON.parse(stored);
    const filtered = requests.filter((req: OfflineRequest) => req.id !== requestId);
    localStorage.setItem('offlineRequests', JSON.stringify(filtered));
    console.log(`Removed offline request: ${requestId}`);
  } catch (error) {
    console.error('Failed to remove offline request:', error);
  }
}

/**
 * Retry all offline requests
 */
export async function retryOfflineRequests(
  trpcClient: any
): Promise<{ success: number; failed: number }> {
  const requests = getOfflineRequests();
  let successCount = 0;
  let failedCount = 0;

  console.log(`Retrying ${requests.length} offline requests...`);

  for (const request of requests) {
    try {
      // Extract procedure path (e.g., "coin.addCoins" -> ["coin", "addCoins"])
      const [routerName, procedureName] = request.type.split('.');
      
      if (!trpcClient[routerName] || !trpcClient[routerName][procedureName]) {
        console.error(`Unknown procedure: ${request.type}`);
        failedCount++;
        continue;
      }

      // Execute the mutation
      await trpcClient[routerName][procedureName].mutate(request.input);
      
      // Remove from offline storage on success
      removeOfflineRequest(request.id);
      successCount++;
      
      console.log(`Successfully synced offline request: ${request.id}`);
      
    } catch (error) {
      console.error(`Failed to sync offline request ${request.id}:`, error);
      
      // Increment retry count
      request.retryCount++;
      
      // Remove if too many retries (avoid infinite retry)
      if (request.retryCount > 5) {
        console.warn(`Removing offline request after 5 failed retries: ${request.id}`);
        removeOfflineRequest(request.id);
      }
      
      failedCount++;
    }
  }

  console.log(`Offline sync completed: ${successCount} success, ${failedCount} failed`);
  return { success: successCount, failed: failedCount };
}

/**
 * Show user-friendly notification about offline storage
 */
function showOfflineNotification(procedureName: string): void {
  // Create a simple toast notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff9800;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  notification.textContent = `Request saved offline and will be retried when connection is restored`;
  
  document.body.appendChild(notification);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

/**
 * Clear all offline requests (for testing/debugging)
 */
export function clearAllOfflineRequests(): void {
  localStorage.removeItem('offlineRequests');
  console.log('All offline requests cleared');
}

/**
 * Get offline requests count
 */
export function getOfflineRequestsCount(): number {
  return getOfflineRequests().length;
}
