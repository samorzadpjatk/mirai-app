import { runMigrations } from "@mirai-app/db";
import { logger } from "@mirai-app/shared/utils";
import { serverConfig } from "./config";
import { createServer } from "./server";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const migrationsFolder = process.env.MIGRATIONS_FOLDER;

  await runMigrations(databaseUrl, migrationsFolder, logger);

  const server = createServer(serverConfig);
  server.start();
}

void main();
