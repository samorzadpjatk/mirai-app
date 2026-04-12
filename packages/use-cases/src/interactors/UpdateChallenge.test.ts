import { describe, it, expect, mock } from "bun:test";
import {
  updateChallengeUseCase,
  type UpdateChallengeInput,
  ChallengeNotFoundError,
  ChallengeUpdateValidationError,
  ChallengeTerminalStateError,
} from "./UpdateChallenge";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeRepositoryTag } from "../ports/ChallengeRepository";
import type { ChallengeRepository } from "../ports/ChallengeRepository";

describe("[UNIT] updateChallengeUseCase (Effect)", () => {
  // Helper to create a valid challenge
  const createValidChallenge = (
    overrides?: Partial<{
      id: string;
      name: string;
      status: ChallengeStatus;
      description: string | null;
      basePoints: number;
    }>,
  ): Challenge => {
    const result = Challenge.create({
      id: overrides?.id ?? "challenge-123",
      tripId: "trip-123",
      name: overrides?.name ?? "Test Challenge",
      description: overrides?.description ?? "Original description",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.UNLIMITED,
      status: overrides?.status ?? ChallengeStatus.HIDDEN,
      basePoints: overrides?.basePoints ?? 100,
    });
    // Since Challenge.create now returns Effect, we need to run it
    // For simplicity in test helpers, we'll use Effect.runPromise
    // But the tests themselves should use the Effect patterns
    throw new Error("Use Effect.runPromise with Challenge.create");
  };

  // Helper to create a challenge via Effect
  const createChallengeEffect = (
    overrides?: Partial<{
      id: string;
      name: string;
      status: ChallengeStatus;
      description: string | null;
      basePoints: number;
    }>,
  ): Effect.Effect<Challenge, never, never> => {
    return Challenge.create({
      id: overrides?.id ?? "challenge-123",
      tripId: "trip-123",
      name: overrides?.name ?? "Test Challenge",
      description: overrides?.description ?? "Original description",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.UNLIMITED,
      status: overrides?.status ?? ChallengeStatus.HIDDEN,
      basePoints: overrides?.basePoints ?? 100,
    }).pipe(Effect.orDie);
  };

  describe("execute", () => {
    it("should update challenge name", async () => {
      // Arrange
      const existingChallenge = await Effect.runPromise(
        createChallengeEffect({ id: "challenge-456" }),
      );
      const updatedChallenge = await Effect.runPromise(
        existingChallenge
          .updateDetails({ name: "Updated Challenge Name" })
          .pipe(Effect.orDie),
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(existingChallenge)),
        findById: mock(() => Promise.resolve(existingChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedChallenge)),
        updateStatus: mock(() => Promise.resolve(updatedChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const input: UpdateChallengeInput = {
        challengeId: "challenge-456",
        name: "Updated Challenge Name",
      };

      // Act
      const program = updateChallengeUseCase(input).pipe(
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
      expect(result.name).toBe("Updated Challenge Name");
      expect(mockRepo.findById).toHaveBeenCalledWith("challenge-456");
      expect(mockRepo.update).toHaveBeenCalled();
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

      const input: UpdateChallengeInput = {
        challengeId: "non-existent",
        name: "New Name",
      };

      // Act
      const program = updateChallengeUseCase(input).pipe(
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
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when challenge is in terminal state (COMPLETED)", async () => {
      // Arrange
      const completedChallenge = await Effect.runPromise(
        Challenge.create({
          id: "challenge-completed",
          tripId: "trip-123",
          name: "Completed Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
          status: ChallengeStatus.COMPLETED,
          basePoints: 100,
        }).pipe(Effect.orDie),
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(completedChallenge)),
        findById: mock(() => Promise.resolve(completedChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(completedChallenge)),
        updateStatus: mock(() => Promise.resolve(completedChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const input: UpdateChallengeInput = {
        challengeId: "challenge-completed",
        name: "New Name",
      };

      // Act
      const program = updateChallengeUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(ChallengeTerminalStateError);
        expect(either.left.message).toContain("completed or cancelled");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when challenge is in terminal state (CANCELLED)", async () => {
      // Arrange
      const cancelledChallenge = await Effect.runPromise(
        Challenge.create({
          id: "challenge-cancelled",
          tripId: "trip-123",
          name: "Cancelled Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
          status: ChallengeStatus.CANCELLED,
          basePoints: 100,
        }).pipe(Effect.orDie),
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(cancelledChallenge)),
        findById: mock(() => Promise.resolve(cancelledChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(cancelledChallenge)),
        updateStatus: mock(() => Promise.resolve(cancelledChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const input: UpdateChallengeInput = {
        challengeId: "challenge-cancelled",
        name: "New Name",
      };

      // Act
      const program = updateChallengeUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(ChallengeTerminalStateError);
        expect(either.left.message).toContain("completed or cancelled");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when name is empty", async () => {
      // Arrange
      const existingChallenge = await Effect.runPromise(
        createChallengeEffect({ id: "challenge-empty" }),
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(existingChallenge)),
        findById: mock(() => Promise.resolve(existingChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(existingChallenge)),
        updateStatus: mock(() => Promise.resolve(existingChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const input: UpdateChallengeInput = {
        challengeId: "challenge-empty",
        name: "", // Empty name
      };

      // Act
      const program = updateChallengeUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(ChallengeUpdateValidationError);
        expect(either.left.message).toContain("name");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });
});
