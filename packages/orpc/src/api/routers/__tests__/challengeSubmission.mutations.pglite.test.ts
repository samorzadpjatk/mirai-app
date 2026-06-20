import {
  challengeLocationMatch,
  challengeRecurrence,
  challengeSubmissions,
  challenges,
  coinTransactions,
  groups,
  trips,
  users,
} from "@mirai-app/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createMockSupabase } from "~/test-helpers";
import { reviewSubmission } from "../challengeSubmission/mutations";

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

async function seedBaseForReview() {
  await testDb.db.insert(users).values({
    id: "admin-1",
    authUserId: "auth-admin",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    createdAt: now(),
    updatedAt: now(),
  });

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
    endDate: new Date(Date.now() + 86400000 * 30),
    createdAt: now(),
    updatedAt: now(),
  });

  await testDb.db.insert(groups).values({
    id: "group-1",
    tripId: "trip-1",
    name: "Test Group",
    description: "",
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
    description: "",
    submissionType: "IMAGE",
    scoringCategory: "UNLIMITED",
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
    challengeId: "challenge-1",
    isRecurring: false,
    dailyStartTime: "",
    dailyEndTime: "",
    recurringDays: 0,
    type: "DAILY",
  });

  await testDb.db.insert(challengeLocationMatch).values({
    challengeId: "challenge-1",
    targetLatitude: 0,
    targetLongitude: 0,
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
}

describe("challengeSubmission mutations — reviewSubmission", () => {
  it("rejects submission with REJECTED status and sets bonusPoints to 0 (shouldAwardCoins=false branch)", async () => {
    await seedBaseForReview();

    const result = await reviewSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase({ "auth-admin": "admin@example.com" }),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      {
        id: "submission-1",
        status: "REJECTED",
        rejectionReason: "Bad quality",
      },
    );

    expect(result.status).toBe("REJECTED");
    expect(result.rejectionReason).toBe("Bad quality");
    expect(result.reviewedById).toBe("admin-1");

    // No coins should have been awarded (shouldAwardCoins was false)
    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(100);

    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(0);
  });

  it("throws BAD_REQUEST when rejecting without rejectionReason", async () => {
    await seedBaseForReview();

    await expect(
      reviewSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "admin-1", role: "ADMIN" },
        },
        {
          id: "submission-1",
          status: "REJECTED",
        },
      ),
    ).rejects.toThrow("Wymagany jest powód odrzucenia");
  });

  it("throws NOT_FOUND when submission does not exist", async () => {
    await seedBaseForReview();

    await expect(
      reviewSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "admin-1", role: "ADMIN" },
        },
        {
          id: "nonexistent-submission",
          status: "REJECTED",
          rejectionReason: "Bad",
        },
      ),
    ).rejects.toThrow("Zgłoszenie nie zostało znalezione");
  });

  it("throws BAD_REQUEST when reviewing JUDGED_STAFF challenge", async () => {
    await seedBaseForReview();

    // Update challenge scoring category to JUDGED_STAFF
    await testDb.db
      .update(challenges)
      .set({ scoringCategory: "JUDGED_STAFF" })
      .where(eq(challenges.id, "challenge-1"));

    await expect(
      reviewSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "admin-1", role: "ADMIN" },
        },
        {
          id: "submission-1",
          status: "REJECTED",
          rejectionReason: "Bad",
        },
      ),
    ).rejects.toThrow("For judged staff challenges use staff voting flow");
  });
});
