import { createSupabaseClient as createClient } from "@integral-2025-app/supabase";
import type { RealtimePostgresInsertPayload } from "@integral-2025-app/supabase";
import { getTRPCClient } from "@integral-2025-app/trpc/client";
import { createInactivityScheduler } from "./utils/scheduler";

interface NotificationRow {
  id: string;
}

function main() {
  const TRPC_HOST = process.env.TRPC_HOST;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    undefined,
    { realtime: { params: { eventsPerSecond: 2 } } },
  );

  const { client, cleanup } = getTRPCClient(
    `http://${TRPC_HOST}/api/trpc`,
    `ws://${TRPC_HOST}/api/trpc`,
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
            await client.notificationSender.trackDeliveryStart.mutate({
              notificationId: id,
            });

            const mobile = await client.notificationSender.sendMobileNotifications.mutate({
              notificationId: id,
            });
            console.log("Delivery summary:", { mobile });

            await client.notificationSender.trackDeliveryComplete.mutate({
              notificationId: id,
              totalRecipients: mobile.total,
              successCount: mobile.sent,
              failureCount: mobile.failed,
              errors: mobile.success ? null : "Some deliveries failed",
            });
          } catch (err) {
            console.error("Failed handling Notification INSERT:", err);

            await client.notificationSender.trackDeliveryFailure.mutate({
              notificationId: id,
              error: err instanceof Error ? err : String(err),
            });
          }
        })();
      },
    )
    .subscribe((status) => {
      console.log("Realtime channel status:", status);
    });

  // Start the inactivity checker scheduler (runs every 5 minutes)
  const inactivityScheduler = createInactivityScheduler(
    async () => {
      await client.notificationSender.checkInactiveUsers.mutate();
    },
    1,
  );
  inactivityScheduler.start();

  process.on("SIGINT", () => {
    void (async () => {
      console.log("Shutting down...");
      inactivityScheduler.stop();
      await supabase.removeChannel(channel);
      await cleanup();
      process.exit(0);
    })();
  });
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
