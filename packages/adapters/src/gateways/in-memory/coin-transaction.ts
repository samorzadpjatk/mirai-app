import type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  PaginationOptions,
  CoinStatistics,
  MostActiveAdminStat,
} from "@mirai-app/use-cases";

/**
 * In-Memory Coin Transaction Repository for Testing
 *
 * Implements CoinTransactionRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryCoinTransactionRepository();
 * repo.seed([mockTransaction]);
 *
 * const stats = await repo.sumAddedCoins("trip-123");
 * expect(stats).toBe(100);
 *
 * repo.reset();
 * ```
 */
export class InMemoryCoinTransactionRepository implements CoinTransactionRepository {
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

  async count(filters?: Partial<CoinTransactionFilters>): Promise<number> {
    return this.filterTransactions(filters).length;
  }

  async sumAmount(
    filters?: Partial<CoinTransactionFilters>,
  ): Promise<number | null> {
    const filtered = this.filterTransactions(filters);
    if (filtered.length === 0) return null;
    return filtered.reduce((sum, t) => sum + t.amount, 0);
  }

  async sumAddedCoins(tripId: string): Promise<number | null> {
    const filtered = this.transactions.filter(
      (t) => t.group?.id === tripId && t.amount > 0,
    );
    if (filtered.length === 0) return null;
    return filtered.reduce((sum, t) => sum + t.amount, 0);
  }

  async sumRemovedCoins(tripId: string): Promise<number | null> {
    const filtered = this.transactions.filter(
      (t) => t.group?.id === tripId && t.amount < 0,
    );
    if (filtered.length === 0) return null;
    return filtered.reduce((sum, t) => sum + t.amount, 0);
  }

  async getMostActiveAdmin(tripId: string): Promise<MostActiveAdminStat[]> {
    const filtered = this.transactions.filter((t) => t.group?.id === tripId);
    const adminMap = new Map<string, { sum: number; count: number }>();

    filtered.forEach((t) => {
      const adminId = t.adminId;
      const current = adminMap.get(adminId) ?? { sum: 0, count: 0 };
      current.sum += Math.abs(t.amount);
      current.count += 1;
      adminMap.set(adminId, current);
    });

    return Array.from(adminMap.entries()).map(([adminId, stats]) => ({
      adminId,
      _sum: { amount: stats.sum },
      _count: { id: stats.count },
    }));
  }

  async findMany(
    filters: Partial<CoinTransactionFilters>,
    pagination: PaginationOptions,
  ): Promise<CoinTransaction[]> {
    let filtered = this.filterTransactions(filters);
    const offset = pagination.offset ?? 0;
    const limit = pagination.limit ?? 50;
    filtered = filtered.slice(offset, offset + limit);
    return filtered;
  }

  async findRecent(
    filters: Partial<CoinTransactionFilters>,
    limit: number,
  ): Promise<CoinTransaction[]> {
    let filtered = this.filterTransactions(filters);
    // Sort by createdAt descending
    filtered = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return filtered.slice(0, limit);
  }

  async getTotalCoinsByGroup(
    tripId: string,
  ): Promise<Array<{ groupId: string; _sum: { amount: number | null } }>> {
    const filtered = this.transactions.filter((t) => t.group?.id === tripId);
    const groupMap = new Map<string, number>();

    filtered.forEach((t) => {
      const groupId = t.groupId;
      const current = groupMap.get(groupId) ?? 0;
      groupMap.set(groupId, current + t.amount);
    });

    return Array.from(groupMap.entries()).map(([groupId, sum]) => ({
      groupId,
      _sum: { amount: sum },
    }));
  }

  async groupByAdmin(
    tripId: string,
    limit: number,
  ): Promise<Array<{ adminId: string; _count: { id: number } }>> {
    const filtered = this.transactions.filter((t) => t.group?.id === tripId);
    const adminMap = new Map<string, number>();

    filtered.forEach((t) => {
      const adminId = t.adminId;
      adminMap.set(adminId, (adminMap.get(adminId) ?? 0) + 1);
    });

    return Array.from(adminMap.entries())
      .slice(0, limit)
      .map(([adminId, count]) => ({
        adminId,
        _count: { id: count },
      }));
  }

  async create(data: {
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Promise<CoinTransaction> {
    const transaction: CoinTransaction = {
      id: crypto.randomUUID(),
      groupId: data.groupId,
      amount: data.amount,
      reason: data.reason ?? null,
      adminId: data.adminId,
      createdAt: new Date(),
    };
    this.transactions.push(transaction);
    return transaction;
  }

  async incrementGroupCoins(groupId: string, amount: number): Promise<void> {
    const current = this.groupCoins.get(groupId) ?? 0;
    this.groupCoins.set(groupId, current + amount);
  }

  async decrementGroupCoins(
    groupId: string,
    amount: number,
  ): Promise<{ success: boolean; currentBalance?: number }> {
    const current = this.groupCoins.get(groupId) ?? 0;
    if (current < amount) {
      return { success: false, currentBalance: current };
    }
    this.groupCoins.set(groupId, current - amount);
    return { success: true, currentBalance: current - amount };
  }

  async getGroupCoins(groupId: string): Promise<number> {
    return this.groupCoins.get(groupId) ?? 0;
  }

  async verifyGroupInTrip(
    groupId: string,
    tripId: string,
  ): Promise<{
    exists: boolean;
    tripId?: string;
    isDeleted?: boolean;
    coins?: number;
  }> {
    // This is a simplified implementation
    // In real scenarios, this would check group data
    // For testing, we simulate the behavior
    const coins = this.groupCoins.get(groupId) ?? 0;
    return {
      exists: true,
      tripId,
      isDeleted: false,
      coins,
    };
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
