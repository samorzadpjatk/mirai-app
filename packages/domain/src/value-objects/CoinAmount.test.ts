import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { CoinAmount } from "./CoinAmount";
import { ValidationError } from "../errors";

describe("[UNIT] CoinAmount", () => {
  describe("[UNIT] CoinAmount.create", () => {
    it("creates valid coin amount", async () => {
      const result = await Effect.runPromise(CoinAmount.create(100));
      expect(result.value).toBe(100);
    });

    it("creates zero amount", async () => {
      const result = await Effect.runPromise(CoinAmount.create(0));
      expect(result.value).toBe(0);
    });

    it("creates maximum amount", async () => {
      const result = await Effect.runPromise(CoinAmount.create(1_000_000_000));
      expect(result.value).toBe(1_000_000_000);
    });

    it("fails for negative amount", async () => {
      const exit = await Effect.runPromiseExit(CoinAmount.create(-1));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for non-integer amount", async () => {
      const exit = await Effect.runPromiseExit(CoinAmount.create(1.5));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for amount exceeding maximum", async () => {
      const exit = await Effect.runPromiseExit(
        CoinAmount.create(1_000_000_001),
      );
      expect(exit._tag).toBe("Failure");
    });

    it("returns ValidationError on failure", async () => {
      const result = await Effect.runPromise(
        Effect.either(CoinAmount.create(-5)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.message).toContain("cannot be negative");
      }
    });
  });

  describe("[UNIT] CoinAmount.unsafeCreate", () => {
    it("creates amount without validation", () => {
      const result = CoinAmount.unsafeCreate(999);
      expect(result.value).toBe(999);
    });
  });

  describe("[UNIT] CoinAmount.zero", () => {
    it("returns zero amount", () => {
      const result = CoinAmount.zero();
      expect(result.value).toBe(0);
    });
  });

  describe("[UNIT] CoinAmount.add", () => {
    it("adds two amounts", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(100));
      const amount2 = await Effect.runPromise(CoinAmount.create(50));
      const result = await Effect.runPromise(amount1.add(amount2));
      expect(result.value).toBe(150);
    });

    it("fails when result exceeds maximum", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(900_000_000));
      const amount2 = await Effect.runPromise(CoinAmount.create(200_000_000));
      const exit = await Effect.runPromiseExit(amount1.add(amount2));
      expect(exit._tag).toBe("Failure");
    });
  });

  describe("[UNIT] CoinAmount.subtract", () => {
    it("subtracts two amounts", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(100));
      const amount2 = await Effect.runPromise(CoinAmount.create(30));
      const result = await Effect.runPromise(amount1.subtract(amount2));
      expect(result.value).toBe(70);
    });

    it("fails when result would be negative", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(10));
      const amount2 = await Effect.runPromise(CoinAmount.create(20));
      const exit = await Effect.runPromiseExit(amount1.subtract(amount2));
      expect(exit._tag).toBe("Failure");
    });
  });

  describe("[UNIT] CoinAmount.multiply", () => {
    it("multiplies by positive integer", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(10));
      const result = await Effect.runPromise(amount.multiply(5));
      expect(result.value).toBe(50);
    });

    it("multiplies by zero", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(100));
      const result = await Effect.runPromise(amount.multiply(0));
      expect(result.value).toBe(0);
    });

    it("fails for negative factor", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(10));
      const exit = await Effect.runPromiseExit(amount.multiply(-2));
      expect(exit._tag).toBe("Failure");
    });

    it("fails for non-integer factor", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(10));
      const exit = await Effect.runPromiseExit(amount.multiply(1.5));
      expect(exit._tag).toBe("Failure");
    });

    it("fails when result exceeds maximum", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(500_000_000));
      const exit = await Effect.runPromiseExit(amount.multiply(3));
      expect(exit._tag).toBe("Failure");
    });
  });

  describe("[UNIT] CoinAmount.isGreaterThanOrEqual", () => {
    it("returns true when greater", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(100));
      const amount2 = await Effect.runPromise(CoinAmount.create(50));
      expect(amount1.isGreaterThanOrEqual(amount2)).toBe(true);
    });

    it("returns true when equal", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(100));
      const amount2 = await Effect.runPromise(CoinAmount.create(100));
      expect(amount1.isGreaterThanOrEqual(amount2)).toBe(true);
    });

    it("returns false when less", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(50));
      const amount2 = await Effect.runPromise(CoinAmount.create(100));
      expect(amount1.isGreaterThanOrEqual(amount2)).toBe(false);
    });
  });

  describe("[UNIT] CoinAmount.isZero", () => {
    it("returns true for zero amount", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(0));
      expect(amount.isZero()).toBe(true);
    });

    it("returns false for non-zero amount", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(100));
      expect(amount.isZero()).toBe(false);
    });
  });

  describe("[UNIT] CoinAmount.compare", () => {
    it("returns positive when greater", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(100));
      const amount2 = await Effect.runPromise(CoinAmount.create(50));
      expect(amount1.compare(amount2)).toBe(50);
    });

    it("returns zero when equal", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(100));
      const amount2 = await Effect.runPromise(CoinAmount.create(100));
      expect(amount1.compare(amount2)).toBe(0);
    });

    it("returns negative when less", async () => {
      const amount1 = await Effect.runPromise(CoinAmount.create(50));
      const amount2 = await Effect.runPromise(CoinAmount.create(100));
      expect(amount1.compare(amount2)).toBe(-50);
    });
  });

  describe("[UNIT] CoinAmount.toString", () => {
    it("formats single coin", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(1));
      expect(amount.toString()).toBe("1 coin");
    });

    it("formats multiple coins", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(5));
      expect(amount.toString()).toBe("5 coins");
    });

    it("formats zero coins", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(0));
      expect(amount.toString()).toBe("0 coins");
    });
  });

  describe("[UNIT] CoinAmount.toNumber", () => {
    it("returns raw value", async () => {
      const amount = await Effect.runPromise(CoinAmount.create(123));
      expect(amount.toNumber()).toBe(123);
    });
  });
});
