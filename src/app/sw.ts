/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { Serwist, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Change this attribute's name to your \`injectionPoint\`.
    // \`injectionPoint\` is an InjectManifest option.
    // See https://serwist.pages.dev/docs/build/configuring
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
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
      title: "Treasure Bank",
      body: "You have a new notification",
      url: "/",
    };
  }

  const options: NotificationOptions = {
    body: notificationData.body ?? "You have a new notification",
    icon: "/GRAL192.png",
    badge: "/GRAL192.png",
    data: {
      url: notificationData.url ?? "/",
      timestamp: Date.now(),
      ...notificationData.data,
    },
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title ?? "Treasure Bank",
      options
    )
  );
});

// Custom notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("SW: Notification clicked", event);
  
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

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

// Background sync for offline functionality
self.addEventListener("sync", (event) => {
  console.log("SW: Background sync", event.tag);
  
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log("SW: Performing background sync");
  // Here you can implement background sync logic
  // For example, sync offline coin transactions, user data updates, etc.
}

// Error handling
self.addEventListener("error", (event) => {
  console.error("SW: Error occurred:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("SW: Unhandled rejection:", event.reason);
});

console.log("SW: Serwist Service Worker loaded successfully");

serwist.addEventListeners();
