import { describe, expect, it } from "@jest/globals";
import { formatAdminName, formatRelativeTime } from "../trips/details/TripNewsSection";

describe("formatRelativeTime", () => {
  it("should return 'just now' for very recent dates", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("should return minutes ago for recent dates", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
  });

  it("should return minutes ago up to 30 minutes", () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);
    expect(formatRelativeTime(thirtyMinutesAgo)).toBe("30m ago");
  });

  it("should return date and time for older dates", () => {
    const oldDate = new Date("2024-01-15T10:30:00");
    const result = formatRelativeTime(oldDate);
    expect(result).toContain("15.01.2024");
    expect(result).toContain("10:30");
  });

  it("should handle string dates", () => {
    const recent = new Date(Date.now() - 2 * 60000).toISOString();
    expect(formatRelativeTime(recent)).toBe("2m ago");
  });
});

describe("formatAdminName", () => {
  it("should format full admin name", () => {
    const item = {
      id: "1",
      activityType: "custom" as const,
      title: "News",
      description: null,
      imageUrl: null,
      createdAt: new Date(),
      admin: { firstName: "John", lastName: "Doe" },
    };
    expect(formatAdminName(item)).toBe("John Doe");
  });

  it("should handle missing admin", () => {
    const item = {
      id: "1",
      activityType: "custom" as const,
      title: "News",
      description: null,
      imageUrl: null,
      createdAt: new Date(),
      admin: null,
    };
    expect(formatAdminName(item)).toBe("Admin");
  });

  it("should handle partial name", () => {
    const item = {
      id: "1",
      activityType: "custom" as const,
      title: "News",
      description: null,
      imageUrl: null,
      createdAt: new Date(),
      admin: { firstName: "Jane", lastName: "" },
    };
    expect(formatAdminName(item)).toBe("Jane");
  });

  it("should trim whitespace", () => {
    const item = {
      id: "1",
      activityType: "custom" as const,
      title: "News",
      description: null,
      imageUrl: null,
      createdAt: new Date(),
      admin: { firstName: "  John  ", lastName: "  Doe  " },
    };
    expect(formatAdminName(item)).toBe("John Doe");
  });
});
