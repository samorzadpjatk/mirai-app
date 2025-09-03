/**
 * Service Worker Message Handler
 * Handles communication between Service Worker and main thread for localStorage access
 */

'use client';

import { useEffect } from 'react';

export default function ServiceWorkerMessageHandler() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'GET_LOCALSTORAGE') {
          const { key } = event.data;
          const value = localStorage.getItem(key);
          event.ports[0]?.postMessage({ value });
        } else if (event.data?.type === 'SET_LOCALSTORAGE') {
          const { key, value } = event.data;
          localStorage.setItem(key, value);
        }
      };

      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      // Also listen for messages on the global scope
      window.addEventListener('message', messageHandler);

      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
        window.removeEventListener('message', messageHandler);
      };
    }
  }, []);

  // This component doesn't render anything
  return null;
}
