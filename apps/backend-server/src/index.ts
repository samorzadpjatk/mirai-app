import { logger } from "@mirai-app/common/utils";
import { runMigrations } from "@mirai-app/db";
import { serverConfig } from "./config";
import { initNotificationScheduleRunner } from "./notificationScheduleRunner";
import { createServer } from "./server";

export async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const migrationsFolder = process.env.MIGRATIONS_FOLDER;

  await runMigrations(databaseUrl, migrationsFolder, logger);

  const server = createServer(serverConfig);
  server.start();

  // Nothing else in the repository reads `notification_schedules`, so without
  // this loop every recurring notification is stored and never sent.
  initNotificationScheduleRunner({ databaseUrl });
}

void main();
