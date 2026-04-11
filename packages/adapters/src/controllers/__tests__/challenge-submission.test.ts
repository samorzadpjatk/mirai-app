import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ChallengeSubmissionController } from "../challenge-submission";
import type { ChallengeSubmissionRepository } from "@mirai-app/use-cases";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";

// Mock ChallengeSubmission
const createMockSubmission = (
  overrides?: Partial<ChallengeSubmission>,
): ChallengeSubmission =>
  ({
    id: "sub-123" as SubmissionId,
    challengeId: "challenge-123",
    groupId: "group-123",
    status: "PENDING",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }) as ChallengeSubmission;

describe("[UNIT] ChallengeSubmissionController", () => {
  let controller: ChallengeSubmissionController;
  let mockSubmissionRepository: ChallengeSubmissionRepository;

  beforeEach(() => {
    mockSubmissionRepository = {
      findById: mock(() => Promise.resolve(createMockSubmission())),
      findByChallengeId: mock(() =>
        Promise.resolve({
          submissions: [createMockSubmission()],
          totalCount: 1,
        }),
      ),
      findByChallengeAndGroup: mock(() =>
        Promise.resolve(createMockSubmission()),
      ),
      create: mock((s: ChallengeSubmission) => Promise.resolve(s)),
      update: mock((s: ChallengeSubmission) => Promise.resolve(s)),
      delete: mock(() => Promise.resolve()),
    } as unknown as ChallengeSubmissionRepository;

    controller = new ChallengeSubmissionController(mockSubmissionRepository);
  });

  describe("getById", () => {
    it("should return submission by ID", async () => {
      const result = await controller.getById({ submissionId: "sub-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("sub-123");
      }
    });

    it("should return error when submission not found", async () => {
      mockSubmissionRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ submissionId: "sub-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("getByChallengeAndGroup", () => {
    it("should return submission for challenge and group", async () => {
      const result = await controller.getByChallengeAndGroup({
        challengeId: "challenge-123",
        groupId: "group-123",
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.challengeId).toBe("challenge-123");
      }
    });

    it("should return null when no submission found", async () => {
      mockSubmissionRepository.findByChallengeAndGroup = mock(() =>
        Promise.resolve(null),
      );

      const result = await controller.getByChallengeAndGroup({
        challengeId: "challenge-123",
        groupId: "group-123",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("listByChallenge", () => {
    it("should return submissions for challenge", async () => {
      const result = await controller.listByChallenge({
        challengeId: "challenge-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissions).toHaveLength(1);
      }
    });

    it("should support ordering", async () => {
      const result = await controller.listByChallenge({
        challengeId: "challenge-123",
        orderBy: "voteScore",
        orderDirection: "desc",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("create", () => {
    it("should create submission with valid input", async () => {
      const input = {
        challengeId: "challenge-123",
        groupId: "group-123",
        imageIds: ["img-1", "img-2"],
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
    });

    it("should support video submission", async () => {
      const input = {
        challengeId: "challenge-123",
        groupId: "group-123",
        videoId: "video-123",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
    });

    it("should support location data", async () => {
      const input = {
        challengeId: "challenge-123",
        groupId: "group-123",
        latitude: 40.7128,
        longitude: -74.006,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
    });
  });

  describe("update", () => {
    it("should update submission content", async () => {
      const input = {
        submissionId: "sub-123",
        imageIds: ["new-img-1"],
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should support review action", async () => {
      const input = {
        submissionId: "sub-123",
        reviewAction: "APPROVE",
        reviewedById: "admin-123",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should support rejection with reason", async () => {
      const input = {
        submissionId: "sub-123",
        reviewAction: "REJECT",
        reviewedById: "admin-123",
        rejectionReason: "Inappropriate content",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should support awarding points", async () => {
      const input = {
        submissionId: "sub-123",
        awardedPoints: 100,
        bonusPoints: 20,
        ranking: 1,
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete submission", async () => {
      const result = await controller.delete({ submissionId: "sub-123" });

      expect(result.success).toBe(true);
    });
  });
});
