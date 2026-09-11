import { IMAGE_TRANSFORMS } from "@mirai-app/common/storage";
import {
  activityFeeds,
  activityReactions,
  challengeActivities,
  challengeLocationMatch,
  challengeRecurrence,
  challengeSubmissions,
  challenges,
  groups,
  rankChangeActivities,
  submissionActivities,
  tripParticipants,
  trips,
  userPosts,
  users,
} from "@mirai-app/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { enrichActivities } from "../enrichment";
import type { RawActivityWithRelations } from "../types";

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

// ── helpers ──────────────────────────────────────────────────────────

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

async function seedGroup(db: DB, id: string, tripId: string, organizerId: string) {
  await db.insert(groups).values({
    id,
    tripId,
    name: "Group",
    description: "",
    image: "group/group.jpg",
    organizerId,
    code: "CODE",
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

async function seedActivity(db: DB, id: string, tripId: string, activityType: string) {
  await db.insert(activityFeeds).values({
    id,
    tripId,
    activityType,
    title: "Activity",
    description: "",
    imageUrl: "",
    createdAt: now(),
    updatedAt: now(),
  });
}

async function makeContext(db: DB) {
  const supabase = {
    storage: {
      from: () => ({
        createSignedUrl: async () => ({
          data: { signedUrl: "https://resolved.example.com/img.jpg" },
          error: null,
        }),
      }),
    },
  } as unknown as Parameters<typeof enrichActivities>[0]["supabase"];

  return {
    db,
    supabase,
    dbUser: { id: "user-1" },
  } as Parameters<typeof enrichActivities>[0];
}

async function fetchActivityWithRelations(db: DB, ids: string[]) {
  return db.query.activityFeeds.findMany({
    where: (af) => eq(af.id, ids[0]!),
    with: {
      userPost: {
        with: {
          author: {
            with: {
              user: true,
              group: true,
            },
          },
        },
      },
      submissionActivity: {
        with: {
          group: true,
          challenge: true,
          submission: true,
        },
      },
      challengeActivity: {
        with: {
          challenge: true,
        },
      },
      rankChangeActivity: {
        with: {
          group: true,
        },
      },
    },
  });
}

// ── tests ────────────────────────────────────────────────────────────

describe("enrichActivities", () => {
  it("returns empty array for empty input", async () => {
    const result = await enrichActivities(await makeContext(testDb.db), []);
    expect(result).toEqual([]);
  });

  // Each test seeds the DB, so beforeAll seeding is not used.
  // The beforeAll block is kept for potential shared data.
  beforeEach(async () => {
    // nothing – each test seeds its own data
  });

  it("signs feed images at card size, not at full upload resolution", async () => {
    const createSignedUrl = vi.fn(async () => ({
      data: { signedUrl: "https://resolved.example.com/img.jpg" },
      error: null,
    }));
    const ctx = {
      db: testDb.db,
      supabase: { storage: { from: () => ({ createSignedUrl }) } },
      dbUser: { id: "user-1" },
    } as unknown as Parameters<typeof enrichActivities>[0];

    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1");
    await seedActivity(testDb.db, "af-img", "trip-1", "custom");
    await testDb.db
      .update(activityFeeds)
      .set({ imageUrl: "activity/banner.jpg" })
      .where(eq(activityFeeds.id, "af-img"));

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-img"]);
    await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(createSignedUrl).toHaveBeenCalledWith("activity/banner.jpg", expect.any(Number), {
      transform: IMAGE_TRANSFORMS.feedCard,
    });
  });

  it("enriches custom activity with reactions and cached image", async () => {
    const ctx = await makeContext(testDb.db);

    await seedUser(testDb.db, "user-1");
    await seedUser(testDb.db, "user-2");
    await seedUser(testDb.db, "user-3");
    await seedUser(testDb.db, "admin-1");
    await seedTrip(testDb.db, "trip-1");
    await seedGroup(testDb.db, "g1", "trip-1", "user-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1", "g1");

    await seedActivity(testDb.db, "af-1", "trip-1", "custom");

    // Add reactions (hit Map.get existing branch + reactionType in counts)
    await testDb.db.insert(activityReactions).values([
      { id: "r1", activityId: "af-1", userId: "user-1", reactionType: "heart", createdAt: now() },
      { id: "r2", activityId: "af-1", userId: "user-2", reactionType: "heart", createdAt: now() },
      { id: "r3", activityId: "af-1", userId: "user-3", reactionType: "fire", createdAt: now() },
    ]);

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched.length).toBe(1);
    expect(enriched[0].activityType).toBe("custom");
    expect(enriched[0].reactionsSummary.total).toBe(3);
    expect(enriched[0].reactionsSummary.counts.heart).toBe(2);
    expect(enriched[0].reactionsSummary.counts.fire).toBe(1);
    expect(enriched[0].reactionsSummary.myReactions).toContain("heart");
    expect(enriched[0].submissionActivity).toBeNull();
  });

  it("enriches user_post with full author + group (truthy branch)", async () => {
    const ctx = await makeContext(testDb.db);

    await seedUser(testDb.db, "user-1");
    await seedUser(testDb.db, "admin-1");
    await seedTrip(testDb.db, "trip-1");
    await seedGroup(testDb.db, "g1", "trip-1", "user-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1", "g1");

    await seedActivity(testDb.db, "af-1", "trip-1", "user_post");
    await testDb.db.insert(userPosts).values({
      activityId: "af-1",
      authorId: "p1",
      additionalImages: ["group/img1.jpg", "group/img2.jpg"],
    });

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched[0].activityType).toBe("user_post");
    expect(enriched[0].userPost).toMatchObject({
      authorId: "p1",
      additionalImages: [
        "https://resolved.example.com/img.jpg",
        "https://resolved.example.com/img.jpg",
      ],
      author: {
        id: "p1",
        userId: "user-1",
        tripId: "trip-1",
        group: { id: "g1", name: "Group", image: "https://resolved.example.com/img.jpg" },
      },
    });
    expect(enriched[0].userPost!.author!.user).toMatchObject({
      id: "user-1",
      firstName: "User",
      lastName: "user-1",
    });
  });

  it("enriches submission with full relations (truthy branch with group/challenge/submission)", async () => {
    const ctx = await makeContext(testDb.db);

    await seedUser(testDb.db, "user-1");
    await seedUser(testDb.db, "admin-1");
    await seedTrip(testDb.db, "trip-1");
    await seedGroup(testDb.db, "g1", "trip-1", "user-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1", "g1");

    await seedActivity(testDb.db, "af-1", "trip-1", "submission");

    await testDb.db.insert(challenges).values({
      id: "ch-1",
      tripId: "trip-1",
      name: "Challenge",
      description: "",
      submissionType: "IMAGE",
      scoringCategory: "JUDGED_STAFF",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(challengeRecurrence).values({
      challengeId: "ch-1",
      isRecurring: false,
      dailyStartTime: "",
      dailyEndTime: "",
      recurringDays: 0,
      type: "DAILY",
    });
    await testDb.db.insert(challengeLocationMatch).values({
      challengeId: "ch-1",
      targetLatitude: 0,
      targetLongitude: 0,
    });

    await testDb.db.insert(challengeSubmissions).values({
      id: "cs-1",
      challengeId: "ch-1",
      groupId: "g1",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(submissionActivities).values({
      activityId: "af-1",
      submissionId: "cs-1",
      challengeId: "ch-1",
      groupId: "g1",
      hasVideo: true,
      isWinner: true,
      ranking: 3,
      pointsAwarded: 50,
    });

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched[0].activityType).toBe("submission");
    expect(enriched[0].submissionActivity).toMatchObject({
      submissionId: "cs-1",
      challengeId: "ch-1",
      groupId: "g1",
      hasVideo: true,
      isWinner: true,
      ranking: 3,
      pointsAwarded: 50,
      currentGroupRank: 1,
      group: { id: "g1", name: "Group", image: "https://resolved.example.com/img.jpg" },
      challenge: { id: "ch-1", name: "Challenge" },
      submission: { id: "cs-1", ranking: 0 },
    });
  });

  it("enriches challenge_event with challenge data", async () => {
    const ctx = await makeContext(testDb.db);

    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1");

    await seedActivity(testDb.db, "af-1", "trip-1", "challenge_event");

    await testDb.db.insert(challenges).values({
      id: "ch-1",
      tripId: "trip-1",
      name: "Challenge",
      description: "Desc",
      submissionType: "IMAGE",
      scoringCategory: "JUDGED_STAFF",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(challengeRecurrence).values({
      challengeId: "ch-1",
      isRecurring: false,
      dailyStartTime: "",
      dailyEndTime: "",
      recurringDays: 0,
      type: "DAILY",
    });
    await testDb.db.insert(challengeLocationMatch).values({
      challengeId: "ch-1",
      targetLatitude: 0,
      targetLongitude: 0,
    });
    await testDb.db.insert(challengeActivities).values({
      activityId: "af-1",
      challengeId: "ch-1",
      eventType: "challenge_started",
    });

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched[0].activityType).toBe("challenge_event");
    expect(enriched[0].challengeActivity).toMatchObject({
      challengeId: "ch-1",
      eventType: "challenge_started",
      basePoints: 0,
      submissionCount: 0,
      challenge: { id: "ch-1", name: "Challenge", description: "Desc" },
    });
  });

  it("enriches rank_change with group data", async () => {
    const ctx = await makeContext(testDb.db);

    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1");
    await seedGroup(testDb.db, "g1", "trip-1", "user-1");
    await seedParticipant(testDb.db, "p1", "user-1", "trip-1", "g1");

    await seedActivity(testDb.db, "af-1", "trip-1", "rank_change");

    await testDb.db.insert(rankChangeActivities).values({
      activityId: "af-1",
      groupId: "g1",
      newRank: 2,
      totalCoins: 100,
      coinsGained: 10,
    });

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched[0].activityType).toBe("rank_change");
    expect(enriched[0].rankChangeActivity).toMatchObject({
      groupId: "g1",
      newRank: 2,
      totalCoins: 100,
      coinsGained: 10,
      group: { id: "g1", name: "Group", image: "https://resolved.example.com/img.jpg" },
    });
  });

  it("enriches custom activity (no reactions in DB)", async () => {
    const ctx = await makeContext(testDb.db);
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1");
    await seedActivity(testDb.db, "af-1", "trip-1", "custom");

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched[0].activityType).toBe("custom");
    expect(enriched[0].reactionsSummary.total).toBe(0);
    expect(enriched[0].reactionsSummary.counts.heart).toBe(0);
    expect(enriched[0].reactionsSummary.myReactions).toEqual([]);
  });

  it("enriches user_post with null userPost relation (falsy branch)", async () => {
    const ctx = await makeContext(testDb.db);
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1");
    await seedActivity(testDb.db, "af-1", "trip-1", "user_post");

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched[0].activityType).toBe("user_post");
    expect(enriched[0].userPost).toMatchObject({
      authorId: "",
      additionalImages: [],
      author: null,
    });
  });

  it("enriches submission with null submission relation (falsy branch)", async () => {
    const ctx = await makeContext(testDb.db);
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1");
    await seedActivity(testDb.db, "af-1", "trip-1", "submission");

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched[0].activityType).toBe("submission");
    expect(enriched[0].submissionActivity).toMatchObject({
      submissionId: "",
      challengeId: "",
      groupId: "",
      hasVideo: false,
      isWinner: false,
      ranking: 0,
      pointsAwarded: 0,
      currentGroupRank: null,
      group: null,
      challenge: null,
      submission: null,
    });
  });

  it("handles unknown activity type → falls back to custom", async () => {
    const ctx = await makeContext(testDb.db);
    await seedUser(testDb.db, "user-1");
    await seedTrip(testDb.db, "trip-1");

    // Manually insert with an unknown activityType
    await testDb.db.insert(activityFeeds).values({
      id: "af-1",
      tripId: "trip-1",
      activityType: "unknown_type",
      title: "Unknown",
      description: "",
      imageUrl: "",
      createdAt: now(),
      updatedAt: now(),
    });

    const feeds = await fetchActivityWithRelations(testDb.db, ["af-1"]);
    const enriched = await enrichActivities(ctx, feeds as unknown as RawActivityWithRelations[]);

    expect(enriched[0].activityType).toBe("custom");
    expect(enriched[0].submissionActivity).toBeNull();
    expect(enriched[0].challengeActivity).toBeNull();
    expect(enriched[0].rankChangeActivity).toBeNull();
    expect(enriched[0].userPost).toBeNull();
  });
});
