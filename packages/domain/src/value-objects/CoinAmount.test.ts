import { describe, it, expect } from "bun:test";
import { CoinAmount } from "./CoinAmount";

// Helper to extract value from Result
const unwrap = <T, E>(
  result: { kind: "ok"; value: T } | { kind: "err"; error: E },
): T => {
  if (result.kind === "err") {
    throw new Error(`Unexpected error: ${result.error}`);
  }
  return result.value;
};

describe("[UNIT] CoinAmount", () => {
  describe("CoinAmount.create", () => {
    it("should create with positive integer", () => {
      const result = CoinAmount.create(100);
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.toNumber()).toBe(100);
      }
    });

    it("should create with zero", () => {
      const result = CoinAmount.create(0);
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.toNumber()).toBe(0);
      }
    });

    it("should create with large value", () => {
      const result = CoinAmount.create(1_000_000_000);
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.toNumber()).toBe(1_000_000_000);
      }
    });

    it("should reject negative value", () => {
      const result = CoinAmount.create(-1);
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("negative");
      }
    });

    it("should reject fractional value", () => {
      const result = CoinAmount.create(10.5);
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("integer");
      }
    });

    it("should reject value exceeding maximum", () => {
      const result = CoinAmount.create(2_000_000_000);
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("maximum");
      }
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
      const a = unwrap(CoinAmount.create(50));
      const b = unwrap(CoinAmount.create(30));
      const result = a.add(b);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.toNumber()).toBe(80);
      }
    });

    it("should not exceed maximum when adding", () => {
      const a = CoinAmount.unsafeCreate(900_000_000);
      const b = CoinAmount.unsafeCreate(200_000_000);
      const result = a.add(b);

      expect(result.kind).toBe("err");
    });
  });

  describe("CoinAmount.subtract", () => {
    it("should subtract smaller from larger", () => {
      const a = unwrap(CoinAmount.create(50));
      const b = unwrap(CoinAmount.create(30));
      const result = a.subtract(b);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.toNumber()).toBe(20);
      }
    });

    it("should return error when result would be negative", () => {
      const a = unwrap(CoinAmount.create(30));
      const b = unwrap(CoinAmount.create(50));
      const result = a.subtract(b);

      expect(result.kind).toBe("err");
    });

    it("should allow subtracting to zero", () => {
      const a = unwrap(CoinAmount.create(50));
      const b = unwrap(CoinAmount.create(50));
      const result = a.subtract(b);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.toNumber()).toBe(0);
        expect(result.value.isZero()).toBe(true);
      }
    });
  });

  describe("CoinAmount.multiply", () => {
    it("should multiply by positive integer", () => {
      const a = unwrap(CoinAmount.create(50));
      const result = a.multiply(3);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.toNumber()).toBe(150);
      }
    });

    it("should reject negative factor", () => {
      const a = unwrap(CoinAmount.create(50));
      const result = a.multiply(-2);

      expect(result.kind).toBe("err");
    });

    it("should reject fractional factor", () => {
      const a = unwrap(CoinAmount.create(50));
      const result = a.multiply(1.5);

      expect(result.kind).toBe("err");
    });

    it("should handle zero factor", () => {
      const a = unwrap(CoinAmount.create(50));
      const result = a.multiply(0);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.toNumber()).toBe(0);
      }
    });
  });

  describe("CoinAmount.isGreaterThanOrEqual", () => {
    it("should return true when greater", () => {
      const a = unwrap(CoinAmount.create(50));
      const b = unwrap(CoinAmount.create(30));

      expect(a.isGreaterThanOrEqual(b)).toBe(true);
    });

    it("should return true when equal", () => {
      const a = unwrap(CoinAmount.create(50));
      const b = unwrap(CoinAmount.create(50));

      expect(a.isGreaterThanOrEqual(b)).toBe(true);
    });

    it("should return false when smaller", () => {
      const a = unwrap(CoinAmount.create(30));
      const b = unwrap(CoinAmount.create(50));

      expect(a.isGreaterThanOrEqual(b)).toBe(false);
    });
  });

  describe("CoinAmount.isZero", () => {
    it("should return true for zero", () => {
      const zero = CoinAmount.zero();
      expect(zero.isZero()).toBe(true);
    });

    it("should return false for positive", () => {
      const amount = unwrap(CoinAmount.create(10));
      expect(amount.isZero()).toBe(false);
    });
  });

  describe("CoinAmount.compare", () => {
    it("should return positive when greater", () => {
      const a = unwrap(CoinAmount.create(50));
      const b = unwrap(CoinAmount.create(30));

      expect(a.compare(b)).toBeGreaterThan(0);
    });

    it("should return negative when smaller", () => {
      const a = unwrap(CoinAmount.create(30));
      const b = unwrap(CoinAmount.create(50));

      expect(a.compare(b)).toBeLessThan(0);
    });

    it("should return zero when equal", () => {
      const a = unwrap(CoinAmount.create(50));
      const b = unwrap(CoinAmount.create(50));

      expect(a.compare(b)).toBe(0);
    });
  });

  describe("CoinAmount.toString", () => {
    it("should format single coin", () => {
      const amount = unwrap(CoinAmount.create(1));
      expect(amount.toString()).toBe("1 coin");
    });

    it("should format multiple coins", () => {
      const amount = unwrap(CoinAmount.create(5));
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
