import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof createDrizzleDb> | undefined;

const createDrizzleDb = (databaseUrl: string) => {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
};

export const createDb = (databaseUrl: string) => {
  _db ??= createDrizzleDb(databaseUrl);
  return _db;
};

export type DB = ReturnType<typeof createDb>;
export type TransactionDB = Parameters<Parameters<DB["transaction"]>[0]>[0];
