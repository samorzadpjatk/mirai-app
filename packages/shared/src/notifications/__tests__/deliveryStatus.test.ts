import { describe, it, expect } from "vitest";
import { buildDeliveryStatus } from "../deliveryStatus";

describe("buildDeliveryStatus", () => {
  it("returns success when no failures", () => {
    expect(buildDeliveryStatus(10, 0)).toBe("success");
  });

  it("returns failure when no successes", () => {
    expect(buildDeliveryStatus(0, 10)).toBe("failure");
  });

  it("returns partial_failure when mix of success and failure", () => {
    expect(buildDeliveryStatus(7, 3)).toBe("partial_failure");
  });

  it("returns success when both counts are zero", () => {
    expect(buildDeliveryStatus(0, 0)).toBe("success");
  });

  it("returns success for single success", () => {
    expect(buildDeliveryStatus(1, 0)).toBe("success");
  });

  it("returns failure for single failure", () => {
    expect(buildDeliveryStatus(0, 1)).toBe("failure");
  });
});
