import { describe, it, expect } from "@jest/globals";
import {
  calculateIsSubscribed,
  calculateIsSubscribedElsewhere,
  buildPermissionAlertButtons,
  getExpoProjectId,
  shouldRequestNotificationPermission,
  buildNotificationPermissionResult,
} from "../../notifications/useNotifications";

describe("calculateIsSubscribed", () => {
  it("should return true when permission is granted and subscribed", () => {
    expect(calculateIsSubscribed("granted", true)).toBe(true);
  });

  it("should return false when permission is granted but not subscribed", () => {
    expect(calculateIsSubscribed("granted", false)).toBe(false);
  });

  it("should return false when permission is denied even if subscribed", () => {
    expect(calculateIsSubscribed("denied", true)).toBe(false);
  });

  it("should return false when subscription status is undefined", () => {
    expect(calculateIsSubscribed("granted", undefined)).toBe(false);
  });

  it("should return false when permission is undetermined", () => {
    expect(calculateIsSubscribed("undetermined", true)).toBe(false);
  });
});

describe("calculateIsSubscribedElsewhere", () => {
  it("should return true when subscribed but permission not granted", () => {
    expect(calculateIsSubscribedElsewhere("denied", true)).toBe(true);
  });

  it("should return false when permission is granted", () => {
    expect(calculateIsSubscribedElsewhere("granted", true)).toBe(false);
  });

  it("should return false when not subscribed", () => {
    expect(calculateIsSubscribedElsewhere("denied", false)).toBe(false);
  });

  it("should return false when subscription status is undefined", () => {
    expect(calculateIsSubscribedElsewhere("denied", undefined)).toBe(false);
  });
});

describe("buildPermissionAlertButtons", () => {
  it("should return cancel and open settings buttons", () => {
    const onPress = jest.fn();
    const buttons = buildPermissionAlertButtons(onPress);
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toEqual({ text: "Cancel", style: "cancel" });
    expect(buttons[1]).toEqual({ text: "Open Settings", onPress });
  });
});

describe("getExpoProjectId", () => {
  it("should return undefined when no config is available", () => {
    const result = getExpoProjectId();
    expect(result).toBeUndefined();
  });
});

describe("shouldRequestNotificationPermission", () => {
  it("should return true when status is not granted", () => {
    expect(shouldRequestNotificationPermission("denied")).toBe(true);
    expect(shouldRequestNotificationPermission("undetermined")).toBe(true);
  });

  it("should return false when status is granted", () => {
    expect(shouldRequestNotificationPermission("granted")).toBe(false);
  });
});

describe("buildNotificationPermissionResult", () => {
  it("should return new status when provided", () => {
    expect(buildNotificationPermissionResult("denied", "granted")).toBe("granted");
  });

  it("should return existing status when no new status", () => {
    expect(buildNotificationPermissionResult("denied")).toBe("denied");
  });
});
