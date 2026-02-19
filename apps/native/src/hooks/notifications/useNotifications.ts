import { useEffect, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Alert, Linking } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export interface UseNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isSubscribedElsewhere: boolean;
  isLoading: boolean;
  permission: Notifications.PermissionStatus;
  requestPermission: () => Promise<Notifications.PermissionStatus>;
  toggleSubscription: () => Promise<void>;
  onTogglePress: () => void;
  testNotification: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const subscriptionQueryOptions =
    trpc.notifications.getSubscriptionStatus.queryOptions();
  const { data: subscriptionStatus, isLoading: isStatusLoading } = useQuery(
    subscriptionQueryOptions,
  );

  const [permission, setPermission] = useState<Notifications.PermissionStatus>(
    Notifications.PermissionStatus.UNDETERMINED,
  );

  const isSubscribedElsewhere =
    (subscriptionStatus?.isSubscribed &&
      permission !== Notifications.PermissionStatus.GRANTED) ??
    false;

  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then((data) => {
        setPermission(data.status);
      })
      .catch((err) => {
        console.warn("Failed to get notification permissions", err);
      });
  }, []);

  const subscribeMutation = useMutation(
    trpc.notifications.subscribe.mutationOptions({
      onSuccess: async () => {
        Alert.alert("Success", "Push notifications enabled!");
        await queryClient.invalidateQueries({
          queryKey: subscriptionQueryOptions.queryKey,
        });
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to subscribe: ${error.message}`);
      },
    }),
  );

  const unsubscribeMutation = useMutation(
    trpc.notifications.unsubscribe.mutationOptions({
      onSuccess: async () => {
        Alert.alert("Success", "Push notifications disabled");
        await queryClient.invalidateQueries({
          queryKey: subscriptionQueryOptions.queryKey,
        });
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to unsubscribe: ${error.message}`);
      },
    }),
  );

  const isSubscribed =
    permission === Notifications.PermissionStatus.GRANTED &&
    subscriptionStatus?.isSubscribed;

  const requestPermission = useCallback(async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermission(finalStatus);
    return finalStatus;
  }, []);

  const openAppSettings = useCallback(() => {
    void Linking.openSettings().catch((error) => {
      console.warn("Failed to open app settings", error);
      Alert.alert("Error", "Could not open device settings");
    });
  }, []);

  const toggleSubscription = useCallback(async () => {
    if (subscriptionStatus?.isSubscribed) {
      for (const sub of subscriptionStatus.subscriptions) {
        await unsubscribeMutation.mutateAsync({ token: sub.token });
      }
      return;
    }

    const finalStatus = await requestPermission();
    if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
      Alert.alert(
        "Permission Required",
        "Please enable notifications in your device settings",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openAppSettings },
        ],
      );
      return;
    }

    const extraExpoConfig: { eas?: { projectId?: string } } | undefined =
      Constants.expoConfig?.extra;
    const projectId = extraExpoConfig?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    if (tokenData.data) {
      await subscribeMutation.mutateAsync({ token: tokenData.data });
    }
  }, [
    subscriptionStatus,
    requestPermission,
    openAppSettings,
    subscribeMutation,
    unsubscribeMutation,
  ]);

  const testNotification = useCallback(() => {
    // Helper to test sending a notification from device by invoking backend if available
    // For now, just show a local alert
    Alert.alert("Test", "This would trigger a test notification flow");
  }, []);

  const onTogglePress = useCallback(() => {
    void toggleSubscription().catch((err) => {
      console.error("Error toggling notifications:", err);
      Alert.alert("Error", "Failed to update notification settings");
    });
  }, [toggleSubscription]);

  return {
    isSupported: true,
    isSubscribed: !!isSubscribed,
    isSubscribedElsewhere,
    isLoading: isStatusLoading,
    permission,
    requestPermission,
    toggleSubscription,
    onTogglePress,
    testNotification,
  };
}
