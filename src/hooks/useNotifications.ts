"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "~/trpc/react";

// Service Worker registration
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }
  return null;
};

// Convert VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)!;
  }
  return outputArray.buffer;
};

export const useNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  // tRPC mutations
  const subscribeMutation = api.notifications.subscribe.useMutation();
  const unsubscribeMutation = api.notifications.unsubscribe.useMutation();
  const vapidQuery = api.notifications.getVapidPublicKey.useQuery();
  const statusQuery = api.notifications.getSubscriptionStatus.useQuery();

  // Check browser support and permission status
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Update subscription status when data is loaded
  useEffect(() => {
    if (statusQuery.data) {
      setIsSubscribed(statusQuery.data.isSubscribed);
    }
  }, [statusQuery.data]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Notifications not supported");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== "granted") {
      console.warn("Cannot subscribe: not supported or permission not granted");
      return false;
    }

    if (!vapidQuery.data?.publicKey) {
      console.error("VAPID public key not available");
      return false;
    }

    setIsLoading(true);

    try {
      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error("Service Worker registration failed");
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidQuery.data.publicKey),
      });

      // Send subscription to server
      const result = await subscribeMutation.mutateAsync({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
            auth: arrayBufferToBase64(subscription.getKey("auth")!),
          },
        },
      });

      if (result.success) {
        setIsSubscribed(true);
        await statusQuery.refetch();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, vapidQuery.data, subscribeMutation, statusQuery]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Unsubscribe from server
      const result = await unsubscribeMutation.mutateAsync();

      if (result.success) {
        // Unsubscribe from browser
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
        }

        setIsSubscribed(false);
        await statusQuery.refetch();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribeMutation, statusQuery]);

  // Test notification
  const testNotification = useCallback(() => {
    if (!isSupported || permission !== "granted") {
      console.warn("Cannot show test notification");
      return;
    }

    new Notification("Bank Monet", {
      body: "This is a test notification from your PWA!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
    });
  }, [isSupported, permission]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
    vapidPublicKey: vapidQuery.data?.publicKey,
  };
};

// Helper function to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return window.btoa(binary);
};
