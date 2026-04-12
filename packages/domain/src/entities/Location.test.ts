import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { Location, LocationAccuracy, calculateDistance } from "./Location";
import { ValidationError } from "../errors/effect-errors";
import { LocationId } from "../value-objects/LocationId";

describe("[UNIT] Location Entity", () => {
  describe("Location.create", () => {
    it("should create location with coordinates", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      expect(location.id).toBeDefined();
      expect(location.userId).toBe("user-123");
      expect(location.latitude).toBe(40.7128);
      expect(location.longitude).toBe(-74.006);
      expect(location.isSharingLocation()).toBe(false);
      expect(location.timestamp).toBeInstanceOf(Date);
      expect(location.usersToShareWith).toEqual([]);
    });

    it("should create location with all fields", () => {
      const timestamp = new Date("2026-01-01T12:00:00");

      const location = Effect.runSync(
        Location.create({
          userId: "user-456",
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 10.5,
          altitude: 100.0,
          altitudeAccuracy: 5.0,
          heading: 90.0,
          speed: 5.5,
          isSharingLocation: true,
          timestamp,
          usersToShareWith: [
            { id: "user-789", firstName: "Jane", lastName: "Doe" },
          ],
        }),
      );

      expect(location.accuracy).toBe(10.5);
      expect(location.altitude).toBe(100.0);
      expect(location.heading).toBe(90.0);
      expect(location.speed).toBe(5.5);
      expect(location.isSharingLocation()).toBe(true);
      expect(location.timestamp).toEqual(timestamp);
      expect(location.usersToShareWith).toHaveLength(1);
    });

    it("should create location without coordinates", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          isSharingLocation: false,
        }),
      );

      expect(location.latitude).toBeNull();
      expect(location.longitude).toBeNull();
      expect(location.hasCoordinates()).toBe(false);
    });

    it("should reject invalid latitude (>90)", () => {
      const effect = Location.create({
        userId: "user-123",
        latitude: 91,
        longitude: 0,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("latitude");
      }
    });

    it("should reject invalid latitude (<-90)", () => {
      const effect = Location.create({
        userId: "user-123",
        latitude: -91,
        longitude: 0,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("latitude");
      }
    });

    it("should reject invalid longitude (>180)", () => {
      const effect = Location.create({
        userId: "user-123",
        latitude: 0,
        longitude: 181,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("longitude");
      }
    });

    it("should reject invalid longitude (<-180)", () => {
      const effect = Location.create({
        userId: "user-123",
        latitude: 0,
        longitude: -181,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("longitude");
      }
    });

    it("should reject empty userId", () => {
      const effect = Location.create({
        userId: "",
        latitude: 40.7128,
        longitude: -74.006,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("userId");
      }
    });

    it("should reject negative accuracy", () => {
      const effect = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: -5,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("accuracy");
      }
    });

    it("should reject negative speed", () => {
      const effect = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        speed: -1,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("speed");
      }
    });

    it("should reject heading > 360", () => {
      const effect = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        heading: 361,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("heading");
      }
    });

    it("should reject self-sharing in usersToShareWith", () => {
      const effect = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        usersToShareWith: [
          { id: "user-123", firstName: "Self", lastName: "User" },
        ],
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("usersToShareWith");
      }
    });
  });

  describe("Location.reconstitute", () => {
    it("should reconstitute location from persistence", () => {
      const location = Location.reconstitute({
        id: LocationId.unsafeCreate("loc-123"),
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        isSharingLocation: true,
        timestamp: new Date("2026-01-01"),
        lastInactivityNotification: null,
        usersToShareWith: [],
      });

      expect(location.id).toBe(LocationId.unsafeCreate("loc-123"));
      expect(location.userId).toBe("user-123");
      expect(location.latitude).toBe(40.7128);
      expect(location.isSharingLocation()).toBe(true);
    });
  });

  describe("Location.updateCoordinates", () => {
    it("should update coordinates", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const updated = Effect.runSync(
        location.updateCoordinates({
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 15.0,
        }),
      );

      expect(updated.latitude).toBe(51.5074);
      expect(updated.longitude).toBe(-0.1278);
      expect(updated.accuracy).toBe(15.0);
      expect(updated.id).toBe(location.id);
    });

    it("should update coordinates to null", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const updated = Effect.runSync(
        location.updateCoordinates({
          latitude: null,
          longitude: null,
        }),
      );

      expect(updated.latitude).toBeNull();
      expect(updated.longitude).toBeNull();
      expect(updated.hasCoordinates()).toBe(false);
    });

    it("should reject invalid coordinates in update", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const effect = location.updateCoordinates({
        latitude: 91,
        longitude: 0,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("latitude");
      }
    });
  });

  describe("Location.startSharing", () => {
    it("should start location sharing", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: false,
        }),
      );

      expect(location.isSharingLocation()).toBe(false);

      const updated = location.startSharing();
      expect(updated.isSharingLocation()).toBe(true);
      expect(updated.timestamp.getTime()).toBeGreaterThanOrEqual(
        location.timestamp.getTime(),
      );
    });
  });

  describe("Location.stopSharing", () => {
    it("should stop location sharing", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: true,
        }),
      );

      const updated = location.stopSharing();

      expect(updated.isSharingLocation()).toBe(false);
    });
  });

  describe("Location.addSharingUser", () => {
    it("should add user to sharing list", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const newUser = { id: "user-456", firstName: "Jane", lastName: "Doe" };
      const updated = Effect.runSync(location.addSharingUser(newUser));

      expect(updated.usersToShareWith).toHaveLength(1);
      expect(updated.isSharingWith("user-456")).toBe(true);
    });

    it("should reject adding self to sharing list", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const selfUser = { id: "user-123", firstName: "Self", lastName: "User" };
      const effect = location.addSharingUser(selfUser);

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("user");
      }
    });

    it("should reject adding duplicate user", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          usersToShareWith: [
            { id: "user-456", firstName: "Jane", lastName: "Doe" },
          ],
        }),
      );

      const duplicateUser = {
        id: "user-456",
        firstName: "Jane",
        lastName: "Smith",
      };
      const effect = location.addSharingUser(duplicateUser);

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("user");
      }
    });
  });

  describe("Location.removeSharingUser", () => {
    it("should remove user from sharing list", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          usersToShareWith: [
            { id: "user-456", firstName: "Jane", lastName: "Doe" },
            { id: "user-789", firstName: "Bob", lastName: "Smith" },
          ],
        }),
      );

      const updated = location.removeSharingUser("user-456");
      expect(updated.usersToShareWith).toHaveLength(1);
      expect(updated.isSharingWith("user-456")).toBe(false);
      expect(updated.isSharingWith("user-789")).toBe(true);
    });
  });

  describe("Location.updateSharingUsers", () => {
    it("should update entire sharing list", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const newList = [
        { id: "user-456", firstName: "Jane", lastName: "Doe" },
        { id: "user-789", firstName: "Bob", lastName: "Smith" },
      ];
      const updated = Effect.runSync(location.updateSharingUsers(newList));

      expect(updated.usersToShareWith).toHaveLength(2);
    });

    it("should reject list containing self", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const invalidList = [
        { id: "user-456", firstName: "Jane", lastName: "Doe" },
        { id: "user-123", firstName: "Self", lastName: "User" },
      ];
      const effect = location.updateSharingUsers(invalidList);

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("users");
      }
    });
  });

  describe("Location.isAccurate", () => {
    it("should return true for accurate location", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
        }),
      );

      expect(location.isAccurate()).toBe(true);
    });

    it("should return false for inaccurate location", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 200,
        }),
      );

      expect(location.isAccurate()).toBe(false);
    });

    it("should return false when accuracy is null", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      expect(location.isAccurate()).toBe(false);
    });
  });

  describe("Location.isMoving", () => {
    it("should return true when speed > 0", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          speed: 5.5,
        }),
      );

      expect(location.isMoving()).toBe(true);
    });

    it("should return false when speed is 0", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          speed: 0,
        }),
      );

      expect(location.isMoving()).toBe(false);
    });

    it("should return false when speed is null", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      expect(location.isMoving()).toBe(false);
    });
  });

  describe("Location.getAccuracyLevel", () => {
    it("should return HIGH for accuracy < 10", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 5,
        }),
      );

      expect(location.getAccuracyLevel()).toBe(LocationAccuracy.HIGH);
    });

    it("should return MEDIUM for accuracy 10-50", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 30,
        }),
      );

      expect(location.getAccuracyLevel()).toBe(LocationAccuracy.MEDIUM);
    });

    it("should return LOW for accuracy > 50", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 100,
        }),
      );

      expect(location.getAccuracyLevel()).toBe(LocationAccuracy.LOW);
    });

    it("should return UNKNOWN when accuracy is null", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      expect(location.getAccuracyLevel()).toBe(LocationAccuracy.UNKNOWN);
    });
  });

  describe("Location.getCoordinates", () => {
    it("should return coordinates tuple", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const coords = location.getCoordinates();
      expect(coords).toEqual([40.7128, -74.006]);
    });

    it("should return null when no coordinates", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
        }),
      );

      const coords = location.getCoordinates();
      expect(coords).toBeNull();
    });
  });

  describe("Location.distanceTo", () => {
    it("should calculate distance to another location", () => {
      const loc1 = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128, // NYC
          longitude: -74.006,
        }),
      );

      const loc2 = Effect.runSync(
        Location.create({
          userId: "user-456",
          latitude: 51.5074, // London
          longitude: -0.1278,
        }),
      );

      const distance = loc1.distanceTo(loc2);
      expect(distance).toBeGreaterThan(5500); // ~5570 km
      expect(distance).toBeLessThan(5600);
    });

    it("should return null when this location has no coordinates", () => {
      const loc1 = Effect.runSync(
        Location.create({
          userId: "user-123",
        }),
      );

      const loc2 = Effect.runSync(
        Location.create({
          userId: "user-456",
          latitude: 51.5074,
          longitude: -0.1278,
        }),
      );

      const distance = loc1.distanceTo(loc2);
      expect(distance).toBeNull();
    });
  });

  describe("Location.isWithinRadius", () => {
    it("should return true when within radius", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      // Same point should be within any radius
      expect(location.isWithinRadius(40.7128, -74.006, 1)).toBe(true);
    });

    it("should return false when outside radius", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128, // NYC
          longitude: -74.006,
        }),
      );

      // NYC is more than 1km from London
      expect(location.isWithinRadius(51.5074, -0.1278, 1)).toBe(false);
    });

    it("should return false when no coordinates", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
        }),
      );

      expect(location.isWithinRadius(40.7128, -74.006, 100)).toBe(false);
    });
  });

  describe("Location.canBeViewedBy", () => {
    it("should allow owner to view", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: false,
        }),
      );

      expect(location.canBeViewedBy("user-123")).toBe(true);
    });

    it("should allow shared user to view when sharing enabled", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: true,
          usersToShareWith: [
            { id: "user-456", firstName: "Jane", lastName: "Doe" },
          ],
        }),
      );

      expect(location.canBeViewedBy("user-456")).toBe(true);
    });

    it("should deny non-shared user when sharing enabled", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: true,
          usersToShareWith: [
            { id: "user-456", firstName: "Jane", lastName: "Doe" },
          ],
        }),
      );

      expect(location.canBeViewedBy("user-789")).toBe(false);
    });

    it("should deny all others when sharing disabled", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          isSharingLocation: false,
          usersToShareWith: [
            { id: "user-456", firstName: "Jane", lastName: "Doe" },
          ],
        }),
      );

      expect(location.canBeViewedBy("user-456")).toBe(false);
    });
  });

  describe("Location.isStale", () => {
    it("should return false for fresh location", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          timestamp: new Date(),
        }),
      );

      expect(location.isStale()).toBe(false);
    });

    it("should return true for stale location", () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          timestamp: tenMinutesAgo,
        }),
      );

      expect(location.isStale()).toBe(true);
    });

    it("should respect custom threshold", () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          timestamp: twoMinutesAgo,
        }),
      );

      // Default 5 minutes - should not be stale
      expect(location.isStale()).toBe(false);
      // Custom 1 minute threshold - should be stale
      expect(location.isStale(60 * 1000)).toBe(true);
    });
  });

  describe("Location.toExpoFormat", () => {
    it("should convert to Expo format", () => {
      const timestamp = new Date("2026-01-01T12:00:00");
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: 100,
          heading: 90,
          speed: 5.5,
          timestamp,
        }),
      );

      const expo = location.toExpoFormat();
      expect(expo).not.toBeNull();
      expect(expo!.coords.latitude).toBe(40.7128);
      expect(expo!.coords.longitude).toBe(-74.006);
      expect(expo!.coords.accuracy).toBe(10);
      expect(expo!.timestamp).toBe(timestamp.getTime());
    });

    it("should return null when no coordinates", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
        }),
      );

      const expo = location.toExpoFormat();
      expect(expo).toBeNull();
    });
  });

  describe("Location.updateInactivityNotification", () => {
    it("should update inactivity notification timestamp", () => {
      const location = Effect.runSync(
        Location.create({
          userId: "user-123",
          latitude: 40.7128,
          longitude: -74.006,
        }),
      );

      const updated = location.updateInactivityNotification();
      expect(updated.lastInactivityNotification).toBeInstanceOf(Date);
    });
  });

  describe("calculateDistance", () => {
    it("should calculate distance between two points", () => {
      // NYC to London
      const distance = calculateDistance(40.7128, -74.006, 51.5074, -0.1278);
      expect(distance).toBeGreaterThan(5500);
      expect(distance).toBeLessThan(5600);
    });

    it("should return 0 for same point", () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });
  });
});
