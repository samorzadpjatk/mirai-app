import { Effect } from "effect";
import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { timestamps } from "../utils/immutable";
import { ValidationError } from "../errors/effect-errors";

/**
 * CoinTransaction entity - tracks coin balance changes for groups
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class CoinTransaction {
  private constructor(
    public readonly id: string,
    public readonly groupId: string,
    public readonly amount: number,
    public readonly reason: string | null,
    public readonly adminId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new CoinTransaction
   * Validates all input data
   *
   * Returns Effect<CoinTransaction, ValidationError, never>
   */
  static create(props: {
    id?: string;
    groupId: string;
    amount: number;
    reason?: string | null;
    adminId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<CoinTransaction, ValidationError, never> {
    // Validate groupId
    const groupId = validate.id(props.groupId, "groupId");
    if (isError(groupId)) {
      return Effect.fail(
        new ValidationError({
          message: groupId.error.message,
          field: "groupId",
        }),
      );
    }

    // Validate amount (must be non-zero)
    if (props.amount === 0) {
      return Effect.fail(
        new ValidationError({
          message: "amount cannot be zero",
          field: "amount",
        }),
      );
    }

    // Validate adminId
    const adminId = validate.id(props.adminId, "adminId");
    if (isError(adminId)) {
      return Effect.fail(
        new ValidationError({
          message: adminId.error.message,
          field: "adminId",
        }),
      );
    }

    // Validate reason if provided
    if (props.reason) {
      const validated = validate.string(props.reason, "reason", {
        required: false,
        maxLength: 500,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "reason",
          }),
        );
      }
    }

    const ts = timestamps(props);

    return Effect.succeed(
      new CoinTransaction(
        props.id ?? crypto.randomUUID(),
        groupId.value,
        props.amount,
        props.reason ?? null,
        adminId.value,
        ts.createdAt,
        ts.updatedAt,
      ),
    );
  }

  /**
   * Check if this is a credit (positive amount)
   */
  isCredit(): boolean {
    return this.amount > 0;
  }

  /**
   * Check if this is a debit (negative amount)
   */
  isDebit(): boolean {
    return this.amount < 0;
  }

  /**
   * Get absolute amount (for display)
   */
  getAbsoluteAmount(): number {
    return Math.abs(this.amount);
  }

  /**
   * Get formatted amount with sign
   */
  getFormattedAmount(): string {
    const sign = this.amount > 0 ? "+" : "";
    return `${sign}${this.amount} coins`;
  }

  /**
   * Check if transaction has a reason
   */
  hasReason(): boolean {
    return this.reason !== null && this.reason.length > 0;
  }

  /**
   * Check if transaction is for a specific group
   */
  isForGroup(groupId: string): boolean {
    return this.groupId === groupId;
  }

  /**
   * Check if transaction was processed by specific admin
   */
  isProcessedBy(adminId: string): boolean {
    return this.adminId === adminId;
  }
}

// Backward compatibility: Keep synchronous Result-based methods for transition
export namespace CoinTransactionCompat {
  /**
   * @deprecated Use CoinTransaction.create instead (returns Effect)
   * Synchronous Result-based version for backward compatibility during migration
   */
  export function createSync(
    props: Parameters<typeof CoinTransaction.create>[0],
  ): Result<CoinTransaction, ValidationError> {
    const effect = CoinTransaction.create(props);
    try {
      const transaction = Effect.runSync(effect);
      return ok(transaction);
    } catch (e) {
      return err(e as ValidationError);
    }
  }
}
