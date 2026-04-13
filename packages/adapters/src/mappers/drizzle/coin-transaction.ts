import type { CoinTransaction } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type { coinTransactions } from "@mirai-app/frameworks/drizzle/schema";

/**
 * CoinTransactionDrizzleMapper
 *
 * Maps between Drizzle database records and CoinTransaction entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 *
 * Note: CoinTransaction is a use-case level entity with optional relations.
 */
export class CoinTransactionDrizzleMapper implements DrizzleEntityMapper<
  CoinTransaction,
  typeof coinTransactions.$inferSelect,
  Partial<typeof coinTransactions.$inferInsert>
> {
  /**
   * Convert a Drizzle CoinTransaction record to an entity
   *
   * Handles both raw records and records with included relations
   */
  toDomain(
    record: typeof coinTransactions.$inferSelect & {
      groupName?: string | null;
      groupCoins?: number | null;
      adminFirstName?: string | null;
      adminLastName?: string | null;
    },
  ): CoinTransaction {
    return {
      id: record.id,
      groupId: record.groupId,
      amount: record.amount,
      reason: record.reason,
      adminId: record.adminId,
      createdAt: record.createdAt,
      group: record.groupName
        ? {
            id: record.groupId,
            name: record.groupName,
            coins: record.groupCoins ?? 0,
          }
        : undefined,
      admin:
        record.adminFirstName !== undefined
          ? {
              id: record.adminId,
              firstName: record.adminFirstName,
              lastName: record.adminLastName ?? null,
            }
          : undefined,
    };
  }

  /**
   * Convert a CoinTransaction entity to Drizzle insert input
   */
  toDrizzleInsert(
    entity: CoinTransaction,
  ): Partial<typeof coinTransactions.$inferInsert> {
    return {
      id: entity.id,
      tripId: (entity as any).tripId ?? "", // Required field in schema
      groupId: entity.groupId,
      amount: entity.amount,
      reason: entity.reason ?? null,
      adminId: entity.adminId,
      createdAt: entity.createdAt ?? new Date(),
    };
  }

  /**
   * Convert a CoinTransaction entity to Drizzle update input
   */
  toDrizzleUpdate(
    entity: CoinTransaction,
  ): Partial<typeof coinTransactions.$inferInsert> {
    return {
      amount: entity.amount,
      reason: entity.reason ?? null,
    } as Partial<typeof coinTransactions.$inferInsert>;
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<typeof coinTransactions.$inferSelect>,
  ): Partial<CoinTransaction> {
    const partial: Record<string, unknown> = {};
    if (record.id) partial.id = record.id;
    if (record.groupId) partial.groupId = record.groupId;
    if (record.amount !== undefined) partial.amount = record.amount;
    if (record.reason !== undefined) partial.reason = record.reason;
    if (record.adminId) partial.adminId = record.adminId;
    return partial as Partial<CoinTransaction>;
  }

  static readonly instance = new CoinTransactionDrizzleMapper();
}
