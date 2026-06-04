import { describe, expect, it } from "@jest/globals";
import { formatDateTime } from "~/components/trips/groups/details/GroupApprovedChallenges";

describe("formatDateTime", () => {
  it("should format valid date string", () => {
    const result = formatDateTime("2024-01-15T10:30:00Z");
    expect(result).toBeTruthy();
    expect(result).not.toBe("Unknown date");
  });

  it("should format Date object", () => {
    const date = new Date("2024-06-20T14:00:00Z");
    const result = formatDateTime(date);
    expect(result).toBeTruthy();
    expect(result).not.toBe("Unknown date");
  });

  it("should return Unknown date for invalid string", () => {
    expect(formatDateTime("invalid")).toBe("Unknown date");
  });

  it("should return Unknown date for NaN Date", () => {
    expect(formatDateTime(new Date(NaN))).toBe("Unknown date");
  });
});
