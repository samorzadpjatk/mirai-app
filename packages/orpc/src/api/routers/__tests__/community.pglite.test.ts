import { activityFeeds } from "@mirai-app/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  createMockSupabase,
  seedGroup,
  seedParticipant,
  seedTrip,
  seedUser,
} from "../../../test-helpers";
import { getCommunityFull } from "../community/queries";

const TEST_USER_ID = "user-1";
const TEST_TRIP_ID = "trip-1";

describe("community.getCommunityFull — PGLite integration", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
  const now = () => new Date();

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  function buildContext(
    userId = TEST_USER_ID,
    role = "USER" as const,
    emails: Record<string, string> = {},
  ) {
    return {
      db: testDb.db,
      supabase: createMockSupabase(emails),
      dbUser: { id: userId, role },
    };
  }

  async function seedActivity(id: string, title: string) {
    await testDb.db.insert(activityFeeds).values({
      id,
      tripId: TEST_TRIP_ID,
      activityType: "custom",
      title,
      description: "Community announcement",
      imageUrl: "",
      createdByAdmin: TEST_USER_ID,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  it("returns feed, ranking, active challenges and avatar URLs for a participant", async () => {
    await seedUser(testDb.db, TEST_USER_ID, "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, TEST_TRIP_ID, "Community Trip");
    await seedGroup(testDb.db, "group-1", TEST_TRIP_ID, "Team A", TEST_USER_ID, "TEAM01");
    await seedParticipant(testDb.db, "tp-1", TEST_USER_ID, TEST_TRIP_ID, "group-1");
    await seedActivity("af-1", "Hello community");

    const result = await getCommunityFull(
      buildContext(TEST_USER_ID, "USER", { "auth-1": "alice@example.com" }),
      {
        tripId: TEST_TRIP_ID,
      },
    );

    expect(result.feed.activities).toHaveLength(1);
    expect(result.feed.activities[0]?.id).toBe("af-1");
    expect(result.feed.activities[0]?.title).toBe("Hello community");
    expect(result.feed.pagination.hasMore).toBe(false);

    expect(result.ranking.data).toHaveLength(1);
    expect(result.ranking.data[0]?.id).toBe("group-1");

    expect(result.activeChallenges).toEqual([]);

    expect(result.avatarUrls[TEST_USER_ID]).toBe("https://signed-url.example.com/image.jpg");
  });

  it("supports cursor pagination", async () => {
    await seedUser(testDb.db, TEST_USER_ID, "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, TEST_TRIP_ID, "Community Trip");
    await seedGroup(testDb.db, "group-1", TEST_TRIP_ID, "Team A", TEST_USER_ID, "TEAM01");
    await seedParticipant(testDb.db, "tp-1", TEST_USER_ID, TEST_TRIP_ID, "group-1");
    await seedActivity("af-1", "First");
    await seedActivity("af-2", "Second");

    const firstPage = await getCommunityFull(buildContext(TEST_USER_ID), {
      tripId: TEST_TRIP_ID,
      pageSize: 1,
    });

    expect(firstPage.feed.activities).toHaveLength(1);
    expect(firstPage.feed.nextCursor).not.toBeNull();

    const secondPage = await getCommunityFull(buildContext(TEST_USER_ID), {
      tripId: TEST_TRIP_ID,
      pageSize: 1,
      cursor: firstPage.feed.nextCursor,
    });

    expect(secondPage.feed.activities).toHaveLength(1);
    expect(secondPage.feed.activities[0]?.id).not.toBe(firstPage.feed.activities[0]?.id);
  });

  it("throws FORBIDDEN for non-participants", async () => {
    await seedUser(testDb.db, TEST_USER_ID, "auth-1", "Alice", "Smith");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");
    await seedTrip(testDb.db, TEST_TRIP_ID, "Community Trip");

    await expect(
      getCommunityFull(buildContext("user-2"), { tripId: TEST_TRIP_ID }),
    ).rejects.toThrow("You are not a participant of this trip");
  });

  it("returns empty results when there is no activity", async () => {
    await seedUser(testDb.db, TEST_USER_ID, "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, TEST_TRIP_ID, "Community Trip");
    await seedGroup(testDb.db, "group-1", TEST_TRIP_ID, "Team A", TEST_USER_ID, "TEAM01");
    await seedParticipant(testDb.db, "tp-1", TEST_USER_ID, TEST_TRIP_ID, "group-1");

    const result = await getCommunityFull(buildContext(TEST_USER_ID), { tripId: TEST_TRIP_ID });

    expect(result.feed.activities).toHaveLength(0);
    expect(result.ranking.data).toHaveLength(1);
    expect(result.activeChallenges).toEqual([]);
    expect(Object.keys(result.avatarUrls)).toHaveLength(0);
  });
});
