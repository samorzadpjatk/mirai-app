import { describe, it, expect } from "@jest/globals";
import { shouldRunAutoPushEffect } from "../../notifications/useAutoPushSubscription";

describe("shouldRunAutoPushEffect", () => {
  it("should return false when no session", () => {
    expect(shouldRunAutoPushEffect(false, "user1", false, false, false, null)).toBe(false);
  });

  it("should return false when no authUserId", () => {
    expect(shouldRunAutoPushEffect(true, null, false, false, false, null)).toBe(false);
  });

  it("should return false when status is loading", () => {
    expect(shouldRunAutoPushEffect(true, "user1", true, false, false, null)).toBe(false);
  });

  it("should return false when already subscribed", () => {
    expect(shouldRunAutoPushEffect(true, "user1", false, true, false, null)).toBe(false);
  });

  it("should return false when mutation is pending", () => {
    expect(shouldRunAutoPushEffect(true, "user1", false, false, true, null)).toBe(false);
  });

  it("should return false when already attempted for user", () => {
    expect(shouldRunAutoPushEffect(true, "user1", false, false, false, "user1")).toBe(false);
  });

  it("should return true when all conditions allow", () => {
    expect(shouldRunAutoPushEffect(true, "user1", false, false, false, null)).toBe(true);
  });

  it("should return true when attempted for different user", () => {
    expect(shouldRunAutoPushEffect(true, "user1", false, false, false, "user2")).toBe(true);
  });
});
