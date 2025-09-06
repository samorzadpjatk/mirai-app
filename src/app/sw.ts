/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { Serwist, type SerwistGlobalConfig } from "serwist";
import { api } from "~/trpc/sw";
import { arrayBufferToBase64 } from "~/utils/web_push";

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
      options,
    ),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("SW: Push subscription change event", event);
  const work = async () => {
    if (event.newSubscription) {
      const subscription = event.newSubscription;
      console.log("SW: New push subscription:", subscription);
      const p256dh = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");
      if (!p256dh || !auth) {
        console.error("SW: Missing keys in subscription");
        return;
      }
      const payload = {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dh),
            auth: arrayBufferToBase64(auth),
          },
        },
      };
      await api.notifications.subscribe.mutate(payload);
    }
  };
  // Here you would typically resubscribe and send the new subscription to your server
  event.waitUntil(work());
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
      }),
  );
});

// Error handling
self.addEventListener("error", (event) => {
  console.error("SW: Error occurred:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("SW: Unhandled rejection:", event.reason);
});

console.log("SW: Serwist Service Worker loaded successfully");

serwist.addEventListeners();
