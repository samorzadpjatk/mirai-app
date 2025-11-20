export { Prisma } from "@prisma/client";

// Re-export all Prisma types
export type * from "@prisma/client";

import { PrismaClient as _PrismaClient } from "@prisma/client";

let _prisma: _PrismaClient | undefined;

export function getPrisma(): _PrismaClient {
  if (!_prisma) {
    _prisma = new _PrismaClient();
  }
  return _prisma;
}

export const db = getPrisma();
