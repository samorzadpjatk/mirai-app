import { useEffect, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Alert, Linking } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "~/lib/graphql-client";

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
  const queryClient = useQueryClient();

  // GraphQL query for subscription status using direct request
  const subscriptionQuery = useQuery({
    queryKey: ["GetNotificationSubscriptionStatus"],
    queryFn: async () => {
      const result = await graphqlClient.request<{
        myNotificationSubscriptions: {
          isSubscribed: boolean;
          subscriptions: Array<{
            token: string;
            platform: string;
            createdAt: string;
          }>;
        };
      }>(GetSubscriptionStatusDocument);
      return result.myNotificationSubscriptions;
    },
  });

  const subscriptionStatus = subscriptionQuery.data;
  const isStatusLoading = subscriptionQuery.isLoading;

  // GraphQL mutation for subscribing
  const subscribeMutation = useMutation({
    mutationFn: async (variables: { token: string }) => {
      const result = await graphqlClient.request<{
        subscribeToNotifications: {
          success: boolean;
          subscription: { token: string; platform: string };
        };
      }>(SubscribeNotificationsDocument, variables);
      return result.subscribeToNotifications;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["GetNotificationSubscriptionStatus"],
      });
    },
  });

  // GraphQL mutation for unsubscribing
  const unsubscribeMutation = useMutation({
    mutationFn: async (variables: { token: string }) => {
      const result = await graphqlClient.request<{
        unsubscribeFromNotifications: { success: boolean };
      }>(UnsubscribeNotificationsDocument, variables);
      return result.unsubscribeFromNotifications;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["GetNotificationSubscriptionStatus"],
      });
    },
  });

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
