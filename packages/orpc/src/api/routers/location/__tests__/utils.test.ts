import type { Location as DbLocation } from "@mirai-app/db";
import { toExpoLocation } from "@mirai-app/shared/locations";
import { describe, expect, it } from "vitest";
import { getUserAvatarPath } from "../utils";

describe("location/utils pure functions", () => {
  describe("getUserAvatarPath", () => {
    it("should return avatar path with jpg extension", () => {
      expect(getUserAvatarPath("user-123")).toBe("avatar/user-123.jpg");
    });

    it("should handle UUID-style userId", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(getUserAvatarPath(uuid)).toBe(`avatar/${uuid}.jpg`);
    });

    it("should handle empty userId", () => {
      expect(getUserAvatarPath("")).toBe("avatar/.jpg");
    });
  });

  describe("toExpoLocation", () => {
    it("should convert a full DbLocation to ExpoLocationObject", () => {
      const dbLocation: DbLocation = {
        id: "loc-1",
        userId: "user-1",
        timestamp: new Date("2024-06-15T12:30:45Z"),
        isSharingLocation: true,
        latitude: 52.2297,
        longitude: 21.0122,
        altitude: 100.5,
        accuracy: 10.0,
        altitudeAccuracy: 5.0,
        heading: 90.0,
        speed: 2.5,
        lastInactivityNotification: null,
      };

      const result = toExpoLocation(dbLocation);

      expect(result).toEqual({
        coords: {
          latitude: 52.2297,
          longitude: 21.0122,
          altitude: 100.5,
          accuracy: 10.0,
          altitudeAccuracy: 5.0,
          heading: 90.0,
          speed: 2.5,
        },
        timestamp: dbLocation.timestamp.getTime(),
      });
    });

    it("should default all optional coords to null when missing", () => {
      const dbLocation: DbLocation = {
        id: "loc-3",
        userId: "user-3",
        timestamp: new Date("2024-06-15T12:00:00Z"),
        isSharingLocation: true,
        latitude: 0,
        longitude: 0,
        altitude: null,
        accuracy: 0,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        lastInactivityNotification: null,
      };

      const result = toExpoLocation(dbLocation);

      expect(result.coords.altitude).toBeNull();
      expect(result.coords.accuracy).toBe(0);
      expect(result.coords.altitudeAccuracy).toBeNull();
      expect(result.coords.heading).toBeNull();
      expect(result.coords.speed).toBeNull();
    });

    it("should use numeric timestamp in milliseconds", () => {
      const timestamp = new Date("2024-06-15T12:00:00.123Z");
      const dbLocation: DbLocation = {
        id: "loc-4",
        userId: "user-4",
        timestamp,
        isSharingLocation: true,
        latitude: 1.0,
        longitude: 1.0,
        altitude: null,
        accuracy: 0,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        lastInactivityNotification: null,
      };

      const result = toExpoLocation(dbLocation);
      expect(result.timestamp).toBe(timestamp.getTime());
    });

    it("should preserve zero values for altitude, accuracy, etc.", () => {
      const dbLocation: DbLocation = {
        id: "loc-5",
        userId: "user-5",
        timestamp: new Date("2024-06-15T12:00:00Z"),
        isSharingLocation: true,
        latitude: 1.0,
        longitude: 1.0,
        altitude: 0,
        accuracy: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
        lastInactivityNotification: null,
      };

      const result = toExpoLocation(dbLocation);

      expect(result.coords.altitude).toBe(0);
      expect(result.coords.accuracy).toBe(0);
      expect(result.coords.altitudeAccuracy).toBe(0);
      expect(result.coords.heading).toBe(0);
      expect(result.coords.speed).toBe(0);
    });

    it("should preserve negative latitude and longitude", () => {
      const dbLocation: DbLocation = {
        id: "loc-6",
        userId: "user-6",
        timestamp: new Date("2024-06-15T12:00:00Z"),
        isSharingLocation: true,
        latitude: -33.8688,
        longitude: -151.2093,
        altitude: null,
        accuracy: 0,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        lastInactivityNotification: null,
      };

      const result = toExpoLocation(dbLocation);

      expect(result.coords.latitude).toBe(-33.8688);
      expect(result.coords.longitude).toBe(-151.2093);
    });
  });
});
