import { Effect } from "effect";
import { ValidationError } from "../errors/effect-errors";

/**
 * VoteWeight - Value object representing the normalized weight of a vote
 *
 * Used in weighted voting systems where some votes count more than others
 */
export class VoteWeight {
  private constructor(public readonly value: number) {}

  /**
   * Default weight (1.0) - all votes count equally
   */
  static readonly DEFAULT = new VoteWeight(1.0);

  /**
   * Create a VoteWeight from a number
   * Must be positive
   */
  static create(
    weight: number,
  ): Effect.Effect<VoteWeight, ValidationError, never> {
    return Effect.gen(function* () {
      if (typeof weight !== "number" || Number.isNaN(weight)) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Vote weight must be a valid number",
            field: "general",
          }),
        );
      }

      if (weight <= 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Vote weight must be positive",
            field: "general",
          }),
        );
      }

      return new VoteWeight(weight);
    });
  }

  /**
   * Create without validation (use carefully)
   */
  static unsafeCreate(weight: number): VoteWeight {
    return new VoteWeight(weight);
  }

  /**
   * Create with default weight (1.0)
   */
  static default(): VoteWeight {
    return VoteWeight.DEFAULT;
  }

  /**
   * Calculate weighted points
   * result = points * weight
   */
  applyTo(points: number): number {
    return points * this.value;
  }

  /**
   * Check if this is the default weight
   */
  isDefault(): boolean {
    return this.value === 1.0;
  }

  /**
   * Compare two weights
   */
  equals(other: VoteWeight): boolean {
    return this.value === other.value;
  }

  /**
   * Check if this weight is greater than another
   */
  isGreaterThan(other: VoteWeight): boolean {
    return this.value > other.value;
  }
}
