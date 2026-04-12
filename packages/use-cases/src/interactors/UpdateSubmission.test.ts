import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateSubmissionUseCase,
  type UpdateSubmissionInput,
  SubmissionUpdateNotFoundError,
  SubmissionUpdateValidationError,
  InvalidReviewActionError,
  UpdateSubmissionRepositoryError,
} from "./UpdateSubmission";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";
import { InMemoryChallengeSubmissionRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] updateSubmissionUseCase (Effect)", () => {
  let repo: InMemoryChallengeSubmissionRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeSubmissionRepository();
  });

  // Helper to create a valid submission
  const createValidSubmission = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
    }>,
  ) => {
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

  // Helper to run use case with repository
  const runUseCase = async (input: UpdateSubmissionInput) => {
    const program = updateSubmissionUseCase(input).pipe(
      Effect.provideService(ChallengeSubmissionRepositoryTag, {
        create: (submission: ChallengeSubmission) =>
          Effect.promise(() => repo.create(submission)),
        findById: (id: SubmissionId) => Effect.promise(() => repo.findById(id)),
        findByChallengeAndGroup: (challengeId: string, groupId: string) =>
          Effect.promise(() =>
            repo.findByChallengeAndGroup(challengeId, groupId),
          ),
        findByChallengeId: (challengeId: string) =>
          Effect.promise(() => repo.findByChallengeId(challengeId)),
        findByGroupId: (groupId: string) =>
          Effect.promise(() => repo.findByGroupId(groupId)),
        findByStatus: (status: any) =>
          Effect.promise(() => repo.findByStatus(status)),
        findMany: (params: any) => Effect.promise(() => repo.findMany(params)),
        update: (submission: ChallengeSubmission) =>
          Effect.promise(() => repo.update(submission)),
        delete: (id: SubmissionId) => Effect.promise(() => repo.delete(id)),
        existsForChallengeAndGroup: (challengeId: string, groupId: string) =>
          Effect.promise(() =>
            repo.existsForChallengeAndGroup(challengeId, groupId),
          ),
        countByChallengeId: (challengeId: string) =>
          Effect.promise(() => repo.countByChallengeId(challengeId)),
        countByChallengeAndStatus: (challengeId: string, status: any) =>
          Effect.promise(() =>
            repo.countByChallengeAndStatus(challengeId, status),
          ),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should update submission content successfully", async () => {
      // Arrange
      const submission = createValidSubmission({ id: "submission-456" });
      await repo.create(submission);

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        textContent: "Updated content",
        latitude: 48.8566,
        longitude: 2.3522,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("submission-456");
      expect(result.textContent).toBe("Updated content");
      expect(result.latitude).toBe(48.8566);
      expect(result.longitude).toBe(2.3522);
      expect(result.updatedAt).toBeInstanceOf(Date);

      // Verify stored
      const stored = await repo.findById(
        SubmissionId.unsafeCreate("submission-456"),
      );
      expect(stored?.textContent).toBe("Updated content");
    });

    it("should approve submission successfully", async () => {
      // Arrange
      const submission = createValidSubmission({ id: "submission-456" });
      await repo.create(submission);

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "APPROVE",
        reviewedById: "moderator-123",
        awardedPoints: 100,
        bonusPoints: 50,
        ranking: 1,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe("APPROVED");
      expect(result.awardedPoints).toBe(100);
      expect(result.bonusPoints).toBe(50);
      expect(result.ranking).toBe(1);
      expect(result.reviewedById).toBe("moderator-123");
      expect(result.reviewedAt).toBeInstanceOf(Date);
    });

    it("should reject submission successfully", async () => {
      // Arrange
      const submission = createValidSubmission({ id: "submission-456" });
      await repo.create(submission);

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "REJECT",
        reviewedById: "moderator-123",
        rejectionReason: "Content does not meet requirements",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe("REJECTED");
      expect(result.rejectionReason).toBe("Content does not meet requirements");
      expect(result.reviewedById).toBe("moderator-123");
      expect(result.reviewedAt).toBeInstanceOf(Date);
    });

    it("should return error when submission not found", async () => {
      // Arrange
      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
        textContent: "Updated content",
      };

      // Act
      const program = updateSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionRepositoryTag, {
          create: (s: ChallengeSubmission) =>
            Effect.promise(() => repo.create(s)),
          findById: (id: SubmissionId) =>
            Effect.promise(() => repo.findById(id)),
          findByChallengeAndGroup: (challengeId: string, groupId: string) =>
            Effect.promise(() =>
              repo.findByChallengeAndGroup(challengeId, groupId),
            ),
          findByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.findByChallengeId(challengeId)),
          findByGroupId: (groupId: string) =>
            Effect.promise(() => repo.findByGroupId(groupId)),
          findByStatus: (status: any) =>
            Effect.promise(() => repo.findByStatus(status)),
          findMany: (params: any) =>
            Effect.promise(() => repo.findMany(params)),
          update: (s: ChallengeSubmission) =>
            Effect.promise(() => repo.update(s)),
          delete: (id: SubmissionId) => Effect.promise(() => repo.delete(id)),
          existsForChallengeAndGroup: (challengeId: string, groupId: string) =>
            Effect.promise(() =>
              repo.existsForChallengeAndGroup(challengeId, groupId),
            ),
          countByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.countByChallengeId(challengeId)),
          countByChallengeAndStatus: (challengeId: string, status: any) =>
            Effect.promise(() =>
              repo.countByChallengeAndStatus(challengeId, status),
            ),
        }),
      );

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SubmissionUpdateNotFoundError);
      }
    });

    it("should return error for invalid review action", async () => {
      // Arrange
      const submission = createValidSubmission({ id: "submission-456" });
      await repo.create(submission);

      const input: UpdateSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
        reviewAction: "INVALID" as any,
      };

      // Act
      const program = updateSubmissionUseCase(input).pipe(
        Effect.provideService(ChallengeSubmissionRepositoryTag, {
          create: (s: ChallengeSubmission) =>
            Effect.promise(() => repo.create(s)),
          findById: (id: SubmissionId) =>
            Effect.promise(() => repo.findById(id)),
          findByChallengeAndGroup: (challengeId: string, groupId: string) =>
            Effect.promise(() =>
              repo.findByChallengeAndGroup(challengeId, groupId),
            ),
          findByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.findByChallengeId(challengeId)),
          findByGroupId: (groupId: string) =>
            Effect.promise(() => repo.findByGroupId(groupId)),
          findByStatus: (status: any) =>
            Effect.promise(() => repo.findByStatus(status)),
          findMany: (params: any) =>
            Effect.promise(() => repo.findMany(params)),
          update: (s: ChallengeSubmission) =>
            Effect.promise(() => repo.update(s)),
          delete: (id: SubmissionId) => Effect.promise(() => repo.delete(id)),
          existsForChallengeAndGroup: (challengeId: string, groupId: string) =>
            Effect.promise(() =>
              repo.existsForChallengeAndGroup(challengeId, groupId),
            ),
          countByChallengeId: (challengeId: string) =>
            Effect.promise(() => repo.countByChallengeId(challengeId)),
          countByChallengeAndStatus: (challengeId: string, status: any) =>
            Effect.promise(() =>
              repo.countByChallengeAndStatus(challengeId, status),
            ),
        }),
      );

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidReviewActionError);
      }
    });
  });
});
