import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { groups } from "@mirai-app/frameworks/drizzle/schema/group";
import { coinTransactions } from "@mirai-app/frameworks/drizzle/schema/coinTransaction";
import { eq, sql } from "drizzle-orm";

/**
 * Manages group coin balance and transactions
 */
export class DrizzleGroupCoinsService {
  constructor(private db: DrizzleDb) {}

  async getBalance(groupId: string): Promise<number> {
    const [group] = await this.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);
    return group?.coins ?? 0;
  }

  async deductCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(groups)
        .set({ coins: sql`${groups.coins} - ${amount}` })
        .where(eq(groups.id, groupId));

      await tx.insert(coinTransactions).values({
        groupId,
        tripId: (
          await tx
            .select({ tripId: groups.tripId })
            .from(groups)
            .where(eq(groups.id, groupId))
            .limit(1)
        )[0]?.tripId!,
        amount: -amount,
        reason,
        adminId,
      });
    });
  }

  async addCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(groups)
        .set({ coins: sql`${groups.coins} + ${amount}` })
        .where(eq(groups.id, groupId));

      const tripId = (
        await tx
          .select({ tripId: groups.tripId })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1)
      )[0]?.tripId;

      await tx.insert(coinTransactions).values({
        groupId,
        tripId: tripId!,
        amount,
        reason,
        adminId,
      });
    });
  }
}
