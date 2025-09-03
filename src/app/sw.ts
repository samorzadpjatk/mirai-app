/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";
import { BackgroundSyncPlugin } from "@serwist/background-sync";
import { NetworkOnly } from "@serwist/strategies";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Background sync plugin for offline functionality
const bgSyncPlugin = new BackgroundSyncPlugin("api-queue", {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
});

// Enhanced runtime caching with background sync
const enhancedCache = [
  ...defaultCache,
  // API routes with background sync for offline support
  {
    matcher: ({ request }: { request: Request }) => {
      return request.url.includes('/api/trpc/') && request.method === 'POST';
    },
    handler: new NetworkOnly({
      plugins: [bgSyncPlugin],
    }),
  },
];

const serwist = installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: enhancedCache,
});

// Custom push notification handler
self.addEventListener("push", (event) => {
  console.log("SW: Push event received", event);
  
  let notificationData: {
    title?: string;
    body?: string;
    url?: string;
    data?: Record<string, unknown>;
  } = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.error("SW: Error parsing push data:", error);
    notificationData = {
      title: "Bank Monet",
      body: "You have a new notification",
      url: "/",
    };
  }

  const options: NotificationOptions = {
    body: notificationData.body || "You have a new notification",
    icon: "/GRAL192.png",
    badge: "/GRAL192.png",
    data: {
      url: notificationData.url || "/",
      timestamp: Date.now(),
      ...notificationData.data,
    },
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || "Bank Monet",
      options
    )
  );
});

// Custom notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("SW: Notification clicked", event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || "/";
  
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        
        // If no existing window/tab, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Enhanced background sync for offline functionality
self.addEventListener("sync", (event) => {
  console.log("SW: Background sync triggered", event.tag);
  
  switch (event.tag) {
    case "api-queue":
      // This is handled automatically by BackgroundSyncPlugin
      console.log("SW: API queue sync triggered");
      break;
    case "coin-transactions":
      event.waitUntil(syncCoinTransactions());
      break;
    case "user-data":
      event.waitUntil(syncUserData());
      break;
    case "notifications":
      event.waitUntil(syncNotifications());
      break;
    default:
      console.log("SW: Unknown sync tag:", event.tag);
  }
});

// Sync offline coin transactions
async function syncCoinTransactions() {
  console.log("SW: Syncing coin transactions");
  try {
    // Get offline transactions from both storage methods
    const legacyTransactions = await getOfflineTransactions();
    const newRequests = await getOfflineRequests();
    
    // Sync legacy format transactions
    for (const transaction of legacyTransactions) {
      try {
        const response = await fetch("/api/trpc/coinTransaction.create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transaction),
        });
        
        if (response.ok) {
          console.log("SW: Legacy transaction synced successfully");
          await removeOfflineTransaction(transaction.id);
        }
      } catch (error) {
        console.error("SW: Failed to sync legacy transaction:", error);
      }
    }

    // Sync new format requests
    for (const request of newRequests) {
      try {
        let endpoint = '';
        let body = {};

        // Map request types to tRPC endpoints
        switch (request.type) {
          case 'coin.addCoins':
            endpoint = '/api/trpc/coin.addCoins';
            break;
          case 'coin.removeCoins':
            endpoint = '/api/trpc/coin.removeCoins';
            break;
          case 'group.create':
            endpoint = '/api/trpc/group.create';
            break;
          case 'group.update':
            endpoint = '/api/trpc/group.update';
            break;
          case 'group.delete':
            endpoint = '/api/trpc/group.delete';
            break;
          case 'user.updateUserAdminStatus':
            endpoint = '/api/trpc/user.updateUserAdminStatus';
            break;
          case 'user.updateWristNumber':
            endpoint = '/api/trpc/user.updateWristNumber';
            break;
          case 'user.removeWristNumber':
            endpoint = '/api/trpc/user.removeWristNumber';
            break;
          case 'group.join':
            endpoint = '/api/trpc/group.join';
            break;
          case 'group.assignUserToGroup':
            endpoint = '/api/trpc/group.assignUserToGroup';
            break;
          case 'group.removeUserFromGroup':
            endpoint = '/api/trpc/group.removeUserFromGroup';
            break;
          case 'notifications.sendToUser':
            endpoint = '/api/trpc/notifications.sendToUser';
            break;
          case 'notifications.sendToGroup':
            endpoint = '/api/trpc/notifications.sendToGroup';
            break;
          case 'notifications.subscribe':
            endpoint = '/api/trpc/notifications.subscribe';
            break;
          case 'notifications.unsubscribe':
            endpoint = '/api/trpc/notifications.unsubscribe';
            break;
          case 'notificationSchedule.create':
            endpoint = '/api/trpc/notificationSchedule.create';
            break;
          case 'notificationSchedule.update':
            endpoint = '/api/trpc/notificationSchedule.update';
            break;
          case 'notificationSchedule.delete':
            endpoint = '/api/trpc/notificationSchedule.delete';
            break;
          case 'notificationSchedule.toggleActive':
            endpoint = '/api/trpc/notificationSchedule.toggleActive';
            break;
          case 'notificationSchedule.updateLastRun':
            endpoint = '/api/trpc/notificationSchedule.updateLastRun';
            break;
        }

        if (endpoint) {
          body = { 
            json: request.input,
            meta: { values: { json: [] } }
          };
        }

        if (endpoint) {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          
          if (response.ok) {
            console.log(`SW: Request ${request.id} synced successfully`);
            await removeOfflineRequest(request.id);
          } else {
            console.error(`SW: Failed to sync request ${request.id}: ${response.status}`);
          }
        }
      } catch (error) {
        console.error(`SW: Failed to sync request ${request.id}:`, error);
      }
    }
  } catch (error) {
    console.error("SW: Error syncing coin transactions:", error);
  }
}

// Sync user data updates
async function syncUserData() {
  console.log("SW: Syncing user data");
  try {
    // Implementation for syncing user data changes
    // This could include profile updates, group memberships, etc.
  } catch (error) {
    console.error("SW: Error syncing user data:", error);
  }
}

// Sync pending notifications
async function syncNotifications() {
  console.log("SW: Syncing notifications");
  try {
    // Implementation for syncing notification delivery attempts
  } catch (error) {
    console.error("SW: Error syncing notifications:", error);
  }
}

// Helper functions for offline transaction management
async function getOfflineTransactions(): Promise<any[]> {
  // Try to get legacy format transactions from localStorage
  try {
    const stored = await getLocalStorageFromSW('offlineTransactions');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("SW: Error getting offline transactions:", error);
    return [];
  }
}

async function removeOfflineTransaction(transactionId: string): Promise<void> {
  // Remove successfully synced transaction from offline storage
  try {
    const stored = await getLocalStorageFromSW('offlineTransactions');
    if (stored) {
      const transactions = JSON.parse(stored);
      const filtered = transactions.filter((t: any) => t.id !== transactionId);
      await setLocalStorageFromSW('offlineTransactions', JSON.stringify(filtered));
    }
    console.log("SW: Removed synced transaction:", transactionId);
  } catch (error) {
    console.error("SW: Error removing offline transaction:", error);
  }
}

// New helper functions for enhanced offline requests
async function getOfflineRequests(): Promise<any[]> {
  try {
    const stored = await getLocalStorageFromSW('offlineRequests');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("SW: Error getting offline requests:", error);
    return [];
  }
}

async function removeOfflineRequest(requestId: string): Promise<void> {
  try {
    const stored = await getLocalStorageFromSW('offlineRequests');
    if (stored) {
      const requests = JSON.parse(stored);
      const filtered = requests.filter((r: any) => r.id !== requestId);
      await setLocalStorageFromSW('offlineRequests', JSON.stringify(filtered));
    }
    console.log("SW: Removed synced request:", requestId);
  } catch (error) {
    console.error("SW: Error removing offline request:", error);
  }
}

// Helper functions to access localStorage from Service Worker context
async function getLocalStorageFromSW(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    // Use message to main thread to access localStorage
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data.value);
    };
    
    // Send message to all clients to get localStorage value
    self.clients.matchAll().then(clients => {
      if (clients.length > 0 && clients[0]) {
        clients[0].postMessage(
          { type: 'GET_LOCALSTORAGE', key },
          [messageChannel.port2]
        );
      } else {
        resolve(null);
      }
    });
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

async function setLocalStorageFromSW(key: string, value: string): Promise<void> {
  return new Promise((resolve) => {
    // Send message to all clients to set localStorage value
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SET_LOCALSTORAGE', key, value });
      });
      resolve();
    });
  });
}

// Error handling
self.addEventListener("error", (event) => {
  console.error("SW: Error occurred:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("SW: Unhandled rejection:", event.reason);
});

// Check for Background Sync API support and setup fallbacks
function setupBackgroundSyncFallback() {
  if (!('sync' in (self as any).ServiceWorkerRegistration?.prototype || {})) {
    console.warn("SW: Background Sync not supported, setting up fallbacks");
    
    // Setup periodic checks for offline data when online
    self.addEventListener('online', () => {
      console.log("SW: Back online, attempting to sync offline data");
      syncCoinTransactions();
      syncUserData();
      syncNotifications();
    });
    
    // Setup message listener for manual sync triggers
    self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'MANUAL_SYNC') {
        console.log("SW: Manual sync requested");
        Promise.all([
          syncCoinTransactions(),
          syncUserData(),
          syncNotifications()
        ]).then(() => {
          event.ports[0]?.postMessage({ success: true });
        }).catch((error) => {
          console.error("SW: Manual sync failed:", error);
          event.ports[0]?.postMessage({ success: false, error });
        });
      }
    });
  } else {
    console.log("SW: Background Sync API supported");
  }
}

setupBackgroundSyncFallback();

console.log("SW: Serwist Service Worker loaded successfully with Background Sync");
