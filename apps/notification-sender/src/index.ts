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
 * 2. Calls the GraphQL API using the typed SDK to track delivery status
 * 3. Sends mobile push notifications via the notification service
 * 4. Tracks delivery completion or failure
 *
 * ## Environment Variables
 *
 * - `GRAPHQL_ENDPOINT` - GraphQL API endpoint (e.g., http://localhost:4000/graphql)
 * - `SUPABASE_URL` - Supabase project URL
 * - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
 *
 * ## GraphQL Mutations Used (via SDK)
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
import { GraphQLClient } from "graphql-request";
import { getSdk } from "@mirai-app/graphql-types/sdk";

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
// GraphQL SDK Client
// =============================================================================

/**
 * Create GraphQL client with service account authentication
 */
const graphQLClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "X-Service-Account": "notification-sender",
  },
});

/**
 * Typed GraphQL SDK for notification operations
 */
const sdk = getSdk(graphQLClient);

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
 * Notification service using the typed GraphQL SDK
 * Replaces the previous custom GraphQL client with full type safety
 */
class NotificationSDKService {
  /**
   * Track delivery start via SDK
   */
  async trackDeliveryStart(notificationId: string): Promise<boolean> {
    try {
      const result = await sdk.TrackDeliveryStart({
        input: { notificationId },
      });
      return result.trackDeliveryStart?.success ?? false;
    } catch (error) {
      console.error("Failed to track delivery start:", error);
      return false;
    }
  }

  /**
   * Send mobile notifications via SDK
   */
  async sendMobileNotifications(
    notificationId: string,
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    total: number;
  }> {
    try {
      const result = await sdk.SendMobileNotifications({
        input: { notificationId },
      });
      const payload = result.sendMobileNotifications;
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
   * Track delivery completion via SDK
   */
  async trackDeliveryComplete(
    notificationId: string,
    totalRecipients: number,
    successCount: number,
    failureCount: number,
    errors: string | null,
  ): Promise<boolean> {
    try {
      const result = await sdk.TrackDeliveryComplete({
        input: {
          notificationId,
          totalRecipients,
          successCount,
          failureCount,
          errors,
        },
      });
      return result.trackDeliveryComplete?.success ?? false;
    } catch (error) {
      console.error("Failed to track delivery completion:", error);
      return false;
    }
  }

  /**
   * Track delivery failure via SDK
   */
  async trackDeliveryFailure(
    notificationId: string,
    error: string,
  ): Promise<boolean> {
    try {
      const result = await sdk.TrackDeliveryFailure({
        input: { notificationId, error },
      });
      return result.trackDeliveryFailure?.success ?? false;
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
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    undefined,
    { realtime: { params: { eventsPerSecond: 2 } } },
  );

  const notificationService = new NotificationSDKService();

  const channel = supabase
    .channel("public:Notification:insert")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "Notification" },
      (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
        void (async () => {
          const id = payload.new.id;
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
  console.log("Notification sender service started with GraphQL SDK");
} catch (err) {
  console.error("Failed to start notification sender:", err);
  process.exit(1);
}

// Export for testing
export { NotificationSDKService, main };
