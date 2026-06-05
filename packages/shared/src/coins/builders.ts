import type { CoinTransactionInput } from "./validators";

interface CoinTransactionValues {
  groupId: string;
  amount: number;
  reason: string;
  adminId: string;
}

/**
 * Builds the coin transaction record values for database insertion.
 * For remove operations, the amount is negated.
 */
export function buildCoinTransactionValues(
  input: CoinTransactionInput,
  adminId: string,
  isAdd: boolean,
): CoinTransactionValues {
  return {
    groupId: input.groupId,
    amount: isAdd ? input.amount : -input.amount,
    reason: input.reason ?? "",
    adminId,
  };
}
