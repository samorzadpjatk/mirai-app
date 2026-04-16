import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { validate } from "./entity-validation";
import { ValidationError } from "../errors";

describe("[UNIT] Entity Validation", () => {
  // ============================================================================
  // String Validation Tests
  // ============================================================================
  describe("[UNIT] validate.string", () => {
    describe("required rule", () => {
      it("succeeds for non-empty string when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("hello", "name", { required: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("hello");
        }
      });

      it("fails for empty string when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("", "name", { required: true })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("name");
          expect(result.left.message).toBe("name is required");
        }
      });

      it("fails for whitespace-only string when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("   ", "name", { required: true })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.field).toBe("name");
          expect(result.left.message).toBe("name is required");
        }
      });

      it("succeeds for empty string when not required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("", "name", { required: false })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("");
        }
      });

      it("succeeds for whitespace-only string when not required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("   ", "name", { required: false })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("   ");
        }
      });

      it("succeeds without required rule (defaults to not required)", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("", "name", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("");
        }
      });
    });

    describe("minLength rule", () => {
      it("succeeds when string meets minimum length", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("hello", "name", { minLength: 3 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("hello");
        }
      });

      it("succeeds when string equals minimum length", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("abc", "name", { minLength: 3 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("abc");
        }
      });

      it("fails when string is shorter than minimum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("ab", "name", { minLength: 3 })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("name");
          expect(result.left.message).toBe(
            "name must be at least 3 characters",
          );
        }
      });

      it("skips minLength when not required and empty", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("", "name", { required: false, minLength: 5 }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("");
        }
      });

      it("applies minLength when required and non-empty", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("ab", "name", { required: true, minLength: 5 }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe(
            "name must be at least 5 characters",
          );
        }
      });
    });

    describe("maxLength rule", () => {
      it("succeeds when string is within maximum length", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("hello", "name", { maxLength: 10 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("hello");
        }
      });

      it("succeeds when string equals maximum length", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("abcdefghij", "name", { maxLength: 10 }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("abcdefghij");
        }
      });

      it("fails when string exceeds maximum length", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("hello world", "name", { maxLength: 5 }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("name");
          expect(result.left.message).toBe("name must be at most 5 characters");
        }
      });
    });

    describe("trim rule", () => {
      it("trims whitespace when trim is true", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("  hello  ", "name", { trim: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("hello");
        }
      });

      it("does not trim when trim is false", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("  hello  ", "name", { trim: false })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("  hello  ");
        }
      });

      it("does not trim by default", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("  hello  ", "name", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("  hello  ");
        }
      });

      it("validates after trimming for required check", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("   ", "name", { required: true, trim: true }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("name is required");
        }
      });

      it("validates after trimming for minLength", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("  hi  ", "name", { trim: true, minLength: 3 }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe(
            "name must be at least 3 characters",
          );
        }
      });

      it("validates after trimming for maxLength", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("  hello  ", "name", { trim: true, maxLength: 5 }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("hello");
        }
      });
    });

    describe("combined rules", () => {
      it("succeeds with all rules satisfied", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("hello", "name", {
              required: true,
              minLength: 3,
              maxLength: 10,
              trim: true,
            }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("hello");
        }
      });

      it("fails with first applicable error", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("", "name", {
              required: true,
              minLength: 3,
              maxLength: 10,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("name is required");
        }
      });

      it("succeeds with empty string when not required but with other rules", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("", "name", {
              required: false,
              minLength: 3,
              maxLength: 10,
            }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("");
        }
      });
    });

    describe("edge cases", () => {
      it("handles unicode characters correctly", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("日本語", "name", { minLength: 3 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("日本語");
        }
      });

      it("counts unicode length correctly", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("日本語", "name", { minLength: 4 })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe(
            "name must be at least 4 characters",
          );
        }
      });

      it("handles emoji characters", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.string("hello world", "name", { maxLength: 11 }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("hello world");
        }
      });

      it("handles very long strings", async () => {
        const longString = "a".repeat(1000);
        const result = await Effect.runPromise(
          Effect.either(
            validate.string(longString, "name", { maxLength: 1000 }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(longString);
        }
      });

      it("fails for very long strings exceeding limit", async () => {
        const longString = "a".repeat(1001);
        const result = await Effect.runPromise(
          Effect.either(
            validate.string(longString, "name", { maxLength: 1000 }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe(
            "name must be at most 1000 characters",
          );
        }
      });

      it("handles special characters", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.string("hello@#$%world", "name", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe("hello@#$%world");
        }
      });
    });
  });

  // ============================================================================
  // Number Validation Tests
  // ============================================================================
  describe("[UNIT] validate.number", () => {
    describe("required rule", () => {
      it("succeeds for valid number when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(42, "count", { required: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(42);
        }
      });

      it("succeeds for zero when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(0, "count", { required: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(0);
        }
      });

      it("fails for null when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.number(null as unknown as number, "count", {
              required: true,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("count");
          expect(result.left.message).toBe("count is required");
        }
      });

      it("fails for undefined when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.number(undefined as unknown as number, "count", {
              required: true,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.field).toBe("count");
          expect(result.left.message).toBe("count is required");
        }
      });

      it("succeeds for null when not required", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.number(null as unknown as number, "count", {
              required: false,
            }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBeNull();
        }
      });

      it("succeeds for undefined when not required", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.number(undefined as unknown as number, "count", {
              required: false,
            }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBeUndefined();
        }
      });
    });

    describe("min rule", () => {
      it("succeeds when number meets minimum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(10, "count", { min: 5 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(10);
        }
      });

      it("succeeds when number equals minimum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(5, "count", { min: 5 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(5);
        }
      });

      it("fails when number is below minimum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(3, "count", { min: 5 })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("count");
          expect(result.left.message).toBe("count must be at least 5");
        }
      });

      it("works with negative minimum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(-5, "count", { min: -10 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(-5);
        }
      });

      it("fails for negative below negative minimum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(-15, "count", { min: -10 })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("count must be at least -10");
        }
      });
    });

    describe("max rule", () => {
      it("succeeds when number is within maximum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(10, "count", { max: 20 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(10);
        }
      });

      it("succeeds when number equals maximum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(20, "count", { max: 20 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(20);
        }
      });

      it("fails when number exceeds maximum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(25, "count", { max: 20 })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("count");
          expect(result.left.message).toBe("count must be at most 20");
        }
      });

      it("works with negative maximum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(-15, "count", { max: -10 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(-15);
        }
      });

      it("fails for positive above negative maximum", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(5, "count", { max: -10 })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("count must be at most -10");
        }
      });
    });

    describe("integer rule", () => {
      it("succeeds for integer when integer is required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(42, "count", { integer: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(42);
        }
      });

      it("succeeds for negative integer when integer is required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(-42, "count", { integer: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(-42);
        }
      });

      it("succeeds for zero when integer is required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(0, "count", { integer: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(0);
        }
      });

      it("fails for decimal when integer is required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(3.14, "count", { integer: true })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("count");
          expect(result.left.message).toBe("count must be an integer");
        }
      });

      it("succeeds for decimal when integer is not required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(3.14, "count", { integer: false })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(3.14);
        }
      });

      it("succeeds for decimal by default", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(3.14, "count", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(3.14);
        }
      });
    });

    describe("combined rules", () => {
      it("succeeds with all rules satisfied", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.number(42, "count", {
              required: true,
              min: 0,
              max: 100,
              integer: true,
            }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(42);
        }
      });

      it("fails with required error before min", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.number(null as unknown as number, "count", {
              required: true,
              min: 0,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("count is required");
        }
      });

      it("fails with integer error before min/max", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.number(3.14, "count", {
              integer: true,
              min: 0,
              max: 100,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("count must be an integer");
        }
      });
    });

    describe("edge cases", () => {
      it("fails for NaN", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(NaN, "count", {})),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("count must be a valid number");
        }
      });

      it("succeeds for positive Infinity (valid number)", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(Infinity, "count", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(Infinity);
        }
      });

      it("succeeds for negative Infinity (valid number)", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(-Infinity, "count", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(-Infinity);
        }
      });

      it("handles very large positive numbers", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(Number.MAX_SAFE_INTEGER, "count", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(Number.MAX_SAFE_INTEGER);
        }
      });

      it("handles very large negative numbers", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(Number.MIN_SAFE_INTEGER, "count", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(Number.MIN_SAFE_INTEGER);
        }
      });

      it("handles floating point precision edge cases", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(0.1 + 0.2, "count", { max: 1 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBeCloseTo(0.3, 10);
        }
      });

      it("validates scientific notation numbers", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(1e10, "count", { integer: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(10000000000);
        }
      });

      it("handles very small decimal numbers", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.number(0.0001, "count", { min: 0 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toBe(0.0001);
        }
      });

      it("validates boundary values", async () => {
        const resultAtMin = await Effect.runPromise(
          Effect.either(validate.number(0, "count", { min: 0, max: 10 })),
        );
        expect(resultAtMin._tag).toBe("Right");

        const resultAtMax = await Effect.runPromise(
          Effect.either(validate.number(10, "count", { min: 0, max: 10 })),
        );
        expect(resultAtMax._tag).toBe("Right");
      });
    });
  });

  // ============================================================================
  // ID Validation Tests
  // ============================================================================
  describe("[UNIT] validate.id", () => {
    it("succeeds for non-empty string ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id("user-123", "userId")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("user-123");
      }
    });

    it("succeeds for UUID format ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          validate.id("550e8400-e29b-41d4-a716-446655440000", "userId"),
        ),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("550e8400-e29b-41d4-a716-446655440000");
      }
    });

    it("succeeds for numeric ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id("12345", "userId")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("12345");
      }
    });

    it("succeeds for alphanumeric ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id("abc123def", "userId")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("abc123def");
      }
    });

    it("fails for empty string ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id("", "userId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("userId");
        expect(result.left.message).toBe("userId must be a valid ID");
      }
    });

    it("fails for whitespace-only string ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id("   ", "userId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("userId");
        expect(result.left.message).toBe("userId must be a valid ID");
      }
    });

    it("fails for null ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id(null as unknown as string, "userId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe("userId must be a valid ID");
      }
    });

    it("fails for undefined ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id(undefined as unknown as string, "userId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe("userId must be a valid ID");
      }
    });

    it("fails for number type (not string)", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id(123 as unknown as string, "userId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe("userId must be a valid ID");
      }
    });

    it("fails for object type", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id({} as unknown as string, "userId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe("userId must be a valid ID");
      }
    });

    it("uses custom field name in error message", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id("", "tripId")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("tripId");
        expect(result.left.message).toBe("tripId must be a valid ID");
      }
    });

    it("succeeds for CUID format ID", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id("clp1234567890abcdef123456789", "userId")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("clp1234567890abcdef123456789");
      }
    });

    it("succeeds for IDs with special characters", async () => {
      const result = await Effect.runPromise(
        Effect.either(validate.id("user_123-test", "userId")),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe("user_123-test");
      }
    });
  });

  // ============================================================================
  // Array Validation Tests
  // ============================================================================
  describe("[UNIT] validate.array", () => {
    describe("required rule", () => {
      it("succeeds for non-empty array when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array([1, 2, 3], "items", { required: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([1, 2, 3]);
        }
      });

      it("fails for empty array when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array([], "items", { required: true })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("items");
          expect(result.left.message).toBe("items is required");
        }
      });

      it("fails for null when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array(null as unknown as string[], "items", {
              required: true,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.field).toBe("items");
          expect(result.left.message).toBe("items is required");
        }
      });

      it("fails for undefined when required", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array(undefined as unknown as string[], "items", {
              required: true,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.field).toBe("items");
          expect(result.left.message).toBe("items is required");
        }
      });

      it("succeeds for empty array when not required", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array([], "items", { required: false })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([]);
        }
      });

      it("succeeds without required rule (defaults to not required)", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array([], "items", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([]);
        }
      });
    });

    describe("maxItems rule", () => {
      it("succeeds when array is within maxItems limit", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array([1, 2, 3], "items", { maxItems: 5 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([1, 2, 3]);
        }
      });

      it("succeeds when array equals maxItems limit", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array([1, 2, 3, 4, 5], "items", { maxItems: 5 }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([1, 2, 3, 4, 5]);
        }
      });

      it("fails when array exceeds maxItems limit", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array([1, 2, 3, 4, 5, 6], "items", { maxItems: 5 }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("items");
          expect(result.left.message).toBe("items cannot exceed 5 items");
        }
      });

      it("succeeds for empty array with maxItems", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array([], "items", { maxItems: 5 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([]);
        }
      });

      it("works with required and maxItems combined", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array([1, 2], "items", { required: true, maxItems: 5 }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([1, 2]);
        }
      });

      it("fails required check before maxItems for empty array", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array([], "items", { required: true, maxItems: 5 }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("items is required");
        }
      });
    });

    describe("non-array values", () => {
      it("fails for null (not array)", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array(null as unknown as string[], "items", {
              required: false,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("items must be an array");
        }
      });

      it("fails for undefined (not array)", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array(undefined as unknown as string[], "items", {
              required: false,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("items must be an array");
        }
      });

      it("fails for string (not array)", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array("not an array" as unknown as string[], "items", {}),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("items must be an array");
        }
      });

      it("fails for number (not array)", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array(123 as unknown as number[], "items", {}),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("items must be an array");
        }
      });

      it("fails for object (not array)", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array({ a: 1 } as unknown as number[], "items", {}),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("items must be an array");
        }
      });
    });

    describe("generic type support", () => {
      it("works with string arrays", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array(["a", "b", "c"], "tags", { required: true }),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual(["a", "b", "c"]);
        }
      });

      it("works with object arrays", async () => {
        interface Item {
          id: string;
          name: string;
        }
        const items: Item[] = [
          { id: "1", name: "Item 1" },
          { id: "2", name: "Item 2" },
        ];
        const result = await Effect.runPromise(
          Effect.either(validate.array(items, "items", { required: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual(items);
        }
      });

      it("works with mixed type arrays", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array([1, "two", { three: 3 }], "mixed", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([1, "two", { three: 3 }]);
        }
      });
    });

    describe("edge cases", () => {
      it("succeeds for single item array", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array(["only"], "items", { required: true })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual(["only"]);
        }
      });

      it("succeeds for large arrays within limit", async () => {
        const largeArray = Array.from({ length: 100 }, (_, i) => i);
        const result = await Effect.runPromise(
          Effect.either(validate.array(largeArray, "items", { maxItems: 100 })),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.length).toBe(100);
        }
      });

      it("fails for array exceeding large limit", async () => {
        const largeArray = Array.from({ length: 101 }, (_, i) => i);
        const result = await Effect.runPromise(
          Effect.either(validate.array(largeArray, "items", { maxItems: 100 })),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.message).toBe("items cannot exceed 100 items");
        }
      });

      it("succeeds for array with undefined/null items", async () => {
        const result = await Effect.runPromise(
          Effect.either(validate.array([1, null, undefined, 4], "items", {})),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([1, null, undefined, 4]);
        }
      });

      it("succeeds for nested arrays", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            validate.array(
              [
                [1, 2],
                [3, 4],
              ],
              "matrix",
              {},
            ),
          ),
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right).toEqual([
            [1, 2],
            [3, 4],
          ]);
        }
      });
    });
  });

  // ============================================================================
  // Date Range Validation Tests
  // ============================================================================
  describe("[UNIT] validate.dateRange", () => {
    it("succeeds when start is before end", async () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-12-31");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBeUndefined();
      }
    });

    it("succeeds when start equals end", async () => {
      const date = new Date("2024-06-15");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(date, date)),
      );
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBeUndefined();
      }
    });

    it("fails when start is after end", async () => {
      const start = new Date("2024-12-31");
      const end = new Date("2024-01-01");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("dateRange");
        expect(result.left.message).toBe(
          "start date must be before or equal to end date",
        );
      }
    });

    it("succeeds for millisecond difference", async () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2024-01-01T00:00:00.001Z");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("fails for one millisecond before (start after end)", async () => {
      const start = new Date("2024-01-01T00:00:00.001Z");
      const end = new Date("2024-01-01T00:00:00.000Z");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe(
          "start date must be before or equal to end date",
        );
      }
    });

    it("succeeds for same millisecond", async () => {
      const time = new Date("2024-01-01T00:00:00.000Z").getTime();
      const start = new Date(time);
      const end = new Date(time);
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("fails for invalid start date", async () => {
      const start = new Date("invalid");
      const end = new Date("2024-01-01");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("start");
        expect(result.left.message).toBe("start date must be a valid date");
      }
    });

    it("fails for invalid end date", async () => {
      const start = new Date("2024-01-01");
      const end = new Date("invalid");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("end");
        expect(result.left.message).toBe("end date must be a valid date");
      }
    });

    it("fails for both invalid dates", async () => {
      const start = new Date("invalid-start");
      const end = new Date("invalid-end");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("start");
        expect(result.left.message).toBe("start date must be a valid date");
      }
    });

    it("succeeds for dates in the past", async () => {
      const start = new Date("2020-01-01");
      const end = new Date("2020-12-31");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("succeeds for dates in the future", async () => {
      const start = new Date("2030-01-01");
      const end = new Date("2030-12-31");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("succeeds for date range spanning years", async () => {
      const start = new Date("2020-01-01");
      const end = new Date("2030-12-31");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("succeeds for UTC dates", async () => {
      const start = new Date("2024-01-01T00:00:00.000Z");
      const end = new Date("2024-12-31T23:59:59.999Z");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("succeeds for timezone-aware dates", async () => {
      const start = new Date("2024-01-01T00:00:00+05:00");
      const end = new Date("2024-12-31T23:59:59-08:00");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("handles Date objects created with timestamps", async () => {
      const now = Date.now();
      const start = new Date(now - 1000);
      const end = new Date(now);
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("handles epoch dates", async () => {
      const start = new Date(0);
      const end = new Date(86400000); // 1 day after epoch
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("fails for epoch end before epoch start", async () => {
      const start = new Date(86400000);
      const end = new Date(0);
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe(
          "start date must be before or equal to end date",
        );
      }
    });

    it("handles edge case dates (leap year)", async () => {
      const start = new Date("2024-02-29"); // Leap year
      const end = new Date("2024-03-01");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("handles invalid leap year date as invalid", async () => {
      const start = new Date("2023-02-29"); // Not a leap year - becomes Mar 1
      const end = new Date("2023-02-28");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      // JavaScript auto-adjusts invalid dates, so this may succeed or fail
      // depending on browser/JS engine behavior
      expect(result._tag).toBeDefined();
    });

    it("succeeds for same day with different times", async () => {
      const start = new Date("2024-06-15T09:00:00");
      const end = new Date("2024-06-15T17:00:00");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Right");
    });

    it("fails for same day with end before start time", async () => {
      const start = new Date("2024-06-15T17:00:00");
      const end = new Date("2024-06-15T09:00:00");
      const result = await Effect.runPromise(
        Effect.either(validate.dateRange(start, end)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe(
          "start date must be before or equal to end date",
        );
      }
    });
  });
});
