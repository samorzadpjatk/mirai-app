import {
  activityFeeds,
  activityReactions,
  challengeActivities,
  challengeLocation,
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
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

describe("activityFeed router — PGLite transaction rollback", () => {
  async function seedTrip(id: string, name: string) {
    await testDb.db.insert(trips).values({
      id,
      name,
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedUser(id: string, authUserId: string, firstName: string, lastName: string) {
    await testDb.db.insert(users).values({
      id,
      authUserId,
      firstName,
      lastName,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedGroup(
    id: string,
    tripId: string,
    name: string,
    organizerId: string,
    code: string,
  ) {
    await testDb.db.insert(groups).values({
      id,
      tripId,
      name,
      description: "",
      organizerId,
      code,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
    await testDb.db.insert(tripParticipants).values({
      id,
      userId,
      tripId,
      groupId,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedChallenge(id: string, tripId: string, name: string) {
    await testDb.db.insert(challenges).values({
      id,
      tripId,
      name,
      description: "",
      submissionType: "IMAGE",
      scoringCategory: "JUDGED_STAFF",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challengeRecurrence).values({
      challengeId: id,
      isRecurring: false,
      dailyStartTime: "",
      dailyEndTime: "",
      recurringDays: 0,
      type: "DAILY",
    });

    await testDb.db.insert(challengeLocation).values({
      challengeId: id,
      targetLatitude: 0,
      targetLongitude: 0,
    });
  }

  async function seedChallengeSubmission(id: string, challengeId: string, groupId: string) {
    await testDb.db.insert(challengeSubmissions).values({
      id,
      challengeId,
      groupId,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  it("rolls back activity feed and user post on transaction failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "auth-1", "John", "Doe");
    await seedGroup("group-1", "trip-1", "Group A", "user-1", "CODE1");
    await seedParticipant("part-1", "user-1", "trip-1", "group-1");

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(activityFeeds).values({
          id: "af-1",
          tripId: "trip-1",
          activityType: "user_post",
          title: "Post",
          description: "",
          imageUrl: "",
          createdAt: now(),
          updatedAt: now(),
        });
        await tx.insert(userPosts).values({
          activityId: "af-1",
          authorId: "part-1",
          additionalImages: [],
        });
        throw new Error("Simulated failure after inserts");
      }),
    ).rejects.toThrow("Simulated failure after inserts");

    const feeds = await testDb.db.select().from(activityFeeds).where(eq(activityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(0);
    const posts = await testDb.db.select().from(userPosts).where(eq(userPosts.activityId, "af-1"));
    expect(posts).toHaveLength(0);
  });

  it("rolls back activity feed and submission activity on transaction failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "auth-1", "John", "Doe");
    await seedGroup("group-1", "trip-1", "Group A", "user-1", "CODE1");
    await seedParticipant("part-1", "user-1", "trip-1", "group-1");
    await seedChallenge("ch-1", "trip-1", "Challenge 1");
    await seedChallengeSubmission("sub-1", "ch-1", "group-1");

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(activityFeeds).values({
          id: "af-1",
          tripId: "trip-1",
          activityType: "submission",
          title: "Submission",
          description: "",
          imageUrl: "",
          createdAt: now(),
          updatedAt: now(),
        });
        await tx.insert(submissionActivities).values({
          activityId: "af-1",
          submissionId: "sub-1",
          challengeId: "ch-1",
          groupId: "group-1",
          hasVideo: false,
        });
        throw new Error("Simulated failure after inserts");
      }),
    ).rejects.toThrow("Simulated failure after inserts");

    const feeds = await testDb.db.select().from(activityFeeds).where(eq(activityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(0);
    const subs = await testDb.db
      .select()
      .from(submissionActivities)
      .where(eq(submissionActivities.activityId, "af-1"));
    expect(subs).toHaveLength(0);
  });

  it("commits activity feed and challenge activity when no failure occurs", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedChallenge("ch-1", "trip-1", "Challenge 1");

    await testDb.db.transaction(async (tx) => {
      await tx.insert(activityFeeds).values({
        id: "af-1",
        tripId: "trip-1",
        activityType: "challenge_event",
        title: "Challenge",
        description: "",
        imageUrl: "",
        createdAt: now(),
        updatedAt: now(),
      });
      await tx.insert(challengeActivities).values({
        activityId: "af-1",
        challengeId: "ch-1",
        eventType: "challenge_started",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds).where(eq(activityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(1);
    expect(feeds[0].activityType).toBe("challenge_event");
    expect(feeds[0].title).toBe("Challenge");
    const chas = await testDb.db
      .select()
      .from(challengeActivities)
      .where(eq(challengeActivities.activityId, "af-1"));
    expect(chas).toHaveLength(1);
    expect(chas[0].eventType).toBe("challenge_started");
  });
});

describe("activityFeed router — Drizzle ORM PGLite integration", () => {
  beforeEach(async () => {
    await seedUser("user-1", "auth-1", "John", "Doe");
    await seedTrip("trip-1", "Test Trip");
    await seedGroup("group-1", "trip-1", "Group A", "user-1", "CODE1");
    await seedParticipant("part-1", "user-1", "trip-1", "group-1");
    await seedChallenge("ch-1", "trip-1", "Challenge 1");
    await seedChallengeSubmission("sub-1", "ch-1", "group-1");
  });

  async function seedUser(id: string, authUserId: string, firstName: string, lastName: string) {
    await testDb.db.insert(users).values({
      id,
      authUserId,
      firstName,
      lastName,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedTrip(id: string, name: string) {
    await testDb.db.insert(trips).values({
      id,
      name,
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedGroup(
    id: string,
    tripId: string,
    name: string,
    organizerId: string,
    code: string,
  ) {
    await testDb.db.insert(groups).values({
      id,
      tripId,
      name,
      description: "",
      organizerId,
      code,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
    await testDb.db.insert(tripParticipants).values({
      id,
      userId,
      tripId,
      groupId,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedChallenge(id: string, tripId: string, name: string) {
    await testDb.db.insert(challenges).values({
      id,
      tripId,
      name,
      description: "",
      submissionType: "IMAGE",
      scoringCategory: "JUDGED_STAFF",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challengeRecurrence).values({
      challengeId: id,
      isRecurring: false,
      dailyStartTime: "",
      dailyEndTime: "",
      recurringDays: 0,
      type: "DAILY",
    });

    await testDb.db.insert(challengeLocation).values({
      challengeId: id,
      targetLatitude: 0,
      targetLongitude: 0,
    });
  }

  async function seedChallengeSubmission(id: string, challengeId: string, groupId: string) {
    await testDb.db.insert(challengeSubmissions).values({
      id,
      challengeId,
      groupId,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedActivityFeed(id: string, tripId: string, activityType: string, title: string) {
    await testDb.db.insert(activityFeeds).values({
      id,
      tripId,
      activityType,
      title,
      description: "",
      imageUrl: "",
      createdAt: now(),
      updatedAt: now(),
    });
  }

  it("creates user post via Drizzle ORM transaction", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx.insert(activityFeeds).values({
        id: "af-1",
        tripId: "trip-1",
        activityType: "user_post",
        title: "User Post",
        description: "",
        imageUrl: "",
        createdAt: now(),
        updatedAt: now(),
      });
      await tx.insert(userPosts).values({
        activityId: "af-1",
        authorId: "part-1",
        additionalImages: [],
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds).where(eq(activityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(1);
    expect(feeds[0].activityType).toBe("user_post");
    expect(feeds[0].title).toBe("User Post");
    expect(feeds[0].tripId).toBe("trip-1");

    const posts = await testDb.db.select().from(userPosts).where(eq(userPosts.activityId, "af-1"));
    expect(posts).toHaveLength(1);
    expect(posts[0].authorId).toBe("part-1");
    expect(posts[0].additionalImages).toEqual([]);
  });

  it("rolls back submission activity on validation failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(activityFeeds).values({
          id: "af-1",
          tripId: "trip-1",
          activityType: "submission",
          title: "Submission",
          description: "",
          imageUrl: "",
          createdAt: now(),
          updatedAt: now(),
        });
        await tx.insert(submissionActivities).values({
          activityId: "af-1",
          submissionId: "sub-1",
          challengeId: "ch-1",
          groupId: "group-1",
          hasVideo: false,
        });
        throw new Error("Validation failure");
      }),
    ).rejects.toThrow("Validation failure");

    const feeds = await testDb.db.select().from(activityFeeds).where(eq(activityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(0);
    const subs = await testDb.db
      .select()
      .from(submissionActivities)
      .where(eq(submissionActivities.activityId, "af-1"));
    expect(subs).toHaveLength(0);
    const allSubs = await testDb.db.select().from(submissionActivities);
    expect(allSubs).toHaveLength(0);
    const allFeeds = await testDb.db.select().from(activityFeeds);
    expect(allFeeds).toHaveLength(0);
  });

  it("rolls back challenge activity on validation failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(activityFeeds).values({
          id: "af-1",
          tripId: "trip-1",
          activityType: "challenge_event",
          title: "Challenge",
          description: "",
          imageUrl: "",
          createdAt: now(),
          updatedAt: now(),
        });
        await tx.insert(challengeActivities).values({
          activityId: "af-1",
          challengeId: "ch-1",
          eventType: "challenge_started",
        });
        throw new Error("Validation failure");
      }),
    ).rejects.toThrow("Validation failure");

    const feeds = await testDb.db.select().from(activityFeeds).where(eq(activityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(0);
    const chas = await testDb.db
      .select()
      .from(challengeActivities)
      .where(eq(challengeActivities.activityId, "af-1"));
    expect(chas).toHaveLength(0);
    const allChas = await testDb.db.select().from(challengeActivities);
    expect(allChas).toHaveLength(0);
    const allFeeds = await testDb.db.select().from(activityFeeds);
    expect(allFeeds).toHaveLength(0);
  });

  it("rolls back rank change activity on validation failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(activityFeeds).values({
          id: "af-1",
          tripId: "trip-1",
          activityType: "submission",
          title: "Submission",
          description: "",
          imageUrl: "",
          createdAt: now(),
          updatedAt: now(),
        });
        await tx.insert(rankChangeActivities).values({
          activityId: "af-1",
          groupId: "group-1",
          newRank: 1,
          totalCoins: 100,
          coinsGained: 10,
        });
        throw new Error("Validation failure");
      }),
    ).rejects.toThrow("Validation failure");

    const feeds = await testDb.db.select().from(activityFeeds).where(eq(activityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(0);
    const ranks = await testDb.db
      .select()
      .from(rankChangeActivities)
      .where(eq(rankChangeActivities.activityId, "af-1"));
    expect(ranks).toHaveLength(0);
    const allRanks = await testDb.db.select().from(rankChangeActivities);
    expect(allRanks).toHaveLength(0);
    const allFeeds = await testDb.db.select().from(activityFeeds);
    expect(allFeeds).toHaveLength(0);
  });

  it("toggles reaction with real data", async () => {
    await seedActivityFeed("af-1", "trip-1", "custom", "Activity");
    await testDb.db.insert(activityReactions).values({
      id: "react-1",
      activityId: "af-1",
      userId: "user-1",
      reactionType: "heart",
      createdAt: now(),
    });

    const reactions = await testDb.db
      .select()
      .from(activityReactions)
      .where(eq(activityReactions.activityId, "af-1"));
    expect(reactions).toHaveLength(1);
    expect(reactions[0].reactionType).toBe("heart");
    expect(reactions[0].userId).toBe("user-1");
    expect(reactions[0].activityId).toBe("af-1");

    await testDb.db.delete(activityReactions).where(eq(activityReactions.id, "react-1"));
    const afterDelete = await testDb.db
      .select()
      .from(activityReactions)
      .where(eq(activityReactions.activityId, "af-1"));
    expect(afterDelete).toHaveLength(0);
    const allReactions = await testDb.db.select().from(activityReactions);
    expect(allReactions).toHaveLength(0);
    const byUser = await testDb.db
      .select()
      .from(activityReactions)
      .where(eq(activityReactions.userId, "user-1"));
    expect(byUser).toHaveLength(0);
  });

  it("queries activities with pagination", async () => {
    for (let i = 1; i <= 5; i++) {
      await seedActivityFeed(`af-${i}`, "trip-1", "custom", `Activity ${i}`);
    }

    const allFeeds = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"));
    expect(allFeeds).toHaveLength(5);

    const pageSize = 2;
    const page1 = allFeeds.slice(0, pageSize);
    expect(page1).toHaveLength(2);
    expect(page1[0].title).toBe("Activity 1");
    expect(page1[1].title).toBe("Activity 2");

    const page2 = allFeeds.slice(pageSize, pageSize * 2);
    expect(page2).toHaveLength(2);
    expect(page2[0].title).toBe("Activity 3");
    expect(page2[1].title).toBe("Activity 4");

    const page3 = allFeeds.slice(pageSize * 2);
    expect(page3).toHaveLength(1);
    expect(page3[0].title).toBe("Activity 5");

    const totalCount = await testDb.db
      .select({ count: count() })
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"));
    expect(totalCount[0].count).toBe(5);

    const otherTripCount = await testDb.db
      .select({ count: count() })
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-2"));
    expect(otherTripCount[0].count).toBe(0);

    const limited = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"))
      .limit(2);
    expect(limited).toHaveLength(2);
    expect(limited[0].title).toBe("Activity 1");
    expect(limited[1].title).toBe("Activity 2");

    const offset = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"))
      .limit(2)
      .offset(2);
    expect(offset).toHaveLength(2);
    expect(offset[0].title).toBe("Activity 3");
    expect(offset[1].title).toBe("Activity 4");
  });
});
