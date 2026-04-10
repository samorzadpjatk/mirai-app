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
 * 2. Calls the GraphQL API to track delivery status
 * 3. Sends mobile push notifications via the notification service
 * 4. Tracks delivery completion or failure
 *
 * ## Environment Variables
 *
 * - `GRAPHQL_ENDPOINT` - GraphQL API endpoint (e.g., http://localhost:4000/graphql)
 * - `SUPABASE_URL` - Supabase project URL
 * - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
 *
 * ## GraphQL Mutations Used
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

// =============================================================================
// Types
// =============================================================================

interface NotificationRow {
  id: string;
}

interface SendMobileNotificationsResult {
  success: boolean;
  sent: number;
  failed: number;
  total: number;
}

interface TrackDeliveryResult {
  success: boolean;
}

// =============================================================================
// GraphQL Client
// =============================================================================

/**
 * Simple GraphQL client for making mutations to the notification API
 */
class GraphQLClient {
  private endpoint: string;
  private authToken: string;

  constructor(endpoint: string, authToken: string) {
    this.endpoint = endpoint;
    this.authToken = authToken;
  }

  async mutate<T>(
    mutation: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`,
      );
    }

    return result.data as T;
  }
}

// =============================================================================
// GraphQL Mutations
// =============================================================================

const TRACK_DELIVERY_START_MUTATION = `
  mutation TrackDeliveryStart($input: TrackDeliveryStartInput!) {
    trackDeliveryStart(input: $input) {
      success
    }
  }
`;

const SEND_MOBILE_NOTIFICATIONS_MUTATION = `
  mutation SendMobileNotifications($input: SendMobileNotificationsInput!) {
    sendMobileNotifications(input: $input) {
      success
      sent
      failed
      total
    }
  }
`;

const TRACK_DELIVERY_COMPLETE_MUTATION = `
  mutation TrackDeliveryComplete($input: TrackDeliveryCompleteInput!) {
    trackDeliveryComplete(input: $input) {
      success
    }
  }
`;

const TRACK_DELIVERY_FAILURE_MUTATION = `
  mutation TrackDeliveryFailure($input: TrackDeliveryFailureInput!) {
    trackDeliveryFailure(input: $input) {
      success
    }
  }
`;

// =============================================================================
// Notification Service
// =============================================================================

class NotificationGraphQLService {
  private client: GraphQLClient;

  constructor(endpoint: string, authToken: string) {
    this.client = new GraphQLClient(endpoint, authToken);
  }

  async trackDeliveryStart(
    notificationId: string,
  ): Promise<TrackDeliveryResult> {
    return this.client.mutate<TrackDeliveryResult>(
      TRACK_DELIVERY_START_MUTATION,
      { input: { notificationId } },
    );
  }

  async sendMobileNotifications(
    notificationId: string,
  ): Promise<SendMobileNotificationsResult> {
    return this.client.mutate<SendMobileNotificationsResult>(
      SEND_MOBILE_NOTIFICATIONS_MUTATION,
      { input: { notificationId } },
    );
  }

  async trackDeliveryComplete(
    notificationId: string,
    totalRecipients: number,
    successCount: number,
    failureCount: number,
    errors: string | null,
  ): Promise<TrackDeliveryResult> {
    return this.client.mutate<TrackDeliveryResult>(
      TRACK_DELIVERY_COMPLETE_MUTATION,
      {
        input: {
          notificationId,
          totalRecipients,
          successCount,
          failureCount,
          errors,
        },
      },
    );
  }

  async trackDeliveryFailure(
    notificationId: string,
    error: string,
  ): Promise<TrackDeliveryResult> {
    return this.client.mutate<TrackDeliveryResult>(
      TRACK_DELIVERY_FAILURE_MUTATION,
      { input: { notificationId, error } },
    );
  }
}

// =============================================================================
// Main Function
// =============================================================================

function main(): () => void {
  const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!GRAPHQL_ENDPOINT) throw new Error("Missing env: GRAPHQL_ENDPOINT");
  if (!SUPABASE_URL) throw new Error("Missing env: SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    undefined,
    { realtime: { params: { eventsPerSecond: 2 } } },
  );

  const notificationService = new NotificationGraphQLService(
    GRAPHQL_ENDPOINT,
    SUPABASE_SERVICE_ROLE_KEY,
  );

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
} catch (err) {
  console.error(err);
  process.exit(1);
}

// Export for testing
export { GraphQLClient, NotificationGraphQLService, main };
