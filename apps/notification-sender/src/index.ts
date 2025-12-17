import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import webpush from "web-push";
import { db } from "@integral-2025-app/db";
import { startWsServer } from "./server";
import { sendNotifications } from "./sender";
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
  const VAPID_PUBLIC_KEY = requireEnv("VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE_KEY = requireEnv("VAPID_PRIVATE_KEY");
  const VAPID_EMAIL = requireEnv("VAPID_EMAIL");
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );

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
      async (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
        try {
          const id = (payload.new as NotificationRow).id;
          await db.$transaction(async (tx) => {
            const web = await sendNotifications(tx, id);
            const mobile = await sendMobileNotifications(tx, id);
            console.log("Delivery summary:", { web, mobile });
          });
        } catch (err) {
          console.error("Failed handling Notification INSERT:", err);
        }
      },
    )
    .subscribe((status) => {
      console.log("Realtime channel status:", status);
    });

  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await supabase.removeChannel(channel);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
