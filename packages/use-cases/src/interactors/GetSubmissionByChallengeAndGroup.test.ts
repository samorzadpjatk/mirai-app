import { describe, it, expect, mock } from "bun:test";
import {
  GetSubmissionByChallengeAndGroupUseCase,
  type GetSubmissionByChallengeAndGroupInput,
} from "./GetSubmissionByChallengeAndGroup";
import { SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] GetSubmissionByChallengeAndGroupUseCase", () => {
  const createMockSubmission = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
      status: string;
    }>,
  ) => ({
    id: SubmissionId.unsafeCreate(overrides?.id ?? "submission-123"),
    challengeId: overrides?.challengeId ?? "challenge-123",
    groupId: overrides?.groupId ?? "group-123",
    imageIds: ["image-1"],
    videoId: null,
    textContent: "Test content",
    latitude: 52.52,
    longitude: 13.405,
    status: overrides?.status ?? "PENDING",
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
      id: overrides?.groupId ?? "group-123",
      name: "Test Group",
      image: null,
      coins: 500,
    },
    reviewedBy: null,
  });

  const createMockRepo = (
    overrides?: Partial<ChallengeSubmissionRepository>,
  ): ChallengeSubmissionRepository => ({
    create: mock(() => Promise.resolve(createMockSubmission() as any)),
    findById: mock(() => Promise.resolve(null)),
    findByChallengeAndGroup: mock(() => Promise.resolve(null)),
    findByChallengeId: mock(() => Promise.resolve([])),
    findByGroupId: mock(() => Promise.resolve([])),
    findByStatus: mock(() => Promise.resolve([])),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(createMockSubmission() as any)),
    delete: mock(() => Promise.resolve()),
    existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
    countByChallengeId: mock(() => Promise.resolve(0)),
    countByChallengeAndStatus: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  describe("execute", () => {
    it("should return submission when found", async () => {
      const mockSubmission = createMockSubmission({
        id: "submission-456",
        challengeId: "challenge-456",
        groupId: "group-456",
        status: "APPROVED",
      });
      const mockRepo = createMockRepo({
        findByChallengeAndGroup: mock(() =>
          Promise.resolve(mockSubmission as any),
        ),
      });

      const useCase = new GetSubmissionByChallengeAndGroupUseCase(mockRepo);
      const input: GetSubmissionByChallengeAndGroupInput = {
        challengeId: "challenge-456",
        groupId: "group-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).not.toBeNull();
        expect(result.value?.id).toBe("submission-456");
        expect(result.value?.challengeId).toBe("challenge-456");
        expect(result.value?.groupId).toBe("group-456");
        expect(result.value?.status).toBe("APPROVED");
        expect(result.value?.group?.name).toBe("Test Group");
      }
      expect(mockRepo.findByChallengeAndGroup).toHaveBeenCalledWith(
        "challenge-456",
        "group-456",
      );
    });

    it("should return null when submission not found", async () => {
      const mockRepo = createMockRepo({
        findByChallengeAndGroup: mock(() => Promise.resolve(null)),
      });

      const useCase = new GetSubmissionByChallengeAndGroupUseCase(mockRepo);
      const input: GetSubmissionByChallengeAndGroupInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toBeNull();
      }
    });

    it("should return submission with reviewer info when available", async () => {
      const mockSubmission = {
        ...createMockSubmission({
          id: "submission-reviewed",
          status: "REJECTED",
        }),
        reviewedById: "user-123",
        reviewedAt: new Date(),
        rejectionReason: "Invalid submission",
        reviewedBy: {
          id: "user-123",
          firstName: "Reviewer",
          lastName: "User",
          email: "reviewer@example.com",
        },
      };
      const mockRepo = createMockRepo({
        findByChallengeAndGroup: mock(() =>
          Promise.resolve(mockSubmission as any),
        ),
      });

      const useCase = new GetSubmissionByChallengeAndGroupUseCase(mockRepo);
      const input: GetSubmissionByChallengeAndGroupInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok" && result.value) {
        expect(result.value.status).toBe("REJECTED");
        expect(result.value.rejectionReason).toBe("Invalid submission");
        expect(result.value.reviewedBy?.firstName).toBe("Reviewer");
        expect(result.value.reviewedAt).toBeInstanceOf(Date);
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findByChallengeAndGroup: mock(() =>
          Promise.reject(new Error("DB error")),
        ),
      });

      const useCase = new GetSubmissionByChallengeAndGroupUseCase(mockRepo);
      const input: GetSubmissionByChallengeAndGroupInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
