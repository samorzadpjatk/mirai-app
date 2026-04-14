/**
 * Notification Sender Service
 *
 * Background service that listens for new notifications via Supabase Realtime
 * and sends mobile push notifications via the GraphQL API.
 *
 * ## Architecture
 *
 * This service is designed to run as a background worker with Effect at the boundary:
 * - Uses Effect for structured error handling and resource management
 * - Effect.runPromise at the boundary for composable effects
 * - Maintains all existing functionality with improved error handling
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
import { Effect, Console } from "effect";
import { serverLogger } from "@mirai-app/shared";

// =============================================================================
// Environment Configuration
// =============================================================================

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// =============================================================================
// Error Types
// =============================================================================

class MissingEnvError extends Error {
  readonly _tag = "MissingEnvError";
  constructor(varName: string) {
    super(`Missing environment variable: ${varName}`);
  }
}

class NotificationServiceError extends Error {
  readonly _tag = "NotificationServiceError";
  constructor(
    public readonly operation: string,
    public override readonly cause: unknown,
  ) {
    super(`Notification service error (${operation}): ${String(cause)}`);
  }
}

// =============================================================================
// Environment Validation Effect
// =============================================================================

const validateEnvironment = Effect.gen(function* () {
  if (!GRAPHQL_ENDPOINT) {
    return yield* Effect.fail(new MissingEnvError("GRAPHQL_ENDPOINT"));
  }
  if (!SUPABASE_URL) {
    return yield* Effect.fail(new MissingEnvError("SUPABASE_URL"));
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return yield* Effect.fail(new MissingEnvError("SUPABASE_SERVICE_ROLE_KEY"));
  }
  yield* Console.log("✓ Environment variables validated");
  return { GRAPHQL_ENDPOINT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY };
});

// =============================================================================
// GraphQL Client (urql)
// =============================================================================

/**
 * Create urql client with service account authentication
 */
const createUrqlClientEffect = (endpoint: string, apiKey: string) =>
  Effect.sync(() =>
    createUrqlClient({
      url: endpoint,
      exchanges: [cacheExchange, fetchExchange],
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Service-Account": "notification-sender",
        },
      },
    }),
  );

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
  constructor(
    private readonly urqlClient: ReturnType<typeof createUrqlClient>,
  ) {}

  /**
   * Track delivery start via urql mutation
   */
  async trackDeliveryStart(notificationId: string): Promise<boolean> {
    try {
      const result = await this.urqlClient.mutation<TrackDeliveryStartMutation>(
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
      const result =
        await this.urqlClient.mutation<SendMobileNotificationsMutation>(
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
      const result =
        await this.urqlClient.mutation<TrackDeliveryCompleteMutation>(
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
      const result =
        await this.urqlClient.mutation<TrackDeliveryFailureMutation>(
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
// Effect-based Notification Handler
// =============================================================================

/**
 * Handle a notification INSERT event using Effect
 */
const handleNotificationInsert = (
  notificationService: NotificationService,
  payload: RealtimePostgresInsertPayload<NotificationRow>,
) => {
  const id = payload.new.id;

  if (!id) {
    return Effect.gen(function* () {
      yield* Console.error("Missing notification ID in payload");
      return yield* Effect.fail(
        new NotificationServiceError("handleInsert", "Missing ID"),
      );
    });
  }

  return Effect.gen(function* () {
    yield* Console.log(`Processing notification: ${id}`);

    // Track delivery start
    const startResult = yield* Effect.tryPromise({
      try: () => notificationService.trackDeliveryStart(id),
      catch: (error) =>
        new NotificationServiceError("trackDeliveryStart", error),
    });

    if (!startResult) {
      yield* Console.error(`Failed to track delivery start for ${id}`);
    }

    // Send mobile notifications
    const mobileResult = yield* Effect.tryPromise({
      try: () => notificationService.sendMobileNotifications(id),
      catch: (error) =>
        new NotificationServiceError("sendMobileNotifications", error),
    });

    yield* Console.log("Delivery summary:", mobileResult);

    // Track completion
    const completeResult = yield* Effect.tryPromise({
      try: () =>
        notificationService.trackDeliveryComplete(
          id,
          mobileResult.total,
          mobileResult.sent,
          mobileResult.failed,
          mobileResult.success ? null : "Some deliveries failed",
        ),
      catch: (error) =>
        new NotificationServiceError("trackDeliveryComplete", error),
    });

    if (!completeResult) {
      yield* Console.error(`Failed to track delivery completion for ${id}`);
    }

    return { success: true, id };
  }).pipe(
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        yield* Console.error("Failed handling Notification INSERT:", error);

        // Try to track the failure
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        yield* Effect.tryPromise({
          try: () => notificationService.trackDeliveryFailure(id, errorMessage),
          catch: () => undefined, // Ignore tracking failure errors
        });

        return { success: false, id, error: errorMessage };
      }),
    ),
  );
};

// =============================================================================
// Main Program with Effect
// =============================================================================

/**
 * Main Effect program that sets up and runs the notification sender
 */
const notificationSenderProgram = Effect.gen(function* () {
  // Validate environment
  const env = yield* validateEnvironment;

  // Create clients
  const urqlClient = yield* createUrqlClientEffect(
    env.GRAPHQL_ENDPOINT,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const notificationService = new NotificationService(urqlClient);

  // Create Supabase client
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    undefined,
    { realtime: { params: { eventsPerSecond: 2 } } },
  );

  // Set up realtime subscription
  const channel = supabase
    .channel("public:Notification:insert")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "Notification" },
      (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
        // Run the handler in Effect
        void Effect.runPromise(
          handleNotificationInsert(notificationService, payload),
        );
      },
    )
    .subscribe((status) => {
      serverLogger.info("Realtime channel status", { status });
    });

  yield* Console.log(
    "Notification sender service started with Effect and urql",
  );

  // Return cleanup function
  return {
    cleanup: () =>
      Effect.gen(function* () {
        yield* Console.log("Shutting down...");
        yield* Effect.tryPromise({
          try: () => supabase.removeChannel(channel),
          catch: (error) => new NotificationServiceError("cleanup", error),
        });
        yield* Console.log("Shutdown complete");
      }),
  };
});

// =============================================================================
// Entry Point - Run Effects at Boundary
// =============================================================================

const program = Effect.gen(function* () {
  const { cleanup } = yield* notificationSenderProgram;

  // Set up signal handlers
  const handleSignal = (signal: string) =>
    Effect.gen(function* () {
      yield* Console.log(
        `\nReceived ${signal}, initiating graceful shutdown...`,
      );
      yield* cleanup();
      process.exit(0);
    });

  process.on("SIGTERM", () => {
    void Effect.runPromise(handleSignal("SIGTERM"));
  });

  process.on("SIGINT", () => {
    void Effect.runPromise(handleSignal("SIGINT"));
  });

  // Keep the program running
  yield* Effect.sleep(Infinity);
});

/**
 * Run the notification sender application
 */
export async function run(): Promise<void> {
  await Effect.runPromise(program);
}

// Run the program at the boundary only when executed directly
if (import.meta.main) {
  Effect.runPromise(program).catch((error) => {
    console.error("Failed to start notification sender:", error);
    process.exit(1);
  });
}

// Export for testing
export {
  NotificationService,
  notificationSenderProgram,
  handleNotificationInsert,
  MissingEnvError,
  NotificationServiceError,
};
