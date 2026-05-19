import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof createDrizzleDb> | undefined;
let _client: ReturnType<typeof postgres> | undefined;

const createDrizzleDb = (databaseUrl: string) => {
  _client = postgres(databaseUrl);
  return drizzle(_client, { schema });
};

export const createDb = (databaseUrl: string) => {
  _db ??= createDrizzleDb(databaseUrl);
  return _db;
};

export const closeDb = async () => {
  if (_client) {
    await _client.end();
    _client = undefined;
    _db = undefined;
  }
};

export type DB = ReturnType<typeof createDb>;
export type TransactionDB = Parameters<Parameters<DB["transaction"]>[0]>[0];
