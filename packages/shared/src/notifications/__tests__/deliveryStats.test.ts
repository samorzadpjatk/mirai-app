import { describe, it, expect } from "vitest";
import { buildDeliveryStats } from "../deliveryStats";

describe("buildDeliveryStats", () => {
  it("returns all zeros for empty array", () => {
    const result = buildDeliveryStats([]);
    expect(result).toEqual({
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      partial: 0,
      successRate: 0,
    });
  });

  it("calculates 100% success rate for all success", () => {
    const deliveries = [
      { id: "1", status: "success" as const },
      { id: "2", status: "success" as const },
    ];
    const result = buildDeliveryStats(deliveries);
    expect(result.total).toBe(2);
    expect(result.successful).toBe(2);
    expect(result.successRate).toBe(100);
  });

  it("calculates 0% success rate for all failure", () => {
    const deliveries = [
      { id: "1", status: "failure" as const },
      { id: "2", status: "failure" as const },
    ];
    const result = buildDeliveryStats(deliveries);
    expect(result.total).toBe(2);
    expect(result.successful).toBe(0);
    expect(result.failed).toBe(2);
    expect(result.successRate).toBe(0);
  });

  it("calculates correct rate for mixed statuses", () => {
    const deliveries = [
      { id: "1", status: "success" as const },
      { id: "2", status: "failure" as const },
      { id: "3", status: "partial_failure" as const },
      { id: "4", status: "pending" as const },
    ];
    const result = buildDeliveryStats(deliveries);
    expect(result.total).toBe(4);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.partial).toBe(1);
    expect(result.pending).toBe(1);
    expect(result.successRate).toBe(25);
  });

  it("handles single delivery correctly", () => {
    const result = buildDeliveryStats([{ status: "success" as const }]);
    expect(result.total).toBe(1);
    expect(result.successRate).toBe(100);
  });

  it("handles large arrays", () => {
    const deliveries = Array.from({ length: 100 }, (_, i) => ({
      status: i < 80 ? ("success" as const) : ("failure" as const),
    }));
    const result = buildDeliveryStats(deliveries);
    expect(result.total).toBe(100);
    expect(result.successful).toBe(80);
    expect(result.successRate).toBe(80);
  });
});
