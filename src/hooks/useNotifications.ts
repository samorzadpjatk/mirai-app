"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "~/trpc/react";
import { arrayBufferToBase64 } from "~/utils/web_push";

// Service Worker registration with Serwist
const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if ("serviceWorker" in navigator) {
      try {
        // First check if there's already a service worker registered
        const existingRegistration =
          await navigator.serviceWorker.getRegistration();
        if (existingRegistration) {
          console.log(
            "Using existing Serwist Service Worker registration:",
            existingRegistration,
          );
          return existingRegistration;
        }

        // In production, Serwist generates /sw.js
        // In development, SW is disabled via next.config.js
        const swPath = "/sw.js";

        console.log(`Registering Serwist Service Worker: ${swPath}`);

        // Try to register the service worker
        const registration = await navigator.serviceWorker.register(swPath, {
          scope: "/",
        });
        console.log("Serwist Service Worker registered:", registration);

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        return registration;
      } catch (error) {
        console.error("Serwist Service Worker registration failed:", error);

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
  const [isSubscribedElsewhere, setIsSubscribedElsewhere] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  // tRPC mutations
  const subscribeMutation = api.notifications.subscribe.useMutation();
  const unsubscribeMutation = api.notifications.unsubscribe.useMutation();
  const { data: vapidQuery, isLoading: isVapidLoading } =
    api.notifications.getVapidPublicKey.useQuery();
  const {
    data: statusQuery,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = api.notifications.getSubscriptionStatus.useQuery();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(isVapidLoading || isStatusLoading);
  }, [isVapidLoading, isStatusLoading]);

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
    if (statusQuery) {
      navigator.serviceWorker?.ready
        .then(async (registration) => {
          const subscription =
            await registration.pushManager?.getSubscription();
          if (statusQuery.isSubscribed) {
            if (
              !subscription ||
              subscription.endpoint !== statusQuery.endpoint
            ) {
              setIsSubscribedElsewhere(true);
            } else {
              setIsSubscribed(true);
            }
          } else {
            setIsSubscribed(false);
          }
        })
        .catch((error) => {
          console.error("Error checking subscription:", error);
        });
    }
  }, [statusQuery]);

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

    if (!vapidQuery?.publicKey) {
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
        applicationServerKey: urlBase64ToUint8Array(vapidQuery.publicKey),
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
        await refetchStatus();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    isSupported,
    permission,
    vapidQuery?.publicKey,
    subscribeMutation,
    refetchStatus,
  ]);

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
        await refetchStatus();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribeMutation, refetchStatus]);

  // Test notification
  const testNotification = useCallback(() => {
    if (!isSupported || permission !== "granted") {
      console.warn("Cannot show test notification");
      return;
    }

    new Notification("Treasure Bank", {
      body: "This is a test notification from your PWA!",
      icon: "/GRAL192.png",
      badge: "/GRAL192.png",
    });
  }, [isSupported, permission]);

  return {
    isSupported,
    isSubscribed,
    isSubscribedElsewhere,
    isLoading,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
    vapidPublicKey: vapidQuery?.publicKey,
  };
};
