import { formatRelativeTime, formatAdminName } from "../../../trips/details/TripNewsSection";

describe("TripNewsSection pure functions", () => {
  describe("formatRelativeTime", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns "just now" for very recent dates', () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
      expect(formatRelativeTime(new Date("2024-01-15T11:59:59Z"))).toBe("just now");
    });

    it('returns "Xm ago" for dates within last 30 minutes', () => {
      jest.setSystemTime(new Date("2024-01-15T12:30:00Z"));
      expect(formatRelativeTime(new Date("2024-01-15T12:00:00Z"))).toBe("30m ago");
      expect(formatRelativeTime(new Date("2024-01-15T12:15:00Z"))).toBe("15m ago");
    });

    it("returns formatted date with time for dates over 30 minutes ago", () => {
      jest.setSystemTime(new Date("2024-01-15T14:00:00Z"));
      const result = formatRelativeTime(new Date("2024-01-15T12:00:00Z"));
      expect(result).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });

    it("handles string dates", () => {
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
      expect(formatRelativeTime("2024-01-15T11:59:59Z")).toBe("just now");
    });
  });

  describe("formatAdminName", () => {
    it("formats first and last name", () => {
      const item = {
        id: "1",
        activityType: "custom" as const,
        title: "Test",
        description: null,
        imageUrl: null,
        createdAt: new Date(),
        admin: { firstName: "John", lastName: "Doe" },
      };
      expect(formatAdminName(item)).toBe("John Doe");
    });

    it("handles missing admin", () => {
      const item = {
        id: "1",
        activityType: "custom" as const,
        title: "Test",
        description: null,
        imageUrl: null,
        createdAt: new Date(),
      };
      expect(formatAdminName(item)).toBe("Admin");
    });

    it("handles missing last name", () => {
      const item = {
        id: "1",
        activityType: "custom" as const,
        title: "Test",
        description: null,
        imageUrl: null,
        createdAt: new Date(),
        admin: { firstName: "John" },
      };
      expect(formatAdminName(item)).toBe("John");
    });

    it("handles whitespace-only names", () => {
      const item = {
        id: "1",
        activityType: "custom" as const,
        title: "Test",
        description: null,
        imageUrl: null,
        createdAt: new Date(),
        admin: { firstName: "  ", lastName: "  " },
      };
      expect(formatAdminName(item)).toBe("Admin");
    });
  });
});
