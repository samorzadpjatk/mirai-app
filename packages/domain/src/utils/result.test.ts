import { describe, it, expect } from "bun:test";
import {
  ok,
  err,
  isSuccess,
  isError,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  map,
  mapError,
  flatMap,
  match,
  all,
  zip2,
  zip3,
  ResultWrapper,
} from "./result";

describe("[UNIT] result utilities", () => {
  describe("ok() and err()", () => {
    it("should create a successful result", () => {
      const result = ok(42);
      expect(result.kind).toBe("ok");
      expect(result.value).toBe(42);
    });

    it("should create an error result", () => {
      const result = err("error message");
      expect(result.kind).toBe("err");
      expect(result.error).toBe("error message");
    });
  });

  describe("isSuccess() and isError()", () => {
    it("should identify success results", () => {
      const success = ok(42);
      const error = err("error");

      expect(isSuccess(success)).toBe(true);
      expect(isSuccess(error)).toBe(false);
    });

    it("should identify error results", () => {
      const success = ok(42);
      const error = err("error");

      expect(isError(success)).toBe(false);
      expect(isError(error)).toBe(true);
    });
  });

  describe("unwrap()", () => {
    it("should return value from success result", () => {
      const result = ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it("should throw on error result", () => {
      const result = err("error");
      expect(() => unwrap(result)).toThrow();
    });
  });

  describe("unwrapOr()", () => {
    it("should return value from success result", () => {
      const result = ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it("should return default on error result", () => {
      const result = err("error");
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe("unwrapOrElse()", () => {
    it("should return value from success result", () => {
      const result = ok(42);
      expect(unwrapOrElse(result, () => 0)).toBe(42);
    });

    it("should compute default on error result", () => {
      const result = err("error");
      expect(unwrapOrElse(result, (e) => `fallback: ${e}`)).toBe(
        "fallback: error",
      );
    });
  });

  describe("map()", () => {
    it("should transform success value", () => {
      const result = ok(42);
      const mapped = map(result, (x) => x * 2);
      expect(unwrap(mapped)).toBe(84);
    });

    it("should pass through error", () => {
      const result = err("error");
      const mapped = map(result, (x: number) => x * 2);
      expect(isError(mapped)).toBe(true);
      expect((mapped as any).error).toBe("error");
    });
  });

  describe("mapError()", () => {
    it("should pass through success", () => {
      const result = ok(42);
      const mapped = mapError(result, (e) => `mapped: ${e}`);
      expect(unwrap(mapped)).toBe(42);
    });

    it("should transform error", () => {
      const result = err("error");
      const mapped = mapError(result, (e) => `mapped: ${e}`);
      expect(isError(mapped)).toBe(true);
      expect((mapped as any).error).toBe("mapped: error");
    });
  });

  describe("flatMap()", () => {
    it("should chain successful operations", () => {
      const result = ok(42);
      const chained = flatMap(result, (x) => ok(x * 2));
      expect(unwrap(chained)).toBe(84);
    });

    it("should short-circuit on first error", () => {
      const result = err("first error");
      const chained = flatMap(result, (x: number) => ok(x * 2));
      expect(isError(chained)).toBe(true);
      expect((chained as any).error).toBe("first error");
    });
  });

  describe("match()", () => {
    it("should call success handler on ok", () => {
      const result = ok(42);
      const value = match(
        result,
        (x) => `success: ${x}`,
        (e) => `error: ${e}`,
      );
      expect(value).toBe("success: 42");
    });

    it("should call error handler on err", () => {
      const result = err("error");
      const value = match(
        result,
        (x: number) => `success: ${x}`,
        (e) => `error: ${e}`,
      );
      expect(value).toBe("error: error");
    });
  });

  describe("all()", () => {
    it("should combine all successful results", () => {
      const results = [ok(1), ok(2), ok(3)];
      const combined = all(results);
      expect(unwrap(combined)).toEqual([1, 2, 3]);
    });

    it("should return first error", () => {
      const results = [ok(1), err("second failed"), ok(3)];
      const combined = all(results);
      expect(isError(combined)).toBe(true);
      expect((combined as any).error).toBe("second failed");
    });
  });

  describe("zip2()", () => {
    it("should combine two success results", () => {
      const result = zip2(ok(1), ok("two"));
      expect(unwrap(result)).toEqual([1, "two"]);
    });

    it("should return first error", () => {
      const result = zip2(err("first"), ok(2));
      expect(isError(result)).toBe(true);
    });

    it("should return second error if first is ok", () => {
      const result = zip2(ok(1), err("second"));
      expect(isError(result)).toBe(true);
    });
  });

  describe("zip3()", () => {
    it("should combine three success results", () => {
      const result = zip3(ok(1), ok(true), ok("three"));
      expect(unwrap(result)).toEqual([1, true, "three"]);
    });
  });

  describe("ResultWrapper", () => {
    it("should provide object-oriented interface", () => {
      const wrapper = new ResultWrapper(ok(42));
      expect(wrapper.isSuccess()).toBe(true);
      expect(wrapper.isError()).toBe(false);
      expect(wrapper.value).toBe(42);
    });

    it("should map values", () => {
      const wrapper = new ResultWrapper(ok(42));
      const mapped = wrapper.map((x) => x * 2);
      expect(mapped.value).toBe(84);
    });

    it("should flatMap results", () => {
      const wrapper = new ResultWrapper(ok(42));
      const chained = wrapper.flatMap((x) => new ResultWrapper(ok(x * 2)));
      expect(chained.value).toBe(84);
    });

    it("should match both cases", () => {
      const wrapper = new ResultWrapper(ok(42));
      const value = wrapper.match(
        (x) => `success: ${x}`,
        (e) => `error: ${e}`,
      );
      expect(value).toBe("success: 42");
    });
  });
});
