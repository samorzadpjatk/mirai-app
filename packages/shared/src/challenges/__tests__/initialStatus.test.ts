import { describe, expect, it } from "vitest";
import { computeInitialStatus } from "../initialStatus";

describe("computeInitialStatus", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  it("returns HIDDEN when no status provided", () => {
    const result = computeInitialStatus({}, now);
    expect(result).toBe("HIDDEN");
  });

  it("returns requested status when not visible", () => {
    expect(computeInitialStatus({ status: "HIDDEN" }, now)).toBe("HIDDEN");
  });

  it("returns VISIBLE when visible but no start time", () => {
    const result = computeInitialStatus({ status: "VISIBLE" }, now);
    expect(result).toBe("VISIBLE");
  });

  it("returns VISIBLE when visible but recurring", () => {
    const result = computeInitialStatus(
      { status: "VISIBLE", isRecurring: true, startTime: new Date("2024-06-15T10:00:00Z") },
      now,
    );
    expect(result).toBe("VISIBLE");
  });

  it("returns ACTIVE when visible, non-recurring, start time in past, no end time", () => {
    const result = computeInitialStatus(
      { status: "VISIBLE", isRecurring: false, startTime: new Date("2024-06-15T10:00:00Z") },
      now,
    );
    expect(result).toBe("ACTIVE");
  });

  it("returns ACTIVE when visible, non-recurring, start time in past, end time in future", () => {
    const result = computeInitialStatus(
      {
        status: "VISIBLE",
        isRecurring: false,
        startTime: new Date("2024-06-15T10:00:00Z"),
        endTime: new Date("2024-06-15T20:00:00Z"),
      },
      now,
    );
    expect(result).toBe("ACTIVE");
  });

  it("returns VISIBLE when visible, non-recurring, start time in future", () => {
    const result = computeInitialStatus(
      {
        status: "VISIBLE",
        isRecurring: false,
        startTime: new Date("2024-06-15T14:00:00Z"),
      },
      now,
    );
    expect(result).toBe("VISIBLE");
  });

  it("returns VISIBLE when visible, non-recurring, start time in past, end time in past", () => {
    const result = computeInitialStatus(
      {
        status: "VISIBLE",
        isRecurring: false,
        startTime: new Date("2024-06-15T08:00:00Z"),
        endTime: new Date("2024-06-15T10:00:00Z"),
      },
      now,
    );
    expect(result).toBe("VISIBLE");
  });

  it("returns VISIBLE when start time equals now", () => {
    const result = computeInitialStatus(
      {
        status: "VISIBLE",
        isRecurring: false,
        startTime: now,
      },
      now,
    );
    expect(result).toBe("ACTIVE");
  });
});
