import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { ChallengeController } from "../challenge";
import type { ChallengeRepository } from "@mirai-app/use-cases";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

// Valid UUIDs for testing
const TEST_CHALLENGE_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_TRIP_ID = "550e8400-e29b-41d4-a716-446655440002";

// Mock Challenge domain object
const createMockChallenge = (overrides?: Partial<Challenge>): Challenge =>
  ({
    id: TEST_CHALLENGE_ID,
    tripId: TEST_TRIP_ID,
    name: "Test Challenge",
    description: "Test description",
    image: null,
    submissionType: SubmissionType.IMAGE,
    scoringCategory: ScoringCategory.SPEED,
    isRecurring: false,
    basePoints: 100,
    status: ChallengeStatus.ACTIVE,
    startTime: null,
    endTime: null,
    targetLatitude: null,
    targetLongitude: null,
    expectedValue: null,
    autoApprove: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    votingStartTime: null,
    votingEndTime: null,
    dailyStartTime: null,
    dailyEndTime: null,
    firstPlacePoints: null,
    secondPlacePoints: null,
    thirdPlacePoints: null,
    isActive: () => true,
    isOpenForSubmission: () => true,
    requiresLocation: () => false,
    requiresQRCode: () => false,
    hasVotingPhase: () => false,
    canTransitionTo: () => true,
    isInVotingPhase: () => false,
    isCompleted: () => false,
    isCancelled: () => false,
    isTerminal: () => false,
    updateDetails: function (props: unknown) {
      return Effect.succeed({ ...this, ...props } as Challenge);
    },
    updateStatus: function (newStatus: ChallengeStatus) {
      return Effect.succeed({ ...this, status: newStatus } as Challenge);
    },
    updatePoints: function (props: unknown) {
      return Effect.succeed({ ...this, ...props } as Challenge);
    },
    updateTiming: function (props: unknown) {
      return Effect.succeed({ ...this, ...props } as Challenge);
    },
    ...overrides,
  }) as Challenge;

describe("[UNIT] ChallengeController", () => {
  let controller: ChallengeController;
  let mockChallengeRepository: ChallengeRepository;

  beforeEach(() => {
    mockChallengeRepository = {
      findById: mock(() => Effect.succeed(createMockChallenge())),
      findByTripId: mock(() => Effect.succeed([createMockChallenge()])),
      create: mock((challenge: Challenge) => Effect.succeed(challenge)),
      update: mock((challenge: Challenge) => Effect.succeed(challenge)),
      findAll: mock(() => Effect.succeed([createMockChallenge()])),
      findActive: mock(() => Effect.succeed([createMockChallenge()])),
      findOpenForSubmission: mock(() =>
        Effect.succeed([createMockChallenge()]),
      ),
      findByStatus: mock(() => Effect.succeed([createMockChallenge()])),
      findByTripIdAndStatus: mock(() =>
        Effect.succeed([createMockChallenge()]),
      ),
      findBySubmissionType: mock(() => Effect.succeed([createMockChallenge()])),
      findByScoringCategory: mock(() =>
        Effect.succeed([createMockChallenge()]),
      ),
      findRecurring: mock(() => Effect.succeed([createMockChallenge()])),
      updateStatus: mock((id: string, status: ChallengeStatus) =>
        Effect.succeed(createMockChallenge({ status })),
      ),
      delete: mock(() => Effect.succeed(void 0)),
      exists: mock(() => Effect.succeed(true)),
      countByTripId: mock(() => Effect.succeed(1)),
    } as unknown as ChallengeRepository;

    controller = new ChallengeController(mockChallengeRepository);
  });

  describe("[UNIT] getById", () => {
    it("should return challenge by ID", async () => {
      const result = await controller.getById({ id: TEST_CHALLENGE_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_CHALLENGE_ID);
        expect(result.data.name).toBe("Test Challenge");
        expect(result.data.isOpenForSubmission).toBe(true);
      }
    });

    it("should return error for invalid ID", async () => {
      const result = await controller.getById({ id: "invalid" });

      expect(result.success).toBe(false);
    });

    it("should return error when challenge not found", async () => {
      mockChallengeRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({ id: TEST_CHALLENGE_ID });

      expect(result.success).toBe(false);
    });
  });

  describe("[UNIT] getByTripId", () => {
    it("should return challenges for trip", async () => {
      const result = await controller.getByTripId({ tripId: TEST_TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("[UNIT] create", () => {
    it("should create challenge with valid input", async () => {
      const input = {
        tripId: TEST_TRIP_ID,
        name: "New Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Challenge");
        expect(result.data.submissionType).toBe("IMAGE");
      }
    });

    it("should return error for invalid submission type", async () => {
      const input = {
        tripId: TEST_TRIP_ID,
        name: "Test",
        submissionType: "INVALID",
        scoringCategory: "SPEED",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });

    it("should return error for invalid time format", async () => {
      const input = {
        tripId: TEST_TRIP_ID,
        name: "Test",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        dailyStartTime: "25:00", // Invalid
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("[UNIT] update", () => {
    it("should update challenge with valid input", async () => {
      const input = {
        challengeId: TEST_CHALLENGE_ID,
        name: "Updated Challenge",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Challenge");
      }
    });

    it("should return error for invalid challengeId", async () => {
      const result = await controller.update({ challengeId: "invalid" });

      expect(result.success).toBe(false);
    });
  });

  describe("[UNIT] updateStatus", () => {
    it("should update challenge status", async () => {
      const input = {
        challengeId: TEST_CHALLENGE_ID,
        newStatus: "COMPLETED",
      };

      const result = await controller.updateStatus(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newStatus).toBe("COMPLETED");
        expect(result.data.previousStatus).toBeDefined();
      }
    });

    it("should return error for invalid status", async () => {
      const input = {
        challengeId: TEST_CHALLENGE_ID,
        newStatus: "INVALID_STATUS",
      };

      const result = await controller.updateStatus(input);

      expect(result.success).toBe(false);
    });
  });

  describe("[UNIT] list", () => {
    it("should return paginated list", async () => {
      const result = await controller.list({ limit: 10, offset: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should return error for invalid limit", async () => {
      const result = await controller.list({ limit: 200 });

      expect(result.success).toBe(false);
    });
  });

  describe("[UNIT] listByStatus", () => {
    it("should return challenges by status", async () => {
      const result = await controller.listByStatus({
        status: "ACTIVE",
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should apply pagination", async () => {
      mockChallengeRepository.findByStatus = mock(() =>
        Effect.succeed([
          createMockChallenge({ id: "550e8400-e29b-41d4-a716-446655440003" }),
          createMockChallenge({ id: "550e8400-e29b-41d4-a716-446655440004" }),
          createMockChallenge({ id: "550e8400-e29b-41d4-a716-446655440005" }),
        ]),
      );

      const result = await controller.listByStatus({
        status: "ACTIVE",
        limit: 2,
        offset: 0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe("[UNIT] findActive", () => {
    it("should return active challenges", async () => {
      const result = await controller.findActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("[UNIT] findOpenForSubmission", () => {
    it("should return open challenges", async () => {
      const result = await controller.findOpenForSubmission();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });
});
