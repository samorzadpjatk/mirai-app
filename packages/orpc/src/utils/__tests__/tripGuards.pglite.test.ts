import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { trips, groups, users } from "@mirai-app/db";
import { ensureTripNotEnded, ensureTripNotEndedByGroupId } from "../tripGuards";
import { ORPCError } from "@orpc/server";

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

describe("tripGuards", () => {
  async function seedUser(id: string) {
    await testDb.db.insert(users).values({
      id,
      authUserId: `auth-${id}`,
      firstName: "Test",
      lastName: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async function seedTrip(id: string, endDate: Date) {
    await testDb.db.insert(trips).values({
      id,
      name: `Trip ${id}`,
      startDate: new Date("2025-06-01"),
      endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async function seedGroup(
    id: string,
    tripId: string,
    organizerId: string,
    isDeleted = false,
  ) {
    await testDb.db.insert(groups).values({
      id,
      tripId,
      name: `Group ${id}`,
      organizerId,
      code: `code-${id}`,
      isDeleted,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  describe("ensureTripNotEnded", () => {
    it("should not throw for active trip", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await seedTrip("trip-1", futureDate);

      await expect(ensureTripNotEnded(testDb.db, "trip-1")).resolves.not.toThrow();
    });

    it("should not throw for trip ended within grace period", async () => {
      const recentEndDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
      await seedTrip("trip-1", recentEndDate);

      await expect(ensureTripNotEnded(testDb.db, "trip-1")).resolves.not.toThrow();
    });

    it("should throw NOT_FOUND for non-existent trip", async () => {
      await expect(ensureTripNotEnded(testDb.db, "trip-1")).rejects.toThrow(ORPCError);
      await expect(ensureTripNotEnded(testDb.db, "trip-1")).rejects.toThrow("Trip not found");

      try {
        await ensureTripNotEnded(testDb.db, "trip-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("NOT_FOUND");
      }
    });

    it("should throw FORBIDDEN for trip ended beyond grace period", async () => {
      const oldEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await seedTrip("trip-1", oldEndDate);

      await expect(ensureTripNotEnded(testDb.db, "trip-1")).rejects.toThrow(ORPCError);
      await expect(ensureTripNotEnded(testDb.db, "trip-1")).rejects.toThrow("Trip has ended");

      try {
        await ensureTripNotEnded(testDb.db, "trip-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("FORBIDDEN");
      }
    });

    it("should throw FORBIDDEN for trip ended exactly at grace period boundary", async () => {
      const gracePeriodBoundary = new Date(Date.now() - 24 * 60 * 60 * 1000 - 1000);
      await seedTrip("trip-1", gracePeriodBoundary);

      await expect(ensureTripNotEnded(testDb.db, "trip-1")).rejects.toThrow(ORPCError);

      try {
        await ensureTripNotEnded(testDb.db, "trip-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("FORBIDDEN");
      }
    });

    it("should query trip with correct ID", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await seedTrip("trip-1", futureDate);

      await expect(ensureTripNotEnded(testDb.db, "trip-1")).resolves.not.toThrow();
    });
  });

  describe("ensureTripNotEndedByGroupId", () => {
    it("should return tripId for valid active group", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await seedUser("user-1");
      await seedTrip("trip-1", futureDate);
      await seedGroup("group-1", "trip-1", "user-1");

      const result = await ensureTripNotEndedByGroupId(testDb.db, "group-1");

      expect(result).toBe("trip-1");
    });

    it("should throw NOT_FOUND for non-existent group", async () => {
      await expect(ensureTripNotEndedByGroupId(testDb.db, "group-1")).rejects.toThrow(ORPCError);
      await expect(ensureTripNotEndedByGroupId(testDb.db, "group-1")).rejects.toThrow(
        "Group not found",
      );

      try {
        await ensureTripNotEndedByGroupId(testDb.db, "group-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("NOT_FOUND");
      }
    });

    it("should throw NOT_FOUND for deleted group", async () => {
      await seedUser("user-1");
      await seedTrip("trip-1", new Date(Date.now() + 24 * 60 * 60 * 1000));
      await seedGroup("group-1", "trip-1", "user-1", true);

      await expect(ensureTripNotEndedByGroupId(testDb.db, "group-1")).rejects.toThrow(ORPCError);
      await expect(ensureTripNotEndedByGroupId(testDb.db, "group-1")).rejects.toThrow(
        "Group not found",
      );

      try {
        await ensureTripNotEndedByGroupId(testDb.db, "group-1");
      } catch (error) {
        expect((error as Error & { code: string }).code).toBe("NOT_FOUND");
      }
    });

    it("should throw FORBIDDEN when trip has ended", async () => {
      const oldEndDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await seedUser("user-1");
      await seedTrip("trip-1", oldEndDate);
      await seedGroup("group-1", "trip-1", "user-1");

      await expect(ensureTripNotEndedByGroupId(testDb.db, "group-1")).rejects.toThrow(ORPCError);
      await expect(ensureTripNotEndedByGroupId(testDb.db, "group-1")).rejects.toThrow(
        "Trip has ended",
      );
    });

    it("should query group with correct ID", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await seedUser("user-1");
      await seedTrip("trip-1", futureDate);
      await seedGroup("group-1", "trip-1", "user-1");

      await expect(ensureTripNotEndedByGroupId(testDb.db, "group-1")).resolves.not.toThrow();
    });

    it("should query trip with correct tripId from group", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await seedUser("user-1");
      await seedTrip("trip-1", futureDate);
      await seedGroup("group-1", "trip-1", "user-1");

      await expect(ensureTripNotEndedByGroupId(testDb.db, "group-1")).resolves.not.toThrow();
    });

    it("should work with group in grace period trip", async () => {
      const recentEndDate = new Date(Date.now() - 12 * 60 * 60 * 1000);
      await seedUser("user-1");
      await seedTrip("trip-1", recentEndDate);
      await seedGroup("group-1", "trip-1", "user-1");

      const result = await ensureTripNotEndedByGroupId(testDb.db, "group-1");

      expect(result).toBe("trip-1");
    });
  });
});
