import { PrismaClient as _PrismaClient } from "./prisma/lib/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

let _prisma: _PrismaClient | undefined;

const getPrisma = (): _PrismaClient => {
  _prisma ??= new _PrismaClient({
    adapter
  });
  return _prisma;
}

export const db = getPrisma();