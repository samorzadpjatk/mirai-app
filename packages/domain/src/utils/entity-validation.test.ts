import { describe, it, expect } from "bun:test";
import { Effect, Exit } from "effect";
import { validate } from "./entity-validation";
import { isValidationError } from "../errors/effect-errors";

describe("[UNIT] entity-validation", () => {
  describe("validate.string", () => {
    it("returns ok for valid string", () => {
      const effect = validate.string("hello", "name", {});
      const value = Effect.runSync(effect);

      expect(value).toBe("hello");
    });

    it("returns error for empty string when required", () => {
      const effect = validate.string("", "name", { required: true });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect(isValidationError(error)).toBe(true);
        expect((error as Error).message).toContain("name is required");
      }
    });

    it("returns error for whitespace-only string when required", () => {
      const effect = validate.string("   ", "name", { required: true });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("allows empty string when not required", () => {
      const effect = validate.string("", "name", { required: false });
      const value = Effect.runSync(effect);

      expect(value).toBe("");
    });

    it("validates minLength", () => {
      const effect = validate.string("hi", "name", { minLength: 3 });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("at least 3");
      }
    });

    it("returns ok when at minLength boundary", () => {
      const effect = validate.string("abc", "name", { minLength: 3 });
      const value = Effect.runSync(effect);

      expect(value).toBe("abc");
    });

    it("validates maxLength", () => {
      const effect = validate.string("toolong", "name", { maxLength: 3 });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("at most 3");
      }
    });

    it("returns ok when at maxLength boundary", () => {
      const effect = validate.string("abc", "name", { maxLength: 3 });
      const value = Effect.runSync(effect);

      expect(value).toBe("abc");
    });

    it("trims when trim option is true", () => {
      const effect = validate.string("  hello  ", "name", { trim: true });
      const value = Effect.runSync(effect);

      expect(value).toBe("hello");
    });

    it("does not trim when trim option is false", () => {
      const effect = validate.string("  hello  ", "name", { trim: false });
      const value = Effect.runSync(effect);

      expect(value).toBe("  hello  ");
    });

    it("applies trim before length validation", () => {
      const effect = validate.string("  hi  ", "name", {
        trim: true,
        minLength: 3,
      });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("includes field name in error", () => {
      const effect = validate.string("", "username", { required: true });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as { field: string }).field).toBe("username");
      }
    });
  });

  describe("validate.number", () => {
    it("returns ok for valid number", () => {
      const effect = validate.number(42, "count", {});
      const value = Effect.runSync(effect);

      expect(value).toBe(42);
    });

    it("validates min constraint", () => {
      const effect = validate.number(5, "count", { min: 10 });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("at least 10");
      }
    });

    it("returns ok at min boundary", () => {
      const effect = validate.number(10, "count", { min: 10 });
      const value = Effect.runSync(effect);

      expect(value).toBe(10);
    });

    it("validates max constraint", () => {
      const effect = validate.number(15, "count", { max: 10 });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("at most 10");
      }
    });

    it("returns ok at max boundary", () => {
      const effect = validate.number(10, "count", { max: 10 });
      const value = Effect.runSync(effect);

      expect(value).toBe(10);
    });

    it("validates integer constraint", () => {
      const effect = validate.number(3.14, "count", { integer: true });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("integer");
      }
    });

    it("returns ok for integer when integer constraint set", () => {
      const effect = validate.number(42, "count", { integer: true });
      const value = Effect.runSync(effect);

      expect(value).toBe(42);
    });

    it("returns ok for zero", () => {
      const effect = validate.number(0, "count", { min: 0 });
      const value = Effect.runSync(effect);

      expect(value).toBe(0);
    });

    it("returns ok for negative numbers when allowed", () => {
      const effect = validate.number(-10, "temperature", {});
      const value = Effect.runSync(effect);

      expect(value).toBe(-10);
    });

    it("returns error for NaN", () => {
      const effect = validate.number(NaN, "value", {});
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
    });
  });

  describe("validate.id", () => {
    it("returns ok for valid ID", () => {
      const effect = validate.id("user-123", "userId");
      const value = Effect.runSync(effect);

      expect(value).toBe("user-123");
    });

    it("returns error for empty string", () => {
      const effect = validate.id("", "userId");
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("valid ID");
        expect((error as { field: string }).field).toBe("userId");
      }
    });

    it("returns error for whitespace-only string", () => {
      const effect = validate.id("   ", "tripId");
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("accepts various ID formats", () => {
      expect(Effect.runSync(validate.id("abc", "id"))).toBe("abc");
      expect(Effect.runSync(validate.id("123", "id"))).toBe("123");
      expect(Effect.runSync(validate.id("abc-123-def", "id"))).toBe(
        "abc-123-def",
      );
      expect(Effect.runSync(validate.id("uuid-format-1234-5678", "id"))).toBe(
        "uuid-format-1234-5678",
      );
    });
  });

  describe("validate.array", () => {
    it("returns ok for valid array", () => {
      const effect = validate.array([1, 2, 3], "items", {});
      const value = Effect.runSync(effect);

      expect(value).toEqual([1, 2, 3]);
    });

    it("returns error for empty array when required", () => {
      const effect = validate.array([], "items", { required: true });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("required");
      }
    });

    it("allows empty array when not required", () => {
      const effect = validate.array([], "items", { required: false });
      const value = Effect.runSync(effect);

      expect(value).toEqual([]);
    });

    it("validates maxItems", () => {
      const effect = validate.array([1, 2, 3, 4, 5], "items", { maxItems: 3 });
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("cannot exceed 3 items");
      }
    });

    it("returns ok at maxItems boundary", () => {
      const effect = validate.array([1, 2, 3], "items", { maxItems: 3 });
      const value = Effect.runSync(effect);

      expect(value).toEqual([1, 2, 3]);
    });

    it("preserves generic type", () => {
      interface Item {
        id: string;
      }
      const items: Item[] = [{ id: "1" }, { id: "2" }];
      const effect = validate.array(items, "items", {});
      const value = Effect.runSync(effect);

      // Type inference ensures value is Item[]
      expect(value[0]?.id).toBe("1");
    });
  });

  describe("validate.dateRange", () => {
    it("returns ok when start is before end", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-15");
      const effect = validate.dateRange(start, end);

      expect(Effect.runSync(effect)).toBeUndefined();
    });

    it("returns ok when start equals end", () => {
      const date = new Date("2024-01-01");
      const effect = validate.dateRange(date, date);

      expect(Effect.runSync(effect)).toBeUndefined();
    });

    it("returns error when start is after end", () => {
      const start = new Date("2024-01-15");
      const end = new Date("2024-01-01");
      const effect = validate.dateRange(start, end);
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("before or equal");
      }
    });

    it("returns error for invalid start date", () => {
      const effect = validate.dateRange(
        new Date("invalid"),
        new Date("2024-01-01"),
      );
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("start date");
      }
    });

    it("returns error for invalid end date", () => {
      const effect = validate.dateRange(
        new Date("2024-01-01"),
        new Date("invalid"),
      );
      const exit = Effect.runSyncExit(effect);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error =
          exit.cause._tag === "Fail" ? exit.cause.error : exit.cause;
        expect((error as Error).message).toContain("end date");
      }
    });

    it("returns void value on success", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-15");
      const effect = validate.dateRange(start, end);
      const value = Effect.runSync(effect);

      expect(value).toBeUndefined();
    });
  });
});
