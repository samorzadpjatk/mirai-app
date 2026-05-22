import { useCallback } from "react";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";
import { resolveProjectId } from "./notificationProjectId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { invalidateNotificationQueries } from "@mirai-app/orpc/client/query";
import { useNotificationPermission } from "./useNotificationPermission";

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

export function calculateIsSubscribed(
  permission: string,
  isSubscribed: boolean | undefined,
): boolean {
  return permission === "granted" && !!isSubscribed;
}

export function calculateIsSubscribedElsewhere(
  permission: string,
  isSubscribed: boolean | undefined,
): boolean {
  return (isSubscribed && permission !== "granted") ?? false;
}

export function buildPermissionAlertButtons(
  onOpenSettings: () => void,
): Array<{ text: string; style?: "cancel"; onPress?: () => void }> {
  return [
    { text: "Cancel", style: "cancel" },
    { text: "Open Settings", onPress: onOpenSettings },
  ];
}

export function getExpoProjectId(): string | undefined {
  return resolveProjectId();
}

export function shouldRequestNotificationPermission(status: string): boolean {
  return status !== "granted";
}

export function buildNotificationPermissionResult(
  existingStatus: string,
  newStatus?: string,
): string {
  return newStatus ?? existingStatus;
}

export interface NotificationMutations {
  subscribeMutation: { mutateAsync: (data: { token: string }) => Promise<unknown> };
  unsubscribeMutation: { mutateAsync: (data: { token: string }) => Promise<unknown> };
}

export interface NotificationPermissionDeps {
  permission: string;
  requestPermission: () => Promise<string>;
  openAppSettings: () => void;
}

export async function executeToggleSubscription(
  subscriptionStatus: {
    isSubscribed?: boolean;
    subscriptions?: Array<{ token: string }>;
  } | undefined,
  permissionDeps: NotificationPermissionDeps,
  mutations: NotificationMutations,
): Promise<void> {
  if (subscriptionStatus?.isSubscribed) {
    for (const sub of subscriptionStatus.subscriptions ?? []) {
      await mutations.unsubscribeMutation.mutateAsync({ token: sub.token });
    }
    return;
  }

  const finalStatus = await permissionDeps.requestPermission();
  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    Alert.alert(
      "Permission Required",
      "Please enable notifications in your device settings",
      buildPermissionAlertButtons(permissionDeps.openAppSettings),
    );
    return;
  }

  const projectId = getExpoProjectId();
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

  if (tokenData.data) {
    await mutations.subscribeMutation.mutateAsync({ token: tokenData.data });
  }
}

export function buildNotificationActions(
  subscriptionStatus: {
    isSubscribed?: boolean;
    subscriptions?: Array<{ token: string }>;
  } | undefined,
  permissionDeps: NotificationPermissionDeps,
  mutations: NotificationMutations,
) {
  const toggleSubscription = async () => {
    await executeToggleSubscription(subscriptionStatus, permissionDeps, mutations);
  };

  const testNotification = () => {
    Alert.alert("Test", "This would trigger a test notification flow");
  };

  const onTogglePress = () => {
    void toggleSubscription().catch(() => {
      Alert.alert("Error", "Failed to update notification settings");
    });
  };

  return { toggleSubscription, onTogglePress, testNotification };
}

export function useNotifications(): UseNotificationsReturn {
  const subscriptionQueryOptions = orpc.notifications.getSubscriptionStatus.queryOptions({
    input: {},
  });
  const { data: subscriptionStatus, isLoading: isStatusLoading } =
    useQuery(subscriptionQueryOptions);

  const queryClient = useQueryClient();
  const subscribeMutation = useMutation(
    orpc.notifications.subscribe.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
    }),
  );
  const unsubscribeMutation = useMutation(
    orpc.notifications.unsubscribe.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
    }),
  );

  const { permission, requestPermission, openAppSettings } = useNotificationPermission();

  const isSubscribed = calculateIsSubscribed(permission, subscriptionStatus?.isSubscribed);

  const isSubscribedElsewhere = calculateIsSubscribedElsewhere(
    permission,
    subscriptionStatus?.isSubscribed,
  );

  const actions = buildNotificationActions(
    subscriptionStatus,
    { permission, requestPermission, openAppSettings },
    { subscribeMutation, unsubscribeMutation },
  );

  return {
    isSupported: true,
    isSubscribed,
    isSubscribedElsewhere,
    isLoading: isStatusLoading,
    permission,
    requestPermission,
    ...actions,
  };
}
