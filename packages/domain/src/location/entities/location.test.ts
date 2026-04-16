import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { Location } from "./location";
import { ValidationError } from "../../system/errors";

describe("[UNIT] Location", () => {
  describe("create", () => {
    it("creates a valid Location with minimal required props", async () => {
      const effect = Location.create({
        userId: "user-123",
      });

      const location = await Effect.runPromise(effect);

      expect(location.userId).toBe("user-123");
      expect(location.isSharingLocation).toBe(false);
      expect(location.latitude).toBeNull();
      expect(location.longitude).toBeNull();
      expect(location.accuracy).toBeNull();
      expect(location.altitude).toBeNull();
      expect(location.altitudeAccuracy).toBeNull();
      expect(location.heading).toBeNull();
      expect(location.speed).toBeNull();
      expect(location.lastInactivityNotification).toBeNull();
      expect(location.timestamp).toBeInstanceOf(Date);
      expect(location.id).toBeDefined();
    });

    it("creates a Location with all coordinates and properties", async () => {
      const timestamp = new Date("2024-01-15T10:30:00Z");
      const notificationDate = new Date("2024-01-14T08:00:00Z");

      const effect = Location.create({
        id: "loc-456",
        userId: "user-123",
        timestamp,
        isSharingLocation: true,
        latitude: 52.520008,
        longitude: 13.404954,
        accuracy: 10.5,
        altitude: 34.2,
        altitudeAccuracy: 1.5,
        heading: 90,
        speed: 5.5,
        lastInactivityNotification: notificationDate,
      });

      const location = await Effect.runPromise(effect);

      expect(location.id).toBe("loc-456");
      expect(location.userId).toBe("user-123");
      expect(location.timestamp).toEqual(timestamp);
      expect(location.isSharingLocation).toBe(true);
      expect(location.latitude).toBe(52.520008);
      expect(location.longitude).toBe(13.404954);
      expect(location.accuracy).toBe(10.5);
      expect(location.altitude).toBe(34.2);
      expect(location.altitudeAccuracy).toBe(1.5);
      expect(location.heading).toBe(90);
      expect(location.speed).toBe(5.5);
      expect(location.lastInactivityNotification).toEqual(notificationDate);
    });

    it("generates a unique id if not provided", async () => {
      const effect1 = Location.create({ userId: "user-1" });
      const effect2 = Location.create({ userId: "user-2" });

      const loc1 = await Effect.runPromise(effect1);
      const loc2 = await Effect.runPromise(effect2);

      expect(loc1.id).not.toBe(loc2.id);
      expect(loc1.id).toBeDefined();
      expect(loc2.id).toBeDefined();
    });

    describe("coordinate validation", () => {
      it("fails when latitude is below -90", async () => {
        const effect = Location.create({
          userId: "user-123",
          latitude: -91,
          longitude: 0,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("latitude");
          expect(result.left.message).toBe(
            "latitude must be between -90 and 90",
          );
        }
      });

      it("fails when latitude is above 90", async () => {
        const effect = Location.create({
          userId: "user-123",
          latitude: 91,
          longitude: 0,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.field).toBe("latitude");
          expect(result.left.message).toBe(
            "latitude must be between -90 and 90",
          );
        }
      });

      it("fails when longitude is below -180", async () => {
        const effect = Location.create({
          userId: "user-123",
          latitude: 0,
          longitude: -181,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("longitude");
          expect(result.left.message).toBe(
            "longitude must be between -180 and 180",
          );
        }
      });

      it("fails when longitude is above 180", async () => {
        const effect = Location.create({
          userId: "user-123",
          latitude: 0,
          longitude: 181,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.field).toBe("longitude");
          expect(result.left.message).toBe(
            "longitude must be between -180 and 180",
          );
        }
      });

      it("accepts boundary values for latitude", async () => {
        const effect = Location.create({
          userId: "user-123",
          latitude: -90,
          longitude: 0,
        });

        const location = await Effect.runPromise(effect);
        expect(location.latitude).toBe(-90);
      });

      it("accepts boundary values for longitude", async () => {
        const effect = Location.create({
          userId: "user-123",
          latitude: 0,
          longitude: 180,
        });

        const location = await Effect.runPromise(effect);
        expect(location.longitude).toBe(180);
      });
    });

    describe("accuracy validation", () => {
      it("fails when accuracy is negative", async () => {
        const effect = Location.create({
          userId: "user-123",
          accuracy: -1,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("accuracy");
          expect(result.left.message).toBe("accuracy must be non-negative");
        }
      });

      it("accepts zero accuracy", async () => {
        const effect = Location.create({
          userId: "user-123",
          accuracy: 0,
        });

        const location = await Effect.runPromise(effect);
        expect(location.accuracy).toBe(0);
      });
    });

    describe("altitudeAccuracy validation", () => {
      it("fails when altitudeAccuracy is negative", async () => {
        const effect = Location.create({
          userId: "user-123",
          altitudeAccuracy: -0.5,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("altitudeAccuracy");
          expect(result.left.message).toBe(
            "altitudeAccuracy must be non-negative",
          );
        }
      });
    });

    describe("heading validation", () => {
      it("fails when heading is negative", async () => {
        const effect = Location.create({
          userId: "user-123",
          heading: -1,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("heading");
          expect(result.left.message).toBe("heading must be between 0 and 360");
        }
      });

      it("fails when heading is 360 or above", async () => {
        const effect = Location.create({
          userId: "user-123",
          heading: 360,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left.field).toBe("heading");
          expect(result.left.message).toBe("heading must be between 0 and 360");
        }
      });

      it("accepts heading at boundary 0", async () => {
        const effect = Location.create({
          userId: "user-123",
          heading: 0,
        });

        const location = await Effect.runPromise(effect);
        expect(location.heading).toBe(0);
      });

      it("accepts heading at boundary 359.99", async () => {
        const effect = Location.create({
          userId: "user-123",
          heading: 359.99,
        });

        const location = await Effect.runPromise(effect);
        expect(location.heading).toBe(359.99);
      });
    });

    describe("speed validation", () => {
      it("fails when speed is negative", async () => {
        const effect = Location.create({
          userId: "user-123",
          speed: -5,
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("speed");
          expect(result.left.message).toBe("speed must be non-negative");
        }
      });

      it("accepts zero speed", async () => {
        const effect = Location.create({
          userId: "user-123",
          speed: 0,
        });

        const location = await Effect.runPromise(effect);
        expect(location.speed).toBe(0);
      });
    });

    describe("userId validation", () => {
      it("fails when userId is empty", async () => {
        const effect = Location.create({
          userId: "",
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("userId");
        }
      });

      it("fails when userId is whitespace only", async () => {
        const effect = Location.create({
          userId: "   ",
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
        }
      });
    });
  });

  describe("updateCoordinates", () => {
    it("updates coordinates with new values", async () => {
      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          latitude: 0,
          longitude: 0,
        }),
      );

      const newTimestamp = new Date("2024-06-01T12:00:00Z");
      const effect = location.updateCoordinates({
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 15,
        altitude: 100,
        altitudeAccuracy: 2,
        heading: 180,
        speed: 10.5,
        timestamp: newTimestamp,
      });

      const updated = await Effect.runPromise(effect);

      expect(updated.latitude).toBe(40.7128);
      expect(updated.longitude).toBe(-74.006);
      expect(updated.accuracy).toBe(15);
      expect(updated.altitude).toBe(100);
      expect(updated.altitudeAccuracy).toBe(2);
      expect(updated.heading).toBe(180);
      expect(updated.speed).toBe(10.5);
      expect(updated.timestamp).toEqual(newTimestamp);
      expect(updated.id).toBe(location.id);
      expect(updated.userId).toBe(location.userId);
    });

    it("updates with optional fields as null when not provided", async () => {
      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          latitude: 0,
          longitude: 0,
          accuracy: 10,
          altitude: 50,
        }),
      );

      const effect = location.updateCoordinates({
        latitude: 51.5074,
        longitude: -0.1278,
      });

      const updated = await Effect.runPromise(effect);

      expect(updated.accuracy).toBeNull();
      expect(updated.altitude).toBeNull();
      expect(updated.altitudeAccuracy).toBeNull();
      expect(updated.heading).toBeNull();
      expect(updated.speed).toBeNull();
    });

    it("fails when latitude is out of range", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      const effect = location.updateCoordinates({
        latitude: 91,
        longitude: 0,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("latitude");
      }
    });

    it("fails when longitude is out of range", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      const effect = location.updateCoordinates({
        latitude: 0,
        longitude: -181,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("longitude");
      }
    });

    it("fails when accuracy is negative", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      const effect = location.updateCoordinates({
        latitude: 0,
        longitude: 0,
        accuracy: -1,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("accuracy");
      }
    });

    it("fails when heading is out of range", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      const effect = location.updateCoordinates({
        latitude: 0,
        longitude: 0,
        heading: 360,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("heading");
      }
    });

    it("fails when speed is negative", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      const effect = location.updateCoordinates({
        latitude: 0,
        longitude: 0,
        speed: -1,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("speed");
      }
    });
  });

  describe("enableSharing / disableSharing", () => {
    it("enables location sharing", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123", isSharingLocation: false }),
      );

      const updated = location.enableSharing();

      expect(updated.isSharingLocation).toBe(true);
      expect(updated.isSharing()).toBe(true);
      expect(updated.id).toBe(location.id);
    });

    it("disables location sharing", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123", isSharingLocation: true }),
      );

      const updated = location.disableSharing();

      expect(updated.isSharingLocation).toBe(false);
      expect(updated.isSharing()).toBe(false);
      expect(updated.id).toBe(location.id);
    });

    it("returns new instance without mutating original", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123", isSharingLocation: false }),
      );

      const enabled = location.enableSharing();

      expect(location.isSharingLocation).toBe(false);
      expect(enabled.isSharingLocation).toBe(true);
    });
  });

  describe("updateInactivityNotification", () => {
    it("updates the last inactivity notification timestamp", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      const notificationTime = new Date("2024-06-15T14:30:00Z");
      const updated = location.updateInactivityNotification(notificationTime);

      expect(updated.lastInactivityNotification).toEqual(notificationTime);
      expect(updated.id).toBe(location.id);
    });
  });

  describe("hasValidCoordinates", () => {
    it("returns true when both latitude and longitude are present", async () => {
      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      expect(location.hasValidCoordinates()).toBe(true);
    });

    it("returns false when latitude is null", async () => {
      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          latitude: null,
          longitude: -74.006,
        }),
      );

      expect(location.hasValidCoordinates()).toBe(false);
    });

    it("returns false when longitude is null", async () => {
      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: null,
        }),
      );

      expect(location.hasValidCoordinates()).toBe(false);
    });

    it("returns false when both are null", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      expect(location.hasValidCoordinates()).toBe(false);
    });
  });

  describe("getCoordinates", () => {
    it("returns tuple when coordinates are valid", async () => {
      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const coords = location.getCoordinates();

      expect(coords).toEqual([40.7128, -74.006]);
    });

    it("returns null when coordinates are invalid", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      expect(location.getCoordinates()).toBeNull();
    });
  });

  describe("distanceTo", () => {
    it("calculates distance between two locations using Haversine formula", async () => {
      const location1 = await Effect.runPromise(
        Location.create({
          userId: "user-1",
          latitude: 40.7128, // New York
          longitude: -74.006,
        }),
      );

      const location2 = await Effect.runPromise(
        Location.create({
          userId: "user-2",
          latitude: 51.5074, // London
          longitude: -0.1278,
        }),
      );

      const distance = location1.distanceTo(location2);

      expect(distance).not.toBeNull();
      // Distance between NYC and London is approximately 5,570 km
      expect(distance).toBeGreaterThan(5_000_000);
      expect(distance).toBeLessThan(6_000_000);
    });

    it("returns 0 for same location", async () => {
      const location1 = await Effect.runPromise(
        Location.create({
          userId: "user-1",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const location2 = await Effect.runPromise(
        Location.create({
          userId: "user-2",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const distance = location1.distanceTo(location2);

      expect(distance).toBe(0);
    });

    it("returns null when this location has no coordinates", async () => {
      const location1 = await Effect.runPromise(
        Location.create({ userId: "user-1" }),
      );

      const location2 = await Effect.runPromise(
        Location.create({
          userId: "user-2",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const distance = location1.distanceTo(location2);

      expect(distance).toBeNull();
    });

    it("returns null when other location has no coordinates", async () => {
      const location1 = await Effect.runPromise(
        Location.create({
          userId: "user-1",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const location2 = await Effect.runPromise(
        Location.create({ userId: "user-2" }),
      );

      const distance = location1.distanceTo(location2);

      expect(distance).toBeNull();
    });

    it("calculates short distances accurately", async () => {
      const location1 = await Effect.runPromise(
        Location.create({
          userId: "user-1",
          latitude: 52.520008, // Berlin
          longitude: 13.404954,
        }),
      );

      const location2 = await Effect.runPromise(
        Location.create({
          userId: "user-2",
          latitude: 52.5205, // ~55 meters north
          longitude: 13.404954,
        }),
      );

      const distance = location1.distanceTo(location2);

      expect(distance).not.toBeNull();
      expect(distance).toBeGreaterThan(50);
      expect(distance).toBeLessThan(60);
    });
  });

  describe("isStale", () => {
    it("returns true when location is older than threshold", async () => {
      const oldTimestamp = new Date("2024-01-01T10:00:00Z");
      const now = new Date("2024-01-01T12:00:00Z");

      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          timestamp: oldTimestamp,
        }),
      );

      expect(location.isStale(30, now)).toBe(true); // 120 minutes old > 30 min threshold
    });

    it("returns false when location is within threshold", async () => {
      const recentTimestamp = new Date("2024-01-01T11:45:00Z");
      const now = new Date("2024-01-01T12:00:00Z");

      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          timestamp: recentTimestamp,
        }),
      );

      expect(location.isStale(30, now)).toBe(false); // 15 minutes old < 30 min threshold
    });

    it("returns false when location is exactly at threshold", async () => {
      const thresholdMinutes = 30;
      const now = new Date("2024-01-01T12:00:00Z");
      const exactThreshold = new Date(
        now.getTime() - thresholdMinutes * 60 * 1000,
      );

      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          timestamp: exactThreshold,
        }),
      );

      expect(location.isStale(thresholdMinutes, now)).toBe(false);
    });
  });

  describe("getAgeInMinutes", () => {
    it("returns correct age in minutes", async () => {
      const timestamp = new Date("2024-01-01T10:30:00Z");
      const now = new Date("2024-01-01T12:00:00Z");

      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          timestamp,
        }),
      );

      expect(location.getAgeInMinutes(now)).toBe(90);
    });

    it("returns 0 for same minute", async () => {
      const now = new Date("2024-01-01T12:00:00Z");

      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          timestamp: now,
        }),
      );

      expect(location.getAgeInMinutes(now)).toBe(0);
    });

    it("floors partial minutes", async () => {
      const now = new Date("2024-01-01T12:00:59Z");
      const timestamp = new Date("2024-01-01T12:00:00Z");

      const location = await Effect.runPromise(
        Location.create({
          userId: "user-123",
          timestamp,
        }),
      );

      expect(location.getAgeInMinutes(now)).toBe(0);
    });
  });

  describe("belongsToUser", () => {
    it("returns true for matching userId", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      expect(location.belongsToUser("user-123")).toBe(true);
    });

    it("returns false for different userId", async () => {
      const location = await Effect.runPromise(
        Location.create({ userId: "user-123" }),
      );

      expect(location.belongsToUser("user-456")).toBe(false);
    });
  });
});
