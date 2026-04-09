import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/trpc/client";
import { invalidateNotificationQueries } from "@mirai-app/frameworks/trpc/client/query";
import { useAuth } from "@mirai-app/frameworks/auth/client";

function resolveProjectId(): string | undefined {
  const expoConfigExtra = (Constants.expoConfig?.extra ?? null) as unknown;
  if (typeof expoConfigExtra === "object" && expoConfigExtra !== null) {
    const eas = (expoConfigExtra as { eas?: unknown }).eas;
    if (typeof eas === "object" && eas !== null) {
      const maybeProjectId = (eas as { projectId?: unknown }).projectId;
      if (typeof maybeProjectId === "string" && maybeProjectId.length > 0) {
        return maybeProjectId;
      }
    }
  }

  const easConfig = (Constants.easConfig ?? null) as unknown;
  if (typeof easConfig === "object" && easConfig !== null) {
    const maybeProjectId = (easConfig as { projectId?: unknown }).projectId;
    if (typeof maybeProjectId === "string" && maybeProjectId.length > 0) {
      return maybeProjectId;
    }
  }

  return undefined;
}

function parseToken(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const tokenData = (value as { data?: unknown }).data;
  if (typeof tokenData !== "string") {
    return null;
  }

  const trimmedToken = tokenData.trim();
  return trimmedToken.length > 0 ? trimmedToken : null;
}

export function useAutoPushSubscription() {
  const { session } = useAuth();
  const attemptedForUserRef = useRef<string | null>(null);

  // Use tRPC + React Query directly for server-state
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const subscriptionQuery = useQuery(
    trpc.notifications.getSubscriptionStatus.queryOptions(),
  );
  const subscribeMutation = useMutation(
    trpc.notifications.subscribe.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
    }),
  );

  const { data: subscriptionStatus, isLoading: isStatusLoading } =
    subscriptionQuery;

  const hasSession = !!session?.access_token;
  const authUserId = session?.user?.id ?? null;
  const hasSubscription = subscriptionStatus?.isSubscribed ?? false;

  useEffect(() => {
    if (!hasSession || !authUserId) {
      attemptedForUserRef.current = null;
      return;
    }

    if (isStatusLoading || hasSubscription || subscribeMutation.isPending) {
      return;
    }

    if (attemptedForUserRef.current === authUserId) {
      return;
    }

    attemptedForUserRef.current = authUserId;

    void (async () => {
      try {
        const currentPermission = await Notifications.getPermissionsAsync();
        let finalStatus = currentPermission.status;

        if (finalStatus === Notifications.PermissionStatus.UNDETERMINED) {
          const requestedPermission =
            await Notifications.requestPermissionsAsync();
          finalStatus = requestedPermission.status;
        }

        if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
          return;
        }

        const projectId = resolveProjectId();

        const tokenData = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();
        const token = parseToken(tokenData);

        if (!token) {
          return;
        }

        await subscribeMutation.mutateAsync({ token });
      } catch (error) {
        console.warn("Failed to run automatic notification onboarding:", error);
      }
    })();
  }, [
    authUserId,
    hasSession,
    hasSubscription,
    isStatusLoading,
    subscribeMutation,
  ]);
}
