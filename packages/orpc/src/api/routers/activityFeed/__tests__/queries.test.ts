import { activityFeeds, tripParticipants, trips, users } from "@mirai-app/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { getActivitiesCursorPage, getActivitiesPage } from "../queries";

type DB = Awaited<ReturnType<typeof createPgliteTestDb>>["db"];

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

const now = () => new Date();

async function seedUser(db: DB, id: string) {
  await db.insert(users).values({
    id,
    authUserId: `auth-${id}`,
    firstName: "User",
    lastName: id,
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedTrip(db: DB, id: string) {
  await db.insert(trips).values({
    id,
    name: "Trip",
    description: "",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-07"),
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedParticipant(
  db: DB,
  id: string,
  userId: string,
  tripId: string,
  groupId?: string,
) {
  await db.insert(tripParticipants).values({
    id,
    userId,
    tripId,
    groupId,
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedActivity(
  db: DB,
  id: string,
  tripId: string,
  activityType: string,
  opts?: { createdAt?: Date },
) {
  await db.insert(activityFeeds).values({
    id,
    tripId,
    activityType,
    title: "Activity",
    description: "",
    imageUrl: "",
    createdAt: opts?.createdAt ?? now(),
    updatedAt: now(),
  });
}

async function makeContext(db: DB, userId = "user-1") {
  await seedUser(db, userId);
  return {
    db,
    supabase: {
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: { signedUrl: "https://resolved.example.com/img.jpg" },
            error: null,
          }),
        }),
      },
    },
    dbUser: { id: userId },
  };
}

describe("getActivitiesPage", () => {
  it("returns paginated activities with hasMore false when all fit on one page", async () => {
    const ctx = await makeContext(testDb.db);
    await seedTrip(testDb.db, "trip-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1");
    await seedActivity(testDb.db, "af-1", "trip-1", "custom");

    const result = await getActivitiesPage({
      context: ctx,
      tripId: "trip-1",
      page: 1,
      pageSize: 10,
      includeHidden: false,
    });

    expect(result.activities.length).toBe(1);
    expect(result.pagination).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasMore: false,
    });
    expect(result.nextCursor).toBeNull();
  });

  it("returns hasMore true when there are more pages", async () => {
    const ctx = await makeContext(testDb.db);
    await seedTrip(testDb.db, "trip-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1");
    await seedActivity(testDb.db, "af-1", "trip-1", "custom");
    await seedActivity(testDb.db, "af-2", "trip-1", "custom");
    await seedActivity(testDb.db, "af-3", "trip-1", "custom");

    const result = await getActivitiesPage({
      context: ctx,
      tripId: "trip-1",
      page: 1,
      pageSize: 2,
      includeHidden: false,
    });

    expect(result.activities.length).toBe(2);
    expect(result.pagination).toMatchObject({
      total: 3,
      page: 1,
      pageSize: 2,
      totalPages: 2,
      hasMore: true,
    });
  });

  it("throws BAD_REQUEST when page exceeds total pages", async () => {
    const ctx = await makeContext(testDb.db);
    await seedTrip(testDb.db, "trip-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1");

    // 1 activity, pageSize=10 → totalPages=1. Requesting page 2 should throw.
    await seedActivity(testDb.db, "af-1", "trip-1", "custom");

    await expect(
      getActivitiesPage({
        context: ctx,
        tripId: "trip-1",
        page: 2,
        pageSize: 10,
        includeHidden: false,
      }),
    ).rejects.toThrow(/Page 2 exceeds total pages 1/);
  });

  it("returns page 2 when exactly two pages exist", async () => {
    const ctx = await makeContext(testDb.db);
    await seedTrip(testDb.db, "trip-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1");
    await seedActivity(testDb.db, "af-1", "trip-1", "custom");
    await seedActivity(testDb.db, "af-2", "trip-1", "custom");

    const result = await getActivitiesPage({
      context: ctx,
      tripId: "trip-1",
      page: 2,
      pageSize: 1,
      includeHidden: false,
    });

    expect(result.activities.length).toBe(1);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.pagination.hasMore).toBe(false);
  });
});

describe("getActivitiesCursorPage", () => {
  it("returns activities with nextCursor when more results exist", async () => {
    const ctx = await makeContext(testDb.db);
    await seedTrip(testDb.db, "trip-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1");

    // Seed activities with increasing timestamps for deterministic ordering
    const t1 = new Date("2025-01-01T00:00:00Z");
    const t2 = new Date("2025-01-02T00:00:00Z");
    const t3 = new Date("2025-01-03T00:00:00Z");
    const t4 = new Date("2025-01-04T00:00:00Z");

    await seedActivity(testDb.db, "af-1", "trip-1", "custom", { createdAt: t1 });
    await seedActivity(testDb.db, "af-2", "trip-1", "custom", { createdAt: t2 });
    await seedActivity(testDb.db, "af-3", "trip-1", "custom", { createdAt: t3 });
    await seedActivity(testDb.db, "af-4", "trip-1", "custom", { createdAt: t4 });

    const result = await getActivitiesCursorPage({
      context: ctx,
      tripId: "trip-1",
      pageSize: 2,
      includeHidden: false,
    });

    expect(result.activities.length).toBe(2);
    expect(result.nextCursor).not.toBeNull();
    expect(result.nextCursor!.id).toBe("af-3");
    expect(result.pagination.hasMore).toBe(true);
  });

  it("returns null nextCursor when all results fit", async () => {
    const ctx = await makeContext(testDb.db);
    await seedTrip(testDb.db, "trip-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1");
    await seedActivity(testDb.db, "af-1", "trip-1", "custom");

    const result = await getActivitiesCursorPage({
      context: ctx,
      tripId: "trip-1",
      pageSize: 10,
      includeHidden: false,
    });

    expect(result.activities.length).toBe(1);
    expect(result.nextCursor).toBeNull();
    expect(result.pagination.hasMore).toBe(false);
  });

  it("honors the cursor parameter for pagination", async () => {
    const ctx = await makeContext(testDb.db);
    await seedTrip(testDb.db, "trip-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1");

    const t1 = new Date("2025-01-01T00:00:00Z");
    const t2 = new Date("2025-01-02T00:00:00Z");
    const t3 = new Date("2025-01-03T00:00:00Z");

    await seedActivity(testDb.db, "af-1", "trip-1", "custom", { createdAt: t1 });
    await seedActivity(testDb.db, "af-2", "trip-1", "custom", { createdAt: t2 });
    await seedActivity(testDb.db, "af-3", "trip-1", "custom", { createdAt: t3 });

    const firstPage = await getActivitiesCursorPage({
      context: ctx,
      tripId: "trip-1",
      pageSize: 1,
      includeHidden: false,
    });

    expect(firstPage.nextCursor).not.toBeNull();
    expect(firstPage.nextCursor!.id).toBe("af-3");

    const secondPage = await getActivitiesCursorPage({
      context: ctx,
      tripId: "trip-1",
      pageSize: 1,
      includeHidden: false,
      cursor: firstPage.nextCursor,
    });

    expect(secondPage.activities.length).toBe(1);
    expect(secondPage.activities[0].id).toBe("af-2");
  });

  it("returns hasMore false with empty results", async () => {
    const ctx = await makeContext(testDb.db);
    await seedTrip(testDb.db, "trip-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1");

    const result = await getActivitiesCursorPage({
      context: ctx,
      tripId: "trip-1",
      pageSize: 10,
      includeHidden: false,
    });

    expect(result.activities.length).toBe(0);
    expect(result.nextCursor).toBeNull();
    expect(result.pagination.hasMore).toBe(false);
  });
});
