import { describe, expect, it } from "@jest/globals";
import {
  toFiniteNumberOrUndefined,
  toHeadingOrUndefined,
  toNonNegativeOrUndefined,
} from "~/services/background/backgroundLocationTaskUtils";

describe("toFiniteNumberOrUndefined", () => {
  it("should return number when valid finite number", () => {
    expect(toFiniteNumberOrUndefined(42)).toBe(42);
    expect(toFiniteNumberOrUndefined(0)).toBe(0);
    expect(toFiniteNumberOrUndefined(-10)).toBe(-10);
  });

  it("should return undefined for non-number values", () => {
    expect(toFiniteNumberOrUndefined(null)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(undefined)).toBeUndefined();
    expect(toFiniteNumberOrUndefined("string")).toBeUndefined();
  });

  it("should return undefined for non-finite numbers", () => {
    expect(toFiniteNumberOrUndefined(NaN)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(Infinity)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(-Infinity)).toBeUndefined();
  });
});

describe("toNonNegativeOrUndefined", () => {
  it("should return value for non-negative finite numbers", () => {
    expect(toNonNegativeOrUndefined(42)).toBe(42);
    expect(toNonNegativeOrUndefined(0)).toBe(0);
  });

  it("should return undefined for negative numbers", () => {
    expect(toNonNegativeOrUndefined(-1)).toBeUndefined();
    expect(toNonNegativeOrUndefined(-10)).toBeUndefined();
  });

  it("should return undefined for invalid numbers", () => {
    expect(toNonNegativeOrUndefined(NaN)).toBeUndefined();
    expect(toNonNegativeOrUndefined(Infinity)).toBeUndefined();
    expect(toNonNegativeOrUndefined(null)).toBeUndefined();
    expect(toNonNegativeOrUndefined(undefined)).toBeUndefined();
  });
});

describe("toHeadingOrUndefined", () => {
  it("should return value for valid heading", () => {
    expect(toHeadingOrUndefined(0)).toBe(0);
    expect(toHeadingOrUndefined(180)).toBe(180);
    expect(toHeadingOrUndefined(360)).toBe(360);
  });

  it("should return undefined for out of range values", () => {
    expect(toHeadingOrUndefined(-1)).toBeUndefined();
    expect(toHeadingOrUndefined(361)).toBeUndefined();
    expect(toHeadingOrUndefined(500)).toBeUndefined();
  });

  it("should return undefined for invalid numbers", () => {
    expect(toHeadingOrUndefined(NaN)).toBeUndefined();
    expect(toHeadingOrUndefined(Infinity)).toBeUndefined();
    expect(toHeadingOrUndefined(null)).toBeUndefined();
    expect(toHeadingOrUndefined(undefined)).toBeUndefined();
  });
});
