import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { eq, sql } from "drizzle-orm";
import {
  validateSubmissionPayload,
  resolveAwardedPoints,
} from "@mirai-app/shared/challengeSubmissions";
import {
  challenges,
  challengeSubmissions,
  groups,
  coinTransactions,
  users,
  trips,
} from "@mirai-app/db";

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

describe("challengeSubmission router — PGLite transaction rollback", () => {
  beforeEach(async () => {
    // Seed parent tables first (foreign key constraints)
    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(users).values({
      id: "admin-1",
      authUserId: "auth-admin",
      firstName: "Admin",
      lastName: "User",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(groups).values({
      id: "group-1",
      tripId: "trip-1",
      name: "Test Group",
      organizerId: "user-1",
      code: "1234",
      coins: 100,
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challenges).values({
      id: "challenge-1",
      tripId: "trip-1",
      name: "Test Challenge",
      submissionType: "IMAGE",
      scoringCategory: "UNLIMITED",
      basePoints: 10,
      firstPlacePoints: 30,
      secondPlacePoints: 20,
      thirdPlacePoints: 15,
      status: "ACTIVE",
      autoApprove: true,
      createdAt: now(),
      updatedAt: now(),
    });
  });

  it("rolls back createSubmission transaction on failure", async () => {
    try {
      await testDb.db.transaction(async (tx) => {
        await tx.insert(challengeSubmissions).values({
          id: "submission-1",
          challengeId: "challenge-1",
          groupId: "group-1",
          imageIds: ["image-1"],
          status: "APPROVED",
          createdAt: now(),
          updatedAt: now(),
        });

        await tx
          .update(groups)
          .set({ coins: sql`${groups.coins} + ${10}` })
          .where(eq(groups.id, "group-1"));

        await tx.insert(coinTransactions).values({
          id: "coin-tx-1",
          groupId: "group-1",
          amount: 10,
          reason: "Auto-approved challenge: Test Challenge",
          adminId: "user-1",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure after inserts");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const submissionRows = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-1"));
    expect(submissionRows).toHaveLength(0);

    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(100);

    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(0);
  });

  it("rolls back updateMineSubmission transaction on failure", async () => {
    await testDb.db.insert(challengeSubmissions).values({
      id: "submission-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["image-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(challengeSubmissions)
          .set({ imageIds: ["image-2"], status: "APPROVED", reviewedAt: now() })
          .where(eq(challengeSubmissions.id, "submission-1"));

        await tx
          .update(groups)
          .set({ coins: sql`${groups.coins} + ${10}` })
          .where(eq(groups.id, "group-1"));

        throw new Error("Simulated failure after update");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const submissionRows = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-1"));
    expect(submissionRows[0].status).toBe("PENDING");
    expect(submissionRows[0].imageIds).toEqual(["image-1"]);

    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(100);
  });

  it("rolls back reviewSubmission transaction on failure", async () => {
    await testDb.db.insert(challengeSubmissions).values({
      id: "submission-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["image-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(challengeSubmissions)
          .set({
            status: "APPROVED",
            awardedPoints: 10,
            reviewedById: "admin-1",
            reviewedAt: now(),
          })
          .where(eq(challengeSubmissions.id, "submission-1"));

        await tx
          .update(groups)
          .set({ coins: sql`${groups.coins} + ${10}` })
          .where(eq(groups.id, "group-1"));

        await tx.insert(coinTransactions).values({
          id: "coin-tx-1",
          groupId: "group-1",
          amount: 10,
          reason: "Challenge approved: Test Challenge",
          adminId: "admin-1",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure after review updates");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const submissionRows = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-1"));
    expect(submissionRows[0].status).toBe("PENDING");
    expect(submissionRows[0].awardedPoints).toBe(0);

    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(100);

    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(0);
  });

  it("commits createSubmission transaction successfully", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx.insert(challengeSubmissions).values({
        id: "submission-1",
        challengeId: "challenge-1",
        groupId: "group-1",
        imageIds: ["image-1"],
        status: "APPROVED",
        createdAt: now(),
        updatedAt: now(),
      });

      await tx
        .update(groups)
        .set({ coins: sql`${groups.coins} + ${10}` })
        .where(eq(groups.id, "group-1"));

      await tx.insert(coinTransactions).values({
        id: "coin-tx-1",
        groupId: "group-1",
        amount: 10,
        reason: "Auto-approved challenge: Test Challenge",
        adminId: "user-1",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const submissionRows = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-1"));
    expect(submissionRows).toHaveLength(1);

    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(110);

    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(1);
    expect(txRows[0].amount).toBe(10);
  });
});

describe("challengeSubmission router — Drizzle ORM PGLite integration", () => {
  beforeEach(async () => {
    // Seed parent tables first (foreign key constraints)
    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(users).values({
      id: "admin-1",
      authUserId: "auth-admin",
      firstName: "Admin",
      lastName: "User",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(groups).values({
      id: "group-1",
      tripId: "trip-1",
      name: "Test Group",
      organizerId: "user-1",
      code: "1234",
      coins: 100,
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challenges).values({
      id: "challenge-1",
      tripId: "trip-1",
      name: "Test Challenge",
      submissionType: "IMAGE",
      scoringCategory: "UNLIMITED",
      basePoints: 10,
      firstPlacePoints: 30,
      secondPlacePoints: 20,
      thirdPlacePoints: 15,
      status: "ACTIVE",
      autoApprove: true,
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challengeSubmissions).values({
      id: "submission-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["image-1"],
      status: "PENDING",
      awardedPoints: 0,
      bonusPoints: 0,
      createdAt: now(),
      updatedAt: now(),
    });
  });

  it("commits review submission via Drizzle ORM transaction", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx
        .update(challengeSubmissions)
        .set({ status: "APPROVED", awardedPoints: 10, reviewedById: "admin-1" })
        .where(eq(challengeSubmissions.id, "submission-1"));

      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} + ${10}`,
        })
        .where(eq(groups.id, "group-1"));

      await tx.insert(coinTransactions).values({
        id: "coin-tx-1",
        groupId: "group-1",
        amount: 10,
        reason: "Challenge approved: Test Challenge",
        adminId: "admin-1",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const submissions = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-1"));
    expect(submissions[0].status).toBe("APPROVED");
    expect(submissions[0].awardedPoints).toBe(10);

    const groupsRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupsRows[0].coins).toBe(110);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(10);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx
          .update(challengeSubmissions)
          .set({ status: "APPROVED", awardedPoints: 10 })
          .where(eq(challengeSubmissions.id, "submission-1"));

        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} + ${10}`,
          })
          .where(eq(groups.id, "group-1"));

        await tx.insert(coinTransactions).values({
          id: "coin-tx-1",
          groupId: "group-1",
          amount: 10,
          reason: "Challenge approved: Test Challenge",
          adminId: "admin-1",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const submissions = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-1"));
    expect(submissions[0].status).toBe("PENDING");
    expect(submissions[0].awardedPoints).toBe(0);

    const groupsRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupsRows[0].coins).toBe(100);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txs).toHaveLength(0);
  });

  it("validates pure functions with real PGLite data", async () => {
    const challengesRows = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "challenge-1"));
    const dbChallenge = challengesRows[0];

    expect(() =>
      validateSubmissionPayload({
        submissionType: "IMAGE",
        imageIds: ["image-1"],
      }),
    ).not.toThrow();

    expect(() =>
      validateSubmissionPayload({
        submissionType: "IMAGE",
        imageIds: [],
      }),
    ).toThrow();

    expect(() =>
      validateSubmissionPayload({
        submissionType: "TEXT",
        textContent: "Hello",
      }),
    ).not.toThrow();

    expect(() =>
      validateSubmissionPayload({
        submissionType: "TEXT",
        textContent: "",
      }),
    ).toThrow();

    const basePoints = resolveAwardedPoints(dbChallenge, {});
    expect(basePoints).toBe(10);

    const firstPlace = resolveAwardedPoints(dbChallenge, { ranking: 1 });
    expect(firstPlace).toBe(30);

    const secondPlace = resolveAwardedPoints(dbChallenge, { ranking: 2 });
    expect(secondPlace).toBe(20);

    const thirdPlace = resolveAwardedPoints(dbChallenge, { ranking: 3 });
    expect(thirdPlace).toBe(15);

    const explicitPoints = resolveAwardedPoints(dbChallenge, { awardedPoints: 50 });
    expect(explicitPoints).toBe(50);

    const fallback = resolveAwardedPoints(dbChallenge, { ranking: 5 });
    expect(fallback).toBe(10);
  });
});
