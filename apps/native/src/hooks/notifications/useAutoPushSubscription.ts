import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { invalidateNotificationQueries } from "@mirai-app/orpc/client/query";
import { useAuth } from "@mirai-app/auth/client";
import { resolveProjectId } from "./notificationProjectId";

export { resolveProjectId };
export function parseToken(value: unknown): string | null {
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
export function isAutoPushBlocked(
  hasSession: boolean,
  authUserId: string | null,
  isStatusLoading: boolean,
  hasSubscription: boolean,
  isPending: boolean,
  attemptedUserId: string | null,
): boolean {
  return (
    !hasSession ||
    !authUserId ||
    isStatusLoading ||
    hasSubscription ||
    isPending ||
    attemptedUserId === authUserId
  );
}

export async function getExpoPushToken(
  projectId?: string,
): Promise<Notifications.ExpoPushToken> {
  return projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();
}

export async function runAutoPushSubscriptionFlow(
  subscribeMutation: { mutateAsync: (data: { token: string }) => Promise<unknown> },
): Promise<void> {
  try {
    const currentPermission = await Notifications.getPermissionsAsync();
    let finalStatus = currentPermission.status;
    if (finalStatus === Notifications.PermissionStatus.UNDETERMINED) {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }
    if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
      return;
    }
    const projectId = resolveProjectId();
    const tokenData = await getExpoPushToken(projectId);
    const token = parseToken(tokenData);
    if (!token) {
      return;
    }
    await subscribeMutation.mutateAsync({ token });
  } catch {
    // Silently ignore automatic notification onboarding errors
  }
}

export function shouldRunAutoPushEffect(
  hasSession: boolean,
  authUserId: string | null,
  isStatusLoading: boolean,
  hasSubscription: boolean,
  isPending: boolean,
  attemptedUserId: string | null,
): boolean {
  if (!hasSession || !authUserId) {
    return false;
  }
  return !isAutoPushBlocked(
    hasSession,
    authUserId,
    isStatusLoading,
    hasSubscription,
    isPending,
    attemptedUserId,
  );
}

export function useAutoPushSubscription() {
  const { session } = useAuth();
  const attemptedForUserRef = useRef<string | null>(null);
  // Use oRPC + React Query directly for server-state
  const queryClient = useQueryClient();
  const subscriptionQuery = useQuery(
    orpc.notifications.getSubscriptionStatus.queryOptions({ input: {} }),
  );
  const subscribeMutation = useMutation(
    orpc.notifications.subscribe.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
    }),
  );
  const { data: subscriptionStatus, isLoading: isStatusLoading } = subscriptionQuery;
  const hasSession = !!session?.access_token;
  const authUserId = session?.user?.id ?? null;
  const hasSubscription = subscriptionStatus?.isSubscribed ?? false;
  useEffect(() => {
    if (!hasSession || !authUserId) {
      attemptedForUserRef.current = null;
      return;
    }
    if (
      isAutoPushBlocked(
        hasSession,
        authUserId,
        isStatusLoading,
        hasSubscription,
        subscribeMutation.isPending,
        attemptedForUserRef.current,
      )
    ) {
      return;
    }
    attemptedForUserRef.current = authUserId;
    void runAutoPushSubscriptionFlow(subscribeMutation);
  }, [authUserId, hasSession, hasSubscription, isStatusLoading, subscribeMutation]);
}
