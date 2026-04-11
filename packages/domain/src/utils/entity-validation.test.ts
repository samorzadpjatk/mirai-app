import { describe, it, expect } from "bun:test";
import { validate } from "./entity-validation";
import { isValidationError } from "../errors/domain-errors";

describe("[UNIT] entity-validation", () => {
  describe("validate.string", () => {
    it("returns ok for valid string", () => {
      const result = validate.string("hello", "name", {});

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBe("hello");
      }
    });

    it("returns error for empty string when required", () => {
      const result = validate.string("", "name", { required: true });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(isValidationError(result.error)).toBe(true);
        expect(result.error.message).toContain("name is required");
      }
    });

    it("returns error for whitespace-only string when required", () => {
      const result = validate.string("   ", "name", { required: true });

      expect(result.kind).toBe("err");
    });

    it("allows empty string when not required", () => {
      const result = validate.string("", "name", { required: false });

      expect(result.kind).toBe("ok");
    });

    it("validates minLength", () => {
      const result = validate.string("hi", "name", { minLength: 3 });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("at least 3");
      }
    });

    it("returns ok when at minLength boundary", () => {
      const result = validate.string("abc", "name", { minLength: 3 });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBe("abc");
      }
    });

    it("validates maxLength", () => {
      const result = validate.string("toolong", "name", { maxLength: 3 });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("at most 3");
      }
    });

    it("returns ok when at maxLength boundary", () => {
      const result = validate.string("abc", "name", { maxLength: 3 });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBe("abc");
      }
    });

    it("trims when trim option is true", () => {
      const result = validate.string("  hello  ", "name", { trim: true });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBe("hello");
      }
    });

    it("does not trim when trim option is false", () => {
      const result = validate.string("  hello  ", "name", { trim: false });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBe("  hello  ");
      }
    });

    it("applies trim before length validation", () => {
      const result = validate.string("  hi  ", "name", {
        trim: true,
        minLength: 3,
      });

      expect(result.kind).toBe("err");
    });

    it("includes field name in error", () => {
      const result = validate.string("", "username", { required: true });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.field).toBe("username");
      }
    });
  });

  describe("validate.number", () => {
    it("returns ok for valid number", () => {
      const result = validate.number(42, "count", {});

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBe(42);
      }
    });

    it("validates min constraint", () => {
      const result = validate.number(5, "count", { min: 10 });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("at least 10");
      }
    });

    it("returns ok at min boundary", () => {
      const result = validate.number(10, "count", { min: 10 });

      expect(result.kind).toBe("ok");
    });

    it("validates max constraint", () => {
      const result = validate.number(15, "count", { max: 10 });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("at most 10");
      }
    });

    it("returns ok at max boundary", () => {
      const result = validate.number(10, "count", { max: 10 });

      expect(result.kind).toBe("ok");
    });

    it("validates integer constraint", () => {
      const result = validate.number(3.14, "count", { integer: true });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("integer");
      }
    });

    it("returns ok for integer when integer constraint set", () => {
      const result = validate.number(42, "count", { integer: true });

      expect(result.kind).toBe("ok");
    });

    it("returns ok for zero", () => {
      const result = validate.number(0, "count", { min: 0 });

      expect(result.kind).toBe("ok");
    });

    it("returns ok for negative numbers when allowed", () => {
      const result = validate.number(-10, "temperature", {});

      expect(result.kind).toBe("ok");
    });

    it("returns error for NaN", () => {
      const result = validate.number(NaN, "value", {});

      expect(result.kind).toBe("err");
    });
  });

  describe("validate.id", () => {
    it("returns ok for valid ID", () => {
      const result = validate.id("user-123", "userId");

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBe("user-123");
      }
    });

    it("returns error for empty string", () => {
      const result = validate.id("", "userId");

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("valid ID");
        expect(result.error.field).toBe("userId");
      }
    });

    it("returns error for whitespace-only string", () => {
      const result = validate.id("   ", "tripId");

      expect(result.kind).toBe("err");
    });

    it("accepts various ID formats", () => {
      expect(validate.id("abc", "id").kind).toBe("ok");
      expect(validate.id("123", "id").kind).toBe("ok");
      expect(validate.id("abc-123-def", "id").kind).toBe("ok");
      expect(validate.id("uuid-format-1234-5678", "id").kind).toBe("ok");
    });
  });

  describe("validate.array", () => {
    it("returns ok for valid array", () => {
      const result = validate.array([1, 2, 3], "items", {});

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toEqual([1, 2, 3]);
      }
    });

    it("returns error for empty array when required", () => {
      const result = validate.array([], "items", { required: true });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("required");
      }
    });

    it("allows empty array when not required", () => {
      const result = validate.array([], "items", { required: false });

      expect(result.kind).toBe("ok");
    });

    it("validates maxItems", () => {
      const result = validate.array([1, 2, 3, 4, 5], "items", { maxItems: 3 });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("cannot exceed 3 items");
      }
    });

    it("returns ok at maxItems boundary", () => {
      const result = validate.array([1, 2, 3], "items", { maxItems: 3 });

      expect(result.kind).toBe("ok");
    });

    it("preserves generic type", () => {
      interface Item {
        id: string;
      }
      const items: Item[] = [{ id: "1" }, { id: "2" }];
      const result = validate.array(items, "items", {});

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        // Type inference ensures result.value is Item[]
        expect(result.value[0]?.id).toBe("1");
      }
    });
  });

  describe("validate.dateRange", () => {
    it("returns ok when start is before end", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-15");
      const result = validate.dateRange(start, end);

      expect(result.kind).toBe("ok");
    });

    it("returns ok when start equals end", () => {
      const date = new Date("2024-01-01");
      const result = validate.dateRange(date, date);

      expect(result.kind).toBe("ok");
    });

    it("returns error when start is after end", () => {
      const start = new Date("2024-01-15");
      const end = new Date("2024-01-01");
      const result = validate.dateRange(start, end);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("before or equal");
      }
    });

    it("returns error for invalid start date", () => {
      const result = validate.dateRange(
        new Date("invalid"),
        new Date("2024-01-01"),
      );

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("start date");
      }
    });

    it("returns error for invalid end date", () => {
      const result = validate.dateRange(
        new Date("2024-01-01"),
        new Date("invalid"),
      );

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("end date");
      }
    });

    it("returns void value on success", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-15");
      const result = validate.dateRange(start, end);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBeUndefined();
      }
    });
  });
});
