import {
  activityFeeds,
  challengeActivities,
  challengeLocation,
  challengeRecurrence,
  challengeSubmissions,
  challenges,
  coinTransactions,
  groups,
  submissionActivities,
  trips,
  users,
} from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { eq, sql } from "drizzle-orm";
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

async function seedUser(id: string, authUserId: string, firstName: string, lastName: string) {
  await testDb.db
    .insert(users)
    .values({ id, authUserId, firstName, lastName, createdAt: now(), updatedAt: now() });
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

async function seedChallenge(
  id: string,
  tripId: string,
  overrides: Partial<typeof challenges.$inferInsert> & {
    isRecurring?: boolean;
    dailyStartTime?: string;
    dailyEndTime?: string;
    recurringDays?: number;
    targetLatitude?: number;
    targetLongitude?: number;
  } = {},
) {
  await testDb.db.insert(challenges).values({
    id,
    tripId,
    name: overrides.name ?? "Test Challenge",
    description: overrides.description ?? "",
    submissionType: overrides.submissionType ?? "IMAGE",
    scoringCategory: overrides.scoringCategory ?? "SPEED",
    status: overrides.status ?? "HIDDEN",
    basePoints: overrides.basePoints ?? 100,
    autoApprove: overrides.autoApprove ?? false,
    startTime: overrides.startTime ?? null,
    endTime: overrides.endTime ?? null,
    votingStartTime: overrides.votingStartTime ?? null,
    votingEndTime: overrides.votingEndTime ?? null,
    createdAt: overrides.createdAt ?? now(),
    updatedAt: overrides.updatedAt ?? now(),
  });

  await testDb.db.insert(challengeRecurrence).values({
    challengeId: id,
    isRecurring: overrides.isRecurring ?? false,
    dailyStartTime: overrides.dailyStartTime ?? "",
    dailyEndTime: overrides.dailyEndTime ?? "",
    recurringDays: overrides.recurringDays ?? 0,
    type: "DAILY",
  });

  await testDb.db.insert(challengeLocation).values({
    challengeId: id,
    targetLatitude: overrides.targetLatitude ?? 0,
    targetLongitude: overrides.targetLongitude ?? 0,
  });
}

describe("challenge router — PGLite transaction rollback", () => {
  describe("createChallenge", () => {
    it("rolls back challenge insert and activity feed on transaction failure", async () => {
      await seedUser("admin-1", "auth-admin-1", "Admin", "User");
      await seedTrip("trip-1", "Test Trip");

      const challengeCountBefore = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challenges);
      expect(challengeCountBefore[0].count).toBe(0);

      try {
        await testDb.db.transaction(async (tx) => {
          await tx.insert(challenges).values({
            id: "challenge-1",
            tripId: "trip-1",
            name: "Test Challenge",
            description: "A test challenge",
            submissionType: "IMAGE",
            scoringCategory: "SPEED",
            status: "ACTIVE",
            basePoints: 100,
            autoApprove: false,
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(challengeRecurrence).values({
            challengeId: "challenge-1",
            isRecurring: false,
            dailyStartTime: "",
            dailyEndTime: "",
            recurringDays: 0,
            type: "DAILY",
          });

          await tx.insert(challengeLocation).values({
            challengeId: "challenge-1",
            targetLatitude: 0,
            targetLongitude: 0,
          });

          await tx.insert(activityFeeds).values({
            id: "activity-1",
            tripId: "trip-1",
            activityType: "challenge_event",
            title: "Czas start!",
            description: "Challenge started",
            createdByAdmin: "admin-1",
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(challengeActivities).values({
            activityId: "activity-1",
            challengeId: "challenge-1",
            eventType: "challenge_started",
            basePoints: 100,
          });

          throw new Error("Simulated failure after challenge creation");
        });
      } catch {
        // Expected rollback
      }

      const challengeCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challenges);
      expect(challengeCountAfter[0].count).toBe(0);

      const activityCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(activityFeeds);
      expect(activityCountAfter[0].count).toBe(0);

      const challengeActivityCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challengeActivities);
      expect(challengeActivityCountAfter[0].count).toBe(0);
    });

    it("rolls back recurring challenge precreation on transaction failure", async () => {
      await seedTrip("trip-1", "Test Trip");

      const challengeCountBefore = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challenges);
      expect(challengeCountBefore[0].count).toBe(0);

      try {
        await testDb.db.transaction(async (tx) => {
          await tx.insert(challenges).values({
            id: "challenge-template-1",
            tripId: "trip-1",
            name: "Recurring Challenge",
            description: "A recurring test challenge",
            submissionType: "IMAGE",
            scoringCategory: "SPEED",
            status: "VISIBLE",
            basePoints: 50,
            autoApprove: false,
            startTime: now(),
            endTime: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000),
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(challengeRecurrence).values({
            challengeId: "challenge-template-1",
            isRecurring: true,
            dailyStartTime: "09:00",
            dailyEndTime: "18:00",
            recurringDays: 7,
            type: "DAILY",
          });

          await tx.insert(challengeLocation).values({
            challengeId: "challenge-template-1",
            targetLatitude: 0,
            targetLongitude: 0,
          });

          await tx.insert(challenges).values({
            id: "challenge-instance-1",
            tripId: "trip-1",
            name: "Recurring Challenge #1",
            description: "A recurring test challenge",
            submissionType: "IMAGE",
            scoringCategory: "SPEED",
            status: "VISIBLE",
            basePoints: 50,
            autoApprove: false,
            startTime: now(),
            endTime: new Date(now().getTime() + 24 * 60 * 60 * 1000),
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(challengeRecurrence).values({
            challengeId: "challenge-instance-1",
            isRecurring: false,
            dailyStartTime: "",
            dailyEndTime: "",
            recurringDays: 0,
            type: "DAILY",
          });

          await tx.insert(challengeLocation).values({
            challengeId: "challenge-instance-1",
            targetLatitude: 0,
            targetLongitude: 0,
          });

          throw new Error("Simulated failure after recurring precreation");
        });
      } catch {
        // Expected rollback
      }

      const challengeCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challenges);
      expect(challengeCountAfter[0].count).toBe(0);
    });
  });

  describe("updateChallenge", () => {
    beforeEach(async () => {
      await seedUser("admin-1", "auth-admin-1", "Admin", "User");
      await seedTrip("trip-1", "Test Trip");
      await seedChallenge("challenge-1", "trip-1", {
        name: "Original Challenge",
        description: "Original description",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "HIDDEN",
        basePoints: 100,
        autoApprove: false,
      });
    });

    it("rolls back challenge update and activity feed on transaction failure", async () => {
      const challengeBefore = await testDb.db
        .select()
        .from(challenges)
        .where(eq(challenges.id, "challenge-1"));
      expect(challengeBefore[0].name).toBe("Original Challenge");
      expect(challengeBefore[0].status).toBe("HIDDEN");

      try {
        await testDb.db.transaction(async (tx) => {
          await tx
            .update(challenges)
            .set({ name: "Updated Challenge", status: "ACTIVE" })
            .where(eq(challenges.id, "challenge-1"));

          await tx.insert(activityFeeds).values({
            id: "activity-1",
            tripId: "trip-1",
            activityType: "challenge_event",
            title: "Czas start!",
            description: "Challenge started",
            imageUrl: "",
            createdByAdmin: "admin-1",
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(challengeActivities).values({
            activityId: "activity-1",
            challengeId: "challenge-1",
            eventType: "challenge_started",
            basePoints: 100,
          });

          throw new Error("Simulated failure after challenge update");
        });
      } catch {
        // Expected rollback
      }

      const challengeAfter = await testDb.db
        .select()
        .from(challenges)
        .where(eq(challenges.id, "challenge-1"));
      expect(challengeAfter[0].name).toBe("Original Challenge");
      expect(challengeAfter[0].status).toBe("HIDDEN");

      const activityCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(activityFeeds);
      expect(activityCountAfter[0].count).toBe(0);

      const challengeActivityCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challengeActivities);
      expect(challengeActivityCountAfter[0].count).toBe(0);
    });

    it("rolls back recurring instance precreation on update failure", async () => {
      await testDb.db
        .update(challengeRecurrence)
        .set({
          isRecurring: true,
          dailyStartTime: "09:00",
          dailyEndTime: "18:00",
          recurringDays: 7,
        })
        .where(eq(challengeRecurrence.challengeId, "challenge-1"));

      await testDb.db
        .update(challenges)
        .set({
          startTime: now(),
          endTime: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000),
        })
        .where(eq(challenges.id, "challenge-1"));

      const challengeCountBefore = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challenges);
      expect(challengeCountBefore[0].count).toBe(1);

      try {
        await testDb.db.transaction(async (tx) => {
          await tx
            .update(challenges)
            .set({ name: "Updated Recurring Challenge" })
            .where(eq(challenges.id, "challenge-1"));

          await tx.insert(challenges).values({
            id: "challenge-instance-1",
            tripId: "trip-1",
            name: "Updated Recurring Challenge #1",
            description: "Updated description",
            submissionType: "IMAGE",
            scoringCategory: "SPEED",
            status: "VISIBLE",
            basePoints: 100,
            autoApprove: false,
            startTime: now(),
            endTime: new Date(now().getTime() + 24 * 60 * 60 * 1000),
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(challengeRecurrence).values({
            challengeId: "challenge-instance-1",
            isRecurring: false,
            dailyStartTime: "",
            dailyEndTime: "",
            recurringDays: 0,
            type: "DAILY",
          });

          await tx.insert(challengeLocation).values({
            challengeId: "challenge-instance-1",
            targetLatitude: 0,
            targetLongitude: 0,
          });

          throw new Error("Simulated failure after recurring update");
        });
      } catch {
        // Expected rollback
      }

      const challengeCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challenges);
      expect(challengeCountAfter[0].count).toBe(1);

      const challengeAfter = await testDb.db
        .select()
        .from(challenges)
        .where(eq(challenges.id, "challenge-1"));
      expect(challengeAfter[0].name).toBe("Original Challenge");
    });
  });

  describe("forceCloseVoting", () => {
    beforeEach(async () => {
      await seedUser("admin-1", "auth-admin-1", "Admin", "User");
      await seedTrip("trip-1", "Test Trip");
      await seedGroup("group-1", "trip-1", "Test Group", "admin-1", "1234");
      await seedGroup("group-2", "trip-1", "Group 2", "admin-1", "5678");

      await seedChallenge("challenge-1", "trip-1", {
        name: "Voting Challenge",
        description: "A peer voting challenge",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
        basePoints: 100,
        autoApprove: false,
        votingStartTime: new Date(now().getTime() - 24 * 60 * 60 * 1000),
        votingEndTime: new Date(now().getTime() + 24 * 60 * 60 * 1000),
      });

      await testDb.db.insert(challengeSubmissions).values({
        id: "submission-1",
        challengeId: "challenge-1",
        groupId: "group-1",
        imageIds: [],
        status: "APPROVED",
        awardedPoints: 0,
        voteCount: 5,
        voteScore: 4.5,
        createdAt: now(),
        updatedAt: now(),
      });

      await testDb.db.insert(challengeSubmissions).values({
        id: "submission-2",
        challengeId: "challenge-1",
        groupId: "group-2",
        imageIds: [],
        status: "APPROVED",
        awardedPoints: 0,
        voteCount: 3,
        voteScore: 3.0,
        createdAt: now(),
        updatedAt: now(),
      });
    });

    it("rolls back challenge status update and completion activities on transaction failure", async () => {
      const challengeBefore = await testDb.db
        .select()
        .from(challenges)
        .where(eq(challenges.id, "challenge-1"));
      expect(challengeBefore[0].status).toBe("VOTING_PHASE");

      const groupCoinsBefore = await testDb.db
        .select()
        .from(groups)
        .where(eq(groups.id, "group-1"));
      expect(groupCoinsBefore[0].coins).toBe(0);

      try {
        await testDb.db.transaction(async (tx) => {
          await tx
            .update(challenges)
            .set({ status: "COMPLETED", votingEndTime: now() })
            .where(eq(challenges.id, "challenge-1"));

          await tx
            .update(challengeSubmissions)
            .set({ ranking: 1, awardedPoints: 100 })
            .where(eq(challengeSubmissions.id, "submission-1"));

          await tx
            .update(groups)
            .set({ coins: sql`${groups.coins} + 100` })
            .where(eq(groups.id, "group-1"));

          await tx.insert(coinTransactions).values({
            id: "coin-tx-1",
            groupId: "group-1",
            amount: 100,
            reason: "Peer voting result: Voting Challenge (#1)",
            adminId: "admin-1",
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(activityFeeds).values({
            id: "activity-1",
            tripId: "trip-1",
            activityType: "challenge_event",
            title: "Czas start!",
            description: "Challenge started",
            imageUrl: "",
            createdByAdmin: "admin-1",
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(challengeActivities).values({
            activityId: "activity-1",
            challengeId: "challenge-1",
            eventType: "completed",
            submissionCount: 2,
          });

          await tx.insert(activityFeeds).values({
            id: "activity-2",
            tripId: "trip-1",
            activityType: "submission",
            title: "#1 place: Test Group",
            description: "Challenge: Voting Challenge | Votes: 5 | Score: 4.50 | Points: +100",
            imageUrl: "",
            createdByAdmin: "admin-1",
            createdAt: now(),
            updatedAt: now(),
          });

          await tx.insert(submissionActivities).values({
            activityId: "activity-2",
            submissionId: "submission-1",
            challengeId: "challenge-1",
            groupId: "group-1",
            hasVideo: false,
            isWinner: true,
            ranking: 1,
            pointsAwarded: 100,
          });

          throw new Error("Simulated failure after force close voting");
        });
      } catch {
        // Expected rollback
      }

      const challengeAfter = await testDb.db
        .select()
        .from(challenges)
        .where(eq(challenges.id, "challenge-1"));
      expect(challengeAfter[0].status).toBe("VOTING_PHASE");
      expect(challengeAfter[0].votingEndTime).toEqual(challengeBefore[0].votingEndTime);

      const submissionAfter = await testDb.db
        .select()
        .from(challengeSubmissions)
        .where(eq(challengeSubmissions.id, "submission-1"));
      expect(submissionAfter[0].ranking).toBeNull();
      expect(submissionAfter[0].awardedPoints).toBe(0);

      const groupCoinsAfter = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
      expect(groupCoinsAfter[0].coins).toBe(0);

      const coinTxCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(coinTransactions);
      expect(coinTxCountAfter[0].count).toBe(0);

      const activityCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(activityFeeds);
      expect(activityCountAfter[0].count).toBe(0);

      const challengeActivityCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(challengeActivities);
      expect(challengeActivityCountAfter[0].count).toBe(0);

      const submissionActivityCountAfter = await testDb.db
        .select({ count: sql<number>`count(*)` })
        .from(submissionActivities);
      expect(submissionActivityCountAfter[0].count).toBe(0);
    });
  });
});

describe("challenge router — Drizzle ORM PGLite integration", () => {
  it("inserts challenge and activity feed via Drizzle ORM transaction", async () => {
    await seedUser("admin-1", "auth-admin-1", "Admin", "User");
    await seedTrip("trip-1", "Test Trip");

    await testDb.db.transaction(async (tx) => {
      await tx.insert(challenges).values({
        id: "challenge-1",
        tripId: "trip-1",
        name: "Test Challenge",
        description: "",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "ACTIVE",
        basePoints: 100,
        autoApprove: false,
        createdAt: now(),
        updatedAt: now(),
      });

      await tx.insert(challengeRecurrence).values({
        challengeId: "challenge-1",
        isRecurring: false,
        dailyStartTime: "",
        dailyEndTime: "",
        recurringDays: 0,
        type: "DAILY",
      });

      await tx.insert(challengeLocation).values({
        challengeId: "challenge-1",
        targetLatitude: 0,
        targetLongitude: 0,
      });

      const activityResult = await tx
        .insert(activityFeeds)
        .values({
          id: "activity-1",
          tripId: "trip-1",
          activityType: "challenge_event",
          title: "Czas start!",
          description: "Challenge started",
          imageUrl: "",
          createdByAdmin: "admin-1",
          createdAt: now(),
          updatedAt: now(),
        })
        .returning();

      if (activityResult[0]) {
        await tx.insert(challengeActivities).values({
          activityId: activityResult[0].id,
          challengeId: "challenge-1",
          eventType: "challenge_started",
          basePoints: 100,
        });
      }
    });

    const challengesResult = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "challenge-1"));
    expect(challengesResult).toHaveLength(1);
    expect(challengesResult[0].name).toBe("Test Challenge");
    expect(challengesResult[0].status).toBe("ACTIVE");

    const activities = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.id, "activity-1"));
    expect(activities).toHaveLength(1);
    expect(activities[0].activityType).toBe("challenge_event");

    const challengeActivitiesResult = await testDb.db
      .select()
      .from(challengeActivities)
      .where(eq(challengeActivities.challengeId, "challenge-1"));
    expect(challengeActivitiesResult).toHaveLength(1);
    expect(challengeActivitiesResult[0].eventType).toBe("challenge_started");
  });

  it("updates challenge and inserts activity via Drizzle ORM transaction", async () => {
    await seedUser("admin-1", "auth-admin-1", "Admin", "User");
    await seedTrip("trip-1", "Test Trip");
    await seedChallenge("challenge-1", "trip-1", {
      name: "Original Challenge",
      description: "Original description",
      submissionType: "IMAGE",
      scoringCategory: "SPEED",
      status: "HIDDEN",
      basePoints: 100,
      autoApprove: false,
    });

    await testDb.db.transaction(async (tx) => {
      await tx
        .update(challenges)
        .set({ name: "Updated Challenge", status: "ACTIVE" })
        .where(eq(challenges.id, "challenge-1"));

      const activityResult = await tx
        .insert(activityFeeds)
        .values({
          id: "activity-1",
          tripId: "trip-1",
          activityType: "challenge_event",
          title: "Czas start!",
          description: "Challenge started",
          imageUrl: "",
          createdByAdmin: "admin-1",
          createdAt: now(),
          updatedAt: now(),
        })
        .returning();

      if (activityResult[0]) {
        await tx.insert(challengeActivities).values({
          activityId: activityResult[0].id,
          challengeId: "challenge-1",
          eventType: "challenge_started",
          basePoints: 100,
        });
      }
    });

    const challengesResult = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "challenge-1"));
    expect(challengesResult[0].name).toBe("Updated Challenge");
    expect(challengesResult[0].status).toBe("ACTIVE");

    const activities = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.id, "activity-1"));
    expect(activities).toHaveLength(1);
  });

  it("rolls back Drizzle ORM transaction on failure for challenge operations", async () => {
    await seedUser("admin-1", "auth-admin-1", "Admin", "User");
    await seedTrip("trip-1", "Test Trip");
    await seedChallenge("challenge-1", "trip-1", {
      name: "Original Challenge",
      description: "Original description",
      submissionType: "IMAGE",
      scoringCategory: "SPEED",
      status: "HIDDEN",
      basePoints: 100,
      autoApprove: false,
    });

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx
          .update(challenges)
          .set({ name: "Updated Challenge", status: "ACTIVE" })
          .where(eq(challenges.id, "challenge-1"));

        await tx.insert(activityFeeds).values({
          id: "activity-1",
          tripId: "trip-1",
          activityType: "challenge_event",
          title: "Czas start!",
          description: "Challenge started",
          imageUrl: "",
          createdByAdmin: "admin-1",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const challengesResult = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "challenge-1"));
    expect(challengesResult[0].name).toBe("Original Challenge");
    expect(challengesResult[0].status).toBe("HIDDEN");

    const activities = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.id, "activity-1"));
    expect(activities).toHaveLength(0);
  });
});
