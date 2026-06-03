import { describe, expect, it } from "@jest/globals";
import { buildFilteredUsers, getActivityOpacity } from "~/components/map/UserMap";
import type { UserLocation } from "~/components/map/UserMap";

describe("getActivityOpacity", () => {
  const now = 1700000000000;

  it("should return 1.0 for very recent activity", () => {
    expect(getActivityOpacity(now, now)).toBe(1);
  });

  it("should return 0.5 for 12 hours ago", () => {
    const twelveHoursAgo = now - 12 * 3600000;
    expect(getActivityOpacity(twelveHoursAgo, now)).toBeCloseTo(0.5, 2);
  });

  it("should return 0 for 24+ hours ago", () => {
    const dayAgo = now - 24 * 3600000;
    expect(getActivityOpacity(dayAgo, now)).toBe(0);
  });

  it("should return 0 for invalid input", () => {
    expect(getActivityOpacity("invalid", now)).toBe(0);
    expect(getActivityOpacity(NaN, now)).toBe(0);
  });

  it("should handle string timestamp", () => {
    const sixHoursAgo = new Date(now - 6 * 3600000).toISOString();
    expect(getActivityOpacity(sixHoursAgo, now)).toBeCloseTo(0.75, 2);
  });

  it("should default to Date.now() when now is not provided", () => {
    const result = getActivityOpacity(Date.now());
    expect(result).toBe(1);
  });
});

describe("buildFilteredUsers", () => {
  const now = 1700000000000;
  const activeUser: UserLocation = {
    id: "user1",
    name: "Alice",
    coordinate: [21, 52],
    lastActiveAt: now,
  };
  const staleUser: UserLocation = {
    id: "user2",
    name: "Bob",
    coordinate: [21, 52],
    lastActiveAt: now - 25 * 3600000,
  };

  it("should return empty array when cannot view others locations", () => {
    const result = buildFilteredUsers(
      [activeUser],
      now,
      undefined,
      null,
      undefined,
      null,
      false,
      false,
    );
    expect(result).toEqual([]);
  });

  it("should filter out stale users", () => {
    const result = buildFilteredUsers(
      [activeUser, staleUser],
      now,
      undefined,
      null,
      undefined,
      null,
      true,
      false,
    );
    expect(result).toEqual([activeUser]);
  });

  it("should exclude current user from others", () => {
    const result = buildFilteredUsers(
      [activeUser],
      now,
      "user1",
      null,
      undefined,
      null,
      true,
      false,
    );
    expect(result).toEqual([]);
  });

  it("should prepend current user when sharing location", () => {
    const result = buildFilteredUsers(
      [activeUser],
      now,
      "me",
      [21, 52],
      "Me",
      "https://example.com/avatar.jpg",
      true,
      true,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "me",
      name: "Me",
      coordinate: [21, 52],
      avatarUrl: "https://example.com/avatar.jpg",
      lastActiveAt: now,
    });
    expect(result[1]).toEqual(activeUser);
  });

  it("should not prepend current user when missing required fields", () => {
    const result = buildFilteredUsers([activeUser], now, "me", null, "Me", null, true, true);
    expect(result).toEqual([activeUser]);
  });
});
