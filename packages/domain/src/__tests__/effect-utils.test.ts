/**
 * Unit Tests for Effect Utilities
 *
 * @module effect-utils.test
 */

import { describe, it, expect } from "bun:test";
import { Effect, Either } from "effect";
import {
  fromPredicate,
  assertPureEffect,
  type EntityEffect,
} from "../effect-utils";
import { ValidationError, NotFoundError } from "../errors/effect-errors";

describe("[UNIT] effect-utils", () => {
  describe("fromPredicate", () => {
    it("should succeed when predicate returns true", async () => {
      const effect = fromPredicate(
        42,
        (n) => n > 0,
        () => new ValidationError({ message: "Must be positive" }),
      );

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right).toBe(42);
      }
    });

    it("should fail when predicate returns false", async () => {
      const effect = fromPredicate(
        -5,
        (n) => n > 0,
        () => new ValidationError({ message: "Must be positive" }),
      );

      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const left = result.left as ValidationError;
        expect(left._tag).toBe("ValidationError");
        expect(left.message).toBe("Must be positive");
      }
    });
  });

  describe("assertPureEffect", () => {
    it("should return the same effect (compile-time check)", async () => {
      const original = Effect.succeed("test");
      const asserted = assertPureEffect(original);

      const result = await Effect.runPromise(asserted);
      expect(result).toBe("test");
    });

    it("should work with EntityEffect type", async () => {
      // Simulate entity factory pattern
      interface User {
        id: string;
        name: string;
      }

      const createUser = (
        name: string,
      ): EntityEffect<User, ValidationError> => {
        if (name.length === 0) {
          return Effect.fail(
            new ValidationError({ message: "Name required", field: "name" }),
          );
        }
        return Effect.succeed({ id: "1", name });
      };

      // Success case
      const validEffect = createUser("Alice");
      const validResult = await Effect.runPromise(Effect.either(validEffect));
      expect(Either.isRight(validResult)).toBe(true);
      if (Either.isRight(validResult)) {
        expect(validResult.right.name).toBe("Alice");
      }

      // Error case
      const invalidEffect = createUser("");
      const invalidResult = await Effect.runPromise(
        Effect.either(invalidEffect),
      );
      expect(Either.isLeft(invalidResult)).toBe(true);
    });
  });

  describe("Effect pattern matching", () => {
    it("should support Effect.catchTag for error handling", async () => {
      const error = new NotFoundError({ entityType: "User", id: "123" });
      const effect = Effect.fail(error);

      const recovered = effect.pipe(
        Effect.catchTag("NotFoundError", (e) =>
          Effect.succeed(`Recovered from: ${e.entityType} ${e.id}`),
        ),
      );

      const result = await Effect.runPromise(recovered);
      expect(result).toBe("Recovered from: User 123");
    });

    it("should support Effect.orElse for fallback", async () => {
      const error = new ValidationError({ message: "Invalid" });
      const effect = Effect.fail(error);

      const withFallback = effect.pipe(
        Effect.orElse(() => Effect.succeed("fallback")),
      );

      const result = await Effect.runPromise(withFallback);
      expect(result).toBe("fallback");
    });
  });
});
