import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { ChallengeSubmissionController } from "../challenge-submission";
import type { ChallengeSubmissionRepository } from "@mirai-app/use-cases";
import {
  ChallengeSubmission,
  SubmissionId,
  type SubmissionStatus,
} from "@mirai-app/domain";

// Valid UUIDs for testing
const SUBMISSION_ID = SubmissionId.unsafeCreate(
  "550e8400-e29b-41d4-a716-446655440000",
);
const CHALLENGE_ID = "550e8400-e29b-41d4-a716-446655440001";
const GROUP_ID = "550e8400-e29b-41d4-a716-446655440002";

// Helper to create a mock submission
const createMockSubmission = (
  overrides?: Partial<ChallengeSubmission>,
): ChallengeSubmission =>
  ({
    id: SUBMISSION_ID,
    challengeId: CHALLENGE_ID,
    groupId: GROUP_ID,
    status: "PENDING" as SubmissionStatus,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    // Add required methods for the use cases
    updateContent: function (content: {
      imageIds?: string[];
      videoId?: string | null;
      textContent?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    }) {
      return Effect.succeed({
        ...this,
        content: { ...this.content, ...content },
        updatedAt: new Date(),
      });
    },
    approve: function (props: {
      reviewedById: string;
      awardedPoints?: number;
      bonusPoints?: number;
      ranking?: number | null;
    }) {
      return Effect.succeed({
        ...this,
        status: "APPROVED" as SubmissionStatus,
        reviewedById: props.reviewedById,
        awardedPoints: props.awardedPoints ?? 0,
        bonusPoints: props.bonusPoints ?? 0,
        ranking: props.ranking ?? null,
        updatedAt: new Date(),
      });
    },
    reject: function (props: { reviewedById: string; reason?: string }) {
      return Effect.succeed({
        ...this,
        status: "REJECTED" as SubmissionStatus,
        reviewedById: props.reviewedById,
        rejectionReason: props.reason ?? null,
        updatedAt: new Date(),
      });
    },
    canDelete: function () {
      return true;
    },
    ...overrides,
  }) as ChallengeSubmission;

describe("[UNIT] ChallengeSubmissionController", () => {
  let controller: ChallengeSubmissionController;
  let mockSubmissionRepository: ChallengeSubmissionRepository;

  beforeEach(() => {
    mockSubmissionRepository = {
      findById: mock(() => Effect.succeed(createMockSubmission())),
      findByChallengeId: mock(() => Effect.succeed([createMockSubmission()])),
      findByChallengeAndGroup: mock(() =>
        Effect.succeed(createMockSubmission()),
      ),
      create: mock((s: ChallengeSubmission) => Effect.succeed(s)),
      update: mock((s: ChallengeSubmission) => Effect.succeed(s)),
      delete: mock(() => Effect.succeed(undefined)),
      findByGroupId: mock(() => Effect.succeed([])),
      findByStatus: mock(() => Effect.succeed([])),
      findMany: mock(() =>
        Effect.succeed([
          {
            id: SUBMISSION_ID,
            challengeId: CHALLENGE_ID,
            groupId: GROUP_ID,
            imageIds: [],
            videoId: null,
            textContent: null,
            latitude: null,
            longitude: null,
            status: "PENDING" as SubmissionStatus,
            reviewedById: null,
            reviewedAt: null,
            rejectionReason: null,
            awardedPoints: 0,
            bonusPoints: 0,
            ranking: null,
            voteCount: 0,
            voteScore: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            group: {
              id: GROUP_ID,
              name: "Test Group",
              image: null,
              coins: 100,
            },
            reviewedBy: null,
          },
        ]),
      ),
      existsForChallengeAndGroup: mock(() => Effect.succeed(false)),
      countByChallengeId: mock(() => Effect.succeed(1)),
      countByChallengeAndStatus: mock(() => Effect.succeed(1)),
    } as unknown as ChallengeSubmissionRepository;

    controller = new ChallengeSubmissionController(mockSubmissionRepository);
  });

  describe("getById", () => {
    it("should return submission by ID", async () => {
      const result = await controller.getById({
        submissionId: SubmissionId.toString(SUBMISSION_ID),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(SubmissionId.toString(SUBMISSION_ID));
      }
    });

    it("should return error when submission not found", async () => {
      mockSubmissionRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({
        submissionId: SubmissionId.toString(SUBMISSION_ID),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getByChallengeAndGroup", () => {
    it("should return submission for challenge and group", async () => {
      const result = await controller.getByChallengeAndGroup({
        challengeId: CHALLENGE_ID,
        groupId: GROUP_ID,
      });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.challengeId).toBe(CHALLENGE_ID);
      }
    });

    it("should return null when no submission found", async () => {
      mockSubmissionRepository.findByChallengeAndGroup = mock(() =>
        Effect.succeed(null),
      );

      const result = await controller.getByChallengeAndGroup({
        challengeId: CHALLENGE_ID,
        groupId: GROUP_ID,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("listByChallenge", () => {
    it("should return submissions for challenge", async () => {
      const result = await controller.listByChallenge({
        challengeId: CHALLENGE_ID,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissions).toHaveLength(1);
      }
    });

    it("should support ordering", async () => {
      const result = await controller.listByChallenge({
        challengeId: CHALLENGE_ID,
        orderBy: "voteScore",
        orderDirection: "desc",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("create", () => {
    it("should create submission with valid input", async () => {
      const input = {
        challengeId: CHALLENGE_ID,
        groupId: GROUP_ID,
        imageIds: ["img-1", "img-2"],
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
    });

    it("should support video submission", async () => {
      const input = {
        challengeId: CHALLENGE_ID,
        groupId: GROUP_ID,
        videoId: "video-123",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
    });

    it("should support location data", async () => {
      const input = {
        challengeId: CHALLENGE_ID,
        groupId: GROUP_ID,
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
        submissionId: SubmissionId.toString(SUBMISSION_ID),
        imageIds: ["new-img-1"],
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should support review action", async () => {
      const input = {
        submissionId: SubmissionId.toString(SUBMISSION_ID),
        reviewAction: "APPROVE" as const,
        reviewedById: "admin-123",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should support rejection with reason", async () => {
      const input = {
        submissionId: SubmissionId.toString(SUBMISSION_ID),
        reviewAction: "REJECT" as const,
        reviewedById: "admin-123",
        rejectionReason: "Inappropriate content",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should support awarding points", async () => {
      const input = {
        submissionId: SubmissionId.toString(SUBMISSION_ID),
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
      const result = await controller.delete({
        submissionId: SubmissionId.toString(SUBMISSION_ID),
      });

      expect(result.success).toBe(true);
    });
  });
});
