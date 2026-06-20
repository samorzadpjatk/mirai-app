import {
  challengeRecurrence,
  challengeSubmissions,
  challenges,
  coinTransactions,
  groups,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { ensureTripParticipant, rebalanceSpeedRankings } from "../challengeSubmission/utils";

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

describe("challengeSubmission utils — ensureTripParticipant", () => {
  it("throws FORBIDDEN when user is not a participant of the trip", async () => {
    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });

    await expect(
      ensureTripParticipant({ db: testDb.db, dbUser: { id: "user-1" } }, "trip-1"),
    ).rejects.toThrow("Brak dostepu do wyjazdu");
  });

  it("returns participant when user is a participant of the trip", async () => {
    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(tripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await ensureTripParticipant(
      { db: testDb.db, dbUser: { id: "user-1" } },
      "trip-1",
    );

    expect(result).toBeDefined();
    expect(result.userId).toBe("user-1");
  });
});

describe("challengeSubmission utils — rebalanceSpeedRankings", () => {
  async function seedSpeedChallenge() {
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
      name: "Speed Trip",
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(groups).values({
      id: "group-1",
      tripId: "trip-1",
      name: "Group 1",
      description: "",
      organizerId: "admin-1",
      code: "1111",
      coins: 50,
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(groups).values({
      id: "group-2",
      tripId: "trip-1",
      name: "Group 2",
      description: "",
      organizerId: "admin-1",
      code: "2222",
      coins: 50,
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challenges).values({
      id: "challenge-speed",
      tripId: "trip-1",
      name: "Speed Challenge",
      description: "",
      submissionType: "IMAGE",
      scoringCategory: "SPEED",
      basePoints: 10,
      firstPlacePoints: 30,
      secondPlacePoints: 20,
      thirdPlacePoints: 15,
      status: "ACTIVE",
      autoApprove: false,
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challengeRecurrence).values({
      challengeId: "challenge-speed",
      isRecurring: false,
      dailyStartTime: "",
      dailyEndTime: "",
      recurringDays: 0,
      type: "DAILY",
    });
  }

  async function seedApprovedSubmission(
    id: string,
    groupId: string,
    ranking: number,
    awardedPoints: number,
    bonusPoints = 0,
    createdAtOffset = 0,
  ) {
    await testDb.db.insert(challengeSubmissions).values({
      id,
      challengeId: "challenge-speed",
      groupId,
      imageIds: ["img-1"],
      status: "APPROVED",
      ranking,
      awardedPoints,
      bonusPoints,
      createdAt: new Date(Date.now() + createdAtOffset),
      updatedAt: now(),
    });
  }

  it("skips submissions that already have correct ranking and points (continue branch)", async () => {
    await seedSpeedChallenge();

    // Submission 1: earliest createdAt → ranking 1, awardedPoints 30 (firstPlacePoints)
    await seedApprovedSubmission("sub-1", "group-1", 1, 30, 0, 0);
    // Submission 2: later createdAt → ranking 2, awardedPoints 20 (secondPlacePoints)
    await seedApprovedSubmission("sub-2", "group-2", 2, 20, 0, 1000);

    const challenge = {
      id: "challenge-speed",
      name: "Speed Challenge",
      basePoints: 10,
      firstPlacePoints: 30,
      secondPlacePoints: 20,
      thirdPlacePoints: 15,
    };

    await rebalanceSpeedRankings({
      tx: testDb.db,
      challenge,
      adminId: "admin-1",
    });

    // Verify no changes — submissions keep their original ranking and points
    const submissions = await testDb.db.select().from(challengeSubmissions);

    expect(submissions).toHaveLength(2);
    const sub1 = submissions.find((s) => s.id === "sub-1");
    const sub2 = submissions.find((s) => s.id === "sub-2");
    expect(sub1?.ranking).toBe(1);
    expect(sub1?.awardedPoints).toBe(30);
    expect(sub2?.ranking).toBe(2);
    expect(sub2?.awardedPoints).toBe(20);

    // No coin transactions should have been created (delta was 0 for both)
    const coinTxRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(coinTxRows).toHaveLength(0);
  });

  it("updates submissions when ranking changes due to new order", async () => {
    await seedSpeedChallenge();

    // Seed with WRONG rankings — sub-1 has ranking 2 but should be 1 (earliest)
    await seedApprovedSubmission("sub-1", "group-1", 2, 20, 0, 0);
    await seedApprovedSubmission("sub-2", "group-2", 1, 30, 0, 1000);

    const challenge = {
      id: "challenge-speed",
      name: "Speed Challenge",
      basePoints: 10,
      firstPlacePoints: 30,
      secondPlacePoints: 20,
      thirdPlacePoints: 15,
    };

    await rebalanceSpeedRankings({
      tx: testDb.db,
      challenge,
      adminId: "admin-1",
    });

    // Verify rankings were corrected
    const submissions = await testDb.db.select().from(challengeSubmissions);

    const sub1 = submissions.find((s) => s.id === "sub-1");
    const sub2 = submissions.find((s) => s.id === "sub-2");
    expect(sub1?.ranking).toBe(1);
    expect(sub1?.awardedPoints).toBe(30);
    expect(sub2?.ranking).toBe(2);
    expect(sub2?.awardedPoints).toBe(20);
  });
});
