import { useEffect, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Alert, Linking } from "react-native";
import { useQuery, useMutation, useClient } from "urql";

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

// GraphQL documents for notification operations (not yet in generated hooks)
const GetSubscriptionStatusDocument = `
  query GetNotificationSubscriptionStatus {
    myNotificationSubscriptions {
      isSubscribed
      subscriptions {
        token
        platform
        createdAt
      }
    }
  }
`;

const SubscribeNotificationsDocument = `
  mutation SubscribeNotifications($token: String!) {
    subscribeToNotifications(input: { token: $token }) {
      success
      subscription {
        token
        platform
      }
    }
  }
`;

const UnsubscribeNotificationsDocument = `
  mutation UnsubscribeNotifications($token: String!) {
    unsubscribeFromNotifications(input: { token: $token }) {
      success
    }
  }
`;

export function useNotifications(): UseNotificationsReturn {
  const client = useClient();

  // GraphQL query for subscription status using urql
  const [subscriptionQueryResult] = useQuery({
    query: GetSubscriptionStatusDocument,
  });

  const subscriptionStatus =
    subscriptionQueryResult.data?.myNotificationSubscriptions;
  const isStatusLoading = subscriptionQueryResult.fetching;

  // GraphQL mutation for subscribing
  const [, subscribeMutation] = useMutation(SubscribeNotificationsDocument);

  // GraphQL mutation for unsubscribing
  const [, unsubscribeMutation] = useMutation(UnsubscribeNotificationsDocument);

  const [permission, setPermission] = useState<Notifications.PermissionStatus>(
    Notifications.PermissionStatus.UNDETERMINED,
  );

  const isSubscribed =
    permission === Notifications.PermissionStatus.GRANTED &&
    !!subscriptionStatus?.isSubscribed;

  const isSubscribedElsewhere =
    (subscriptionStatus?.isSubscribed &&
      permission !== Notifications.PermissionStatus.GRANTED) ??
    false;

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

  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then((data) => {
        setPermission(data.status);
      })
      .catch((err) => {
        console.warn("Failed to get notification permissions", err);
      });
  }, []);

  const toggleSubscription = useCallback(async () => {
    if (subscriptionStatus?.isSubscribed) {
      for (const sub of subscriptionStatus.subscriptions) {
        const result = await unsubscribeMutation({ token: sub.token });
        if (result.error) {
          console.error("Failed to unsubscribe:", result.error);
        }
      }
      // Invalidate cache after unsubscribing
      await client.invalidate(GetSubscriptionStatusDocument);
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
      const result = await subscribeMutation({ token: tokenData.data });
      if (!result.error) {
        // Invalidate cache after subscribing
        await client.invalidate(GetSubscriptionStatusDocument);
      } else {
        console.error("Failed to subscribe:", result.error);
      }
    }
  }, [
    subscriptionStatus,
    requestPermission,
    openAppSettings,
    subscribeMutation,
    unsubscribeMutation,
    client,
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
    isSubscribed,
    isSubscribedElsewhere,
    isLoading: isStatusLoading,
    permission,
    requestPermission,
    toggleSubscription,
    onTogglePress,
    testNotification,
  };
}
