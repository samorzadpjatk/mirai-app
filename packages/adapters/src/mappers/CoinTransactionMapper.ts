import type { CoinTransaction } from "@mirai-app/use-cases";

// Prisma types (from generated client)
type PrismaCoinTransaction = {
  id: string;
  groupId: string;
  amount: number;
  reason: string | null;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaCoinTransactionCreateInput = {
  id?: string;
  groupId: string;
  amount: number;
  reason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  adminId: string;
};

type PrismaCoinTransactionUpdateInput = {
  groupId?: string;
  amount?: number;
  reason?: string | null;
  updatedAt?: Date;
  adminId?: string;
};

/**
 * CoinTransactionMapper
 *
 * Maps between Prisma database records and CoinTransaction entities.
 * This is a pure function with no side effects.
 *
 * Note: CoinTransaction is a use-case level entity (not domain entity) that
 * handles coin transaction data with optional relations for group and admin.
 */
export class CoinTransactionMapper {
  /**
   * Convert a Prisma CoinTransaction record to a CoinTransaction entity
   *
   * This handles both raw Prisma records and records with included relations
   * from queries that select group and admin data.
   */
  static toDomain(
    record: PrismaCoinTransaction & {
      group?: {
        id: string;
        name: string;
        coins: number;
      } | null;
      admin?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
      } | null;
    },
  ): CoinTransaction {
    return {
      id: record.id,
      groupId: record.groupId,
      amount: record.amount,
      reason: record.reason,
      adminId: record.adminId,
      createdAt: record.createdAt,
      group: record.group
        ? {
            id: record.group.id,
            name: record.group.name,
            coins: record.group.coins,
          }
        : undefined,
      admin: record.admin
        ? {
            id: record.admin.id,
            firstName: record.admin.firstName,
            lastName: record.admin.lastName,
          }
        : undefined,
    };
  }

  /**
   * Convert a CoinTransaction entity to Prisma create input
   *
   * Note: This uses the unchecked input format with direct foreign keys
   * (groupId, adminId) rather than nested relation inputs.
   */
  static toPrismaCreate(
    entity: CoinTransaction,
  ): PrismaCoinTransactionCreateInput {
    return {
      id: entity.id,
      groupId: entity.groupId,
      amount: entity.amount,
      reason: entity.reason ?? null,
      adminId: entity.adminId,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Convert a CoinTransaction entity to Prisma update input
   *
   * Note: Updates typically only allow changing amount and reason.
   * Foreign keys (groupId, adminId) and createdAt are generally immutable.
   */
  static toPrismaUpdate(
    entity: CoinTransaction,
  ): PrismaCoinTransactionUpdateInput {
    return {
      amount: entity.amount,
      reason: entity.reason ?? null,
      updatedAt: new Date(),
    };
  }
}
