/**
 * Notification Sender Service
 *
 * Background service that listens for new notifications via Supabase Realtime
 * and sends mobile push notifications via the GraphQL API.
 *
 * ## Architecture
 *
 * This service is designed to run as a background worker. It:
 * 1. Connects to Supabase Realtime to listen for new Notification INSERT events
 * 2. Calls the GraphQL API using urql to track delivery status
 * 3. Sends mobile push notifications via the notification service
 * 4. Tracks delivery completion or failure
 *
 * ## Environment Variables
 *
 * - `GRAPHQL_ENDPOINT` - GraphQL API endpoint (e.g., http://localhost:4000/graphql)
 * - `SUPABASE_URL` - Supabase project URL
 * - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
 *
 * ## GraphQL Mutations Used (via urql)
 *
 * - `trackDeliveryStart` - Marks delivery as started
 * - `sendMobileNotifications` - Sends push notifications
 * - `trackDeliveryComplete` - Records successful delivery
 * - `trackDeliveryFailure` - Records failed delivery
 *
 * @module notification-sender
 */

import { createSupabaseClient as createClient } from "@mirai-app/frameworks/supabase";
import type { RealtimePostgresInsertPayload } from "@mirai-app/frameworks/supabase";
import {
  createClient as createUrqlClient,
  cacheExchange,
  fetchExchange,
} from "@urql/core";
import {
  TrackDeliveryStartDocument,
  SendMobileNotificationsDocument,
  TrackDeliveryCompleteDocument,
  TrackDeliveryFailureDocument,
  type TrackDeliveryStartMutation,
  type SendMobileNotificationsMutation,
  type TrackDeliveryCompleteMutation,
  type TrackDeliveryFailureMutation,
} from "@mirai-app/graphql-client/urql";

// =============================================================================
// Environment Configuration
// =============================================================================

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GRAPHQL_ENDPOINT) throw new Error("Missing env: GRAPHQL_ENDPOINT");
if (!SUPABASE_URL) throw new Error("Missing env: SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

// =============================================================================
// GraphQL Client (urql)
// =============================================================================

/**
 * Create urql client with service account authentication
 */
const urqlClient = createUrqlClient({
  url: GRAPHQL_ENDPOINT,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "X-Service-Account": "notification-sender",
    },
  },
});

// =============================================================================
// Types
// =============================================================================

interface NotificationRow {
  id: string;
}

// =============================================================================
// Notification Service
// =============================================================================

/**
 * Notification service using urql GraphQL client
 * Replaces the previous SDK pattern with urql's core client
 */
class NotificationService {
  /**
   * Track delivery start via urql mutation
   */
  async trackDeliveryStart(notificationId: string): Promise<boolean> {
    try {
      const result = await urqlClient.mutation<TrackDeliveryStartMutation>(
        TrackDeliveryStartDocument,
        { notificationId },
      );

      if (result.error) {
        console.error("Failed to track delivery start:", result.error);
        return false;
      }

      return result.data?.trackDeliveryStart?.success ?? false;
    } catch (error) {
      console.error("Failed to track delivery start:", error);
      return false;
    }
  }

  /**
   * Send mobile notifications via urql mutation
   */
  async sendMobileNotifications(notificationId: string): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    total: number;
  }> {
    try {
      const result = await urqlClient.mutation<SendMobileNotificationsMutation>(
        SendMobileNotificationsDocument,
        { notificationId },
      );

      if (result.error) {
        console.error("Failed to send mobile notifications:", result.error);
        return { success: false, sent: 0, failed: 0, total: 0 };
      }

      const payload = result.data?.sendMobileNotifications;
      return {
        success: payload?.success ?? false,
        sent: payload?.sent ?? 0,
        failed: payload?.failed ?? 0,
        total: payload?.total ?? 0,
      };
    } catch (error) {
      console.error("Failed to send mobile notifications:", error);
      return { success: false, sent: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Track delivery completion via urql mutation
   */
  async trackDeliveryComplete(
    notificationId: string,
    totalRecipients: number,
    successCount: number,
    failureCount: number,
    errors: string | null,
  ): Promise<boolean> {
    try {
      const result = await urqlClient.mutation<TrackDeliveryCompleteMutation>(
        TrackDeliveryCompleteDocument,
        {
          notificationId,
          totalRecipients,
          successCount,
          failureCount,
          errors,
        },
      );

      if (result.error) {
        console.error("Failed to track delivery completion:", result.error);
        return false;
      }

      return result.data?.trackDeliveryComplete?.success ?? false;
    } catch (error) {
      console.error("Failed to track delivery completion:", error);
      return false;
    }
  }

  /**
   * Track delivery failure via urql mutation
   */
  async trackDeliveryFailure(
    notificationId: string,
    error: string,
  ): Promise<boolean> {
    try {
      const result = await urqlClient.mutation<TrackDeliveryFailureMutation>(
        TrackDeliveryFailureDocument,
        { notificationId, error },
      );

      if (result.error) {
        console.error("Failed to track delivery failure:", result.error);
        return false;
      }

      return result.data?.trackDeliveryFailure?.success ?? false;
    } catch (err) {
      console.error("Failed to track delivery failure:", err);
      return false;
    }
  }
}

// =============================================================================
// Main Function
// =============================================================================

function main(): () => void {
  const supabase = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!,
    undefined,
    { realtime: { params: { eventsPerSecond: 2 } } },
  );

  const notificationService = new NotificationService();

  const channel = supabase
    .channel("public:Notification:insert")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "Notification" },
      (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
        void (async () => {
          const id = payload.new.id;
          if (!id) {
            console.error("Missing notification ID in payload");
            return;
          }
          try {
            await notificationService.trackDeliveryStart(id);

            const mobile =
              await notificationService.sendMobileNotifications(id);
            console.log("Delivery summary:", { mobile });

            await notificationService.trackDeliveryComplete(
              id,
              mobile.total,
              mobile.sent,
              mobile.failed,
              mobile.success ? null : "Some deliveries failed",
            );
          } catch (err) {
            console.error("Failed handling Notification INSERT:", err);

            await notificationService.trackDeliveryFailure(
              id,
              err instanceof Error ? err.message : String(err),
            );
          }
        })();
      },
    )
    .subscribe((status) => {
      console.log("Realtime channel status:", status);
    });

  const cleanup = () => {
    void (async () => {
      console.log("Shutting down...");
      await supabase.removeChannel(channel);
      process.exit(0);
    })();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  return cleanup;
}

// =============================================================================
// Entry Point
// =============================================================================

try {
  main();
  console.log("Notification sender service started with urql");
} catch (err) {
  console.error("Failed to start notification sender:", err);
  process.exit(1);
}

// Export for testing
export { NotificationService, main };
