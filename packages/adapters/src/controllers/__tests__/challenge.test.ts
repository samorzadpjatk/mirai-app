import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ChallengeController } from "../challenge";
import type { ChallengeRepository } from "@mirai-app/use-cases";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

// Mock Challenge domain object
const createMockChallenge = (overrides?: Partial<Challenge>): Challenge =>
  ({
    id: "challenge-123",
    tripId: "trip-123",
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
    isActive: () => true,
    isOpenForSubmission: () => true,
    requiresLocation: () => false,
    requiresQRCode: () => false,
    hasVotingPhase: () => false,
    ...overrides,
  }) as Challenge;

describe("[UNIT] ChallengeController", () => {
  let controller: ChallengeController;
  let mockChallengeRepository: ChallengeRepository;

  beforeEach(() => {
    mockChallengeRepository = {
      findById: mock(() => Promise.resolve(createMockChallenge())),
      findByTripId: mock(() => Promise.resolve([createMockChallenge()])),
      create: mock((challenge: Challenge) => Promise.resolve(challenge)),
      update: mock((challenge: Challenge) => Promise.resolve(challenge)),
      findAll: mock(() => Promise.resolve([createMockChallenge()])),
      findActive: mock(() => Promise.resolve([createMockChallenge()])),
      findOpenForSubmission: mock(() =>
        Promise.resolve([createMockChallenge()]),
      ),
      findByStatus: mock(() => Promise.resolve([createMockChallenge()])),
    } as unknown as ChallengeRepository;

    controller = new ChallengeController(mockChallengeRepository);
  });

  describe("getById", () => {
    it("should return challenge by ID", async () => {
      const result = await controller.getById({ id: "challenge-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("challenge-123");
        expect(result.data.name).toBe("Test Challenge");
        expect(result.data.isOpenForSubmission).toBe(true);
      }
    });

    it("should return error for invalid ID", async () => {
      const result = await controller.getById({ id: "invalid" });

      expect(result.success).toBe(false);
    });

    it("should return error when challenge not found", async () => {
      mockChallengeRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "challenge-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("getByTripId", () => {
    it("should return challenges for trip", async () => {
      const result = await controller.getByTripId({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("create", () => {
    it("should create challenge with valid input", async () => {
      const input = {
        tripId: "trip-123",
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
        tripId: "trip-123",
        name: "Test",
        submissionType: "INVALID",
        scoringCategory: "SPEED",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });

    it("should return error for invalid time format", async () => {
      const input = {
        tripId: "trip-123",
        name: "Test",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        dailyStartTime: "25:00", // Invalid
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update challenge with valid input", async () => {
      const input = {
        challengeId: "challenge-123",
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

  describe("updateStatus", () => {
    it("should update challenge status", async () => {
      const input = {
        challengeId: "challenge-123",
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
        challengeId: "challenge-123",
        newStatus: "INVALID_STATUS",
      };

      const result = await controller.updateStatus(input);

      expect(result.success).toBe(false);
    });
  });

  describe("list", () => {
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

  describe("listByStatus", () => {
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
        Promise.resolve([
          createMockChallenge({ id: "c1" }),
          createMockChallenge({ id: "c2" }),
          createMockChallenge({ id: "c3" }),
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

  describe("findActive", () => {
    it("should return active challenges", async () => {
      const result = await controller.findActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("findOpenForSubmission", () => {
    it("should return open challenges", async () => {
      const result = await controller.findOpenForSubmission();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });
});
