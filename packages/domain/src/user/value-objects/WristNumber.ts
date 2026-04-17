import { Data, Effect } from "effect";
import { ValidationError } from "../../shared/errors/domain-errors";

/**
 * Wrist Number value object
 * Represents a wrist band number assigned to a trip participant
 */
export class WristNumber {
  private constructor(readonly value: string) {}

  static create(
    value: string,
  ): Effect.Effect<WristNumber, ValidationError, never> {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "wristNumber",
          message: "Wrist number cannot be empty",
          value,
        }),
      );
    }

    if (trimmed.length > 20) {
      return Effect.fail(
        new ValidationError({
          field: "wristNumber",
          message: "Wrist number cannot be longer than 20 characters",
          value,
        }),
      );
    }

    return Effect.succeed(new WristNumber(trimmed));
  }

  static unsafeCreate(value: string): WristNumber {
    return new WristNumber(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: WristNumber): boolean {
    return this.value === other.value;
  }
}
