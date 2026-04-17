import { Effect } from "effect";
import { DatabaseError, GroupId } from "@mirai-app/domain";
import {
  type ICoinTransactionPort,
  type CoinTransaction,
} from "@mirai-app/use-cases";

/**
 * In-Memory CoinTransaction Gateway
 *
 * Implements ICoinTransactionPort using in-memory Map storage for testing.
 */
export class InMemoryCoinTransactionGateway implements ICoinTransactionPort {
  private transactions: Map<string, CoinTransaction> = new Map();

  findById(
    id: string,
  ): Effect.Effect<CoinTransaction | null, DatabaseError, never> {
    return Effect.succeed(this.transactions.get(id) ?? null);
  }

  findByGroupId(
    groupId: string,
  ): Effect.Effect<CoinTransaction[], DatabaseError, never> {
    const result = Array.from(this.transactions.values()).filter(
      (t) => t.groupId === groupId,
    );
    return Effect.succeed(
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<CoinTransaction[], DatabaseError, never> {
    const result = Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId,
    );
    return Effect.succeed(
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { transactions: CoinTransaction[]; total: number },
    DatabaseError,
    never
  > {
    const allForTrip = Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId,
    );
    const sorted = allForTrip.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const paginated = sorted.slice(params.offset, params.offset + params.limit);
    return Effect.succeed({
      transactions: paginated,
      total: allForTrip.length,
    });
  }

  findByTripIdAndGroupId(
    tripId: string,
    groupId: string,
  ): Effect.Effect<CoinTransaction[], DatabaseError, never> {
    const result = Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId && t.groupId === groupId,
    );
    return Effect.succeed(
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  create(
    transaction: CoinTransaction,
  ): Effect.Effect<CoinTransaction, DatabaseError, never> {
    this.transactions.set(transaction.id, transaction);
    return Effect.succeed(transaction);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    this.transactions.delete(id);
    return Effect.succeed(undefined);
  }

  sumByGroupId(groupId: string): Effect.Effect<number, DatabaseError, never> {
    const total = Array.from(this.transactions.values())
      .filter((t) => t.groupId === groupId)
      .reduce((sum, t) => sum + t.amount, 0);
    return Effect.succeed(total);
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    const count = Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId,
    ).length;
    return Effect.succeed(count);
  }

  sumPositiveByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    const total = Array.from(this.transactions.values())
      .filter((t) => t.tripId === tripId && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    return Effect.succeed(total);
  }

  sumNegativeByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    const total = Array.from(this.transactions.values())
      .filter((t) => t.tripId === tripId && t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
    return Effect.succeed(total);
  }

  getMostActiveAdminStats(tripId: string): Effect.Effect<
    Array<{
      adminId: string;
      totalAmount: number;
      transactionCount: number;
    }>,
    DatabaseError,
    never
  > {
    const tripTransactions = Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId && t.adminId !== null,
    );

    const adminStats = new Map<
      string,
      { adminId: string; totalAmount: number; transactionCount: number }
    >();

    for (const t of tripTransactions) {
      if (!t.adminId) continue;
      const existing = adminStats.get(t.adminId);
      if (existing) {
        existing.totalAmount += Math.abs(t.amount);
        existing.transactionCount += 1;
      } else {
        adminStats.set(t.adminId, {
          adminId: t.adminId,
          totalAmount: Math.abs(t.amount),
          transactionCount: 1,
        });
      }
    }

    const result = Array.from(adminStats.values()).sort(
      (a, b) => b.transactionCount - a.transactionCount,
    );
    return Effect.succeed(result);
  }

  getRichestGroup(
    tripId: string,
  ): Effect.Effect<
    { groupId: GroupId; totalCoins: number } | null,
    DatabaseError,
    never
  > {
    const tripTransactions = Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId,
    );

    const groupTotals = new Map<string, number>();
    for (const t of tripTransactions) {
      const current = groupTotals.get(t.groupId) ?? 0;
      groupTotals.set(t.groupId, current + t.amount);
    }

    let richestGroup: { groupId: GroupId; totalCoins: number } | null = null;
    for (const [groupId, totalCoins] of groupTotals.entries()) {
      if (!richestGroup || totalCoins > richestGroup.totalCoins) {
        richestGroup = { groupId: groupId as GroupId, totalCoins };
      }
    }

    return Effect.succeed(richestGroup);
  }

  findRecentByTripId(
    tripId: string,
    limit: number,
  ): Effect.Effect<CoinTransaction[], DatabaseError, never> {
    const result = Array.from(this.transactions.values())
      .filter((t) => t.tripId === tripId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return Effect.succeed(result);
  }

  // Test helper methods
  clear(): void {
    this.transactions.clear();
  }

  seed(transactions: CoinTransaction[]): void {
    for (const transaction of transactions) {
      this.transactions.set(transaction.id, transaction);
    }
  }

  getAll(): CoinTransaction[] {
    return Array.from(this.transactions.values());
  }

  getByGroupId(groupId: string): CoinTransaction[] {
    return Array.from(this.transactions.values()).filter(
      (t) => t.groupId === groupId,
    );
  }

  getByTripId(tripId: string): CoinTransaction[] {
    return Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId,
    );
  }
}
