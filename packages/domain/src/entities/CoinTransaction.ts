import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * Validation rules for CoinTransaction data
 */
const VALIDATION_RULES = {
  reason: {
    maxLength: 500,
  },
};

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
   */
  static create(props: {
    id?: string;
    groupId: string;
    amount: number;
    reason?: string | null;
    adminId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<CoinTransaction, string> {
    // Validate groupId
    if (!props.groupId || props.groupId.trim() === "") {
      return err("groupId is required");
    }

    // Validate amount (must be non-zero)
    if (props.amount === 0) {
      return err("amount cannot be zero");
    }

    // Validate adminId
    if (!props.adminId || props.adminId.trim() === "") {
      return err("adminId is required");
    }

    // Validate reason if provided
    if (
      props.reason &&
      props.reason.length > VALIDATION_RULES.reason.maxLength
    ) {
      return err(
        `reason must be at most ${VALIDATION_RULES.reason.maxLength} characters`,
      );
    }

    const now = new Date();

    return ok(
      new CoinTransaction(
        props.id ?? crypto.randomUUID(),
        props.groupId.trim(),
        props.amount,
        props.reason ?? null,
        props.adminId.trim(),
        props.createdAt ?? now,
        props.updatedAt ?? now,
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
