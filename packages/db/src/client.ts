import { PrismaClient as _PrismaClient } from "../prisma/lib";

let _prisma: _PrismaClient | undefined;

const getPrisma = (): _PrismaClient => {
  _prisma ??= new _PrismaClient();
  return _prisma;
}

export const db = getPrisma();