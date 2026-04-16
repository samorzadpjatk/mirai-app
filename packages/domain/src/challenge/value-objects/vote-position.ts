import { Effect } from "effect";
import { ValidationError } from "../../system/errors";

/**
 * VotePosition - Value object representing a vote position (1st, 2nd, 3rd place)
 *
 * Valid positions are 1, 2, or 3
 */
export class VotePosition {
  private constructor(public readonly value: number) {}

  /**
   * Create a VotePosition from a number
   * Valid positions: 1, 2, 3
   */
  static create(
    position: number,
  ): Effect.Effect<VotePosition, ValidationError, never> {
    return Effect.gen(function* () {
      if (!Number.isInteger(position)) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Vote position must be an integer",
            field: "general",
          }),
        );
      }

      if (position < 1 || position > 3) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Vote position must be between 1 and 3",
            field: "general",
          }),
        );
      }

      return new VotePosition(position);
    });
  }

  /**
   * Create without validation (use carefully)
   */
  static unsafeCreate(position: number): VotePosition {
    return new VotePosition(position);
  }

  /**
   * Check if this position is first place
   */
  isFirstPlace(): boolean {
    return this.value === 1;
  }

  /**
   * Check if this position is second place
   */
  isSecondPlace(): boolean {
    return this.value === 2;
  }

  /**
   * Check if this position is third place
   */
  isThirdPlace(): boolean {
    return this.value === 3;
  }

  /**
   * Get the points value for this position
   * Uses standard Borda count: 1st=3pts, 2nd=2pts, 3rd=1pt
   */
  toPoints(): number {
    // Standard Borda count inverse: position 1 = 3 points, position 2 = 2 points, position 3 = 1 point
    return 4 - this.value;
  }

  /**
   * Compare two positions
   */
  equals(other: VotePosition): boolean {
    return this.value === other.value;
  }

  /**
   * Compare positions (lower position number = higher rank)
   */
  isBetterThan(other: VotePosition): boolean {
    return this.value < other.value;
  }
}
