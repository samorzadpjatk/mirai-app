import { describe, it, expect } from "bun:test";
import { Location, LocationAccuracy, calculateDistance } from "./Location";
import type { LocationId } from "../value-objects/LocationId";

describe("[UNIT] Location Entity", () => {
  describe("Location.create", () => {
    it("should create location with coordinates", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.userId).toBe("user-123");
        expect(result.value.latitude).toBe(40.7128);
        expect(result.value.longitude).toBe(-74.006);
        expect(result.value.isSharingLocation()).toBe(false);
        expect(result.value.timestamp).toBeInstanceOf(Date);
        expect(result.value.usersToShareWith).toEqual([]);
      }
    });

    it("should create location with all fields", () => {
      const timestamp = new Date("2026-01-01T12:00:00");

      const result = Location.create({
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
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.accuracy).toBe(10.5);
        expect(result.value.altitude).toBe(100.0);
        expect(result.value.heading).toBe(90.0);
        expect(result.value.speed).toBe(5.5);
        expect(result.value.isSharingLocation()).toBe(true);
        expect(result.value.timestamp).toEqual(timestamp);
        expect(result.value.usersToShareWith).toHaveLength(1);
      }
    });

    it("should create location without coordinates", () => {
      const result = Location.create({
        userId: "user-123",
        isSharingLocation: false,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.latitude).toBeNull();
        expect(result.value.longitude).toBeNull();
        expect(result.value.hasCoordinates()).toBe(false);
      }
    });

    it("should reject invalid latitude (>90)", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: 91,
        longitude: 0,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("latitude");
      }
    });

    it("should reject invalid latitude (<-90)", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: -91,
        longitude: 0,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject invalid longitude (>180)", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: 0,
        longitude: 181,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("longitude");
      }
    });

    it("should reject invalid longitude (<-180)", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: 0,
        longitude: -181,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty userId", () => {
      const result = Location.create({
        userId: "",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative accuracy", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: -5,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative speed", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        speed: -1,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject heading > 360", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        heading: 361,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject self-sharing in usersToShareWith", () => {
      const result = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        usersToShareWith: [
          { id: "user-123", firstName: "Self", lastName: "User" },
        ],
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("yourself");
      }
    });
  });

  describe("Location.reconstitute", () => {
    it("should reconstitute location from persistence", () => {
      const location = Location.reconstitute({
        id: "loc-123" as LocationId,
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

      expect(location.id).toBe("loc-123");
      expect(location.userId).toBe("user-123");
      expect(location.latitude).toBe(40.7128);
      expect(location.isSharingLocation()).toBe(true);
    });
  });

  describe("Location.updateCoordinates", () => {
    it("should update coordinates", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const location = locationResult.value;
      const updatedResult = location.updateCoordinates({
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 15.0,
      });

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.latitude).toBe(51.5074);
        expect(updatedResult.value.longitude).toBe(-0.1278);
        expect(updatedResult.value.accuracy).toBe(15.0);
        expect(updatedResult.value.id).toBe(location.id);
      }
    });

    it("should update coordinates to null", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const updatedResult = locationResult.value.updateCoordinates({
        latitude: null,
        longitude: null,
      });

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.latitude).toBeNull();
        expect(updatedResult.value.longitude).toBeNull();
        expect(updatedResult.value.hasCoordinates()).toBe(false);
      }
    });

    it("should reject invalid coordinates in update", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const updatedResult = locationResult.value.updateCoordinates({
        latitude: 91,
        longitude: 0,
      });

      expect(updatedResult.kind).toBe("err");
    });
  });

  describe("Location.startSharing", () => {
    it("should start location sharing", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: false,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const location = locationResult.value;
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
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: true,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const location = locationResult.value;
      const updated = location.stopSharing();

      expect(updated.isSharingLocation()).toBe(false);
    });
  });

  describe("Location.addSharingUser", () => {
    it("should add user to sharing list", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const newUser = { id: "user-456", firstName: "Jane", lastName: "Doe" };
      const updatedResult = locationResult.value.addSharingUser(newUser);

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.usersToShareWith).toHaveLength(1);
        expect(updatedResult.value.isSharingWith("user-456")).toBe(true);
      }
    });

    it("should reject adding self to sharing list", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const selfUser = { id: "user-123", firstName: "Self", lastName: "User" };
      const updatedResult = locationResult.value.addSharingUser(selfUser);

      expect(updatedResult.kind).toBe("err");
    });

    it("should reject adding duplicate user", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
        ],
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const duplicateUser = {
        id: "user-456",
        firstName: "Jane",
        lastName: "Smith",
      };
      const updatedResult = locationResult.value.addSharingUser(duplicateUser);

      expect(updatedResult.kind).toBe("err");
    });
  });

  describe("Location.removeSharingUser", () => {
    it("should remove user from sharing list", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
          { id: "user-789", firstName: "Bob", lastName: "Smith" },
        ],
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const updated = locationResult.value.removeSharingUser("user-456");
      expect(updated.usersToShareWith).toHaveLength(1);
      expect(updated.isSharingWith("user-456")).toBe(false);
      expect(updated.isSharingWith("user-789")).toBe(true);
    });
  });

  describe("Location.updateSharingUsers", () => {
    it("should update entire sharing list", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const newList = [
        { id: "user-456", firstName: "Jane", lastName: "Doe" },
        { id: "user-789", firstName: "Bob", lastName: "Smith" },
      ];
      const updatedResult = locationResult.value.updateSharingUsers(newList);

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.usersToShareWith).toHaveLength(2);
      }
    });

    it("should reject list containing self", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const invalidList = [
        { id: "user-456", firstName: "Jane", lastName: "Doe" },
        { id: "user-123", firstName: "Self", lastName: "User" },
      ];
      const updatedResult =
        locationResult.value.updateSharingUsers(invalidList);

      expect(updatedResult.kind).toBe("err");
    });
  });

  describe("Location.isAccurate", () => {
    it("should return true for accurate location", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isAccurate()).toBe(true);
      }
    });

    it("should return false for inaccurate location", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 200,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isAccurate()).toBe(false);
      }
    });

    it("should return false when accuracy is null", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isAccurate()).toBe(false);
      }
    });
  });

  describe("Location.isMoving", () => {
    it("should return true when speed > 0", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        speed: 5.5,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isMoving()).toBe(true);
      }
    });

    it("should return false when speed is 0", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        speed: 0,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isMoving()).toBe(false);
      }
    });

    it("should return false when speed is null", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isMoving()).toBe(false);
      }
    });
  });

  describe("Location.getAccuracyLevel", () => {
    it("should return HIGH for accuracy < 10", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 5,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.getAccuracyLevel()).toBe(
          LocationAccuracy.HIGH,
        );
      }
    });

    it("should return MEDIUM for accuracy 10-50", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 30,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.getAccuracyLevel()).toBe(
          LocationAccuracy.MEDIUM,
        );
      }
    });

    it("should return LOW for accuracy > 50", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 100,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.getAccuracyLevel()).toBe(
          LocationAccuracy.LOW,
        );
      }
    });

    it("should return UNKNOWN when accuracy is null", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.getAccuracyLevel()).toBe(
          LocationAccuracy.UNKNOWN,
        );
      }
    });
  });

  describe("Location.getCoordinates", () => {
    it("should return coordinates tuple", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        const coords = locationResult.value.getCoordinates();
        expect(coords).toEqual([40.7128, -74.006]);
      }
    });

    it("should return null when no coordinates", () => {
      const locationResult = Location.create({
        userId: "user-123",
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        const coords = locationResult.value.getCoordinates();
        expect(coords).toBeNull();
      }
    });
  });

  describe("Location.distanceTo", () => {
    it("should calculate distance to another location", () => {
      const loc1Result = Location.create({
        userId: "user-123",
        latitude: 40.7128, // NYC
        longitude: -74.006,
      });

      const loc2Result = Location.create({
        userId: "user-456",
        latitude: 51.5074, // London
        longitude: -0.1278,
      });

      expect(loc1Result.kind).toBe("ok");
      expect(loc2Result.kind).toBe("ok");

      if (loc1Result.kind === "ok" && loc2Result.kind === "ok") {
        const distance = loc1Result.value.distanceTo(loc2Result.value);
        expect(distance).toBeGreaterThan(5500); // ~5570 km
        expect(distance).toBeLessThan(5600);
      }
    });

    it("should return null when this location has no coordinates", () => {
      const loc1Result = Location.create({
        userId: "user-123",
      });

      const loc2Result = Location.create({
        userId: "user-456",
        latitude: 51.5074,
        longitude: -0.1278,
      });

      expect(loc1Result.kind).toBe("ok");
      expect(loc2Result.kind).toBe("ok");

      if (loc1Result.kind === "ok" && loc2Result.kind === "ok") {
        const distance = loc1Result.value.distanceTo(loc2Result.value);
        expect(distance).toBeNull();
      }
    });
  });

  describe("Location.isWithinRadius", () => {
    it("should return true when within radius", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        // Same point should be within any radius
        expect(locationResult.value.isWithinRadius(40.7128, -74.006, 1)).toBe(
          true,
        );
      }
    });

    it("should return false when outside radius", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128, // NYC
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        // NYC is more than 1km from London
        expect(locationResult.value.isWithinRadius(51.5074, -0.1278, 1)).toBe(
          false,
        );
      }
    });

    it("should return false when no coordinates", () => {
      const locationResult = Location.create({
        userId: "user-123",
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isWithinRadius(40.7128, -74.006, 100)).toBe(
          false,
        );
      }
    });
  });

  describe("Location.canBeViewedBy", () => {
    it("should allow owner to view", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: false,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.canBeViewedBy("user-123")).toBe(true);
      }
    });

    it("should allow shared user to view when sharing enabled", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
        ],
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.canBeViewedBy("user-456")).toBe(true);
      }
    });

    it("should deny non-shared user when sharing enabled", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
        ],
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.canBeViewedBy("user-789")).toBe(false);
      }
    });

    it("should deny all others when sharing disabled", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: false,
        usersToShareWith: [
          { id: "user-456", firstName: "Jane", lastName: "Doe" },
        ],
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.canBeViewedBy("user-456")).toBe(false);
      }
    });
  });

  describe("Location.isStale", () => {
    it("should return false for fresh location", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: new Date(),
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isStale()).toBe(false);
      }
    });

    it("should return true for stale location", () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: tenMinutesAgo,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        expect(locationResult.value.isStale()).toBe(true);
      }
    });

    it("should respect custom threshold", () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: twoMinutesAgo,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        // Default 5 minutes - should not be stale
        expect(locationResult.value.isStale()).toBe(false);
        // Custom 1 minute threshold - should be stale
        expect(locationResult.value.isStale(60 * 1000)).toBe(true);
      }
    });
  });

  describe("Location.toExpoFormat", () => {
    it("should convert to Expo format", () => {
      const timestamp = new Date("2026-01-01T12:00:00");
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: 100,
        heading: 90,
        speed: 5.5,
        timestamp,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        const expo = locationResult.value.toExpoFormat();
        expect(expo).not.toBeNull();
        expect(expo!.coords.latitude).toBe(40.7128);
        expect(expo!.coords.longitude).toBe(-74.006);
        expect(expo!.coords.accuracy).toBe(10);
        expect(expo!.timestamp).toBe(timestamp.getTime());
      }
    });

    it("should return null when no coordinates", () => {
      const locationResult = Location.create({
        userId: "user-123",
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind === "ok") {
        const expo = locationResult.value.toExpoFormat();
        expect(expo).toBeNull();
      }
    });
  });

  describe("Location.updateInactivityNotification", () => {
    it("should update inactivity notification timestamp", () => {
      const locationResult = Location.create({
        userId: "user-123",
        latitude: 40.7128,
        longitude: -74.006,
      });

      expect(locationResult.kind).toBe("ok");
      if (locationResult.kind !== "ok") return;

      const updated = locationResult.value.updateInactivityNotification();
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
