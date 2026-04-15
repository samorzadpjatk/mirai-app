import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { timestamps } from "../utils/immutable";
import { ValidationError } from "../errors";

/**
 * CoinTransaction DTO - plain data shape for mappers
 */
export interface CoinTransactionDTO {
  id: string;
  groupId: string;
  amount: number;
  reason: string | null;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
  group?: {
    id: string;
    name: string;
    coins: number;
  };
  admin?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

/**
 * CoinTransaction entity - tracks coin balance changes for groups
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class CoinTransaction implements CoinTransactionDTO {
  private constructor(
    public readonly id: string,
    public readonly groupId: string,
    public readonly amount: number,
    public readonly reason: string | null,
    public readonly adminId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly group?: {
      id: string;
      name: string;
      coins: number;
    },
    public readonly admin?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    },
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
    group?: {
      id: string;
      name: string;
      coins: number;
    };
    admin?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    };
  }): Effect.Effect<CoinTransaction, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate groupId
      const groupId = yield* validate.id(props.groupId, "groupId");

      // Validate amount (must be non-zero)
      if (props.amount === 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "amount cannot be zero",
            field: "amount",
          }),
        );
      }

      // Validate adminId
      const adminId = yield* validate.id(props.adminId, "adminId");

      // Validate reason if provided
      let reason: string | null = props.reason ?? null;
      if (props.reason) {
        const validatedReason = yield* validate.string(props.reason, "reason", {
          required: false,
          maxLength: 500,
        });
        reason = validatedReason;
      }

      const ts = timestamps(props);

      return new CoinTransaction(
        props.id ?? crypto.randomUUID(),
        groupId,
        props.amount,
        reason,
        adminId,
        ts.createdAt,
        ts.updatedAt,
        props.group,
        props.admin,
      );
    });
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
