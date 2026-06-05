import { logger } from "@mirai-app/orpc";
import { getServiceORPCClient } from "@mirai-app/orpc/client";
import { createSupabaseClient as createClient } from "@mirai-app/supabase";
import type { RealtimePostgresInsertPayload } from "@mirai-app/supabase";
import { env } from "bun";

interface NotificationRow {
  id: string;
}

export function main() {
  const TRPC_HOST = env.TRPC_HOST;
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const SERVICE_ACCOUNT_TOKEN = env.SERVICE_ACCOUNT_TOKEN;

  if (!TRPC_HOST) throw new Error("Missing env: TRPC_HOST");
  if (!SUPABASE_URL) throw new Error("Missing env: SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
  if (!SERVICE_ACCOUNT_TOKEN) throw new Error("Missing env: SERVICE_ACCOUNT_TOKEN");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, undefined, {
    realtime: { params: { eventsPerSecond: 2 } },
  });

  const { client, cleanup } = getServiceORPCClient(
    `http://${TRPC_HOST}/internal/trpc`,
    `ws://${TRPC_HOST}/internal/trpc`,
    SERVICE_ACCOUNT_TOKEN,
  );

  const handleNotification = async (
    payload: RealtimePostgresInsertPayload<NotificationRow>,
  ): Promise<void> => {
    const id = payload.new.id;
    try {
      await client.notificationSender.trackDeliveryStart({
        notificationId: id,
      });

      const mobile = await client.notificationSender.sendMobileNotifications({
        notificationId: id,
      });
      logger.info({ mobile }, "Delivery summary");

      await client.notificationSender.trackDeliveryComplete({
        notificationId: id,
        totalRecipients: mobile.total,
        successCount: mobile.sent,
        failureCount: mobile.failed,
        errors: mobile.success ? null : "Some deliveries failed",
      });
    } catch (err) {
      logger.error(err, "Failed handling Notification INSERT");

      try {
        await client.notificationSender.trackDeliveryFailure({
          notificationId: id,
          error: err instanceof Error ? err : String(err),
        });
      } catch (trackErr) {
        logger.error(trackErr, "Failed to track delivery failure");
      }
    }
  };

  const channel = supabase
    .channel("public:Notification:insert")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "Notification" },
      (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
        // Intentionally not awaiting - Realtime callback must be synchronous

        handleNotification(payload);
      },
    )
    .subscribe((status) => {
      logger.info({ status }, "Realtime channel status");
    });

  process.on("SIGINT", () => {
    logger.info("Shutting down");
    void supabase.removeChannel(channel);
    void cleanup();
    process.exit(0);
  });
}

if (import.meta.main) {
  try {
    main();
  } catch (err) {
    logger.error(err, "Notification sender fatal error");
    process.exit(1);
  }
}
