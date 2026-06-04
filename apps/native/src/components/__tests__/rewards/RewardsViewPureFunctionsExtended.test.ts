import { describe, expect, it } from "@jest/globals";
import {
  getPurchaseModalError,
  getPurchaseValidationError,
  getRewardAvailabilityColor,
  getRewardAvailabilityText,
  getRewardBorderColor,
  getRewardButtonState,
  getRewardShadowProps,
  getTotalCost,
  isValidQuantity,
} from "~/components/rewards/RewardsView";

describe("getRewardButtonState", () => {
  it("should return enabled state when all conditions are met", () => {
    const result = getRewardButtonState(true, true, false, false);
    expect(result.disabled).toBe(false);
    expect(result.text).toBe("Claim reward");
    expect(result.backgroundColor).toBe("#00ced1");
    expect(result.opacity).toBe(1);
  });

  it("should return disabled state when trip is past", () => {
    const result = getRewardButtonState(true, true, false, true);
    expect(result.disabled).toBe(true);
    expect(result.text).toBe("Trip ended");
    expect(result.backgroundColor).toBe("#374151");
    expect(result.opacity).toBe(0.5);
  });

  it("should return disabled state when out of stock", () => {
    const result = getRewardButtonState(true, true, true, false);
    expect(result.disabled).toBe(true);
    expect(result.text).toBe("Sold out");
    expect(result.backgroundColor).toBe("#374151");
    expect(result.opacity).toBe(0.5);
  });

  it("should return disabled state when not eligible to buy", () => {
    const result = getRewardButtonState(true, false, false, false);
    expect(result.disabled).toBe(true);
    expect(result.text).toBe("Only group leader");
    expect(result.backgroundColor).toBe("#374151");
    expect(result.opacity).toBe(0.5);
  });

  it("should return disabled state when cannot afford", () => {
    const result = getRewardButtonState(false, true, false, false);
    expect(result.disabled).toBe(true);
    expect(result.text).toBe("Not enough coins");
    expect(result.backgroundColor).toBe("#374151");
    expect(result.opacity).toBe(0.5);
  });

  it("should prioritize trip past over other states", () => {
    const result = getRewardButtonState(false, false, true, true);
    expect(result.text).toBe("Trip ended");
  });

  it("should prioritize out of stock when not past and can afford", () => {
    const result = getRewardButtonState(true, true, true, false);
    expect(result.text).toBe("Sold out");
  });
});

describe("getRewardBorderColor", () => {
  it("should return green when just refreshed and in stock", () => {
    expect(getRewardBorderColor(true, false)).toBe("#10b981");
  });

  it("should return red when out of stock", () => {
    expect(getRewardBorderColor(false, true)).toBe("#ef4444");
    expect(getRewardBorderColor(true, true)).toBe("#ef4444");
  });

  it("should return default when not refreshed and in stock", () => {
    expect(getRewardBorderColor(false, false)).toBe("#273a3a");
  });
});

describe("getRewardShadowProps", () => {
  it("should return active shadow when just refreshed", () => {
    const result = getRewardShadowProps(true);
    expect(result.shadowColor).toBe("#10b981");
    expect(result.shadowOffset).toEqual({ width: 0, height: 0 });
    expect(result.shadowOpacity).toBe(0.3);
    expect(result.shadowRadius).toBe(4);
  });

  it("should return transparent shadow when not refreshed", () => {
    const result = getRewardShadowProps(false);
    expect(result.shadowColor).toBe("transparent");
    expect(result.shadowOffset).toBeUndefined();
    expect(result.shadowOpacity).toBe(0);
    expect(result.shadowRadius).toBe(0);
  });
});

describe("getRewardAvailabilityText", () => {
  it("should return Sold out when out of stock", () => {
    expect(getRewardAvailabilityText(true, 5)).toBe("Sold out");
    expect(getRewardAvailabilityText(true, null)).toBe("Sold out");
  });

  it("should return quantity when in stock", () => {
    expect(getRewardAvailabilityText(false, 10)).toBe("10 pcs.");
  });

  it("should return 0 pcs. when quantity is null/undefined and in stock", () => {
    expect(getRewardAvailabilityText(false, null)).toBe("0 pcs.");
    expect(getRewardAvailabilityText(false, undefined)).toBe("0 pcs.");
  });
});

describe("getRewardAvailabilityColor", () => {
  it("should return red when out of stock", () => {
    expect(getRewardAvailabilityColor(true)).toBe("#ef4444");
  });

  it("should return green when in stock", () => {
    expect(getRewardAvailabilityColor(false)).toBe("#10b981");
  });
});

describe("getTotalCost", () => {
  it("should calculate total cost correctly", () => {
    expect(getTotalCost(10, "3")).toBe(30);
    expect(getTotalCost(5, "1")).toBe(5);
  });

  it("should default to 1 when quantity is invalid", () => {
    expect(getTotalCost(10, "")).toBe(10);
    expect(getTotalCost(10, "abc")).toBe(10);
  });

  it("should handle zero cost", () => {
    expect(getTotalCost(0, "5")).toBe(0);
  });
});

describe("isValidQuantity", () => {
  it("should return true for valid positive integers", () => {
    expect(isValidQuantity("1")).toBe(true);
    expect(isValidQuantity("10")).toBe(true);
    expect(isValidQuantity("99")).toBe(true);
  });

  it("should return false for non-numeric strings", () => {
    expect(isValidQuantity("abc")).toBe(false);
    expect(isValidQuantity("")).toBe(false);
  });

  it("should return false for zero and negative numbers", () => {
    expect(isValidQuantity("0")).toBe(false);
    expect(isValidQuantity("-1")).toBe(false);
  });

  it("should allow decimals truncated by parseInt", () => {
    expect(isValidQuantity("1.5")).toBe(true);
  });
});

describe("getPurchaseModalError", () => {
  it("should return error when no group", () => {
    expect(getPurchaseModalError(null, true)).toBe("You are not assigned to any group");
    expect(getPurchaseModalError(undefined, true)).toBe("You are not assigned to any group");
  });

  it("should return error when not eligible to buy", () => {
    expect(getPurchaseModalError({ id: "1" }, false)).toBe("Only group leader can claim rewards");
  });

  it("should return null when group exists and eligible", () => {
    expect(getPurchaseModalError({ id: "1" }, true)).toBeNull();
  });
});

describe("getPurchaseValidationError", () => {
  it("should return error for invalid quantity", () => {
    expect(getPurchaseValidationError("abc", 10, 100)).toBe("Enter a valid quantity");
    expect(getPurchaseValidationError("0", 10, 100)).toBe("Enter a valid quantity");
    expect(getPurchaseValidationError("", 10, 100)).toBe("Enter a valid quantity");
  });

  it("should return error when not enough coins", () => {
    expect(getPurchaseValidationError("5", 10, 30)).toBe("You do not have enough coins");
  });

  it("should return null when valid and affordable", () => {
    expect(getPurchaseValidationError("3", 10, 100)).toBeNull();
  });

  it("should handle edge case with zero cost", () => {
    expect(getPurchaseValidationError("1", 0, 0)).toBeNull();
  });
});
