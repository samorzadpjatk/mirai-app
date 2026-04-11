import { describe, it, expect, mock } from "bun:test";
import {
  UpdateSubmissionUseCase,
  type UpdateSubmissionInput,
} from "./UpdateSubmission";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] UpdateSubmissionUseCase", () => {
  const createValidSubmission = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
      status: string;
    }>,
  ): ChallengeSubmission => {
    const result = ChallengeSubmission.create({
      id: overrides?.id ?? "submission-123",
      challengeId: overrides?.challengeId ?? "challenge-123",
      groupId: overrides?.groupId ?? "group-123",
      imageIds: ["image-1"],
      videoId: null,
      textContent: "Test content",
      latitude: 52.52,
      longitude: 13.405,
    });
    if (result.kind === "err") {
      throw new Error(
        `Failed to create test submission: ${result.error.message}`,
      );
    }
    return result.value;
  };

  const createMockRepo = (
    overrides?: Partial<ChallengeSubmissionRepository>,
  ): ChallengeSubmissionRepository => ({
    create: mock(() => Promise.resolve(createValidSubmission() as any)),
    findById: mock(() => Promise.resolve(null)),
    findByChallengeAndGroup: mock(() => Promise.resolve(null)),
    findByChallengeId: mock(() => Promise.resolve([])),
    findByGroupId: mock(() => Promise.resolve([])),
    findByStatus: mock(() => Promise.resolve([])),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(createValidSubmission() as any)),
    delete: mock(() => Promise.resolve()),
    existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
    countByChallengeId: mock(() => Promise.resolve(0)),
    countByChallengeAndStatus: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  describe("execute", () => {
    it("should update submission content successfully", async () => {
      const existingSubmission = createValidSubmission({
        id: "submission-456",
        status: "PENDING",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSubmission)),
        update: mock(() => Promise.resolve(existingSubmission)),
      });

      const useCase = new UpdateSubmissionUseCase(mockRepo);
      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        textContent: "Updated content",
        latitude: 48.8566,
        longitude: 2.3522,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("submission-456");
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("submission-456");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should approve submission successfully", async () => {
      const existingSubmission = createValidSubmission({
        id: "submission-456",
        status: "PENDING",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSubmission)),
        update: mock(() => Promise.resolve(existingSubmission)),
      });

      const useCase = new UpdateSubmissionUseCase(mockRepo);
      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "APPROVE",
        reviewedById: "moderator-123",
        awardedPoints: 100,
        bonusPoints: 50,
        ranking: 1,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should reject submission successfully", async () => {
      const existingSubmission = createValidSubmission({
        id: "submission-456",
        status: "PENDING",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSubmission)),
        update: mock(() => Promise.resolve(existingSubmission)),
      });

      const useCase = new UpdateSubmissionUseCase(mockRepo);
      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "REJECT",
        reviewedById: "moderator-123",
        rejectionReason: "Content does not meet requirements",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should return error when submission not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new UpdateSubmissionUseCase(mockRepo);
      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
        textContent: "Updated content",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Submission not found");
      }
    });

    it("should return error for invalid review action", async () => {
      const existingSubmission = createValidSubmission({
        id: "submission-456",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSubmission)),
      });

      const useCase = new UpdateSubmissionUseCase(mockRepo);
      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "INVALID" as any,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Invalid review action");
      }
    });

    it("should handle repository errors", async () => {
      const existingSubmission = createValidSubmission({
        id: "submission-456",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSubmission)),
        update: mock(() => Promise.reject(new Error("Update failed"))),
      });

      const useCase = new UpdateSubmissionUseCase(mockRepo);
      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        textContent: "Updated content",
      };

      await expect(useCase.execute(input)).rejects.toThrow("Update failed");
    });
  });
});
