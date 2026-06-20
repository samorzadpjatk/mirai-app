import { describe, expect, it } from "vitest";
import { buildRetryResult } from "../notificationResult";

describe("buildRetryResult", () => {
  it("assembles a success result with all fields", () => {
    const retryResult = {
      sent: 5,
      failed: 0,
      total: 5,
      success: true,
    };

    const result = buildRetryResult(retryResult, "notif-123", 3);

    expect(result).toEqual({
      notificationId: "notif-123",
      retriedCount: 3,
      sent: 5,
      failed: 0,
      total: 5,
      success: true,
    });
  });

  it("assembles a failure result with zero retriedCount", () => {
    const retryResult = {
      sent: 1,
      failed: 4,
      total: 5,
      success: false,
    };

    const result = buildRetryResult(retryResult, "notif-456", 0);

    expect(result).toEqual({
      notificationId: "notif-456",
      retriedCount: 0,
      sent: 1,
      failed: 4,
      total: 5,
      success: false,
    });
  });
});
