import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useClient } from "urql";
import { useAuth } from "@mirai-app/frameworks/auth/client";
import {
  useSubscribeNotificationsMutation,
  GetNotificationSubscriptionStatusDocument,
} from "@mirai-app/frameworks/graphql/urql";

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
  const client = useClient();

  // Use generated hook for subscribing to push notifications
  const [, subscribeMutation] = useSubscribeNotificationsMutation();

  const hasSession = !!session?.access_token;
  const authUserId = session?.user?.id ?? null;

  useEffect(() => {
    if (!hasSession || !authUserId) {
      attemptedForUserRef.current = null;
      return;
    }

    // Check if mutation is in progress via the result
    // urql doesn't expose isPending the same way, so we track differently
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

        const result = await subscribeMutation({ token });

        // Invalidate notification queries to refresh subscription status on success
        if (!result.error) {
          await client.invalidate(GetNotificationSubscriptionStatusDocument);
        }
      } catch {
        // Silently ignore auto push subscription errors
      }
    })();
  }, [authUserId, hasSession, subscribeMutation, client]);
}
