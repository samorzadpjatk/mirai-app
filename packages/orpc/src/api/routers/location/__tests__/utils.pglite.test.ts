import { locationShares, locations, tripParticipants, trips, users } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createMockSupabase } from "../../../../test-helpers";
import {
  assertShareableTargets,
  ensureUserInActiveTrip,
  getShareableUserIdsForCurrentUser,
  toLocationWithUser,
} from "../utils";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

async function seedUser(
  id: string,
  authUserId = `auth-${id}`,
  firstName = "Test",
  lastName = "User",
  hasAvatar = false,
) {
  await testDb.db.insert(users).values({
    id,
    authUserId,
    firstName,
    lastName,
    hasAvatar,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedTrip(id: string, name: string, endDate: Date) {
  await testDb.db.insert(trips).values({
    id,
    name,
    description: "",
    startDate: new Date("2025-06-01"),
    endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedParticipant(id: string, userId: string, tripId: string) {
  await testDb.db.insert(tripParticipants).values({
    id,
    userId,
    tripId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedLocation(
  id: string,
  userId: string,
  overrides: Partial<{
    latitude: number;
    longitude: number;
    isSharingLocation: boolean;
  }> = {},
) {
  await testDb.db.insert(locations).values({
    id,
    userId,
    timestamp: new Date(),
    isSharingLocation: overrides.isSharingLocation ?? true,
    latitude: overrides.latitude ?? 52.2297,
    longitude: overrides.longitude ?? 21.0122,
    altitude: null,
    accuracy: 0,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    lastInactivityNotification: null,
  });
}

async function seedLocationShare(locationId: string, userId: string) {
  await testDb.db.insert(locationShares).values({
    locationId,
    userId,
  });
}

describe("location/utils PGLite integration", () => {
  describe("ensureUserInActiveTrip", () => {
    it("throws FORBIDDEN when user has no trip memberships", async () => {
      await seedUser("user-1");

      await expect(ensureUserInActiveTrip(testDb.db, "user-1")).rejects.toThrow(ORPCError);
      await expect(ensureUserInActiveTrip(testDb.db, "user-1")).rejects.toThrow(
        "Location sharing requires trip participation",
      );

      try {
        await ensureUserInActiveTrip(testDb.db, "user-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("FORBIDDEN");
      }
    });

    it("throws FORBIDDEN when all user trips have ended", async () => {
      await seedUser("user-1");
      await seedTrip("trip-1", "Old Trip", new Date(Date.now() - 48 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");

      await expect(ensureUserInActiveTrip(testDb.db, "user-1")).rejects.toThrow(ORPCError);
      await expect(ensureUserInActiveTrip(testDb.db, "user-1")).rejects.toThrow(
        "Location sharing is not available for past trips",
      );

      try {
        await ensureUserInActiveTrip(testDb.db, "user-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("FORBIDDEN");
      }
    });

    it("resolves when user has at least one active trip", async () => {
      await seedUser("user-1");
      await seedTrip("trip-1", "Active Trip", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");

      await expect(ensureUserInActiveTrip(testDb.db, "user-1")).resolves.not.toThrow();
    });

    it("resolves when one trip is active among multiple ended trips", async () => {
      await seedUser("user-1");
      await seedTrip("trip-1", "Old Trip", new Date(Date.now() - 48 * 60 * 60 * 1000));
      await seedTrip("trip-2", "Active Trip", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");
      await seedParticipant("tp-2", "user-1", "trip-2");

      await expect(ensureUserInActiveTrip(testDb.db, "user-1")).resolves.not.toThrow();
    });
  });

  describe("getShareableUserIdsForCurrentUser", () => {
    it("returns empty set when user is not a trip member", async () => {
      await seedUser("user-1");
      await seedTrip("trip-1", "Test Trip", new Date(Date.now() + 24 * 60 * 60 * 1000));

      const result = await getShareableUserIdsForCurrentUser({
        db: testDb.db,
        currentUserId: "user-1",
        tripId: "trip-1",
      });

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it("returns shareable user IDs for a specific trip", async () => {
      await seedUser("user-1");
      await seedUser("user-2");
      await seedUser("user-3");
      await seedTrip("trip-1", "Test Trip", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");
      await seedParticipant("tp-2", "user-2", "trip-1");
      await seedParticipant("tp-3", "user-3", "trip-1");

      const result = await getShareableUserIdsForCurrentUser({
        db: testDb.db,
        currentUserId: "user-1",
        tripId: "trip-1",
      });

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has("user-2")).toBe(true);
      expect(result.has("user-3")).toBe(true);
      expect(result.has("user-1")).toBe(false);
    });

    it("returns shareable user IDs across all user trips when no tripId provided", async () => {
      await seedUser("user-1");
      await seedUser("user-2");
      await seedUser("user-3");
      await seedTrip("trip-1", "Trip 1", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedTrip("trip-2", "Trip 2", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");
      await seedParticipant("tp-2", "user-2", "trip-1");
      await seedParticipant("tp-3", "user-1", "trip-2");
      await seedParticipant("tp-4", "user-3", "trip-2");

      const result = await getShareableUserIdsForCurrentUser({
        db: testDb.db,
        currentUserId: "user-1",
      });

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has("user-2")).toBe(true);
      expect(result.has("user-3")).toBe(true);
    });

    it("returns empty set when user has no trip memberships and no tripId provided", async () => {
      await seedUser("user-1");
      await seedUser("user-2");

      const result = await getShareableUserIdsForCurrentUser({
        db: testDb.db,
        currentUserId: "user-1",
      });

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });
  });

  describe("assertShareableTargets", () => {
    it("throws BAD_REQUEST when target includes current user", async () => {
      await seedUser("user-1");
      await seedTrip("trip-1", "Test Trip", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");

      await expect(
        assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: ["user-1"],
          tripId: "trip-1",
        }),
      ).rejects.toThrow(ORPCError);
      await expect(
        assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: ["user-1"],
          tripId: "trip-1",
        }),
      ).rejects.toThrow("You cannot share location settings with yourself");

      try {
        await assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: ["user-1"],
          tripId: "trip-1",
        });
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("BAD_REQUEST");
      }
    });

    it("throws BAD_REQUEST when target user is outside sharing scope", async () => {
      await seedUser("user-1");
      await seedUser("user-2");
      await seedTrip("trip-1", "Test Trip", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");

      await expect(
        assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: ["user-2"],
          tripId: "trip-1",
        }),
      ).rejects.toThrow(ORPCError);
      await expect(
        assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: ["user-2"],
          tripId: "trip-1",
        }),
      ).rejects.toThrow("One or more selected users are outside your allowed sharing scope");

      try {
        await assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: ["user-2"],
          tripId: "trip-1",
        });
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("BAD_REQUEST");
      }
    });

    it("resolves when all targets are within sharing scope", async () => {
      await seedUser("user-1");
      await seedUser("user-2");
      await seedTrip("trip-1", "Test Trip", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");
      await seedParticipant("tp-2", "user-2", "trip-1");

      await expect(
        assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: ["user-2"],
          tripId: "trip-1",
        }),
      ).resolves.not.toThrow();
    });

    it("allows already shared users when allowAlreadyShared is true", async () => {
      await seedUser("user-1");
      await seedUser("user-2");
      await seedUser("user-3");
      await seedTrip("trip-1", "Test Trip", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedParticipant("tp-1", "user-1", "trip-1");
      await seedParticipant("tp-2", "user-2", "trip-1");
      await seedLocation("loc-1", "user-1");
      await seedLocationShare("loc-1", "user-3");

      await expect(
        assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: ["user-2", "user-3"],
          tripId: "trip-1",
          allowAlreadyShared: true,
        }),
      ).resolves.not.toThrow();
    });

    it("resolves for empty targetUserIds", async () => {
      await seedUser("user-1");

      await expect(
        assertShareableTargets({
          db: testDb.db,
          currentUserId: "user-1",
          targetUserIds: [],
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("toLocationWithUser", () => {
    it("converts DB location to extended format with user info", async () => {
      await seedUser("user-1", "auth-1", "Alice", "Smith", true);
      await seedLocation("loc-1", "user-1", {
        latitude: 52.2297,
        longitude: 21.0122,
        isSharingLocation: true,
      });

      const supabase = createMockSupabase();
      const dbLocation = await testDb.db.query.locations.findFirst({
        where: (l, { eq }) => eq(l.id, "loc-1"),
      });

      if (!dbLocation) {
        throw new Error("Location not found");
      }

      const result = await toLocationWithUser(
        testDb.db,
        supabase as unknown as Parameters<typeof toLocationWithUser>[1],
        dbLocation,
      );

      expect(result.isSharingLocation).toBe(true);
      expect(result.coords.latitude).toBe(52.2297);
      expect(result.coords.longitude).toBe(21.0122);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe("user-1");
      expect(result.user?.firstName).toBe("Alice");
      expect(result.user?.lastName).toBe("Smith");
      expect(result.user?.image).toBe("https://signed-url.example.com/image.jpg");
    });

    it("converts DB location with user without avatar", async () => {
      await seedUser("user-1", "auth-1", "Bob", "Jones", false);
      await seedLocation("loc-1", "user-1", {
        latitude: 40.7128,
        longitude: -74.006,
        isSharingLocation: false,
      });

      const supabase = createMockSupabase();
      const dbLocation = await testDb.db.query.locations.findFirst({
        where: (l, { eq }) => eq(l.id, "loc-1"),
      });

      if (!dbLocation) {
        throw new Error("Location not found");
      }

      const result = await toLocationWithUser(
        testDb.db,
        supabase as unknown as Parameters<typeof toLocationWithUser>[1],
        dbLocation,
      );

      expect(result.isSharingLocation).toBe(false);
      expect(result.coords.latitude).toBe(40.7128);
      expect(result.coords.longitude).toBe(-74.006);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe("user-1");
      expect(result.user?.firstName).toBe("Bob");
      expect(result.user?.lastName).toBe("Jones");
      expect(result.user?.image).toBeNull();
    });

    it("throws INTERNAL_SERVER_ERROR when user not found for location", async () => {
      await seedUser("user-1");
      await seedLocation("loc-1", "user-1");

      const supabase = createMockSupabase();
      const dbLocation = await testDb.db.query.locations.findFirst({
        where: (l, { eq }) => eq(l.id, "loc-1"),
      });

      if (!dbLocation) {
        throw new Error("Location not found");
      }

      const syntheticLocation = { ...dbLocation, userId: "nonexistent-user" };

      await expect(
        toLocationWithUser(
          testDb.db,
          supabase as unknown as Parameters<typeof toLocationWithUser>[1],
          syntheticLocation,
        ),
      ).rejects.toThrow(ORPCError);
      await expect(
        toLocationWithUser(
          testDb.db,
          supabase as unknown as Parameters<typeof toLocationWithUser>[1],
          syntheticLocation,
        ),
      ).rejects.toThrow("User not found for location");

      try {
        await toLocationWithUser(
          testDb.db,
          supabase as unknown as Parameters<typeof toLocationWithUser>[1],
          syntheticLocation,
        );
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("INTERNAL_SERVER_ERROR");
      }
    });
  });
});
