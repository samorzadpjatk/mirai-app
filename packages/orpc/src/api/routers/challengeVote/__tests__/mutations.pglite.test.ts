import {
  challengeLocationMatch,
  challengeRecurrence,
  challengeSubmissions,
  challenges,
  groups,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { forceEndJudgedStaffVoting, submitVote, submitVotes } from "../mutations";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

async function seedTrip(id: string) {
  await testDb.db.insert(trips).values({
    id,
    name: "Test Trip",
    description: "",
    startDate: new Date(Date.now() - DAY_MS),
    endDate: new Date(Date.now() + DAY_MS),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedUser(id: string, role: string) {
  await testDb.db.insert(users).values({
    id,
    authUserId: `auth-${id}`,
    firstName: "Test",
    lastName: id,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedGroup(id: string, tripId: string, organizerId: string) {
  await testDb.db.insert(groups).values({
    id,
    tripId,
    name: `Group ${id}`,
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
  overrides: Partial<typeof challenges.$inferInsert> = {},
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
    status: "VOTING_PHASE",
    endTime: new Date(Date.now() - HOUR_MS),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  await testDb.db.insert(challengeRecurrence).values({
    challengeId: id,
    isRecurring: false,
    dailyStartTime: "",
    dailyEndTime: "",
    recurringDays: 0,
    type: "DAILY",
  });

  await testDb.db.insert(challengeLocationMatch).values({
    challengeId: id,
    targetLatitude: 0,
    targetLongitude: 0,
    expectedValue: "",
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

/**
 * Seeds a trip with `groupCount` groups, one submission per group and one voter that
 * belongs to no group (so it can vote on everything).
 */
async function seedVotableChallenge(options: {
  groupCount: number;
  voterRole: string;
  challenge?: Partial<typeof challenges.$inferInsert>;
}) {
  await seedTrip("trip-1");
  await seedUser("organizer-1", "USER");
  await seedUser("voter-1", options.voterRole);
  await seedChallenge("challenge-1", "trip-1", options.challenge);

  for (let index = 1; index <= options.groupCount; index += 1) {
    await seedGroup(`group-${index}`, "trip-1", "organizer-1");
    await seedSubmission(`sub-${index}`, "challenge-1", `group-${index}`);
  }

  await seedParticipant("tp-voter-1", "voter-1", "trip-1");
}

const voterContext = (role = "USER") => ({
  db: testDb.db,
  dbUser: { id: "voter-1", role },
});

describe("challengeVote mutations", () => {
  describe("submitVote", () => {
    it("records a peer vote and recomputes the submission score", async () => {
      await seedVotableChallenge({ groupCount: 3, voterRole: "USER" });

      const vote = await submitVote(voterContext(), {
        tripId: "trip-1",
        challengeId: "challenge-1",
        submissionId: "sub-1",
        votePosition: 1,
        votePoints: 3,
      });

      expect(vote?.submissionId).toBe("sub-1");

      const submission = await testDb.db.query.challengeSubmissions.findFirst({
        where: (cs, { eq }) => eq(cs.id, "sub-1"),
      });
      expect(submission?.voteCount).toBe(1);
      expect(submission?.voteScore).toBe(3);
    });

    it("allows only one vote per user per submission", async () => {
      await seedVotableChallenge({
        groupCount: 3,
        voterRole: "ADMIN",
        challenge: { scoringCategory: "JUDGED_STAFF", status: "ACTIVE" },
      });

      await submitVote(voterContext("ADMIN"), {
        tripId: "trip-1",
        challengeId: "challenge-1",
        submissionId: "sub-1",
        votePosition: 1,
        votePoints: 3,
      });

      await expect(
        submitVote(voterContext("ADMIN"), {
          tripId: "trip-1",
          challengeId: "challenge-1",
          submissionId: "sub-1",
          votePosition: 2,
          votePoints: 2,
        }),
      ).rejects.toThrow(ORPCError);

      const votes = await testDb.db.query.challengeVotes.findMany({
        where: (cv, { eq }) => eq(cv.challengeId, "challenge-1"),
      });
      expect(votes).toHaveLength(1);
    });

    it("rejects a second peer vote in the same challenge", async () => {
      await seedVotableChallenge({ groupCount: 3, voterRole: "USER" });

      await submitVote(voterContext(), {
        tripId: "trip-1",
        challengeId: "challenge-1",
        submissionId: "sub-1",
        votePosition: 1,
        votePoints: 3,
      });

      await expect(
        submitVote(voterContext(), {
          tripId: "trip-1",
          challengeId: "challenge-1",
          submissionId: "sub-2",
          votePosition: 2,
          votePoints: 2,
        }),
      ).rejects.toThrow("Oddales juz glos w tym wyzwaniu");
    });

    it("rejects voting on the voter's own group", async () => {
      await seedVotableChallenge({ groupCount: 3, voterRole: "USER" });
      await testDb.db.delete(tripParticipants);
      await seedParticipant("tp-voter-1", "voter-1", "trip-1", "group-1");

      await expect(
        submitVote(voterContext(), {
          tripId: "trip-1",
          challengeId: "challenge-1",
          submissionId: "sub-1",
          votePosition: 1,
          votePoints: 3,
        }),
      ).rejects.toThrow("Nie mozna glosowac na wlasna grupe");
    });

    it("allows judged staff voting when the challenge has no end time", async () => {
      await seedVotableChallenge({
        groupCount: 3,
        voterRole: "ADMIN",
        challenge: { scoringCategory: "JUDGED_STAFF", status: "ACTIVE", endTime: null },
      });

      const vote = await submitVote(voterContext("ADMIN"), {
        tripId: "trip-1",
        challengeId: "challenge-1",
        submissionId: "sub-1",
        votePosition: 1,
        votePoints: 3,
      });

      expect(vote?.submissionId).toBe("sub-1");
    });
  });

  describe("submitVotes", () => {
    it("stores a complete podium in a single transaction", async () => {
      await seedVotableChallenge({ groupCount: 3, voterRole: "USER" });

      const votes = await submitVotes(voterContext(), {
        tripId: "trip-1",
        challengeId: "challenge-1",
        votes: [
          { submissionId: "sub-1", votePosition: 1, votePoints: 3 },
          { submissionId: "sub-2", votePosition: 2, votePoints: 2 },
          { submissionId: "sub-3", votePosition: 3, votePoints: 1 },
        ],
      });

      expect(votes.map((vote) => vote.submissionId)).toEqual(["sub-1", "sub-2", "sub-3"]);
      expect(votes.map((vote) => vote.votePosition)).toEqual([1, 2, 3]);

      const submissions = await testDb.db.query.challengeSubmissions.findMany({
        where: (cs, { eq }) => eq(cs.challengeId, "challenge-1"),
        orderBy: (cs, { asc }) => [asc(cs.id)],
      });
      expect(submissions.map((submission) => submission.voteScore)).toEqual([3, 2, 1]);
    });

    it("rejects a staff vote that is shorter than the required positions", async () => {
      await seedVotableChallenge({
        groupCount: 3,
        voterRole: "ADMIN",
        challenge: { scoringCategory: "JUDGED_STAFF", status: "ACTIVE" },
      });

      await expect(
        submitVotes(voterContext("ADMIN"), {
          tripId: "trip-1",
          challengeId: "challenge-1",
          votes: [
            { submissionId: "sub-1", votePosition: 1, votePoints: 3 },
            { submissionId: "sub-2", votePosition: 2, votePoints: 2 },
          ],
        }),
      ).rejects.toThrow("Staff voting requires exactly 3 votes");

      const votes = await testDb.db.query.challengeVotes.findMany({
        where: (cv, { eq }) => eq(cv.challengeId, "challenge-1"),
      });
      expect(votes).toHaveLength(0);
    });

    it("rejects a staff vote using a position outside the required range", async () => {
      await seedVotableChallenge({
        groupCount: 2,
        voterRole: "ADMIN",
        challenge: { scoringCategory: "JUDGED_STAFF", status: "ACTIVE" },
      });

      await expect(
        submitVotes(voterContext("ADMIN"), {
          tripId: "trip-1",
          challengeId: "challenge-1",
          votes: [
            { submissionId: "sub-1", votePosition: 1, votePoints: 3 },
            { submissionId: "sub-2", votePosition: 3, votePoints: 1 },
          ],
        }),
      ).rejects.toThrow("Staff voting accepts only positions 1-2");
    });

    it("rejects voting twice in the same challenge", async () => {
      await seedVotableChallenge({ groupCount: 3, voterRole: "USER" });

      const podium = [
        { submissionId: "sub-1", votePosition: 1, votePoints: 3 },
        { submissionId: "sub-2", votePosition: 2, votePoints: 2 },
        { submissionId: "sub-3", votePosition: 3, votePoints: 1 },
      ];

      await submitVotes(voterContext(), {
        tripId: "trip-1",
        challengeId: "challenge-1",
        votes: podium,
      });

      await expect(
        submitVotes(voterContext(), {
          tripId: "trip-1",
          challengeId: "challenge-1",
          votes: podium,
        }),
      ).rejects.toThrow("Oddales juz glos w tym wyzwaniu");
    });

    it("rejects a podium containing the voter's own group", async () => {
      await seedVotableChallenge({ groupCount: 3, voterRole: "USER" });
      await testDb.db.delete(tripParticipants);
      await seedParticipant("tp-voter-1", "voter-1", "trip-1", "group-3");

      await expect(
        submitVotes(voterContext(), {
          tripId: "trip-1",
          challengeId: "challenge-1",
          votes: [
            { submissionId: "sub-1", votePosition: 1, votePoints: 3 },
            { submissionId: "sub-2", votePosition: 2, votePoints: 2 },
            { submissionId: "sub-3", votePosition: 3, votePoints: 1 },
          ],
        }),
      ).rejects.toThrow("Nie mozna glosowac na wlasna grupe");
    });

    it("completes a judged staff challenge once every admin has voted", async () => {
      await seedVotableChallenge({
        groupCount: 3,
        voterRole: "ADMIN",
        challenge: { scoringCategory: "JUDGED_STAFF", status: "ACTIVE" },
      });

      await submitVotes(voterContext("ADMIN"), {
        tripId: "trip-1",
        challengeId: "challenge-1",
        votes: [
          { submissionId: "sub-1", votePosition: 1, votePoints: 3 },
          { submissionId: "sub-2", votePosition: 2, votePoints: 2 },
          { submissionId: "sub-3", votePosition: 3, votePoints: 1 },
        ],
      });

      const challenge = await testDb.db.query.challenges.findFirst({
        where: (c, { eq }) => eq(c.id, "challenge-1"),
      });
      expect(challenge?.status).toBe("COMPLETED");
    });
  });

  describe("forceEndJudgedStaffVoting", () => {
    it("finalizes a judged staff challenge from the votes cast so far", async () => {
      await seedVotableChallenge({
        groupCount: 3,
        voterRole: "ADMIN",
        challenge: { scoringCategory: "JUDGED_STAFF", status: "ACTIVE" },
      });
      await seedUser("admin-2", "ADMIN");
      await seedParticipant("tp-admin-2", "admin-2", "trip-1");

      await submitVotes(voterContext("ADMIN"), {
        tripId: "trip-1",
        challengeId: "challenge-1",
        votes: [
          { submissionId: "sub-1", votePosition: 1, votePoints: 3 },
          { submissionId: "sub-2", votePosition: 2, votePoints: 2 },
          { submissionId: "sub-3", votePosition: 3, votePoints: 1 },
        ],
      });

      const beforeForceEnd = await testDb.db.query.challenges.findFirst({
        where: (c, { eq }) => eq(c.id, "challenge-1"),
      });
      expect(beforeForceEnd?.status).toBe("ACTIVE");

      const result = await forceEndJudgedStaffVoting(
        { db: testDb.db, dbUser: { id: "voter-1" } },
        { challengeId: "challenge-1", tripId: "trip-1" },
      );

      expect(result.finalized).toBe(true);
      expect(result.challengeStatus).toBe("COMPLETED");
      expect(result.pendingAdmins).toBe(1);

      const challenge = await testDb.db.query.challenges.findFirst({
        where: (c, { eq }) => eq(c.id, "challenge-1"),
      });
      expect(challenge?.status).toBe("COMPLETED");
    });

    it("force ends a judged staff challenge that has no end time", async () => {
      await seedVotableChallenge({
        groupCount: 3,
        voterRole: "ADMIN",
        challenge: { scoringCategory: "JUDGED_STAFF", status: "ACTIVE", endTime: null },
      });

      const result = await forceEndJudgedStaffVoting(
        { db: testDb.db, dbUser: { id: "voter-1" } },
        { challengeId: "challenge-1", tripId: "trip-1" },
      );

      expect(result.finalized).toBe(true);

      const challenge = await testDb.db.query.challenges.findFirst({
        where: (c, { eq }) => eq(c.id, "challenge-1"),
      });
      expect(challenge?.status).toBe("COMPLETED");
    });

    it("refuses to force end while the submission phase is still open", async () => {
      await seedVotableChallenge({
        groupCount: 3,
        voterRole: "ADMIN",
        challenge: {
          scoringCategory: "JUDGED_STAFF",
          status: "ACTIVE",
          endTime: new Date(Date.now() + HOUR_MS),
        },
      });

      await expect(
        forceEndJudgedStaffVoting(
          { db: testDb.db, dbUser: { id: "voter-1" } },
          { challengeId: "challenge-1", tripId: "trip-1" },
        ),
      ).rejects.toThrow("You can force end staff voting only after submission phase ends");
    });

    it("refuses to force end a challenge that is not judged staff", async () => {
      await seedVotableChallenge({ groupCount: 3, voterRole: "ADMIN" });

      await expect(
        forceEndJudgedStaffVoting(
          { db: testDb.db, dbUser: { id: "voter-1" } },
          { challengeId: "challenge-1", tripId: "trip-1" },
        ),
      ).rejects.toThrow("Force end is available only for judged staff challenges");
    });
  });
});
