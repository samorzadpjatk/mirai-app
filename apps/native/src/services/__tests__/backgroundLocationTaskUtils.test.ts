import { describe, it, expect } from "@jest/globals";
import {
  toFiniteNumberOrNull,
  toNonNegativeOrNull,
  toHeadingOrNull,
} from "~/services/background/backgroundLocationTaskUtils";

describe("toFiniteNumberOrNull", () => {
  it("should return number when valid finite number", () => {
    expect(toFiniteNumberOrNull(42)).toBe(42);
    expect(toFiniteNumberOrNull(0)).toBe(0);
    expect(toFiniteNumberOrNull(-10)).toBe(-10);
  });

  it("should return null for non-number values", () => {
    expect(toFiniteNumberOrNull(null)).toBeNull();
    expect(toFiniteNumberOrNull(undefined)).toBeNull();
    expect(toFiniteNumberOrNull("string" as unknown as number)).toBeNull();
  });

  it("should return null for non-finite numbers", () => {
    expect(toFiniteNumberOrNull(NaN)).toBeNull();
    expect(toFiniteNumberOrNull(Infinity)).toBeNull();
    expect(toFiniteNumberOrNull(-Infinity)).toBeNull();
  });
});

describe("toNonNegativeOrNull", () => {
  it("should return value for non-negative finite numbers", () => {
    expect(toNonNegativeOrNull(42)).toBe(42);
    expect(toNonNegativeOrNull(0)).toBe(0);
  });

  it("should return null for negative numbers", () => {
    expect(toNonNegativeOrNull(-1)).toBeNull();
    expect(toNonNegativeOrNull(-10)).toBeNull();
  });

  it("should return null for invalid numbers", () => {
    expect(toNonNegativeOrNull(NaN)).toBeNull();
    expect(toNonNegativeOrNull(Infinity)).toBeNull();
    expect(toNonNegativeOrNull(null)).toBeNull();
    expect(toNonNegativeOrNull(undefined)).toBeNull();
  });
});

describe("toHeadingOrNull", () => {
  it("should return value for valid heading", () => {
    expect(toHeadingOrNull(0)).toBe(0);
    expect(toHeadingOrNull(180)).toBe(180);
    expect(toHeadingOrNull(360)).toBe(360);
  });

  it("should return null for out of range values", () => {
    expect(toHeadingOrNull(-1)).toBeNull();
    expect(toHeadingOrNull(361)).toBeNull();
    expect(toHeadingOrNull(500)).toBeNull();
  });

  it("should return null for invalid numbers", () => {
    expect(toHeadingOrNull(NaN)).toBeNull();
    expect(toHeadingOrNull(Infinity)).toBeNull();
    expect(toHeadingOrNull(null)).toBeNull();
    expect(toHeadingOrNull(undefined)).toBeNull();
  });
});