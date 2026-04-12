import { describe, it, expect, beforeEach } from "bun:test";
import {
  getSubmissionUseCase,
  type GetSubmissionInput,
  SubmissionNotFoundError,
  GetSubmissionRepositoryError,
} from "./GetSubmission";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";
import { InMemoryChallengeSubmissionRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getSubmissionUseCase (Effect)", () => {
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
      status: string;
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
  const runUseCase = async (input: GetSubmissionInput) => {
    const program = getSubmissionUseCase(input).pipe(
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
    it("should return submission when found", async () => {
      // Arrange
      const submission = createValidSubmission({
        id: "submission-456",
        challengeId: "challenge-456",
        groupId: "group-456",
      });
      await repo.create(submission);

      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-456"),
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("submission-456");
      expect(result.challengeId).toBe("challenge-456");
      expect(result.groupId).toBe("group-456");
      expect(result.status).toBe("PENDING");
      expect(result.awardedPoints).toBe(0);
      expect(result.voteCount).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should return error when submission not found", async () => {
      // Arrange
      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("non-existent"),
      };

      // Act
      const program = getSubmissionUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(SubmissionNotFoundError);
      }
    });

    it("should return submission with group info when available", async () => {
      // Arrange - create submission with group data
      const submission = createValidSubmission({ id: "submission-with-group" });
      await repo.create(submission);

      // Manually seed with group info (adapter layer would normally populate this)
      const submissionWithGroup = await repo.findById(
        SubmissionId.unsafeCreate("submission-with-group"),
      );
      if (submissionWithGroup) {
        Object.assign(submissionWithGroup, {
          group: {
            id: "group-123",
            name: "Test Group",
            image: "/group/image.png",
            coins: 500,
          },
        });
      }

      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-with-group"),
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.group).not.toBeNull();
      expect(result.group?.name).toBe("Test Group");
      expect(result.group?.coins).toBe(500);
    });

    it("should return submission with reviewer info when available", async () => {
      // Arrange - create and approve a submission
      const submission = createValidSubmission({ id: "submission-reviewed" });
      await repo.create(submission);

      const approved = await Effect.runPromise(
        submission.approve({ reviewedById: "user-123", awardedPoints: 100 }),
      );
      await repo.update(approved);

      // Manually add reviewer info
      const submissionWithReviewer = await repo.findById(
        SubmissionId.unsafeCreate("submission-reviewed"),
      );
      if (submissionWithReviewer) {
        Object.assign(submissionWithReviewer, {
          reviewedBy: {
            id: "user-123",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
        });
      }

      const input: GetSubmissionInput = {
        submissionId: SubmissionId.unsafeCreate("submission-reviewed"),
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.reviewedBy).not.toBeNull();
      expect(result.reviewedBy?.firstName).toBe("John");
      expect(result.reviewedBy?.email).toBe("john@example.com");
      expect(result.reviewedAt).toBeInstanceOf(Date);
    });
  });
});
