import { describe, it, expect } from "@jest/globals";
import {
  getStatusMeta,
  formatDateTime,
  formatPersonName,
} from "../admin/challenges/SubmissionReviewCard";

describe("getStatusMeta", () => {
  it("should return approved colors", () => {
    expect(getStatusMeta("APPROVED")).toEqual({
      color: "#22c55e",
      bg: "rgba(34,197,94,0.15)",
    });
  });

  it("should return rejected colors", () => {
    expect(getStatusMeta("REJECTED")).toEqual({
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
    });
  });

  it("should return pending colors", () => {
    expect(getStatusMeta("PENDING")).toEqual({
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
    });
  });
});

describe("formatDateTime", () => {
  it("should return dash for null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("should return dash for undefined", () => {
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("should format valid date", () => {
    const date = new Date("2024-01-15T10:30:00");
    const result = formatDateTime(date);
    expect(result).not.toBe("—");
    expect(result).toContain("2024");
  });

  it("should format valid date string", () => {
    const result = formatDateTime("2024-01-15T10:30:00");
    expect(result).not.toBe("—");
    expect(result).toContain("2024");
  });

  it("should return dash for invalid date", () => {
    expect(formatDateTime("invalid")).toBe("—");
  });
});

describe("formatPersonName", () => {
  it("should format full name", () => {
    expect(formatPersonName({ firstName: "John", lastName: "Doe" })).toBe("John Doe");
  });

  it("should return email when no name", () => {
    expect(formatPersonName({ firstName: "", lastName: "", email: "john@example.com" })).toBe(
      "john@example.com",
    );
  });

  it("should return Unknown admin when no person", () => {
    expect(formatPersonName(null)).toBe("Unknown admin");
    expect(formatPersonName(undefined)).toBe("Unknown admin");
  });

  it("should return Unknown admin when no name or email", () => {
    expect(formatPersonName({ firstName: null, lastName: null })).toBe("Unknown admin");
  });

  it("should handle partial name", () => {
    expect(formatPersonName({ firstName: "Jane", lastName: null })).toBe("Jane");
  });
});
