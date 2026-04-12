/**
 * Unit Tests for Effect Utilities
 *
 * @module effect-utils.test
 */

import { describe, it, expect } from "bun:test";
import { Effect, Either } from "effect";
import {
  resultToEffect,
  effectToResult,
  effectToResultSync,
  resultFnToEffect,
  fromPredicate,
  assertPureEffect,
  type EntityEffect,
} from "../effect-utils";
import { ok, err, isSuccess, isError } from "../utils/result";
import { ValidationError, NotFoundError } from "../errors/effect-errors";

describe("[UNIT] effect-utils", () => {
  describe("resultToEffect", () => {
    it("should convert ok Result to Effect.succeed", async () => {
      const result = ok(42);
      const effect = resultToEffect(result);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBe(42);
      }
    });

    it("should convert err Result to Effect.fail", async () => {
      const error = new ValidationError({
        message: "Invalid input",
        field: "name",
      });
      const result = err(error);
      const effect = resultToEffect(result);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBe(error);
        expect(either.left._tag).toBe("ValidationError");
      }
    });

    it("should work with Effect combinators", async () => {
      const result = ok(5);
      const effect = resultToEffect(result);

      const doubled = await Effect.runPromise(
        effect.pipe(Effect.map((n) => n * 2)),
      );
      expect(doubled).toBe(10);
    });
  });

  describe("effectToResult", () => {
    it("should convert Effect.succeed to ok Result", async () => {
      const effect = Effect.succeed("hello");
      const result = await effectToResult(effect);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe("hello");
      }
    });

    it("should convert Effect.fail to err Result", async () => {
      const error = new NotFoundError({ entityType: "User", id: "123" });
      const effect = Effect.fail(error);
      const result = await effectToResult(effect);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error).toBe(error);
        expect(result.error._tag).toBe("NotFoundError");
      }
    });

    it("should handle complex Effect chains", async () => {
      const effect = Effect.succeed(10).pipe(
        Effect.map((n) => n * 2),
        Effect.map((n) => n + 1),
      );
      const result = await effectToResult(effect);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(21);
      }
    });
  });

  describe("effectToResultSync", () => {
    it("should synchronously convert pure Effect to Result", () => {
      const effect = Effect.succeed({ name: "test" });
      const result = effectToResultSync(effect);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toEqual({ name: "test" });
      }
    });

    it("should synchronously convert failed Effect to err Result", () => {
      const error = new ValidationError({ message: "Invalid" });
      const effect = Effect.fail(error);
      const result = effectToResultSync(effect);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.message).toBe("Invalid");
      }
    });
  });

  describe("resultFnToEffect", () => {
    it("should lift Result-returning function to Effect", async () => {
      const validatePositive = (n: number) =>
        n > 0
          ? ok(n)
          : err(new ValidationError({ message: "Must be positive" }));

      const lifted = (n: number) => resultFnToEffect(() => validatePositive(n));

      // Success case
      const successEffect = lifted(42);
      const successResult = await Effect.runPromise(
        Effect.either(successEffect),
      );
      expect(Either.isRight(successResult)).toBe(true);
      if (Either.isRight(successResult)) {
        expect(successResult.right).toBe(42);
      }

      // Error case
      const errorEffect = lifted(-1);
      const errorResult = await Effect.runPromise(Effect.either(errorEffect));
      expect(Either.isLeft(errorResult)).toBe(true);
      if (Either.isLeft(errorResult)) {
        const left = errorResult.left as ValidationError;
        expect(left._tag).toBe("ValidationError");
      }
    });
  });

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

  describe("Backwards compatibility", () => {
    it("should allow mixing Result and Effect patterns", async () => {
      // Legacy Result-based validation
      const legacyValidate = (email: string) => {
        return email.includes("@")
          ? ok(email)
          : err(
              new ValidationError({ message: "Invalid email", field: "email" }),
            );
      };

      // Convert to Effect and use in pipeline
      const result = legacyValidate("test@example.com");
      const effect = resultToEffect(result);

      // Use Effect combinators
      const processed = await Effect.runPromise(
        effect.pipe(
          Effect.map((e) => e.toLowerCase()),
          Effect.map((e) => `processed: ${e}`),
        ),
      );

      expect(processed).toBe("processed: test@example.com");
    });

    it("should support roundtrip conversion Result -> Effect -> Result", async () => {
      const original = ok({ data: "test" });

      // Result -> Effect
      const effect = resultToEffect(original);

      // Effect -> Result
      const converted = await effectToResult(effect);

      // Should be equivalent
      expect(isSuccess(converted)).toBe(true);
      if (isSuccess(converted)) {
        expect(converted.value).toEqual({ data: "test" });
      }
    });
  });
});
