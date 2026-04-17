import type { CoinTransactionId } from "../value-objects/CoinTransactionId";
import type { GroupId } from "../value-objects/GroupId";
import type { UserId } from "../../user/value-objects/UserId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Coin Transaction Type Enum
 */
export type CoinTransactionType = "EARNED" | "SPENT" | "ADJUSTMENT";

/**
 * Coin Transaction Domain Entity
 *
 * Represents a coin transaction for a group.
 */
export class CoinTransaction {
  private constructor(
    readonly id: CoinTransactionId,
    readonly groupId: GroupId,
    readonly amount: number,
    readonly type: CoinTransactionType,
    readonly reason: string | null,
    readonly adminId: UserId | null,
    readonly createdAt: Date,
  ) {}

  /**
   * Factory method to create a CoinTransaction entity
   */
  static create(props: {
    id: CoinTransactionId;
    groupId: GroupId;
    amount: number;
    type?: CoinTransactionType;
    reason?: string | null;
    adminId?: UserId | null;
    createdAt: Date;
  }): Effect.Effect<CoinTransaction, ValidationError, never> {
    const amount = props.amount;

    if (amount === 0) {
      return Effect.fail(
        new ValidationError({
          field: "amount",
          message: "Transaction amount cannot be zero",
          value: amount,
        }),
      );
    }

    const type = props.type ?? (amount > 0 ? "EARNED" : "SPENT");

    if (!["EARNED", "SPENT", "ADJUSTMENT"].includes(type)) {
      return Effect.fail(
        new ValidationError({
          field: "type",
          message: "Invalid transaction type",
          value: type,
        }),
      );
    }

    return Effect.succeed(
      new CoinTransaction(
        props.id,
        props.groupId,
        amount,
        type,
        props.reason ?? null,
        props.adminId ?? null,
        props.createdAt,
      ),
    );
  }

  /**
   * Check if this is a credit transaction
   */
  isCredit(): boolean {
    return this.amount > 0;
  }

  /**
   * Check if this is a debit transaction
   */
  isDebit(): boolean {
    return this.amount < 0;
  }

  /**
   * Get absolute amount
   */
  absoluteAmount(): number {
    return Math.abs(this.amount);
  }
}
