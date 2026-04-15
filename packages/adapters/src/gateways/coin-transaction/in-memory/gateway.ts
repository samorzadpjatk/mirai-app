import type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  PaginationOptions,
  CoinStatistics,
  MostActiveAdminStat,
} from "@mirai-app/domain/ports";
import { Effect } from "effect";

/**
 * In-Memory Coin Transaction Gateway for Testing
 *
 * Implements CoinTransactionRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryCoinTransactionGateway();
 * gateway.seed([mockTransaction]);
 *
 * const stats = await Effect.runPromise(gateway.sumAddedCoins("trip-123"));
 * expect(stats).toBe(100);
 *
 * gateway.reset();
 * ```
 */
export class InMemoryCoinTransactionGateway implements CoinTransactionRepository {
  private transactions: CoinTransaction[] = [];
  private groupCoins = new Map<string, number>();

  reset(): void {
    this.transactions = [];
    this.groupCoins.clear();
  }

  seed(items: CoinTransaction[]): void {
    this.transactions.push(...items);
  }

  seedGroupCoins(groupId: string, coins: number): void {
    this.groupCoins.set(groupId, coins);
  }

  count(
    filters?: Partial<CoinTransactionFilters>,
  ): Effect.Effect<number, never, never> {
    return Effect.succeed(this.filterTransactions(filters).length);
  }

  sumAmount(
    filters?: Partial<CoinTransactionFilters>,
  ): Effect.Effect<number | null, never, never> {
    const filtered = this.filterTransactions(filters);
    if (filtered.length === 0) return Effect.succeed(null);
    return Effect.succeed(filtered.reduce((sum, t) => sum + t.amount, 0));
  }

  sumAddedCoins(tripId: string): Effect.Effect<number | null, never, never> {
    const filtered = this.transactions.filter(
      (t) => t.group?.id === tripId && t.amount > 0,
    );
    if (filtered.length === 0) return Effect.succeed(null);
    return Effect.succeed(filtered.reduce((sum, t) => sum + t.amount, 0));
  }

  sumRemovedCoins(tripId: string): Effect.Effect<number | null, never, never> {
    const filtered = this.transactions.filter(
      (t) => t.group?.id === tripId && t.amount < 0,
    );
    if (filtered.length === 0) return Effect.succeed(null);
    return Effect.succeed(filtered.reduce((sum, t) => sum + t.amount, 0));
  }

  getMostActiveAdmin(
    tripId: string,
  ): Effect.Effect<MostActiveAdminStat[], never, never> {
    const filtered = this.transactions.filter((t) => t.group?.id === tripId);
    const adminMap = new Map<string, { sum: number; count: number }>();

    filtered.forEach((t) => {
      const adminId = t.adminId;
      const current = adminMap.get(adminId) ?? { sum: 0, count: 0 };
      current.sum += Math.abs(t.amount);
      current.count += 1;
      adminMap.set(adminId, current);
    });

    return Effect.succeed(
      Array.from(adminMap.entries()).map(([adminId, stats]) => ({
        adminId,
        _sum: { amount: stats.sum },
        _count: { id: stats.count },
      })),
    );
  }

  findMany(
    filters: CoinTransactionFilters,
    options?: PaginationOptions,
  ): Effect.Effect<
    {
      items: CoinTransaction[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    never,
    never
  > {
    let filtered = this.filterTransactions(filters);
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    const total = filtered.length;
    const items = filtered.slice(offset, offset + limit);
    const hasMore = offset + items.length < total;

    return Effect.succeed({
      items,
      total,
      limit,
      offset,
      hasMore,
    });
  }

  findRecent(
    filters: Partial<CoinTransactionFilters>,
    limit: number,
  ): Effect.Effect<CoinTransaction[], never, never> {
    let filtered = this.filterTransactions(filters);
    filtered = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return Effect.succeed(filtered.slice(0, limit));
  }

  getTotalCoinsByGroup(
    tripId: string,
  ): Effect.Effect<
    Array<{ groupId: string; _sum: { amount: number | null } }>,
    never,
    never
  > {
    const filtered = this.transactions.filter((t) => t.group?.id === tripId);
    const groupMap = new Map<string, number>();

    filtered.forEach((t) => {
      const groupId = t.groupId;
      const current = groupMap.get(groupId) ?? 0;
      groupMap.set(groupId, current + t.amount);
    });

    return Effect.succeed(
      Array.from(groupMap.entries()).map(([groupId, sum]) => ({
        groupId,
        _sum: { amount: sum },
      })),
    );
  }

  groupByAdmin(
    tripId: string,
    limit: number,
  ): Effect.Effect<
    Array<{ adminId: string; _count: { id: number } }>,
    never,
    never
  > {
    const filtered = this.transactions.filter((t) => t.group?.id === tripId);
    const adminMap = new Map<string, number>();

    filtered.forEach((t) => {
      const adminId = t.adminId;
      adminMap.set(adminId, (adminMap.get(adminId) ?? 0) + 1);
    });

    return Effect.succeed(
      Array.from(adminMap.entries())
        .slice(0, limit)
        .map(([adminId, count]) => ({
          adminId,
          _count: { id: count },
        })),
    );
  }

  create(
    transaction: CoinTransaction,
  ): Effect.Effect<CoinTransaction, never, never> {
    this.transactions.push(transaction);
    return Effect.succeed(transaction);
  }

  incrementGroupCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<void, never, never> {
    const current = this.groupCoins.get(groupId) ?? 0;
    this.groupCoins.set(groupId, current + amount);
    return Effect.succeed(undefined);
  }

  decrementGroupCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<
    { success: boolean; currentBalance?: number },
    never,
    never
  > {
    const current = this.groupCoins.get(groupId) ?? 0;
    if (current < amount) {
      return Effect.succeed({ success: false, currentBalance: current });
    }
    this.groupCoins.set(groupId, current - amount);
    return Effect.succeed({ success: true, currentBalance: current - amount });
  }

  getGroupCoins(groupId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(this.groupCoins.get(groupId) ?? 0);
  }

  verifyGroupInTrip(
    groupId: string,
    tripId: string,
  ): Effect.Effect<
    {
      exists: boolean;
      tripId?: string;
      isDeleted?: boolean;
      coins?: number;
    },
    never,
    never
  > {
    const coins = this.groupCoins.get(groupId) ?? 0;
    return Effect.succeed({
      exists: true,
      tripId,
      isDeleted: false,
      coins,
    });
  }

  private filterTransactions(
    filters?: Partial<CoinTransactionFilters>,
  ): CoinTransaction[] {
    return this.transactions.filter((t) => {
      if (filters?.tripId && t.group?.id !== filters.tripId) return false;
      if (filters?.groupId && t.groupId !== filters.groupId) return false;
      if (filters?.startDate && t.createdAt < filters.startDate) return false;
      if (filters?.endDate && t.createdAt > filters.endDate) return false;
      return true;
    });
  }
}
