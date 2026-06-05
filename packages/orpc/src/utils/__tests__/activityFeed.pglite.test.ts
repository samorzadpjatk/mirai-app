import {
  activityFeeds,
  challengeActivities,
  challengeLocation,
  challengeRecurrence,
  challengeSubmissions,
  challengeVotes,
  challenges,
  coinTransactions,
  groups,
  rankChangeActivities,
  submissionActivities,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  captureTripRankingSnapshot,
  createChallengeCompletionWithWinnersById,
  createChallengeStatusActivityById,
  createChallengeStatusActivityFromTransition,
  createRankChangeActivities,
  finalizeVotingChallengesToCompletedWithFeed,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
} from "../activityFeed";

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

// ─── Seed helpers ───

async function seedTrip(id: string, name = "Test Trip") {
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

async function seedUser(id: string, role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE" = "USER") {
  await testDb.db.insert(users).values({
    id,
    authUserId: `auth-${id}`,
    firstName: "Test",
    lastName: "User",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function seedGroup(
  id: string,
  tripId: string,
  organizerId: string,
  name = "Team",
  coins = 0,
) {
  await testDb.db.insert(groups).values({
    id,
    tripId,
    name,
    description: "",
    organizerId,
    code: `CODE-${id}`,
    coins,
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
    description: "A test challenge",
    image: null,
    submissionType: "IMAGE",
    scoringCategory: "PEER_VOTING",
    basePoints: 100,
    firstPlacePoints: 300,
    secondPlacePoints: 200,
    thirdPlacePoints: 150,
    status: "HIDDEN",
    startTime: null,
    endTime: null,
    votingStartTime: null,
    votingEndTime: null,
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

  await testDb.db.insert(challengeLocation).values({
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
    imageIds: [],
    videoId: null,
    textContent: null,
    status: "PENDING",
    awardedPoints: 0,
    ranking: null,
    voteCount: 0,
    voteScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
  await testDb.db.insert(tripParticipants).values({
    id,
    userId,
    tripId,
    groupId: groupId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
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

// ─── Tests ───

describe("createChallengeCompletionWithWinnersById", () => {
  it("creates completion activity and winner submissions for peer voting challenge", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedUser("user-1", "USER");
    await seedUser("user-2", "USER");
    await seedUser("user-3", "USER");
    await seedGroup("group-1", "trip-1", "admin-1", "Team A", 100);
    await seedGroup("group-2", "trip-1", "admin-1", "Team B", 80);
    await seedGroup("group-3", "trip-1", "admin-1", "Team C", 60);
    await seedChallenge("challenge-1", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
      basePoints: 100,
      firstPlacePoints: 300,
      secondPlacePoints: 200,
      thirdPlacePoints: 150,
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", {
      status: "APPROVED",
      voteCount: 10,
      voteScore: 9.5,
    });
    await seedSubmission("sub-2", "challenge-1", "group-2", {
      status: "APPROVED",
      voteCount: 8,
      voteScore: 8.0,
    });
    await seedSubmission("sub-3", "challenge-1", "group-3", {
      status: "APPROVED",
      voteCount: 5,
      voteScore: 5.0,
    });
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-2");
    await seedParticipant("tp-3", "user-3", "trip-1", "group-3");
    await seedVote("vote-1", "challenge-1", "sub-1", "tp-2", 1, 5);
    await seedVote("vote-2", "challenge-1", "sub-1", "tp-3", 1, 5);
    await seedVote("vote-3", "challenge-1", "sub-2", "tp-1", 2, 3);
    await seedVote("vote-4", "challenge-1", "sub-3", "tp-1", 3, 1);

    await testDb.db.transaction(async (tx) => {
      await createChallengeCompletionWithWinnersById({
        tx,
        challengeId: "challenge-1",
        createdByAdmin: "admin-1",
      });
    });

    // Challenge completion activity feed should exist
    const feeds = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"));
    expect(feeds.length).toBeGreaterThanOrEqual(1);
    const completionFeed = feeds.find((f) => f.activityType === "challenge_event");
    expect(completionFeed).toBeDefined();

    // Winner submission activities
    const winnerActivities = await testDb.db
      .select()
      .from(submissionActivities)
      .where(eq(submissionActivities.challengeId, "challenge-1"));
    expect(winnerActivities).toHaveLength(3);
    expect(winnerActivities.filter((w) => w.isWinner)).toHaveLength(3);

    // Group coins updated
    const group1 = await testDb.db.query.groups.findFirst({
      where: eq(groups.id, "group-1"),
    });
    expect(group1?.coins).toBe(100 + 300); // first place

    const group2 = await testDb.db.query.groups.findFirst({
      where: eq(groups.id, "group-2"),
    });
    expect(group2?.coins).toBe(80 + 200); // second place

    const group3 = await testDb.db.query.groups.findFirst({
      where: eq(groups.id, "group-3"),
    });
    expect(group3?.coins).toBe(60 + 150); // third place

    // Coin transactions created
    const transactions = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(transactions.length).toBeGreaterThanOrEqual(1);
  });

  it("creates completion event but no winners when challenge has no submissions", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
    });

    await testDb.db.transaction(async (tx) => {
      await createChallengeCompletionWithWinnersById({
        tx,
        challengeId: "challenge-1",
        createdByAdmin: "admin-1",
      });
    });

    const feeds = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"));
    expect(feeds).toHaveLength(1);
    expect(feeds[0]?.activityType).toBe("challenge_event");

    const winnerActivities = await testDb.db
      .select()
      .from(submissionActivities)
      .where(eq(submissionActivities.challengeId, "challenge-1"));
    expect(winnerActivities).toHaveLength(0);
  });

  it("does nothing when challenge does not exist", async () => {
    await testDb.db.transaction(async (tx) => {
      await createChallengeCompletionWithWinnersById({
        tx,
        challengeId: "nonexistent",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(0);
  });

  it("skips creating duplicate completion event", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", {
      status: "APPROVED",
      voteCount: 1,
      voteScore: 1,
    });

    // First call
    await testDb.db.transaction(async (tx) => {
      await createChallengeCompletionWithWinnersById({
        tx,
        challengeId: "challenge-1",
        createdByAdmin: "admin-1",
      });
    });

    // Second call should not create another completion event
    await testDb.db.transaction(async (tx) => {
      await createChallengeCompletionWithWinnersById({
        tx,
        challengeId: "challenge-1",
        createdByAdmin: "admin-1",
      });
    });

    const challengeActs = await testDb.db
      .select()
      .from(challengeActivities)
      .where(eq(challengeActivities.eventType, "completed"));
    expect(challengeActs).toHaveLength(1);
  });
});

describe("createChallengeStatusActivityById", () => {
  it("creates challenge_started activity", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedChallenge("challenge-1", "trip-1", {
      status: "ACTIVE",
      endTime: new Date("2025-06-10T12:00:00Z"),
    });

    await testDb.db.transaction(async (tx) => {
      await createChallengeStatusActivityById({
        tx,
        challengeId: "challenge-1",
        eventType: "challenge_started",
        createdByAdmin: "admin-1",
      });
    });

    const feeds = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"));
    expect(feeds).toHaveLength(1);
    expect(feeds[0].activityType).toBe("challenge_event");
    expect(feeds[0].title).toContain("Czas start");

    const challengeActs = await testDb.db
      .select()
      .from(challengeActivities)
      .where(eq(challengeActivities.challengeId, "challenge-1"));
    expect(challengeActs).toHaveLength(1);
    expect(challengeActs[0].eventType).toBe("challenge_started");
    expect(challengeActs[0].endTime).toEqual(new Date("2025-06-10T12:00:00Z"));
  });

  it("creates voting_started activity", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", {
      status: "APPROVED",
    });

    await testDb.db.transaction(async (tx) => {
      await createChallengeStatusActivityById({
        tx,
        challengeId: "challenge-1",
        eventType: "voting_started",
        createdByAdmin: "admin-1",
      });
    });

    const feeds = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"));
    expect(feeds).toHaveLength(1);
    expect(feeds[0].activityType).toBe("challenge_event");

    const challengeActs = await testDb.db
      .select()
      .from(challengeActivities)
      .where(eq(challengeActivities.challengeId, "challenge-1"));
    expect(challengeActs).toHaveLength(1);
    expect(challengeActs[0].eventType).toBe("voting_started");
    expect(challengeActs[0].submissionCount).toBe(1);
  });

  it("does nothing for non-existent challenge", async () => {
    await testDb.db.transaction(async (tx) => {
      await createChallengeStatusActivityById({
        tx,
        challengeId: "nonexistent",
        eventType: "challenge_started",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(0);
  });
});

describe("createChallengeStatusActivityFromTransition", () => {
  it("returns early when previous and next status are the same", async () => {
    await seedTrip("trip-1");
    await seedChallenge("challenge-1", "trip-1");

    await testDb.db.transaction(async (tx) => {
      await createChallengeStatusActivityFromTransition({
        tx,
        challengeId: "challenge-1",
        previousStatus: "ACTIVE",
        nextStatus: "ACTIVE",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(0);
  });

  it("creates challenge_started when transitioning to ACTIVE", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedChallenge("challenge-1", "trip-1", { status: "VISIBLE" });

    await testDb.db.transaction(async (tx) => {
      await createChallengeStatusActivityFromTransition({
        tx,
        challengeId: "challenge-1",
        previousStatus: "VISIBLE",
        nextStatus: "ACTIVE",
        createdByAdmin: "admin-1",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(1);
    expect(feeds[0].activityType).toBe("challenge_event");

    const challengeActs = await testDb.db.select().from(challengeActivities);
    expect(challengeActs[0].eventType).toBe("challenge_started");
  });

  it("creates voting_started when transitioning to VOTING_PHASE", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "ACTIVE",
      scoringCategory: "PEER_VOTING",
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", { status: "APPROVED" });

    await testDb.db.transaction(async (tx) => {
      await createChallengeStatusActivityFromTransition({
        tx,
        challengeId: "challenge-1",
        previousStatus: "ACTIVE",
        nextStatus: "VOTING_PHASE",
        createdByAdmin: "admin-1",
      });
    });

    const challengeActs = await testDb.db.select().from(challengeActivities);
    expect(challengeActs).toHaveLength(1);
    expect(challengeActs[0].eventType).toBe("voting_started");
  });

  it("creates completion when transitioning from VOTING_PHASE to COMPLETED", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", {
      status: "APPROVED",
      voteCount: 1,
      voteScore: 1,
    });

    await testDb.db.transaction(async (tx) => {
      await createChallengeStatusActivityFromTransition({
        tx,
        challengeId: "challenge-1",
        previousStatus: "VOTING_PHASE",
        nextStatus: "COMPLETED",
        createdByAdmin: "admin-1",
      });
    });

    const challengeActs = await testDb.db
      .select()
      .from(challengeActivities)
      .where(eq(challengeActivities.eventType, "completed"));
    expect(challengeActs).toHaveLength(1);
  });

  it("does nothing for unsupported transitions", async () => {
    await seedTrip("trip-1");
    await seedChallenge("challenge-1", "trip-1");

    await testDb.db.transaction(async (tx) => {
      await createChallengeStatusActivityFromTransition({
        tx,
        challengeId: "challenge-1",
        previousStatus: "HIDDEN",
        nextStatus: "COMPLETED",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(0);
  });
});

describe("promoteVisibleChallengesToActiveWithFeed", () => {
  it("promotes visible challenge to active when start time has passed", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VISIBLE",
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60),
    });

    const activated = await testDb.db.transaction(async (tx) => {
      return promoteVisibleChallengesToActiveWithFeed({ tx });
    });

    expect(activated).toContain("challenge-1");

    const updated = await testDb.db.query.challenges.findFirst({
      where: eq(challenges.id, "challenge-1"),
    });
    expect(updated?.status).toBe("ACTIVE");

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(1);
  });

  it("does not promote when start time is in the future", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VISIBLE",
      startTime: new Date(Date.now() + 1000 * 60 * 60),
    });

    const activated = await testDb.db.transaction(async (tx) => {
      return promoteVisibleChallengesToActiveWithFeed({ tx });
    });

    expect(activated).toHaveLength(0);

    const updated = await testDb.db.query.challenges.findFirst({
      where: eq(challenges.id, "challenge-1"),
    });
    expect(updated?.status).toBe("VISIBLE");
  });

  it("does not promote when end time has passed", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VISIBLE",
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      endTime: new Date(Date.now() - 1000 * 60 * 60),
    });

    const activated = await testDb.db.transaction(async (tx) => {
      return promoteVisibleChallengesToActiveWithFeed({ tx });
    });

    expect(activated).toHaveLength(0);
  });

  it("filters by tripId when provided", async () => {
    await seedTrip("trip-1");
    await seedTrip("trip-2");
    await seedUser("admin-1", "ADMIN");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VISIBLE",
      startTime: new Date(Date.now() - 1000 * 60 * 60),
    });
    await seedChallenge("challenge-2", "trip-2", {
      status: "VISIBLE",
      startTime: new Date(Date.now() - 1000 * 60 * 60),
    });

    const activated = await testDb.db.transaction(async (tx) => {
      return promoteVisibleChallengesToActiveWithFeed({ tx, where: { tripId: "trip-1" } });
    });

    expect(activated).toHaveLength(1);
    expect(activated[0]).toBe("challenge-1");
  });

  it("filters by id when provided", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VISIBLE",
      startTime: new Date(Date.now() - 1000 * 60 * 60),
    });
    await seedChallenge("challenge-2", "trip-1", {
      status: "VISIBLE",
      startTime: new Date(Date.now() - 1000 * 60 * 60),
    });

    const activated = await testDb.db.transaction(async (tx) => {
      return promoteVisibleChallengesToActiveWithFeed({ tx, where: { id: "challenge-1" } });
    });

    expect(activated).toHaveLength(1);
    expect(activated[0]).toBe("challenge-1");
  });
});

describe("promoteActivePeerVotingChallengesToVotingPhaseWithFeed", () => {
  it("promotes active peer voting challenge when all submissions are processed", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedGroup("group-2", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "ACTIVE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(Date.now() - 1000 * 60),
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", { status: "APPROVED" });
    await seedSubmission("sub-2", "challenge-1", "group-2", { status: "REJECTED" });

    const votingIds = await testDb.db.transaction(async (tx) => {
      return promoteActivePeerVotingChallengesToVotingPhaseWithFeed({ tx });
    });

    expect(votingIds).toContain("challenge-1");

    const updated = await testDb.db.query.challenges.findFirst({
      where: eq(challenges.id, "challenge-1"),
    });
    expect(updated?.status).toBe("VOTING_PHASE");
    expect(updated?.votingStartTime).toBeDefined();
    expect(updated?.votingEndTime).toBeDefined();

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(1);
  });

  it("does not promote when submissions are still pending", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "ACTIVE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(Date.now() - 1000 * 60),
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", { status: "PENDING" });

    const votingIds = await testDb.db.transaction(async (tx) => {
      return promoteActivePeerVotingChallengesToVotingPhaseWithFeed({ tx });
    });

    expect(votingIds).toHaveLength(0);
  });

  it("does not promote when there are no submissions", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "ACTIVE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(Date.now() - 1000 * 60),
    });

    const votingIds = await testDb.db.transaction(async (tx) => {
      return promoteActivePeerVotingChallengesToVotingPhaseWithFeed({ tx });
    });

    expect(votingIds).toHaveLength(0);
  });

  it("does not promote non-peer-voting challenges", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "ACTIVE",
      scoringCategory: "SPEED",
      endTime: new Date(Date.now() - 1000 * 60),
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", { status: "APPROVED" });

    const votingIds = await testDb.db.transaction(async (tx) => {
      return promoteActivePeerVotingChallengesToVotingPhaseWithFeed({ tx });
    });

    expect(votingIds).toHaveLength(0);
  });

  it("filters by tripId when provided", async () => {
    await seedTrip("trip-1");
    await seedTrip("trip-2");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedGroup("group-2", "trip-2", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "ACTIVE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(Date.now() - 1000 * 60),
    });
    await seedChallenge("challenge-2", "trip-2", {
      status: "ACTIVE",
      scoringCategory: "PEER_VOTING",
      endTime: new Date(Date.now() - 1000 * 60),
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", { status: "APPROVED" });
    await seedSubmission("sub-2", "challenge-2", "group-2", { status: "APPROVED" });

    const votingIds = await testDb.db.transaction(async (tx) => {
      return promoteActivePeerVotingChallengesToVotingPhaseWithFeed({
        tx,
        where: { tripId: "trip-1" },
      });
    });

    expect(votingIds).toHaveLength(1);
    expect(votingIds[0]).toBe("challenge-1");
  });
});

describe("finalizeVotingChallengesToCompletedWithFeed", () => {
  it("finalizes voting phase challenge to completed", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
      votingEndTime: new Date(Date.now() - 1000 * 60),
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", {
      status: "APPROVED",
      voteCount: 1,
      voteScore: 1,
    });

    const completed = await testDb.db.transaction(async (tx) => {
      return finalizeVotingChallengesToCompletedWithFeed({ tx });
    });

    expect(completed).toContain("challenge-1");

    const updated = await testDb.db.query.challenges.findFirst({
      where: eq(challenges.id, "challenge-1"),
    });
    expect(updated?.status).toBe("COMPLETED");

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds.length).toBeGreaterThanOrEqual(1);
  });

  it("does not finalize when voting end time is in the future", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
      votingEndTime: new Date(Date.now() + 1000 * 60 * 60),
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", { status: "APPROVED" });

    const completed = await testDb.db.transaction(async (tx) => {
      return finalizeVotingChallengesToCompletedWithFeed({ tx });
    });

    expect(completed).toHaveLength(0);
  });

  it("does not finalize non-voting-phase challenges", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "ACTIVE",
      scoringCategory: "PEER_VOTING",
      votingEndTime: new Date(Date.now() - 1000 * 60),
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", { status: "APPROVED" });

    const completed = await testDb.db.transaction(async (tx) => {
      return finalizeVotingChallengesToCompletedWithFeed({ tx });
    });

    expect(completed).toHaveLength(0);
  });

  it("filters by id when provided", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1");
    await seedGroup("group-2", "trip-1", "admin-1");
    await seedChallenge("challenge-1", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
      votingEndTime: new Date(Date.now() - 1000 * 60),
    });
    await seedChallenge("challenge-2", "trip-1", {
      status: "VOTING_PHASE",
      scoringCategory: "PEER_VOTING",
      votingEndTime: new Date(Date.now() - 1000 * 60),
    });
    await seedSubmission("sub-1", "challenge-1", "group-1", {
      status: "APPROVED",
      voteCount: 1,
      voteScore: 1,
    });
    await seedSubmission("sub-2", "challenge-2", "group-2", {
      status: "APPROVED",
      voteCount: 1,
      voteScore: 1,
    });

    const completed = await testDb.db.transaction(async (tx) => {
      return finalizeVotingChallengesToCompletedWithFeed({
        tx,
        where: { id: "challenge-1" },
      });
    });

    expect(completed).toHaveLength(1);
    expect(completed[0]).toBe("challenge-1");
  });
});

describe("captureTripRankingSnapshot", () => {
  it("captures correct ranking ordered by coins desc, id asc", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1", "Team A", 300);
    await seedGroup("group-2", "trip-1", "admin-1", "Team B", 500);
    await seedGroup("group-3", "trip-1", "admin-1", "Team C", 300);
    await seedGroup("group-4", "trip-1", "admin-1", "Team D", 100);

    const snapshot = await testDb.db.transaction(async (tx) => {
      return captureTripRankingSnapshot(tx, "trip-1");
    });

    expect(snapshot.size).toBe(4);
    expect(snapshot.get("group-2")?.rank).toBe(1); // 500 coins
    expect(snapshot.get("group-1")?.rank).toBe(2); // 300 coins, earlier id
    expect(snapshot.get("group-3")?.rank).toBe(3); // 300 coins, later id
    expect(snapshot.get("group-4")?.rank).toBe(4); // 100 coins
  });

  it("excludes deleted groups", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1", "Team A", 300);
    await testDb.db.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

    const snapshot = await testDb.db.transaction(async (tx) => {
      return captureTripRankingSnapshot(tx, "trip-1");
    });

    expect(snapshot.size).toBe(0);
  });

  it("returns empty snapshot when no groups exist", async () => {
    await seedTrip("trip-1");

    const snapshot = await testDb.db.transaction(async (tx) => {
      return captureTripRankingSnapshot(tx, "trip-1");
    });

    expect(snapshot.size).toBe(0);
  });
});

describe("createRankChangeActivities", () => {
  it("creates rank change activity when rankings change", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1", "Team A", 300);
    await seedGroup("group-2", "trip-1", "admin-1", "Team B", 500);

    // Initial snapshot: group-1 rank 1 (300), group-2 rank 2 (500 is not seeded yet in this order... wait)
    // Actually with current coins: group-2 has 500, group-1 has 300
    // So current ranking: group-2 = rank 1, group-1 = rank 2
    // Let's create a previous snapshot where group-1 was rank 1 and group-2 was rank 2
    const previousSnapshot = new Map([
      [
        "group-1",
        {
          rank: 1,
          coins: 600,
          name: "Team A",
          image: null,
        },
      ],
      [
        "group-2",
        {
          rank: 2,
          coins: 100,
          name: "Team B",
          image: null,
        },
      ],
    ]);

    await testDb.db.transaction(async (tx) => {
      await createRankChangeActivities({
        tx,
        tripId: "trip-1",
        previousSnapshot,
        createdByAdmin: "admin-1",
      });
    });

    const feeds = await testDb.db
      .select()
      .from(activityFeeds)
      .where(eq(activityFeeds.tripId, "trip-1"));
    expect(feeds).toHaveLength(1);
    expect(feeds[0].activityType).toBe("rank_change");
    expect(feeds[0].title).toBe("Zmiany w tabeli");

    const rankActs = await testDb.db
      .select()
      .from(rankChangeActivities)
      .where(eq(rankChangeActivities.activityId, feeds[0].id));
    expect(rankActs).toHaveLength(1);
  });

  it("does nothing when previous snapshot is empty", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1", "Team A", 300);

    await testDb.db.transaction(async (tx) => {
      await createRankChangeActivities({
        tx,
        tripId: "trip-1",
        previousSnapshot: new Map(),
        createdByAdmin: "admin-1",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(0);
  });

  it("does nothing when rankings are unchanged", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1", "Team A", 300);
    await seedGroup("group-2", "trip-1", "admin-1", "Team B", 500);

    // Current ranking: group-2 = 1 (500), group-1 = 2 (300)
    const previousSnapshot = new Map([
      [
        "group-1",
        {
          rank: 2,
          coins: 200,
          name: "Team A",
          image: null,
        },
      ],
      [
        "group-2",
        {
          rank: 1,
          coins: 400,
          name: "Team B",
          image: null,
        },
      ],
    ]);

    await testDb.db.transaction(async (tx) => {
      await createRankChangeActivities({
        tx,
        tripId: "trip-1",
        previousSnapshot,
        createdByAdmin: "admin-1",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(0);
  });

  it("does nothing when previous groups are no longer present", async () => {
    await seedTrip("trip-1");
    await seedUser("admin-1", "ADMIN");
    await seedGroup("group-1", "trip-1", "admin-1", "Team A", 300);

    const previousSnapshot = new Map([
      [
        "group-missing",
        {
          rank: 1,
          coins: 500,
          name: "Missing Team",
          image: null,
        },
      ],
    ]);

    await testDb.db.transaction(async (tx) => {
      await createRankChangeActivities({
        tx,
        tripId: "trip-1",
        previousSnapshot,
        createdByAdmin: "admin-1",
      });
    });

    const feeds = await testDb.db.select().from(activityFeeds);
    expect(feeds).toHaveLength(0);
  });
});
