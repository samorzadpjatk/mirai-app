import { Effect } from "effect";
import { GroupId, DatabaseError } from "@mirai-app/domain";
import type {
  ICoinTransactionPort,
  CoinTransactionDTO,
} from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";

/**
 * In-Memory CoinTransaction Gateway
 *
 * Implements ICoinTransactionPort using in-memory Map storage for testing.
 *
 * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
 * Financial data requires strict auth - verify for all operations.
 */
export class InMemoryCoinTransactionGateway implements ICoinTransactionPort {
  private transactions: Map<string, CoinTransactionDTO> = new Map();

  findById(id: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const transaction = self.transactions.get(id);
        if (transaction) {
          const authZPort = yield* AuthZPortTag;
          yield* authZPort.verifyAccess({
            userId: authCtx.userId,
            role: authCtx.role,
            tripRoles: authCtx.tripRoles,
            resourceType: "coin",
            resourceId: transaction.tripId,
            requiredPermission: "read",
          });
        }
      }

      return self.transactions.get(id) ?? null;
    });
  }

  findByGroupId(groupId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: groupId,
          requiredPermission: "read",
        });
      }

      const result = Array.from(self.transactions.values()).filter(
        (t) => t.groupId === groupId,
      );
      return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findByTripId(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const result = Array.from(self.transactions.values()).filter(
        (t) => t.tripId === tripId,
      );
      return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const allForTrip = Array.from(self.transactions.values()).filter(
        (t) => t.tripId === tripId,
      );
      const sorted = allForTrip.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const paginated = sorted.slice(params.offset, params.offset + params.limit);
      return {
        transactions: paginated,
        total: allForTrip.length,
      };
    });
  }

  findByTripIdAndGroupId(tripId: string, groupId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const result = Array.from(self.transactions.values()).filter(
        (t) => t.tripId === tripId && t.groupId === groupId,
      );
      return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  create(transaction: CoinTransactionDTO) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification for writes
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: transaction.tripId,
          requiredPermission: "write",
        });
      }

      self.transactions.set(transaction.id, transaction);
      return transaction;
    });
  }

  delete(id: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification for deletes
      const transaction = self.transactions.get(id);
      if (authCtx.isAuthenticated && transaction) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: transaction.tripId,
          requiredPermission: "admin",
        });
      }

      self.transactions.delete(id);
      return undefined;
    });
  }

  sumByGroupId(groupId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: groupId,
          requiredPermission: "read",
        });
      }

      const total = Array.from(self.transactions.values())
        .filter((t) => t.groupId === groupId)
        .reduce((sum, t) => sum + t.amount, 0);
      return total;
    });
  }

  countByTripId(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const count = Array.from(self.transactions.values()).filter(
        (t) => t.tripId === tripId,
      ).length;
      return count;
    });
  }

  sumPositiveByTripId(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const total = Array.from(self.transactions.values())
        .filter((t) => t.tripId === tripId && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      return total;
    });
  }

  sumNegativeByTripId(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const total = Array.from(self.transactions.values())
        .filter((t) => t.tripId === tripId && t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0);
      return total;
    });
  }

  getMostActiveAdminStats(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const tripTransactions = Array.from(self.transactions.values()).filter(
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
      return result;
    });
  }

  getRichestGroup(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const tripTransactions = Array.from(self.transactions.values()).filter(
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

      return richestGroup;
    });
  }

  findRecentByTripId(tripId: string, limit: number) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      const result = Array.from(self.transactions.values())
        .filter((t) => t.tripId === tripId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
      return result;
    });
  }

  // ============================================================================
  // USER-SPECIFIC QUERIES (for ownership verification at use-case level)
  // ============================================================================

  /**
   * Find transactions by user ID
   * Note: Ownership verification uses AuthContext pattern
   */
  findByUserId(userId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user can only access their own transactions
      if (authCtx.isAuthenticated && authCtx.userId !== userId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: userId,
          requiredPermission: "read",
        });
      }

      const result = Array.from(self.transactions.values()).filter(
        (t) => t.adminId === userId,
      );
      return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  /**
   * Get user balance
   * Note: Ownership verification uses AuthContext pattern
   */
  getUserBalance(userId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user can only access their own balance
      if (authCtx.isAuthenticated && authCtx.userId !== userId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: userId,
          requiredPermission: "read",
        });
      }

      const total = Array.from(self.transactions.values())
        .filter((t) => t.adminId === userId)
        .reduce((sum, t) => sum + t.amount, 0);
      return total;
    });
  }

  /**
   * Get user transactions
   * Note: Ownership verification uses AuthContext pattern
   */
  getUserTransactions(userId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user can only access their own transactions
      if (authCtx.isAuthenticated && authCtx.userId !== userId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: userId,
          requiredPermission: "read",
        });
      }

      const result = Array.from(self.transactions.values()).filter(
        (t) => t.adminId === userId,
      );
      return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
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
