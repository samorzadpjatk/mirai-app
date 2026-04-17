import { Data } from "effect";

/**
 * Group has insufficient coins error
 */
export class InsufficientCoinsError extends Data.TaggedError(
  "InsufficientCoinsError",
)<{
  groupId: string;
  required: number;
  available: number;
}> {}

/**
 * Transaction not found error
 */
export class TransactionNotFoundError extends Data.TaggedError(
  "TransactionNotFoundError",
)<{
  transactionId: string;
}> {}

/**
 * Invalid transaction amount error
 */
export class InvalidTransactionAmountError extends Data.TaggedError(
  "InvalidTransactionAmountError",
)<{
  amount: number;
  reason: string;
}> {}
