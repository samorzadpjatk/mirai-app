import { describe, it, expect, mock } from "bun:test";
import {
  DeleteSubmissionUseCase,
  type DeleteSubmissionInput,
} from "./DeleteSubmission";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] DeleteSubmissionUseCase", () => {
  const createValidSubmission = (
    overrides?: Partial<{
      id: string;
      status: string;
    }>,
  ): ChallengeSubmission => {
    const result = ChallengeSubmission.create({
      id: overrides?.id ?? "submission-123",
      challengeId: "challenge-123",
      groupId: "group-123",
      imageIds: [],
      videoId: null,
      textContent: "Test content",
      latitude: null,
      longitude: null,
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
    it("should delete submission successfully when pending", async () => {
      const existingSubmission = createValidSubmission({
        id: "submission-456",
        status: "PENDING",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSubmission)),
        delete: mock(() => Promise.resolve()),
      });

      const useCase = new DeleteSubmissionUseCase(mockRepo);
      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.success).toBe(true);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("submission-456");
      expect(mockRepo.delete).toHaveBeenCalledWith("submission-456");
    });

    it("should return error when submission not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new DeleteSubmissionUseCase(mockRepo);
      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Submission not found");
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should return error when submission is already approved", async () => {
      // Create an approved submission by first creating it, then approving it
      const pendingSubmission = createValidSubmission({
        id: "submission-approved",
      });
      const approvedResult = pendingSubmission.approve({
        reviewedById: "moderator-123",
        awardedPoints: 100,
      });
      if (approvedResult.kind === "err") {
        throw new Error("Failed to approve submission");
      }
      const approvedSubmission = approvedResult.value;

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(approvedSubmission)),
      });

      const useCase = new DeleteSubmissionUseCase(mockRepo);
      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-approved"),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Cannot delete an approved or rejected submission",
        );
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const existingSubmission = createValidSubmission({
        id: "submission-456",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSubmission)),
        delete: mock(() => Promise.reject(new Error("Delete failed"))),
      });

      const useCase = new DeleteSubmissionUseCase(mockRepo);
      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
      };

      await expect(useCase.execute(input)).rejects.toThrow("Delete failed");
    });
  });
});
