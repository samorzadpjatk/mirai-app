import {
  activityFeeds,
  challengeLocationMatch,
  challengeRecurrence,
  challengeSubmissions,
  challenges,
  coinTransactions,
  groups,
  submissionActivities,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createMockSupabase, seedGroup, seedParticipant, seedTrip, seedUser } from "~/test-helpers";
import {
  adminDeleteSubmission,
  createSubmission,
  deleteMineSubmission,
  reviewSubmission,
  updateMineSubmission,
} from "../mutations";
import {
  fetchMySubmissionForChallenge,
  fetchSubmissionById,
  fetchSubmissionsByChallenge,
  fetchSubmissionsByChallengeForParticipant,
} from "../queries";

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

// ─── Shared seeding helpers ───────────────────────────────────────────────

const now = () => new Date();

async function seedBaseTripWithGroupAndChallenge(params: {
  userId?: string;
  groupId?: string;
  challengeId?: string;
  challengeStatus?: string;
  challengeScoringCategory?: string;
  challengeSubmissionType?: string;
  challengeAutoApprove?: boolean;
  challengeEndTime?: Date | null;
  challengeStartTime?: Date | null;
  challengeVotingStartTime?: Date | null;
  challengeName?: string;
  challengeBasePoints?: number;
  challengeFirstPlacePoints?: number | null;
  challengeSecondPlacePoints?: number | null;
  challengeThirdPlacePoints?: number | null;
  groupCoins?: number;
}) {
  const userId = params.userId ?? "user-1";
  const groupId = params.groupId ?? "group-1";
  const challengeId = params.challengeId ?? "challenge-1";
  const tripId = "trip-1";

  await testDb.db.insert(users).values({
    id: userId,
    authUserId: `auth-${userId}`,
    firstName: "Test",
    lastName: "User",
    createdAt: now(),
    updatedAt: now(),
  });

  await testDb.db.insert(users).values({
    id: "admin-1",
    authUserId: "auth-admin-1",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    createdAt: now(),
    updatedAt: now(),
  });

  await seedTrip(testDb.db, tripId, "Test Trip");
  await seedGroup(testDb.db, groupId, tripId, "Test Group", userId, "1234");

  if (params.groupCoins !== undefined) {
    await testDb.db.update(groups).set({ coins: params.groupCoins }).where(eq(groups.id, groupId));
  }

  await seedParticipant(testDb.db, "tp-1", userId, tripId, groupId);

  await testDb.db.insert(challenges).values({
    id: challengeId,
    tripId,
    name: params.challengeName ?? "Test Challenge",
    description: "",
    submissionType: params.challengeSubmissionType ?? "IMAGE",
    scoringCategory: params.challengeScoringCategory ?? "UNLIMITED",
    basePoints: params.challengeBasePoints ?? 10,
    firstPlacePoints: params.challengeFirstPlacePoints ?? 30,
    secondPlacePoints: params.challengeSecondPlacePoints ?? 20,
    thirdPlacePoints: params.challengeThirdPlacePoints ?? 15,
    status: params.challengeStatus ?? "ACTIVE",
    autoApprove: params.challengeAutoApprove ?? false,
    startTime: params.challengeStartTime ?? null,
    endTime: params.challengeEndTime ?? null,
    votingStartTime: params.challengeVotingStartTime ?? null,
    createdAt: now(),
    updatedAt: now(),
  });

  await testDb.db.insert(challengeRecurrence).values({
    challengeId,
    isRecurring: false,
    dailyStartTime: "",
    dailyEndTime: "",
    recurringDays: 0,
    type: "DAILY",
  });

  await testDb.db.insert(challengeLocationMatch).values({
    challengeId,
    targetLatitude: 0,
    targetLongitude: 0,
  });
}

// ─── queries.ts branch coverage ───────────────────────────────────────────

describe("queries — fetchSubmissionsByChallenge", () => {
  it("returns submissions for a challenge", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await fetchSubmissionsByChallenge({
      context: {
        db: testDb.db,
        supabase: createMockSupabase({ "auth-admin-1": "admin@example.com" }),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      challengeId: "challenge-1",
      tripId: "trip-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("sub-1");
  });

  it("returns empty array when no submissions", async () => {
    await seedBaseTripWithGroupAndChallenge({});

    const result = await fetchSubmissionsByChallenge({
      context: {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      challengeId: "challenge-1",
      tripId: "trip-1",
    });

    expect(result).toHaveLength(0);
  });
});

describe("queries — fetchSubmissionsByChallengeForParticipant", () => {
  it("returns all data for ADMIN user (shouldHideUnapprovedMedia=false)", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await fetchSubmissionsByChallengeForParticipant({
      context: {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      challengeId: "challenge-1",
      tripId: "trip-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0].imageIds).toEqual(["img-1"]);
    expect(result[0].status).toBe("PENDING");
  });

  it("sanitises unapproved media for non-admin USER (shouldHideUnapprovedMedia=true)", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      videoId: "vid-1",
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await fetchSubmissionsByChallengeForParticipant({
      context: {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      challengeId: "challenge-1",
      tripId: "trip-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0].imageIds).toEqual([]);
    expect(result[0].videoId).toBeNull();
  });

  it("returns approved media unchanged for USER role", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "APPROVED",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await fetchSubmissionsByChallengeForParticipant({
      context: {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      challengeId: "challenge-1",
      tripId: "trip-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0].imageIds).toEqual(["img-1"]);
  });
});

describe("queries — fetchSubmissionById", () => {
  it("returns submission by id", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await fetchSubmissionById({
      context: {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      id: "sub-1",
      tripId: "trip-1",
    });

    expect(result.id).toBe("sub-1");
  });

  it("throws NOT_FOUND when submission does not exist", async () => {
    await seedBaseTripWithGroupAndChallenge({});

    await expect(
      fetchSubmissionById({
        context: {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        id: "nonexistent",
        tripId: "trip-1",
      }),
    ).rejects.toThrow("Submission not found");
  });
});

describe("queries — fetchMySubmissionForChallenge", () => {
  it("returns submission when participant has groupId and submission exists", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await fetchMySubmissionForChallenge({
      context: {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      challengeId: "challenge-1",
      tripId: "trip-1",
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe("sub-1");
  });

  it("returns null when participant has no groupId (branch: !participant.groupId)", async () => {
    const userId = "user-no-group2";
    await testDb.db.insert(users).values({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "No",
      lastName: "Group",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(users).values({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      createdAt: now(),
      updatedAt: now(),
    });

    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", userId, "trip-1");

    await testDb.db.insert(challenges).values({
      id: "challenge-1",
      tripId: "trip-1",
      name: "Test",
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

    const result = await fetchMySubmissionForChallenge({
      context: {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: userId, role: "USER" },
      },
      challengeId: "challenge-1",
      tripId: "trip-1",
    });

    expect(result).toBeNull();
  });

  it("returns null when no submission exists for this participant", async () => {
    await seedBaseTripWithGroupAndChallenge({});

    const result = await fetchMySubmissionForChallenge({
      context: {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      challengeId: "challenge-1",
      tripId: "trip-1",
    });

    expect(result).toBeNull();
  });
});

// ─── createSubmission branch coverage ─────────────────────────────────────

describe("createSubmission", () => {
  it("throws BAD_REQUEST when participant has no groupId", async () => {
    const userId = "user-no-group3";
    await testDb.db.insert(users).values({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "No",
      lastName: "Group",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(users).values({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      createdAt: now(),
      updatedAt: now(),
    });

    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", userId, "trip-1");

    await testDb.db.insert(challenges).values({
      id: "challenge-1",
      tripId: "trip-1",
      name: "Test",
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

    await expect(
      createSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: userId, role: "USER" },
        },
        {
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["img-1"],
        },
      ),
    ).rejects.toThrow("Użytkownik nie jest przypisany do grupy");
  });

  it("throws FORBIDDEN when challenge status is not ACTIVE", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeStatus: "VISIBLE",
    });

    await expect(
      createSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["img-1"],
        },
      ),
    ).rejects.toThrow("Submission is allowed only for active challenges");
  });

  it("throws FORBIDDEN when challenge endTime has passed", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeScoringCategory: "PEER_VOTING",
      challengeEndTime: new Date("2020-01-01"),
    });

    await expect(
      createSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["img-1"],
        },
      ),
    ).rejects.toThrow("Submission window has ended");
  });

  it("throws CONFLICT when existing submission for group+challenge", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "existing-sub",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-existing"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    await expect(
      createSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["img-1"],
        },
      ),
    ).rejects.toThrow("Zgłoszenie dla tej grupy już istnieje");
  });

  it("creates PENDING submission when autoApprove=false (manual review)", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeAutoApprove: false,
      groupCoins: 100,
    });

    const result = await createSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase({ "auth-user-1": "user@example.com" }),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        tripId: "trip-1",
        challengeId: "challenge-1",
        imageIds: ["img-1"],
      },
    );

    expect(result.status).toBe("PENDING");
    expect(result.reviewedAt).toBeNull();

    // No coins should be awarded
    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(100);

    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(0);
  });

  it("creates APPROVED submission with coin award when autoApprove=true and points > 0", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeAutoApprove: true,
      groupCoins: 50,
      challengeBasePoints: 10,
      challengeFirstPlacePoints: 30,
    });

    const result = await createSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase({ "auth-user-1": "user@example.com" }),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        tripId: "trip-1",
        challengeId: "challenge-1",
        imageIds: ["img-1"],
      },
    );

    expect(result.status).toBe("APPROVED");
    expect(result.reviewedAt).not.toBeNull();

    // Coins should be awarded (autoApproved && awardPoints > 0)
    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(60); // 50 + 10 base points

    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(1);
    expect(txRows[0].amount).toBe(10);
  });
});

// ─── updateMineSubmission branch coverage ─────────────────────────────────

describe("updateMineSubmission", () => {
  it("throws FORBIDDEN when submission is already APPROVED", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "APPROVED",
      createdAt: now(),
      updatedAt: now(),
    });

    await expect(
      updateMineSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "sub-1",
          tripId: "trip-1",
          imageIds: ["img-2"],
        },
      ),
    ).rejects.toThrow("Nie można edytować zatwierdzonego zgłoszenia");
  });

  it("throws NOT_FOUND when submission does not belong to trip", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    await expect(
      updateMineSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "nonexistent",
          tripId: "trip-1",
          imageIds: ["img-2"],
        },
      ),
    ).rejects.toThrow("Submission not found");
  });

  it("activates VISIBLE challenge when startTime is in the past", async () => {
    const past = new Date(Date.now() - 86400000);
    await seedBaseTripWithGroupAndChallenge({
      challengeStatus: "VISIBLE",
      challengeStartTime: past,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await updateMineSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        id: "sub-1",
        tripId: "trip-1",
        imageIds: ["img-2"],
      },
    );

    expect(result.status).toBe("PENDING");

    // Challenge should have been activated to ACTIVE
    const [updatedChallenge] = await testDb.db
      .select({ status: challenges.status })
      .from(challenges)
      .where(eq(challenges.id, "challenge-1"));
    expect(updatedChallenge.status).toBe("ACTIVE");
  });

  it("rejects update when challenge is VISIBLE and startTime is in the future (no activation)", async () => {
    const future = new Date(Date.now() + 86400000);
    await seedBaseTripWithGroupAndChallenge({
      challengeStatus: "VISIBLE",
      challengeStartTime: future,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    await expect(
      updateMineSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "sub-1",
          tripId: "trip-1",
          imageIds: ["img-2"],
        },
      ),
    ).rejects.toThrow("Submission is allowed only for active challenges");

    // Challenge stays VISIBLE (not activated)
    const [updatedChallenge] = await testDb.db
      .select({ status: challenges.status })
      .from(challenges)
      .where(eq(challenges.id, "challenge-1"));
    expect(updatedChallenge.status).toBe("VISIBLE");
  });

  it("throws FORBIDDEN when PEER_VOTING challenge endTime has passed", async () => {
    const past = new Date(Date.now() - 86400000);
    await seedBaseTripWithGroupAndChallenge({
      challengeScoringCategory: "PEER_VOTING",
      challengeStatus: "ACTIVE",
      challengeEndTime: past,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    await expect(
      updateMineSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "sub-1",
          tripId: "trip-1",
          imageIds: ["img-2"],
        },
      ),
    ).rejects.toThrow("Submission window has ended");
  });

  it("throws FORBIDDEN when status is not ACTIVE after activation attempts", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeStatus: "VISIBLE",
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    // Challenge is VISIBLE with no startTime -> stays VISIBLE
    // Then status !== "ACTIVE" -> FORBIDDEN
    await expect(
      updateMineSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "sub-1",
          tripId: "trip-1",
          imageIds: ["img-2"],
        },
      ),
    ).rejects.toThrow("Submission is allowed only for active challenges");
  });

  it("updates PENDING submission successfully (default path)", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeAutoApprove: false,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await updateMineSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        id: "sub-1",
        tripId: "trip-1",
        imageIds: ["img-2"],
        textContent: "updated text",
      },
    );

    expect(result.imageIds).toEqual(["img-2"]);
    expect(result.textContent).toBe("updated text");
  });

  it("updates and auto-approves when autoApprove=true", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeAutoApprove: true,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await updateMineSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        id: "sub-1",
        tripId: "trip-1",
        imageIds: ["img-2"],
      },
    );

    expect(result.status).toBe("APPROVED");
    expect(result.reviewedAt).not.toBeNull();
  });
});

// ─── deleteMineSubmission branch coverage ─────────────────────────────────

describe("deleteMineSubmission", () => {
  it("deletes PENDING submission successfully", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await deleteMineSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        id: "sub-1",
        tripId: "trip-1",
      },
    );

    expect(result.success).toBe(true);

    const remaining = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "sub-1"));
    expect(remaining).toHaveLength(0);
  });

  it("throws FORBIDDEN when submission is APPROVED", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "APPROVED",
      createdAt: now(),
      updatedAt: now(),
    });

    await expect(
      deleteMineSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "sub-1",
          tripId: "trip-1",
        },
      ),
    ).rejects.toThrow("Nie można usunąć zatwierdzonego zgłoszenia");
  });

  it("throws NOT_FOUND when submission does not exist", async () => {
    await seedBaseTripWithGroupAndChallenge({});

    await expect(
      deleteMineSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "nonexistent",
          tripId: "trip-1",
        },
      ),
    ).rejects.toThrow("Zgłoszenie nie zostało znalezione");
  });
});

// ─── reviewSubmission branch coverage ─────────────────────────────────────

describe("reviewSubmission", () => {
  it("rejects without rejectionReason -> BAD_REQUEST", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    await expect(
      reviewSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "admin-1", role: "ADMIN" },
        },
        {
          id: "sub-1",
          status: "REJECTED",
        },
      ),
    ).rejects.toThrow("Wymagany jest powód odrzucenia");
  });

  it("rejects with rejectionReason (rejection branch)", async () => {
    await seedBaseTripWithGroupAndChallenge({
      groupCoins: 100,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await reviewSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      {
        id: "sub-1",
        status: "REJECTED",
        rejectionReason: "Bad quality",
      },
    );

    expect(result.status).toBe("REJECTED");
    expect(result.rejectionReason).toBe("Bad quality");
    expect(result.reviewedById).toBe("admin-1");
  });

  it("throws NOT_FOUND when submission does not exist", async () => {
    await seedBaseTripWithGroupAndChallenge({});

    await expect(
      reviewSubmission(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "admin-1", role: "ADMIN" },
        },
        {
          id: "nonexistent",
          status: "APPROVED",
        },
      ),
    ).rejects.toThrow("Zgłoszenie nie zostało znalezione");
  });

  it("approves with awardedPoints -> coins awarded (shouldAwardCoins=true, totalAwardPoints > 0)", async () => {
    await seedBaseTripWithGroupAndChallenge({
      groupCoins: 50,
      challengeBasePoints: 10,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await reviewSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      {
        id: "sub-1",
        status: "APPROVED",
        awardedPoints: 15,
      },
    );

    expect(result.status).toBe("APPROVED");
    expect(result.awardedPoints).toBe(15);

    // Coins awarded
    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(65); // 50 + 15

    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(1);
  });

  it("approves TEXT submission -> shouldCreateApprovalActivity=false (no feed)", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeSubmissionType: "TEXT",
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      textContent: "my text",
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    await reviewSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      {
        id: "sub-1",
        status: "APPROVED",
        awardedPoints: 10,
      },
    );

    // No activity feed created for TEXT submission
    const feedRows = await testDb.db.select().from(activityFeeds);
    expect(feedRows).toHaveLength(0);
  });

  it("approves IMAGE submission -> creates feed activity (shouldCreateApprovalActivity=true, !existingSubmissionActivity)", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeSubmissionType: "IMAGE",
      groupCoins: 50,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await reviewSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      {
        id: "sub-1",
        status: "APPROVED",
        awardedPoints: 10,
        ranking: 1,
      },
    );

    expect(result.status).toBe("APPROVED");
    expect(result.ranking).toBe(1);

    // Feed activity should have been created
    const feedRows = await testDb.db.select().from(activityFeeds);
    expect(feedRows).toHaveLength(1);

    const actRows = await testDb.db.select().from(submissionActivities);
    expect(actRows).toHaveLength(1);
  });

  it("approves with existing submission activity -> skips feed creation", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeSubmissionType: "IMAGE",
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    // Pre-create a submission activity so existingSubmissionActivity is truthy
    const [feed] = await testDb.db
      .insert(activityFeeds)
      .values({
        tripId: "trip-1",
        activityType: "submission",
        title: "Existing feed",
        description: "pre-existing",
        imageUrl: "img-1",
        createdByAdmin: "admin-1",
      })
      .returning();
    await testDb.db.insert(submissionActivities).values({
      activityId: feed.id,
      submissionId: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      hasVideo: false,
      isWinner: false,
      ranking: 1,
      pointsAwarded: 5,
    });

    const result = await reviewSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      {
        id: "sub-1",
        status: "APPROVED",
        awardedPoints: 10,
        ranking: 1,
      },
    );

    expect(result.status).toBe("APPROVED");

    // No additional feed created (existingSubmissionActivity was truthy)
    const feedRows = await testDb.db.select().from(activityFeeds);
    expect(feedRows).toHaveLength(1);
  });

  it("approves SPEED challenge -> awardedPoints/ranking undefined for SPEED path", async () => {
    await seedBaseTripWithGroupAndChallenge({
      challengeScoringCategory: "SPEED",
      groupCoins: 50,
      challengeBasePoints: 10,
      challengeFirstPlacePoints: 30,
      challengeSecondPlacePoints: 20,
      challengeThirdPlacePoints: 15,
    });
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await reviewSubmission(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "admin-1", role: "ADMIN" },
      },
      {
        id: "sub-1",
        status: "APPROVED",
        ranking: 1,
      },
    );

    expect(result.status).toBe("APPROVED");

    expect(result.awardedPoints).toBe(30);
    expect(result.ranking).toBe(1);
  });
});

// ─── adminDeleteSubmission ────────────────────────────────────────────────

describe("adminDeleteSubmission", () => {
  it("deletes submission successfully", async () => {
    await seedBaseTripWithGroupAndChallenge({});
    await testDb.db.insert(challengeSubmissions).values({
      id: "sub-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      imageIds: ["img-1"],
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    const result = await adminDeleteSubmission(
      {
        db: testDb.db,
      },
      {
        id: "sub-1",
      },
    );

    expect(result.success).toBe(true);

    const remaining = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "sub-1"));
    expect(remaining).toHaveLength(0);
  });
});
