import { Data, Effect } from "effect";
import { ValidationError } from "../../shared/errors/domain-errors";

/**
 * House Number value object
 * Represents a house/room number assigned to a trip participant
 */
export class HouseNumber {
  private constructor(readonly value: string) {}

  static create(
    value: string,
  ): Effect.Effect<HouseNumber, ValidationError, never> {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "houseNumber",
          message: "House number cannot be empty",
          value,
        }),
      );
    }

    if (trimmed.length > 20) {
      return Effect.fail(
        new ValidationError({
          field: "houseNumber",
          message: "House number cannot be longer than 20 characters",
          value,
        }),
      );
    }

    return Effect.succeed(new HouseNumber(trimmed));
  }

  static unsafeCreate(value: string): HouseNumber {
    return new HouseNumber(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: HouseNumber): boolean {
    return this.value === other.value;
  }
}
