import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteSubmissionUseCase,
  type DeleteSubmissionInput,
  SubmissionDeleteNotFoundError,
  SubmissionDeleteNotAllowedError,
  DeleteSubmissionRepositoryError,
} from "./DeleteSubmission";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";
import { InMemoryChallengeSubmissionRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] deleteSubmissionUseCase (Effect)", () => {
  let repo: InMemoryChallengeSubmissionRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeSubmissionRepository();
  });

  // Helper to create a valid submission
  const createValidSubmission = (
    overrides?: Partial<{
      id: string;
      status: string;
    }>,
  ) => {
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

  // Helper to run use case with repository
  const runUseCase = async (input: DeleteSubmissionInput) => {
    const program = deleteSubmissionUseCase(input).pipe(
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
    it("should delete submission successfully when pending", async () => {
      // Arrange
      const submission = createValidSubmission({ id: "submission-456" });
      await repo.create(submission);

      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify deleted
      const stored = await repo.findById(
        SubmissionId.unsafeCreate("submission-456"),
      );
      expect(stored).toBeNull();
    });

    it("should return error when submission not found", async () => {
      // Arrange
      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
      };

      // Act
      const program = deleteSubmissionUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(SubmissionDeleteNotFoundError);
      }
    });

    it("should return error when submission is already approved", async () => {
      // Arrange - create and approve submission
      const submission = createValidSubmission({ id: "submission-approved" });
      await repo.create(submission);

      const approved = await Effect.runPromise(
        submission.approve({
          reviewedById: "moderator-123",
          awardedPoints: 100,
        }),
      );
      await repo.update(approved);

      const input: DeleteSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-approved"),
      };

      // Act
      const program = deleteSubmissionUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(SubmissionDeleteNotAllowedError);
        expect(either.left.message).toBe(
          "Cannot delete an approved or rejected submission",
        );
      }

      // Verify not deleted
      const stored = await repo.findById(
        SubmissionId.unsafeCreate("submission-approved"),
      );
      expect(stored).not.toBeNull();
    });
  });
});
