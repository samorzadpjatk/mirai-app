import { PrismaClient as _PrismaClient } from "./prisma/lib/client";
import { PrismaPg } from "@prisma/adapter-pg";

let _prisma: _PrismaClient | undefined;

const getPrisma = (databaseUrl: string): _PrismaClient => {
  _prisma ??= new _PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
  });
  return _prisma;
}

export const createDb = (databaseUrl: string) => getPrisma(databaseUrl);