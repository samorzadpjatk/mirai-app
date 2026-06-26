import {
  challengeLocationMatch,
  challengeRecurrence,
  challengeSubmissions,
  challenges,
  challengeVotes,
  groups,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  ensureChallengeVoting,
  ensureTripParticipant,
  getChallengeInTrip,
  getJudgedStaffVotingProgress,
  maybeFinalizeJudgedStaffVoting,
  recomputeSubmissionVotes,
  validateJudgedStaffVotePayload,
} from "../utils";

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

async function seedTrip(id: string, name: string) {
  await testDb.db.insert(trips).values({
    id,
    name,
    description: "",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-07"),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedUser(id: string, role: string, firstName = "Test", lastName = "User") {
  await testDb.db.insert(users).values({
    id,
    authUserId: `auth-${id}`,
    firstName,
    lastName,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedGroup(id: string, tripId: string, name: string, organizerId: string) {
  await testDb.db.insert(groups).values({
    id,
    tripId,
    name,
    description: "",
    organizerId,
    code: `CODE-${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
  await testDb.db.insert(tripParticipants).values({
    id,
    userId,
    tripId,
    groupId,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    expectedValue?: string;
  } = {},
) {
  await testDb.db.insert(challenges).values({
    id,
    tripId,
    name: "Test Challenge",
    description: "",
    submissionType: "IMAGE",
    scoringCategory: "PEER_VOTING",
    basePoints: 100,
    firstPlacePoints: 300,
    secondPlacePoints: 200,
    thirdPlacePoints: 150,
    status: "ACTIVE",
    endTime: new Date("2025-12-31T23:59:59Z"),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  await testDb.db.insert(challengeRecurrence).values({
    challengeId: id,
    isRecurring: overrides.isRecurring ?? false,
    dailyStartTime: overrides.dailyStartTime ?? "",
    dailyEndTime: overrides.dailyEndTime ?? "",
    recurringDays: overrides.recurringDays ?? 0,
    type: "DAILY",
  });

  await testDb.db.insert(challengeLocationMatch).values({
    challengeId: id,
    targetLatitude: overrides.targetLatitude ?? 0,
    targetLongitude: overrides.targetLongitude ?? 0,
    expectedValue: overrides.expectedValue ?? "",
  });
}

async function seedSubmission(
  id: string,
  challengeId: string,
  groupId: string,
  overrides: Partial<typeof challengeSubmissions.$inferInsert> = {},
) {
  await testDb.db.insert(challengeSubmissions).values({
    id,
    challengeId,
    groupId,
    status: "APPROVED",
    voteCount: 0,
    voteScore: 0,
    awardedPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

async function seedVote(
  id: string,
  challengeId: string,
  submissionId: string,
  voterId: string,
  votePosition: number,
  votePoints: number,
) {
  await testDb.db.insert(challengeVotes).values({
    id,
    challengeId,
    submissionId,
    voterId,
    votePosition,
    votePoints,
    normalizedWeight: 1,
    votedAt: new Date(),
  });
}

describe("challengeVote utils", () => {
  describe("ensureTripParticipant", () => {
    it("returns participant when user is a trip member", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedParticipant("tp-1", "user-1", "trip-1");

      const result = await ensureTripParticipant(
        { db: testDb.db, dbUser: { id: "user-1" } },
        "trip-1",
      );

      expect(result).toBeDefined();
      expect(result.id).toBe("tp-1");
    });

    it("throws FORBIDDEN when user is not a trip member", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");

      await expect(
        ensureTripParticipant({ db: testDb.db, dbUser: { id: "user-1" } }, "trip-1"),
      ).rejects.toThrow(ORPCError);
      await expect(
        ensureTripParticipant({ db: testDb.db, dbUser: { id: "user-1" } }, "trip-1"),
      ).rejects.toThrow("Brak dostepu do wyjazdu");
    });
  });

  describe("getChallengeInTrip", () => {
    it("returns challenge when it exists in trip", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedChallenge("challenge-1", "trip-1");

      const result = await getChallengeInTrip({ db: testDb.db }, "challenge-1", "trip-1");

      expect(result).toBeDefined();
      expect(result.id).toBe("challenge-1");
      expect(result.tripId).toBe("trip-1");
    });

    it("throws NOT_FOUND when challenge does not exist in trip", async () => {
      await seedTrip("trip-1", "Test Trip");

      await expect(getChallengeInTrip({ db: testDb.db }, "nonexistent", "trip-1")).rejects.toThrow(
        ORPCError,
      );
      await expect(getChallengeInTrip({ db: testDb.db }, "nonexistent", "trip-1")).rejects.toThrow(
        "Challenge not found",
      );
    });
  });

  describe("ensureChallengeVoting", () => {
    it("allows voting for PEER_VOTING in VOTING_PHASE", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "VOTING_PHASE",
            scoringCategory: "PEER_VOTING",
            endTime: new Date(),
          },
          actorRole: "USER",
        }),
      ).not.toThrow();
    });

    it("throws BAD_REQUEST for PEER_VOTING not in VOTING_PHASE", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "ACTIVE",
            scoringCategory: "PEER_VOTING",
            endTime: new Date(),
          },
          actorRole: "USER",
        }),
      ).toThrow("Glosowanie nie jest aktywne");
    });

    it("throws BAD_REQUEST for non-voting scoring categories", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "ACTIVE",
            scoringCategory: "SPEED",
            endTime: new Date(),
          },
          actorRole: "ADMIN",
        }),
      ).toThrow("Voting is available only for peer voting and judged staff challenges");
    });

    it("throws FORBIDDEN for non-admin voting on JUDGED_STAFF", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "ACTIVE",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(),
          },
          actorRole: "USER",
        }),
      ).toThrow("Only admins can vote in judged staff challenges");
    });

    it("throws BAD_REQUEST for JUDGED_STAFF when challenge is CANCELLED", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "CANCELLED",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(),
          },
          actorRole: "ADMIN",
        }),
      ).toThrow("Glosowanie zostalo zakonczone");
    });

    it("throws BAD_REQUEST for JUDGED_STAFF when challenge is COMPLETED", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "COMPLETED",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(),
          },
          actorRole: "ADMIN",
        }),
      ).toThrow("Glosowanie zostalo zakonczone");
    });

    it("throws BAD_REQUEST for JUDGED_STAFF when endTime is missing", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "ACTIVE",
            scoringCategory: "JUDGED_STAFF",
            endTime: null,
          },
          actorRole: "ADMIN",
        }),
      ).toThrow("Staff voting requires submission end time");
    });

    it("throws BAD_REQUEST for JUDGED_STAFF when endTime is in the future", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "ACTIVE",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(Date.now() + 3600000),
          },
          actorRole: "ADMIN",
        }),
      ).toThrow("Staff voting starts after submission phase ends");
    });

    it("allows JUDGED_STAFF voting when challenge is ACTIVE and endTime has passed", () => {
      expect(() =>
        ensureChallengeVoting({
          challenge: {
            id: "c1",
            tripId: "t1",
            status: "ACTIVE",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(Date.now() - 3600000),
          },
          actorRole: "ADMIN",
        }),
      ).not.toThrow();
    });
  });

  describe("recomputeSubmissionVotes", () => {
    it("updates vote count and score based on votes", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedChallenge("challenge-1", "trip-1");
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
      await seedVote("vote-1", "challenge-1", "sub-1", "tp-1", 1, 10);

      await recomputeSubmissionVotes({ db: testDb.db }, "challenge-1");

      const updated = await testDb.db.query.challengeSubmissions.findFirst({
        where: (cs, { eq }) => eq(cs.id, "sub-1"),
      });

      expect(updated?.voteCount).toBe(1);
      expect(updated?.voteScore).toBe(10);
    });

    it("sets vote count and score to zero when no votes", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedChallenge("challenge-1", "trip-1");
      await seedSubmission("sub-1", "challenge-1", "group-1", {
        voteCount: 5,
        voteScore: 25,
      });

      await recomputeSubmissionVotes({ db: testDb.db }, "challenge-1");

      const updated = await testDb.db.query.challengeSubmissions.findFirst({
        where: (cs, { eq }) => eq(cs.id, "sub-1"),
      });

      expect(updated?.voteCount).toBe(0);
      expect(updated?.voteScore).toBe(0);
    });
  });

  describe("getJudgedStaffVotingProgress", () => {
    it("returns zero admins when no admins in trip", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedParticipant("tp-1", "user-1", "trip-1", "group-1");

      const result = await getJudgedStaffVotingProgress(
        { db: testDb.db },
        { challengeId: "challenge-1", tripId: "trip-1" },
      );

      expect(result.totalAdmins).toBe(0);
      expect(result.votedAdmins).toBe(0);
      expect(result.allAdminsVoted).toBe(false);
    });

    it("returns correct progress when some admins have voted", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("admin-1", "ADMIN");
      await seedUser("admin-2", "ADMIN");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "admin-1");
      await seedGroup("group-2", "trip-1", "Team B", "admin-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedSubmission("sub-2", "challenge-1", "group-2");
      await seedParticipant("tp-a1", "admin-1", "trip-1", "group-1");
      await seedParticipant("tp-a2", "admin-2", "trip-1", "group-1");
      await seedParticipant("tp-u1", "user-1", "trip-1", "group-1");
      await seedVote("vote-1", "challenge-1", "sub-1", "tp-a1", 1, 10);
      await seedVote("vote-2", "challenge-1", "sub-2", "tp-a1", 2, 5);

      const result = await getJudgedStaffVotingProgress(
        { db: testDb.db },
        { challengeId: "challenge-1", tripId: "trip-1" },
      );

      expect(result.totalAdmins).toBe(2);
      expect(result.votedAdmins).toBe(1);
      expect(result.pendingAdmins).toBe(1);
      expect(result.allAdminsVoted).toBe(false);
      expect(result.requiredPositions).toBe(2);
    });

    it("returns allAdminsVoted=true when all admins voted", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("admin-1", "ADMIN");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "admin-1");
      await seedGroup("group-2", "trip-1", "Team B", "admin-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedSubmission("sub-2", "challenge-1", "group-2");
      await seedParticipant("tp-a1", "admin-1", "trip-1", "group-1");
      await seedParticipant("tp-u1", "user-1", "trip-1", "group-1");
      await seedVote("vote-1", "challenge-1", "sub-1", "tp-a1", 1, 10);
      await seedVote("vote-2", "challenge-1", "sub-2", "tp-a1", 2, 5);

      const result = await getJudgedStaffVotingProgress(
        { db: testDb.db },
        { challengeId: "challenge-1", tripId: "trip-1" },
      );

      expect(result.totalAdmins).toBe(1);
      expect(result.votedAdmins).toBe(1);
      expect(result.allAdminsVoted).toBe(true);
    });
  });

  describe("maybeFinalizeJudgedStaffVoting", () => {
    it("does not finalize non-JUDGED_STAFF challenges", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "PEER_VOTING",
      });

      const result = await maybeFinalizeJudgedStaffVoting(
        { db: testDb.db },
        {
          challenge: {
            id: "challenge-1",
            tripId: "trip-1",
            status: "VOTING_PHASE",
            scoringCategory: "PEER_VOTING",
            endTime: new Date(),
          },
          createdByAdminId: "admin-1",
        },
      );

      expect(result.finalized).toBe(false);
      expect(result.progress).toBeNull();
    });

    it("does not finalize when not all admins voted", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("admin-1", "ADMIN");
      await seedUser("admin-2", "ADMIN");
      await seedGroup("group-1", "trip-1", "Team A", "admin-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedParticipant("tp-a1", "admin-1", "trip-1", "group-1");
      await seedParticipant("tp-a2", "admin-2", "trip-1", "group-1");
      await seedVote("vote-1", "challenge-1", "sub-1", "tp-a1", 1, 10);

      const result = await maybeFinalizeJudgedStaffVoting(
        { db: testDb.db },
        {
          challenge: {
            id: "challenge-1",
            tripId: "trip-1",
            status: "ACTIVE",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(),
          },
          createdByAdminId: "admin-1",
        },
      );

      expect(result.finalized).toBe(false);
      expect(result.progress?.allAdminsVoted).toBe(false);
    });

    it("finalizes when all admins voted", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("admin-1", "ADMIN");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "admin-1");
      await seedGroup("group-2", "trip-1", "Team B", "admin-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedSubmission("sub-2", "challenge-1", "group-2");
      await seedParticipant("tp-a1", "admin-1", "trip-1", "group-1");
      await seedParticipant("tp-u1", "user-1", "trip-1", "group-1");
      await seedVote("vote-1", "challenge-1", "sub-1", "tp-a1", 1, 10);
      await seedVote("vote-2", "challenge-1", "sub-2", "tp-a1", 2, 5);

      const result = await maybeFinalizeJudgedStaffVoting(
        { db: testDb.db },
        {
          challenge: {
            id: "challenge-1",
            tripId: "trip-1",
            status: "ACTIVE",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(),
          },
          createdByAdminId: "admin-1",
        },
      );

      expect(result.finalized).toBe(true);
      expect(result.progress?.allAdminsVoted).toBe(true);

      const updated = await testDb.db.query.challenges.findFirst({
        where: (c, { eq }) => eq(c.id, "challenge-1"),
      });
      expect(updated?.status).toBe("COMPLETED");
    });

    it("does not finalize when challenge status is not ACTIVE or VOTING_PHASE", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("admin-1", "ADMIN");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "admin-1");
      await seedGroup("group-2", "trip-1", "Team B", "admin-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
        status: "COMPLETED",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedSubmission("sub-2", "challenge-1", "group-2");
      await seedParticipant("tp-a1", "admin-1", "trip-1", "group-1");
      await seedParticipant("tp-u1", "user-1", "trip-1", "group-1");
      await seedVote("vote-1", "challenge-1", "sub-1", "tp-a1", 1, 10);
      await seedVote("vote-2", "challenge-1", "sub-2", "tp-a1", 2, 5);

      const result = await maybeFinalizeJudgedStaffVoting(
        { db: testDb.db },
        {
          challenge: {
            id: "challenge-1",
            tripId: "trip-1",
            status: "COMPLETED",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(),
          },
          createdByAdminId: "admin-1",
        },
      );

      expect(result.progress?.allAdminsVoted).toBe(true);
      expect(result.finalized).toBe(false);
    });

    it("does not finalize when challenge status is CANCELLED", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("admin-1", "ADMIN");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "admin-1");
      await seedGroup("group-2", "trip-1", "Team B", "admin-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
        status: "CANCELLED",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedSubmission("sub-2", "challenge-1", "group-2");
      await seedParticipant("tp-a1", "admin-1", "trip-1", "group-1");
      await seedParticipant("tp-u1", "user-1", "trip-1", "group-1");
      await seedVote("vote-1", "challenge-1", "sub-1", "tp-a1", 1, 10);
      await seedVote("vote-2", "challenge-1", "sub-2", "tp-a1", 2, 5);

      const result = await maybeFinalizeJudgedStaffVoting(
        { db: testDb.db },
        {
          challenge: {
            id: "challenge-1",
            tripId: "trip-1",
            status: "CANCELLED",
            scoringCategory: "JUDGED_STAFF",
            endTime: new Date(),
          },
          createdByAdminId: "admin-1",
        },
      );

      expect(result.progress?.allAdminsVoted).toBe(true);
      expect(result.finalized).toBe(false);
    });
  });

  describe("validateJudgedStaffVotePayload", () => {
    it("throws BAD_REQUEST when less than 2 eligible submissions", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");

      await expect(
        validateJudgedStaffVotePayload(
          { db: testDb.db },
          { challengeId: "challenge-1", votePositions: [1], requireExactCount: true },
        ),
      ).rejects.toThrow("At least 2 eligible submissions are required for staff voting");
    });

    it("throws BAD_REQUEST when vote position exceeds required positions", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedGroup("group-2", "trip-1", "Team B", "user-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedSubmission("sub-2", "challenge-1", "group-2");

      await expect(
        validateJudgedStaffVotePayload(
          { db: testDb.db },
          { challengeId: "challenge-1", votePositions: [1, 2, 3], requireExactCount: false },
        ),
      ).rejects.toThrow("Staff voting accepts only positions 1-2");
    });

    it("throws BAD_REQUEST when requireExactCount and vote count does not match", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedGroup("group-2", "trip-1", "Team B", "user-1");
      await seedGroup("group-3", "trip-1", "Team C", "user-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedSubmission("sub-2", "challenge-1", "group-2");
      await seedSubmission("sub-3", "challenge-1", "group-3");

      await expect(
        validateJudgedStaffVotePayload(
          { db: testDb.db },
          { challengeId: "challenge-1", votePositions: [1], requireExactCount: true },
        ),
      ).rejects.toThrow("Staff voting requires exactly 3 votes");
    });

    it("returns requiredPositions for valid payload", async () => {
      await seedTrip("trip-1", "Test Trip");
      await seedUser("user-1", "USER");
      await seedGroup("group-1", "trip-1", "Team A", "user-1");
      await seedGroup("group-2", "trip-1", "Team B", "user-1");
      await seedGroup("group-3", "trip-1", "Team C", "user-1");
      await seedChallenge("challenge-1", "trip-1", {
        scoringCategory: "JUDGED_STAFF",
      });
      await seedSubmission("sub-1", "challenge-1", "group-1");
      await seedSubmission("sub-2", "challenge-1", "group-2");
      await seedSubmission("sub-3", "challenge-1", "group-3");

      const result = await validateJudgedStaffVotePayload(
        { db: testDb.db },
        { challengeId: "challenge-1", votePositions: [1, 2, 3], requireExactCount: true },
      );

      expect(result.requiredPositions).toBe(3);
    });
  });
});
