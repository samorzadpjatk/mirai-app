import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

/**
 * Query params the admin screen appends to a notification URL to describe the
 * audience. They are a server-side routing concern and must never reach the
 * navigator.
 */
const AUDIENCE_PARAMS = ["__audience", "__groupId"];

/**
 * Routes that older notification rows still point at. They never matched a
 * screen under `apps/native/src/app`, so tapping one of those notifications
 * navigated nowhere. Rows already in the database cannot be rewritten, so they
 * are translated on the way in.
 */
const LEGACY_ROUTE_ALIASES: Record<string, string> = {
  "/ranking": "/trips/leaderboard",
  "/group/my": "/trips/groups",
  "/group": "/trips/groups",
  "/rewards": "/trips/rewards",
  "/challenges": "/trips/challenges",
  "/leaderboard": "/trips/leaderboard",
};

/**
 * Extract a safe in-app route from a notification's `data` payload.
 *
 * Only absolute in-app paths are accepted: anything with a scheme (`http:`,
 * `mirai:`, `javascript:`) or a protocol-relative prefix is rejected, so a
 * malformed or hostile payload cannot push the user out of the app.
 */
export function resolveNotificationRoute(data: unknown): string | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const rawUrl = (data as { url?: unknown }).url;
  if (typeof rawUrl !== "string") {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  const [pathAndQuery, ...hashParts] = trimmed.split("#");
  const [path, query] = (pathAndQuery ?? "").split("?");
  const normalizedPath = LEGACY_ROUTE_ALIASES[path ?? ""] ?? path ?? "";

  if (!normalizedPath.startsWith("/")) {
    return null;
  }

  const params = new URLSearchParams(query ?? "");
  for (const param of AUDIENCE_PARAMS) {
    params.delete(param);
  }

  const remainingQuery = params.toString();
  const hash = hashParts.length > 0 ? `#${hashParts.join("#")}` : "";

  return `${normalizedPath}${remainingQuery ? `?${remainingQuery}` : ""}${hash}`;
}

/**
 * Navigate when a push notification is tapped.
 *
 * Without this listener nothing at all happened on tap: `_layout.tsx` only ever
 * configured the foreground presentation handler, so `data.url` was delivered
 * and dropped. Both entry points are covered — a tap while the app is running,
 * and the response that launched the app from cold.
 */
export function useNotificationResponse(): void {
  const router = useRouter();
  const handledColdStartRef = useRef(false);

  useEffect(() => {
    const navigate = (response: Notifications.NotificationResponse | null): void => {
      const route = resolveNotificationRoute(response?.notification.request.content.data);
      if (!route) {
        return;
      }
      router.push(route as Parameters<typeof router.push>[0]);
    };

    if (!handledColdStartRef.current) {
      handledColdStartRef.current = true;
      void Notifications.getLastNotificationResponseAsync()
        .then(navigate)
        .catch(() => {
          // A missing cold-start response is normal, not an error worth surfacing.
        });
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(navigate);

    return () => {
      subscription.remove();
    };
  }, [router]);
}
