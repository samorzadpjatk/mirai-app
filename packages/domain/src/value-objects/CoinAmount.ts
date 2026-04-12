import { Effect } from "effect";
import { type Result, ok, err } from "../utils/result";
import { ValidationError } from "../errors/effect-errors";

/**
 * CoinAmount - Value object representing a coin amount
 *
 * Encapsulates validation rules for coin amounts:
 * - Must be a non-negative integer
 * - Maximum value to prevent overflow
 */
export class CoinAmount {
  private static readonly MAX_COINS = 1_000_000_000;
  private static readonly MIN_COINS = 0;

  private constructor(public readonly value: number) {}

  /**
   * Create a CoinAmount from a number
   * Validates that the amount is a non-negative integer within bounds
   */
  static create(
    amount: number,
  ): Effect.Effect<CoinAmount, ValidationError, never> {
    if (!Number.isInteger(amount)) {
      return Effect.fail(
        new ValidationError({
          message: "Coin amount must be an integer",
          field: "general",
        }),
      );
    }

    if (amount < this.MIN_COINS) {
      return Effect.fail(
        new ValidationError({
          message: `Coin amount cannot be negative (minimum: ${this.MIN_COINS})`,
          field: "general",
        }),
      );
    }

    if (amount > this.MAX_COINS) {
      return Effect.fail(
        new ValidationError({
          message: `Coin amount exceeds maximum (${this.MAX_COINS})`,
          field: "general",
        }),
      );
    }

    return Effect.succeed(new CoinAmount(amount));
  }

  /**
   * Create a CoinAmount without validation (use carefully)
   * Only use when you know the value is valid (e.g., from database)
   */
  static unsafeCreate(amount: number): CoinAmount {
    return new CoinAmount(amount);
  }

  /**
   * Create a zero coin amount
   */
  static zero(): CoinAmount {
    return new CoinAmount(0);
  }

  /**
   * Add another CoinAmount to this one
   * Returns a new CoinAmount (immutable)
   */
  add(other: CoinAmount): Effect.Effect<CoinAmount, ValidationError, never> {
    return CoinAmount.create(this.value + other.value);
  }

  /**
   * Subtract another CoinAmount from this one
   * Returns error if result would be negative
   */
  subtract(
    other: CoinAmount,
  ): Effect.Effect<CoinAmount, ValidationError, never> {
    return CoinAmount.create(this.value - other.value);
  }

  /**
   * Multiply by a positive integer factor
   */
  multiply(factor: number): Effect.Effect<CoinAmount, ValidationError, never> {
    if (!Number.isInteger(factor) || factor < 0) {
      return Effect.fail(
        new ValidationError({
          message: "Factor must be a non-negative integer",
          field: "general",
        }),
      );
    }
    return CoinAmount.create(this.value * factor);
  }

  /**
   * Check if this amount is greater than or equal to another
   */
  isGreaterThanOrEqual(other: CoinAmount): boolean {
    return this.value >= other.value;
  }

  /**
   * Check if this amount is zero
   */
  isZero(): boolean {
    return this.value === 0;
  }

  /**
   * Compare two CoinAmounts
   */
  compare(other: CoinAmount): number {
    return this.value - other.value;
  }

  /**
   * Format for display
   */
  toString(): string {
    return `${this.value} coin${this.value === 1 ? "" : "s"}`;
  }

  /**
   * Get raw value
   */
  toNumber(): number {
    return this.value;
  }
}

// Backward compatibility: Keep synchronous Result-based methods for transition
export namespace CoinAmountCompat {
  /**
   * @deprecated Use CoinAmount.create instead (returns Effect)
   * Synchronous Result-based version for backward compatibility during migration
   */
  export function createSync(
    props: Parameters<typeof CoinAmount.create>[0],
  ): Result<CoinAmount, ValidationError> {
    const effect = CoinAmount.create(props);
    try {
      const entity = Effect.runSync(effect);
      return ok(entity);
    } catch (e) {
      return err(e as ValidationError);
    }
  }
}
