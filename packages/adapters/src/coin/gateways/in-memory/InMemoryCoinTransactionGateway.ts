import { Effect } from "effect";
import { GroupId } from "@mirai-app/domain";
import type {
  ICoinTransactionPort,
  CoinTransactionDTO,
} from "@mirai-app/domain";

/**
 * In-Memory CoinTransaction Gateway
 *
 * Implements ICoinTransactionPort using in-memory Map storage for testing.
 */
export class InMemoryCoinTransactionGateway implements ICoinTransactionPort {
  private transactions: Map<string, CoinTransactionDTO> = new Map();

  findById(id: string) {
    return Effect.succeed(this.transactions.get(id) ?? null);
  }

  findByGroupId(groupId: string) {
    const result = Array.from(this.transactions.values()).filter(
      (t) => t.groupId === groupId,
    );
    return Effect.succeed(
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByTripId(tripId: string) {
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
  ) {
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

  findByTripIdAndGroupId(tripId: string, groupId: string) {
    const result = Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId && t.groupId === groupId,
    );
    return Effect.succeed(
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  create(transaction: CoinTransactionDTO) {
    this.transactions.set(transaction.id, transaction);
    return Effect.succeed(transaction);
  }

  delete(id: string) {
    this.transactions.delete(id);
    return Effect.succeed(undefined);
  }

  sumByGroupId(groupId: string) {
    const total = Array.from(this.transactions.values())
      .filter((t) => t.groupId === groupId)
      .reduce((sum, t) => sum + t.amount, 0);
    return Effect.succeed(total);
  }

  countByTripId(tripId: string) {
    const count = Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId,
    ).length;
    return Effect.succeed(count);
  }

  sumPositiveByTripId(tripId: string) {
    const total = Array.from(this.transactions.values())
      .filter((t) => t.tripId === tripId && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    return Effect.succeed(total);
  }

  sumNegativeByTripId(tripId: string) {
    const total = Array.from(this.transactions.values())
      .filter((t) => t.tripId === tripId && t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
    return Effect.succeed(total);
  }

  getMostActiveAdminStats(tripId: string) {
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

  getRichestGroup(tripId: string) {
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
        richestGroup = { groupId: GroupId.unsafeCreate(groupId), totalCoins };
      }
    }

    return Effect.succeed(richestGroup);
  }

  findRecentByTripId(tripId: string, limit: number) {
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

  seed(transactions: CoinTransactionDTO[]): void {
    for (const transaction of transactions) {
      this.transactions.set(transaction.id, transaction);
    }
  }

  getAll(): CoinTransactionDTO[] {
    return Array.from(this.transactions.values());
  }

  getByGroupId(groupId: string): CoinTransactionDTO[] {
    return Array.from(this.transactions.values()).filter(
      (t) => t.groupId === groupId,
    );
  }

  getByTripId(tripId: string): CoinTransactionDTO[] {
    return Array.from(this.transactions.values()).filter(
      (t) => t.tripId === tripId,
    );
  }
}
