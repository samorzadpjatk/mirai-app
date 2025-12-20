import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { db } from "@integral-2025-app/db";
import { startWsServer } from "./server";
import { sendMobileNotifications } from "./mobileSender";

interface NotificationRow {
  id: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  await startWsServer();

  const SUPABASE_URL = requireEnv("SUPABASE_URL");
  const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 2 } },
  });

  const channel = supabase
    .channel("public:Notification:insert")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "Notification" },
      (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
        void (async () => {
          try {
            const id = payload.new.id;
            await db.$transaction(async (tx) => {
              const mobile = await sendMobileNotifications(tx, id);
              console.log("Delivery summary:", { mobile });
            });
          } catch (err) {
            console.error("Failed handling Notification INSERT:", err);
          }
        })();
      },
    )
    .subscribe((_status) => {
      console.log("Realtime channel status:", _status);
    });

  process.on("SIGINT", () => {
    void (async () => {
      console.log("Shutting down...");
      await supabase.removeChannel(channel);
      process.exit(0);
    })();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
