import type { Group } from "@mirai-app/db";

export interface CoinTransactionInput {
  tripId: string;
  groupId: string;
  amount: number;
  reason?: string | null;
}

export interface ValidationError {
  error: "NOT_FOUND" | "BAD_REQUEST";
  message: string;
}

/**
 * Validates that a group can participate in a coin transaction.
 * Returns null if valid, or a ValidationError if invalid.
 */
export function validateCoinTransaction(
  group: Group | null | undefined,
  input: CoinTransactionInput,
): ValidationError | null {
  if (!group || group.tripId !== input.tripId || group.isDeleted) {
    return { error: "NOT_FOUND", message: "Group not found" };
  }
  return null;
}

/**
 * Checks if a group has enough coins for a removal transaction.
 * Returns null if valid, or a ValidationError if insufficient.
 */
export function checkCoinBalance(
  group: Group | null | undefined,
  amount: number,
): ValidationError | null {
  const availableCoins = group?.coins ?? 0;
  if (availableCoins < amount) {
    return { error: "BAD_REQUEST", message: "Group does not have enough coins" };
  }
  return null;
}
