import { describe, expect, it } from "bun:test";
import { CoinTransactionMapper } from "../mappers/CoinTransactionMapper";
import type { CoinTransaction } from "@mirai-app/use-cases";

describe("[UNIT] CoinTransactionMapper", () => {
  const createPrismaTransaction = (
    overrides: Partial<{
      id: string;
      groupId: string;
      amount: number;
      reason: string | null;
      adminId: string;
      createdAt: Date;
      updatedAt: Date;
      group: {
        id: string;
        name: string;
        coins: number;
      } | null;
      admin: {
        id: string;
        firstName: string | null;
        lastName: string | null;
      } | null;
    }> = {},
  ) => ({
    id: "tx-123",
    groupId: "group-456",
    amount: 100,
    reason: "Reward for challenge",
    adminId: "admin-789",
    createdAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T11:00:00Z"),
    group: {
      id: "group-456",
      name: "Winners",
      coins: 500,
    },
    admin: {
      id: "admin-789",
      firstName: "Ada",
      lastName: "Lovelace",
    },
    ...overrides,
  });

  const createDomainTransaction = (
    overrides: Partial<CoinTransaction> = {},
  ): CoinTransaction => ({
    id: "tx-123",
    groupId: "group-456",
    amount: 100,
    reason: "Reward for challenge",
    adminId: "admin-789",
    createdAt: new Date("2026-01-01T10:00:00Z"),
    group: {
      id: "group-456",
      name: "Winners",
      coins: 500,
    },
    admin: {
      id: "admin-789",
      firstName: "Ada",
      lastName: "Lovelace",
    },
    ...overrides,
  });

  describe("toDomain", () => {
    it("should map full Prisma transaction record to domain transaction", () => {
      const prismaTransaction = createPrismaTransaction();

      const domainTransaction =
        CoinTransactionMapper.toDomain(prismaTransaction);

      expect(domainTransaction.id).toBe("tx-123");
      expect(domainTransaction.groupId).toBe("group-456");
      expect(domainTransaction.amount).toBe(100);
      expect(domainTransaction.reason).toBe("Reward for challenge");
      expect(domainTransaction.adminId).toBe("admin-789");
      expect(domainTransaction.createdAt).toEqual(
        new Date("2026-01-01T10:00:00Z"),
      );
      expect(domainTransaction.group).toEqual({
        id: "group-456",
        name: "Winners",
        coins: 500,
      });
      expect(domainTransaction.admin).toEqual({
        id: "admin-789",
        firstName: "Ada",
        lastName: "Lovelace",
      });
    });

    it("should map null reason as null", () => {
      const prismaTransaction = createPrismaTransaction({ reason: null });

      const domainTransaction =
        CoinTransactionMapper.toDomain(prismaTransaction);

      expect(domainTransaction.reason).toBeNull();
    });

    it("should map null relations to undefined", () => {
      const prismaTransaction = createPrismaTransaction({
        group: null,
        admin: null,
      });

      const domainTransaction =
        CoinTransactionMapper.toDomain(prismaTransaction);

      expect(domainTransaction.group).toBeUndefined();
      expect(domainTransaction.admin).toBeUndefined();
    });

    it("should map missing relations to undefined", () => {
      const { group, admin, ...prismaTransactionWithoutRelations } =
        createPrismaTransaction();

      const domainTransaction = CoinTransactionMapper.toDomain(
        prismaTransactionWithoutRelations,
      );

      expect(domainTransaction.group).toBeUndefined();
      expect(domainTransaction.admin).toBeUndefined();
    });
  });

  describe("toPrismaCreate", () => {
    it("should map domain transaction to Prisma create input", () => {
      const domainTransaction = createDomainTransaction();

      const prismaData =
        CoinTransactionMapper.toPrismaCreate(domainTransaction);

      expect(prismaData.id).toBe("tx-123");
      expect(prismaData.groupId).toBe("group-456");
      expect(prismaData.amount).toBe(100);
      expect(prismaData.reason).toBe("Reward for challenge");
      expect(prismaData.adminId).toBe("admin-789");
      expect(prismaData.createdAt).toEqual(new Date("2026-01-01T10:00:00Z"));
    });

    it("should normalize undefined reason to null", () => {
      const domainTransaction = createDomainTransaction({ reason: undefined });

      const prismaData =
        CoinTransactionMapper.toPrismaCreate(domainTransaction);

      expect(prismaData.reason).toBeNull();
    });
  });

  describe("toPrismaUpdate", () => {
    it("should map mutable fields and set updatedAt", () => {
      const domainTransaction = createDomainTransaction();

      const before = Date.now();
      const prismaData =
        CoinTransactionMapper.toPrismaUpdate(domainTransaction);
      const after = Date.now();

      expect(prismaData.amount).toBe(100);
      expect(prismaData.reason).toBe("Reward for challenge");
      expect(prismaData.updatedAt).toBeInstanceOf(Date);
      expect(prismaData.updatedAt?.getTime()).toBeGreaterThanOrEqual(before);
      expect(prismaData.updatedAt?.getTime()).toBeLessThanOrEqual(after);
    });

    it("should normalize nullish reason to null", () => {
      const withUndefinedReason = CoinTransactionMapper.toPrismaUpdate(
        createDomainTransaction({ reason: undefined }),
      );
      const withNullReason = CoinTransactionMapper.toPrismaUpdate(
        createDomainTransaction({ reason: null }),
      );

      expect(withUndefinedReason.reason).toBeNull();
      expect(withNullReason.reason).toBeNull();
    });

    it("should not include immutable fields in update input", () => {
      const domainTransaction = createDomainTransaction();

      const prismaData =
        CoinTransactionMapper.toPrismaUpdate(domainTransaction);

      expect("id" in prismaData).toBe(false);
      expect("groupId" in prismaData).toBe(false);
      expect("adminId" in prismaData).toBe(false);
      expect("createdAt" in prismaData).toBe(false);
    });
  });
});
