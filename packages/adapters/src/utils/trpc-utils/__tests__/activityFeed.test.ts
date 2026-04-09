import { describe, expect, test, mock, beforeEach } from "bun:test";
import {
  createChallengeStatusActivityById,
  promoteVisibleChallengesToActiveWithFeed,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  captureTripRankingSnapshot,
  createRankChangeActivities,
} from "../activityFeed";
import type { Prisma } from "@repo/frameworks/prisma";

const createMockTx = () => {
  return {
    challenge: {
      findUnique: mock(),
      findFirst: mock(),
      findMany: mock(),
      updateMany: mock(),
    },
    challengeSubmission: {
      count: mock(),
      findMany: mock(),
      update: mock(),
    },
    group: {
      findMany: mock(),
      update: mock(),
    },
    activityFeed: {
      create: mock(),
    },
    challengeActivity: {
      findFirst: mock(),
      findMany: mock(),
    },
    submissionActivity: {
      findMany: mock(),
    },
    coinTransaction: {
      create: mock(),
    },
    user: {
      findFirst: mock(),
    },
  } as unknown as Prisma.TransactionClient;
};

const createMockChallenge = (overrides = {}) => {
  return {
    id: "challenge-1",
    tripId: "trip-1",
    name: "Test Challenge",
    description: "A test challenge",
    image: null,
    submissionType: "IMAGE" as const,
    scoringCategory: "PEER_VOTING" as const,
    basePoints: 100,
    firstPlacePoints: 150,
    secondPlacePoints: 125,
    thirdPlacePoints: 110,
    endTime: new Date("2024-01-15T17:00:00Z"),
    votingEndTime: new Date("2024-01-16T17:00:00Z"),
    ...overrides,
  };
};

describe("[UNIT] activityFeed", () => {
  beforeEach(() => {
    mock.restore();
  });

  describe("captureTripRankingSnapshot", () => {
    test("captures ranking snapshot with correct order", async () => {
      const tx = createMockTx();
      tx.group.findMany.mockResolvedValueOnce([
        { id: "group-1", name: "Alpha", coins: 500, image: null },
        { id: "group-3", name: "Gamma", coins: 400, image: null },
        { id: "group-2", name: "Beta", coins: 300, image: null },
      ]);

      const snapshot = await captureTripRankingSnapshot(tx, "trip-1");

      expect(snapshot.size).toBe(3);
      expect(snapshot.get("group-1")?.rank).toBe(1);
      expect(snapshot.get("group-1")?.coins).toBe(500);
      expect(snapshot.get("group-2")?.rank).toBe(3);
      expect(snapshot.get("group-3")?.rank).toBe(2);
    });

    test("returns empty snapshot when no groups exist", async () => {
      const tx = createMockTx();
      tx.group.findMany.mockResolvedValueOnce([]);

      const snapshot = await captureTripRankingSnapshot(tx, "trip-1");

      expect(snapshot.size).toBe(0);
    });

    test("sorts by coins desc, then by id asc", async () => {
      const tx = createMockTx();
      tx.group.findMany.mockResolvedValueOnce([
        { id: "group-a", name: "First", coins: 100, image: null },
        { id: "group-b", name: "Second", coins: 100, image: null },
      ]);

      const snapshot = await captureTripRankingSnapshot(tx, "trip-1");

      expect(snapshot.get("group-a")?.rank).toBe(1);
      expect(snapshot.get("group-b")?.rank).toBe(2);
    });
  });

  describe("createChallengeStatusActivityById", () => {
    test("does nothing when challenge not found", async () => {
      const tx = createMockTx();
      tx.challenge.findUnique.mockResolvedValueOnce(null);

      await createChallengeStatusActivityById({
        tx,
        challengeId: "non-existent",
        eventType: "challenge_started",
      });

      expect(tx.activityFeed.create).not.toHaveBeenCalled();
    });

    test("creates activity feed item for challenge_started event", async () => {
      const tx = createMockTx();
      tx.challenge.findUnique.mockResolvedValueOnce(createMockChallenge());
      tx.challengeSubmission.count.mockResolvedValueOnce(5);
      tx.activityFeed.create.mockResolvedValueOnce({ id: "feed-1" } as any);

      await createChallengeStatusActivityById({
        tx,
        challengeId: "challenge-1",
        eventType: "challenge_started",
      });

      expect(tx.activityFeed.create).toHaveBeenCalled();
      const createCall = tx.activityFeed.create.mock.calls[0][0];
      expect(createCall.data.activityType).toBe("challenge_event");
    });

    test("creates activity feed item for voting_started event", async () => {
      const tx = createMockTx();
      tx.challenge.findUnique.mockResolvedValueOnce(createMockChallenge());
      tx.challengeSubmission.count.mockResolvedValueOnce(10);
      tx.activityFeed.create.mockResolvedValueOnce({ id: "feed-1" } as any);

      await createChallengeStatusActivityById({
        tx,
        challengeId: "challenge-1",
        eventType: "voting_started",
      });

      expect(tx.activityFeed.create).toHaveBeenCalled();
    });
  });

  describe("promoteVisibleChallengesToActiveWithFeed", () => {
    test("activates visible challenges that have started", async () => {
      const tx = createMockTx();
      tx.challenge.findMany.mockResolvedValueOnce([{ id: "challenge-1" }]);
      tx.challenge.updateMany.mockResolvedValueOnce({ count: 1 });
      tx.challenge.findUnique.mockResolvedValueOnce(createMockChallenge());
      tx.challengeSubmission.count.mockResolvedValueOnce(5);
      tx.activityFeed.create.mockResolvedValueOnce({ id: "feed-1" } as any);

      const result = await promoteVisibleChallengesToActiveWithFeed({
        tx,
        createdByAdmin: "admin-1",
      });

      expect(result).toContain("challenge-1");
    });

    test("returns empty array when no challenges to activate", async () => {
      const tx = createMockTx();
      tx.challenge.findMany.mockResolvedValueOnce([]);

      const result = await promoteVisibleChallengesToActiveWithFeed({
        tx,
      });

      expect(result).toEqual([]);
    });
  });

  describe("promoteActivePeerVotingChallengesToVotingPhaseWithFeed", () => {
    test("moves eligible peer voting challenges to voting phase", async () => {
      const tx = createMockTx();
      tx.challenge.findMany.mockResolvedValueOnce([
        {
          id: "challenge-1",
          votingStartTime: null,
          votingEndTime: null,
        },
      ]);
      tx.challenge.updateMany.mockResolvedValueOnce({ count: 1 });
      tx.challenge.findUnique.mockResolvedValueOnce(createMockChallenge());
      tx.challengeSubmission.count.mockResolvedValueOnce(5);
      tx.activityFeed.create.mockResolvedValueOnce({ id: "feed-1" } as any);

      const result =
        await promoteActivePeerVotingChallengesToVotingPhaseWithFeed({
          tx,
        });

      expect(result).toContain("challenge-1");
    });
  });

  describe("createRankChangeActivities", () => {
    test("does nothing when previous snapshot is empty", async () => {
      const tx = createMockTx();
      const emptySnapshot = new Map();

      await createRankChangeActivities({
        tx,
        tripId: "trip-1",
        previousSnapshot: emptySnapshot,
      });

      expect(tx.activityFeed.create).not.toHaveBeenCalled();
    });

    test("creates rank change activity when ranks have changed", async () => {
      const tx = createMockTx();
      const previousSnapshot = new Map([
        ["group-1", { rank: 2, coins: 300, name: "Group 1", image: null }],
        ["group-2", { rank: 1, coins: 500, name: "Group 2", image: null }],
      ]);

      tx.group.findMany.mockResolvedValueOnce([
        { id: "group-1", name: "Group 1", coins: 400, image: null },
        { id: "group-2", name: "Group 2", coins: 500, image: null },
      ]);

      await createRankChangeActivities({
        tx,
        tripId: "trip-1",
        previousSnapshot,
      });

      expect(tx.activityFeed.create).toHaveBeenCalled();
    });

    test("does nothing when no ranks have changed", async () => {
      const tx = createMockTx();
      const previousSnapshot = new Map([
        ["group-1", { rank: 1, coins: 500, name: "Group 1", image: null }],
        ["group-2", { rank: 2, coins: 300, name: "Group 2", image: null }],
      ]);

      tx.group.findMany.mockResolvedValueOnce([
        { id: "group-1", name: "Group 1", coins: 500, image: null },
        { id: "group-2", name: "Group 2", coins: 300, image: null },
      ]);

      await createRankChangeActivities({
        tx,
        tripId: "trip-1",
        previousSnapshot,
      });

      expect(tx.activityFeed.create).not.toHaveBeenCalled();
    });
  });
});
