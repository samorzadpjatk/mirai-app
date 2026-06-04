import { describe, expect, it } from "@jest/globals";
import { calculateSwipeToValue, canSubmitReject } from "../../components/judgement/CardStack";

describe("canSubmitReject", () => {
  it("should return true when reason is non-empty and not reviewing", () => {
    expect(canSubmitReject("bad content", false)).toBe(true);
  });

  it("should return false when reason is empty", () => {
    expect(canSubmitReject("", false)).toBe(false);
    expect(canSubmitReject("   ", false)).toBe(false);
  });

  it("should return false when reviewing", () => {
    expect(canSubmitReject("bad content", true)).toBe(false);
  });
});

describe("calculateSwipeToValue", () => {
  it("should return positive for approved", () => {
    expect(calculateSwipeToValue("APPROVED", 100)).toBe(120);
  });

  it("should return negative for rejected", () => {
    expect(calculateSwipeToValue("REJECTED", 100)).toBe(-120);
  });
});
