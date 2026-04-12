import { describe, it, expect, beforeEach } from "bun:test";
import {
  createSubmissionUseCase,
  type CreateSubmissionInput,
  SubmissionCreationError,
  DuplicateSubmissionError,
  SubmissionRepositoryError,
} from "./CreateSubmission";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";
import { InMemoryChallengeSubmissionRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] createSubmissionUseCase (Effect)", () => {
  let repo: InMemoryChallengeSubmissionRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeSubmissionRepository();
  });

  // Helper to create a valid submission input
  const createValidInput = (): CreateSubmissionInput => ({
    challengeId: "challenge-123",
    groupId: "group-123",
    imageIds: ["image-1", "image-2"],
    textContent: "Test submission content",
    latitude: 52.52,
    longitude: 13.405,
  });

  // Helper to run use case with repository
  const runUseCase = async (input: CreateSubmissionInput) => {
    const program = createSubmissionUseCase(input).pipe(
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
    it("should create submission successfully", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.challengeId).toBe("challenge-123");
      expect(result.groupId).toBe("group-123");
      expect(result.imageIds).toHaveLength(2);
      expect(result.textContent).toBe("Test submission content");
      expect(result.latitude).toBe(52.52);
      expect(result.longitude).toBe(13.405);
      expect(result.status).toBe("PENDING");
      expect(result.awardedPoints).toBe(0);
      expect(result.bonusPoints).toBe(0);
      expect(result.voteCount).toBe(0);
      expect(result.voteScore).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);

      // Verify submission was actually stored
      const stored = await repo.findByChallengeId("challenge-123");
      expect(stored).toHaveLength(1);
      expect(stored[0]?.groupId).toBe("group-123");
    });

    it("should return error when submission already exists", async () => {
      // Arrange - create an existing submission
      const submission = ChallengeSubmission.create({
        id: "existing-submission",
        challengeId: "challenge-123",
        groupId: "group-123",
        imageIds: [],
        videoId: null,
        textContent: null,
        latitude: null,
        longitude: null,
      });
      if (submission.kind === "err") {
        throw new Error("Failed to create test submission");
      }
      await repo.create(submission.value);

      const input = createValidInput();

      // Act
      const program = createSubmissionUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(DuplicateSubmissionError);
      }
    });

    it("should create submission with video", async () => {
      // Arrange
      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
        videoId: "video-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.videoId).toBe("video-123");
      expect(result.status).toBe("PENDING");

      // Verify stored
      const stored = await repo.findByChallengeId("challenge-123");
      expect(stored).toHaveLength(1);
    });

    it("should return error when validation fails", async () => {
      // Arrange
      const input: CreateSubmissionInput = {
        challengeId: "", // Invalid empty challengeId
        groupId: "group-123",
      };

      // Act
      const program = createSubmissionUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(SubmissionCreationError);
      }
    });

    it("should create minimal submission with only required fields", async () => {
      // Arrange
      const input: CreateSubmissionInput = {
        challengeId: "challenge-123",
        groupId: "group-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.videoId).toBeNull();
      expect(result.textContent).toBeNull();
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
      expect(result.imageIds).toHaveLength(0);
    });
  });
});
