import { createSupabaseClient as createClient } from "@mirai-app/supabase";
import type { RealtimePostgresInsertPayload } from "@mirai-app/supabase";
import { getTRPCClient } from "@mirai-app/trpc/client";

interface NotificationRow {
  id: string;
}

export function main() {
  const TRPC_HOST = process.env.TRPC_HOST;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!TRPC_HOST) throw new Error("Missing env: TRPC_HOST");
  if (!SUPABASE_URL) throw new Error("Missing env: SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

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
      async (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
        const id = payload.new.id;
        try {
          await client.notificationSender.trackDeliveryStart.mutate({
            notificationId: id,
          });

          const mobile =
            await client.notificationSender.sendMobileNotifications.mutate({
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

          try {
            await client.notificationSender.trackDeliveryFailure.mutate({
              notificationId: id,
              error: err instanceof Error ? err : String(err),
            });
          } catch (trackErr) {
            console.error("Failed to track delivery failure:", trackErr);
          }
        }
      },
    )
    .subscribe((status) => {
      console.log("Realtime channel status:", status);
    });

  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await supabase.removeChannel(channel);
    await cleanup();
    process.exit(0);
  });
}

if (import.meta.main) {
  try {
    main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
