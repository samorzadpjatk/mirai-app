import { coinTransactions } from "@mirai-app/db/schema";
import type { SQL } from "drizzle-orm";
import { eq, inArray } from "drizzle-orm";

/**
 * Builds a Drizzle where expression for coin transactions.
 * Uses eq when a single groupId is provided, otherwise inArray for a list.
 * Pure: no side effects, no async, no DB calls.
 */
export function buildCoinTransactionWhereExpr(
  groupId: string | undefined,
  groupIdList: string[],
): SQL<unknown> | undefined {
  if (groupId) {
    return eq(coinTransactions.groupId, groupId);
  }
  if (groupIdList.length > 0) {
    return inArray(coinTransactions.groupId, groupIdList);
  }
  return undefined;
}
