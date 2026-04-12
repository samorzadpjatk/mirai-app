import { describe, it, expect, mock } from "bun:test";
import {
  deleteChallengeUseCase,
  type DeleteChallengeInput,
  ChallengeNotFoundError,
  ChallengeAlreadyActiveError,
} from "./DeleteChallenge";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeRepositoryTag } from "../ports/ChallengeRepository";
import type { ChallengeRepository } from "../ports/ChallengeRepository";

describe("[UNIT] deleteChallengeUseCase (Effect)", () => {
  // Helper to create a valid challenge via Effect
  const createChallengeEffect = (
    overrides?: Partial<{
      id: string;
      name: string;
      status: ChallengeStatus;
    }>,
  ): Effect.Effect<Challenge, never, never> => {
    return Challenge.create({
      id: overrides?.id ?? "challenge-123",
      tripId: "trip-123",
      name: overrides?.name ?? "Test Challenge",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.UNLIMITED,
      status: overrides?.status ?? ChallengeStatus.HIDDEN,
      basePoints: 100,
    }).pipe(Effect.orDie);
  };

  describe("execute", () => {
    it("should delete challenge when found and not active", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-456",
          status: ChallengeStatus.HIDDEN,
        }),
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
        findById: mock(() => Promise.resolve(mockChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const input: DeleteChallengeInput = {
        challengeId: "challenge-456",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, {
          create: (challenge) =>
            Effect.promise(() => mockRepo.create(challenge)),
          findById: (id) => Effect.promise(() => mockRepo.findById(id)),
          findByTripId: (tripId) =>
            Effect.promise(() => mockRepo.findByTripId(tripId)),
          findByStatus: (status) =>
            Effect.promise(() => mockRepo.findByStatus(status)),
          findByTripIdAndStatus: (tripId, status) =>
            Effect.promise(() =>
              mockRepo.findByTripIdAndStatus(tripId, status),
            ),
          findBySubmissionType: (type) =>
            Effect.promise(() => mockRepo.findBySubmissionType(type)),
          findByScoringCategory: (category) =>
            Effect.promise(() => mockRepo.findByScoringCategory(category)),
          findActive: () => Effect.promise(() => mockRepo.findActive()),
          findOpenForSubmission: () =>
            Effect.promise(() => mockRepo.findOpenForSubmission()),
          findRecurring: () => Effect.promise(() => mockRepo.findRecurring()),
          findAll: (options) => Effect.promise(() => mockRepo.findAll(options)),
          update: (challenge) =>
            Effect.promise(() => mockRepo.update(challenge)),
          updateStatus: (id, status) =>
            Effect.promise(() => mockRepo.updateStatus(id, status)),
          delete: (id) => Effect.promise(() => mockRepo.delete(id)),
          exists: (id) => Effect.promise(() => mockRepo.exists(id)),
          countByTripId: (tripId) =>
            Effect.promise(() => mockRepo.countByTripId(tripId)),
        }),
      );

      const result = await Effect.runPromise(program);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Challenge deleted successfully");
      expect(mockRepo.findById).toHaveBeenCalledWith("challenge-456");
      expect(mockRepo.delete).toHaveBeenCalledWith("challenge-456");
    });

    it("should return error when challenge not found", async () => {
      // Arrange
      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve({} as Challenge)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as Challenge)),
        updateStatus: mock(() => Promise.resolve({} as Challenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      const input: DeleteChallengeInput = {
        challengeId: "non-existent-id",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, {
          create: (challenge) =>
            Effect.promise(() => mockRepo.create(challenge)),
          findById: (id) => Effect.promise(() => mockRepo.findById(id)),
          findByTripId: (tripId) =>
            Effect.promise(() => mockRepo.findByTripId(tripId)),
          findByStatus: (status) =>
            Effect.promise(() => mockRepo.findByStatus(status)),
          findByTripIdAndStatus: (tripId, status) =>
            Effect.promise(() =>
              mockRepo.findByTripIdAndStatus(tripId, status),
            ),
          findBySubmissionType: (type) =>
            Effect.promise(() => mockRepo.findBySubmissionType(type)),
          findByScoringCategory: (category) =>
            Effect.promise(() => mockRepo.findByScoringCategory(category)),
          findActive: () => Effect.promise(() => mockRepo.findActive()),
          findOpenForSubmission: () =>
            Effect.promise(() => mockRepo.findOpenForSubmission()),
          findRecurring: () => Effect.promise(() => mockRepo.findRecurring()),
          findAll: (options) => Effect.promise(() => mockRepo.findAll(options)),
          update: (challenge) =>
            Effect.promise(() => mockRepo.update(challenge)),
          updateStatus: (id, status) =>
            Effect.promise(() => mockRepo.updateStatus(id, status)),
          delete: (id) => Effect.promise(() => mockRepo.delete(id)),
          exists: (id) => Effect.promise(() => mockRepo.exists(id)),
          countByTripId: (tripId) =>
            Effect.promise(() => mockRepo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
        expect(either.left.message).toBe("Challenge not found");
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should return error when challenge is active", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-active",
          status: ChallengeStatus.ACTIVE,
        }),
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
        findById: mock(() => Promise.resolve(mockChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const input: DeleteChallengeInput = {
        challengeId: "challenge-active",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, {
          create: (challenge) =>
            Effect.promise(() => mockRepo.create(challenge)),
          findById: (id) => Effect.promise(() => mockRepo.findById(id)),
          findByTripId: (tripId) =>
            Effect.promise(() => mockRepo.findByTripId(tripId)),
          findByStatus: (status) =>
            Effect.promise(() => mockRepo.findByStatus(status)),
          findByTripIdAndStatus: (tripId, status) =>
            Effect.promise(() =>
              mockRepo.findByTripIdAndStatus(tripId, status),
            ),
          findBySubmissionType: (type) =>
            Effect.promise(() => mockRepo.findBySubmissionType(type)),
          findByScoringCategory: (category) =>
            Effect.promise(() => mockRepo.findByScoringCategory(category)),
          findActive: () => Effect.promise(() => mockRepo.findActive()),
          findOpenForSubmission: () =>
            Effect.promise(() => mockRepo.findOpenForSubmission()),
          findRecurring: () => Effect.promise(() => mockRepo.findRecurring()),
          findAll: (options) => Effect.promise(() => mockRepo.findAll(options)),
          update: (challenge) =>
            Effect.promise(() => mockRepo.update(challenge)),
          updateStatus: (id, status) =>
            Effect.promise(() => mockRepo.updateStatus(id, status)),
          delete: (id) => Effect.promise(() => mockRepo.delete(id)),
          exists: (id) => Effect.promise(() => mockRepo.exists(id)),
          countByTripId: (tripId) =>
            Effect.promise(() => mockRepo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeAlreadyActiveError);
        expect(either.left.message).toContain("active");
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should delete completed challenges", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-completed",
          status: ChallengeStatus.COMPLETED,
        }),
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
        findById: mock(() => Promise.resolve(mockChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const input: DeleteChallengeInput = {
        challengeId: "challenge-completed",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, {
          create: (challenge) =>
            Effect.promise(() => mockRepo.create(challenge)),
          findById: (id) => Effect.promise(() => mockRepo.findById(id)),
          findByTripId: (tripId) =>
            Effect.promise(() => mockRepo.findByTripId(tripId)),
          findByStatus: (status) =>
            Effect.promise(() => mockRepo.findByStatus(status)),
          findByTripIdAndStatus: (tripId, status) =>
            Effect.promise(() =>
              mockRepo.findByTripIdAndStatus(tripId, status),
            ),
          findBySubmissionType: (type) =>
            Effect.promise(() => mockRepo.findBySubmissionType(type)),
          findByScoringCategory: (category) =>
            Effect.promise(() => mockRepo.findByScoringCategory(category)),
          findActive: () => Effect.promise(() => mockRepo.findActive()),
          findOpenForSubmission: () =>
            Effect.promise(() => mockRepo.findOpenForSubmission()),
          findRecurring: () => Effect.promise(() => mockRepo.findRecurring()),
          findAll: (options) => Effect.promise(() => mockRepo.findAll(options)),
          update: (challenge) =>
            Effect.promise(() => mockRepo.update(challenge)),
          updateStatus: (id, status) =>
            Effect.promise(() => mockRepo.updateStatus(id, status)),
          delete: (id) => Effect.promise(() => mockRepo.delete(id)),
          exists: (id) => Effect.promise(() => mockRepo.exists(id)),
          countByTripId: (tripId) =>
            Effect.promise(() => mockRepo.countByTripId(tripId)),
        }),
      );

      const result = await Effect.runPromise(program);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith("challenge-completed");
    });

    it("should delete cancelled challenges", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-cancelled",
          status: ChallengeStatus.CANCELLED,
        }),
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
        findById: mock(() => Promise.resolve(mockChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const input: DeleteChallengeInput = {
        challengeId: "challenge-cancelled",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, {
          create: (challenge) =>
            Effect.promise(() => mockRepo.create(challenge)),
          findById: (id) => Effect.promise(() => mockRepo.findById(id)),
          findByTripId: (tripId) =>
            Effect.promise(() => mockRepo.findByTripId(tripId)),
          findByStatus: (status) =>
            Effect.promise(() => mockRepo.findByStatus(status)),
          findByTripIdAndStatus: (tripId, status) =>
            Effect.promise(() =>
              mockRepo.findByTripIdAndStatus(tripId, status),
            ),
          findBySubmissionType: (type) =>
            Effect.promise(() => mockRepo.findBySubmissionType(type)),
          findByScoringCategory: (category) =>
            Effect.promise(() => mockRepo.findByScoringCategory(category)),
          findActive: () => Effect.promise(() => mockRepo.findActive()),
          findOpenForSubmission: () =>
            Effect.promise(() => mockRepo.findOpenForSubmission()),
          findRecurring: () => Effect.promise(() => mockRepo.findRecurring()),
          findAll: (options) => Effect.promise(() => mockRepo.findAll(options)),
          update: (challenge) =>
            Effect.promise(() => mockRepo.update(challenge)),
          updateStatus: (id, status) =>
            Effect.promise(() => mockRepo.updateStatus(id, status)),
          delete: (id) => Effect.promise(() => mockRepo.delete(id)),
          exists: (id) => Effect.promise(() => mockRepo.exists(id)),
          countByTripId: (tripId) =>
            Effect.promise(() => mockRepo.countByTripId(tripId)),
        }),
      );

      const result = await Effect.runPromise(program);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith("challenge-cancelled");
    });
  });
});
