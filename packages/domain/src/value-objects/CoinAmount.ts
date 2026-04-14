import { Effect } from "effect";
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
    return Effect.gen(function* () {
      if (!Number.isInteger(amount)) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Coin amount must be an integer",
            field: "general",
          }),
        );
      }

      if (amount < CoinAmount.MIN_COINS) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Coin amount cannot be negative (minimum: ${CoinAmount.MIN_COINS})`,
            field: "general",
          }),
        );
      }

      if (amount > CoinAmount.MAX_COINS) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Coin amount exceeds maximum (${CoinAmount.MAX_COINS})`,
            field: "general",
          }),
        );
      }

      return new CoinAmount(amount);
    });
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      if (!Number.isInteger(factor) || factor < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Factor must be a non-negative integer",
            field: "general",
          }),
        );
      }
      return yield* CoinAmount.create(self.value * factor);
    });
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
