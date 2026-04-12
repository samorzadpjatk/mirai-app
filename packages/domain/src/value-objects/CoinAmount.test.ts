import { describe, it, expect } from "bun:test";
import { Effect, Exit } from "effect";
import { CoinAmount } from "./CoinAmount";

describe("[UNIT] CoinAmount", () => {
  describe("CoinAmount.create", () => {
    it("should create with positive integer", () => {
      const effect = CoinAmount.create(100);
      const coinAmount = Effect.runSync(effect);
      expect(coinAmount.toNumber()).toBe(100);
    });

    it("should create with zero", () => {
      const effect = CoinAmount.create(0);
      const coinAmount = Effect.runSync(effect);
      expect(coinAmount.toNumber()).toBe(0);
    });

    it("should create with large value", () => {
      const effect = CoinAmount.create(1_000_000_000);
      const coinAmount = Effect.runSync(effect);
      expect(coinAmount.toNumber()).toBe(1_000_000_000);
    });

    it("should reject negative value", () => {
      const effect = CoinAmount.create(-1);
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("should reject fractional value", () => {
      const effect = CoinAmount.create(10.5);
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("should reject value exceeding maximum", () => {
      const effect = CoinAmount.create(2_000_000_000);
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
    });
  });

  describe("CoinAmount.zero", () => {
    it("should create zero amount", () => {
      const zero = CoinAmount.zero();
      expect(zero.toNumber()).toBe(0);
      expect(zero.isZero()).toBe(true);
    });
  });

  describe("CoinAmount.add", () => {
    it("should add two amounts", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const b = Effect.runSync(CoinAmount.create(30));
      const result = Effect.runSync(a.add(b));

      expect(result.toNumber()).toBe(80);
    });

    it("should not exceed maximum when adding", () => {
      const a = CoinAmount.unsafeCreate(900_000_000);
      const b = CoinAmount.unsafeCreate(200_000_000);
      const effect = a.add(b);

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
    });
  });

  describe("CoinAmount.subtract", () => {
    it("should subtract smaller from larger", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const b = Effect.runSync(CoinAmount.create(30));
      const result = Effect.runSync(a.subtract(b));

      expect(result.toNumber()).toBe(20);
    });

    it("should return error when result would be negative", () => {
      const a = Effect.runSync(CoinAmount.create(30));
      const b = Effect.runSync(CoinAmount.create(50));
      const effect = a.subtract(b);

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("should allow subtracting to zero", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const b = Effect.runSync(CoinAmount.create(50));
      const result = Effect.runSync(a.subtract(b));

      expect(result.toNumber()).toBe(0);
      expect(result.isZero()).toBe(true);
    });
  });

  describe("CoinAmount.multiply", () => {
    it("should multiply by positive integer", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const result = Effect.runSync(a.multiply(3));

      expect(result.toNumber()).toBe(150);
    });

    it("should reject negative factor", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const effect = a.multiply(-2);

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("should reject fractional factor", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const effect = a.multiply(1.5);

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("should handle zero factor", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const result = Effect.runSync(a.multiply(0));

      expect(result.toNumber()).toBe(0);
    });
  });

  describe("CoinAmount.isGreaterThanOrEqual", () => {
    it("should return true when greater", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const b = Effect.runSync(CoinAmount.create(30));

      expect(a.isGreaterThanOrEqual(b)).toBe(true);
    });

    it("should return true when equal", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const b = Effect.runSync(CoinAmount.create(50));

      expect(a.isGreaterThanOrEqual(b)).toBe(true);
    });

    it("should return false when smaller", () => {
      const a = Effect.runSync(CoinAmount.create(30));
      const b = Effect.runSync(CoinAmount.create(50));

      expect(a.isGreaterThanOrEqual(b)).toBe(false);
    });
  });

  describe("CoinAmount.isZero", () => {
    it("should return true for zero", () => {
      const zero = CoinAmount.zero();
      expect(zero.isZero()).toBe(true);
    });

    it("should return false for positive", () => {
      const amount = Effect.runSync(CoinAmount.create(10));
      expect(amount.isZero()).toBe(false);
    });
  });

  describe("CoinAmount.compare", () => {
    it("should return positive when greater", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const b = Effect.runSync(CoinAmount.create(30));

      expect(a.compare(b)).toBeGreaterThan(0);
    });

    it("should return negative when smaller", () => {
      const a = Effect.runSync(CoinAmount.create(30));
      const b = Effect.runSync(CoinAmount.create(50));

      expect(a.compare(b)).toBeLessThan(0);
    });

    it("should return zero when equal", () => {
      const a = Effect.runSync(CoinAmount.create(50));
      const b = Effect.runSync(CoinAmount.create(50));

      expect(a.compare(b)).toBe(0);
    });
  });

  describe("CoinAmount.toString", () => {
    it("should format single coin", () => {
      const amount = Effect.runSync(CoinAmount.create(1));
      expect(amount.toString()).toBe("1 coin");
    });

    it("should format multiple coins", () => {
      const amount = Effect.runSync(CoinAmount.create(5));
      expect(amount.toString()).toBe("5 coins");
    });

    it("should format zero coins", () => {
      const amount = CoinAmount.zero();
      expect(amount.toString()).toBe("0 coins");
    });
  });

  describe("CoinAmount.unsafeCreate", () => {
    it("should create without validation", () => {
      const amount = CoinAmount.unsafeCreate(-100);
      expect(amount.toNumber()).toBe(-100);
    });

    it("should create valid amount", () => {
      const amount = CoinAmount.unsafeCreate(100);
      expect(amount.toNumber()).toBe(100);
    });
  });
});
