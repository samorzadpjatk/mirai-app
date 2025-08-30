// Simple development service worker for push notifications
// @ts-nocheck
console.log('Development Service Worker loaded');

// Install event
self.addEventListener('install', (event) => {
  console.log('SW: Install event');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('SW: Activate event');
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('SW: Push event received', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.error('SW: Error parsing push data:', error);
    notificationData = {
      title: 'Bank Monet',
      body: 'You have a new notification',
      url: '/'
    };
  }

  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: '/GRAL192.png',
    badge: '/GRAL192.png',
    data: {
      url: notificationData.url || '/',
      timestamp: Date.now(),
      ...notificationData.data
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      }
    ],
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Bank Monet', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
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

// Background sync (optional, for offline support)
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync', event.tag);
});

// Error handler
self.addEventListener('error', (event) => {
  console.error('SW: Error occurred:', event.error);
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('SW: Unhandled rejection:', event.reason);
});
