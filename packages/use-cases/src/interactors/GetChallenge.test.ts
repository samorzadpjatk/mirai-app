import { describe, it, expect, mock } from "bun:test";
import {
  getChallengeUseCase,
  type GetChallengeInput,
  ChallengeNotFoundError,
} from "./GetChallenge";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeRepositoryTag } from "../ports/ChallengeRepository";
import type { ChallengeRepository } from "../ports/ChallengeRepository";

describe("[UNIT] getChallengeUseCase (Effect)", () => {
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
      status: overrides?.status ?? ChallengeStatus.ACTIVE,
      basePoints: 100,
    }).pipe(Effect.orDie);
  };

  describe("execute", () => {
    it("should return challenge when found by ID", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({ id: "challenge-456", name: "Photo Challenge" }),
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

      const input: GetChallengeInput = {
        challengeId: "challenge-456",
      };

      // Act
      const program = getChallengeUseCase(input).pipe(
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
      expect(result.id).toBe("challenge-456");
      expect(result.name).toBe("Photo Challenge");
      expect(result.tripId).toBe("trip-123");
      expect(result.status).toBe("ACTIVE");
      expect(result.basePoints).toBe(100);
      expect(result.isActive).toBe(true);
      expect(result.submissionType).toBe("IMAGE");
      expect(result.scoringCategory).toBe("UNLIMITED");
      expect(result.requiresLocation).toBe(false);
      expect(result.requiresQRCode).toBe(false);
      expect(mockRepo.findById).toHaveBeenCalledWith("challenge-456");
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

      const input: GetChallengeInput = {
        challengeId: "non-existent-id",
      };

      // Act
      const program = getChallengeUseCase(input).pipe(
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
      expect(mockRepo.findById).toHaveBeenCalledWith("non-existent-id");
    });

    it("should return challenge with location requirements for IMAGE_LOCATION type", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        Challenge.create({
          id: "challenge-loc",
          tripId: "trip-loc",
          name: "Location Photo Challenge",
          submissionType: SubmissionType.IMAGE_LOCATION,
          scoringCategory: ScoringCategory.SPEED,
          targetLatitude: 52.2297,
          targetLongitude: 21.0122,
          basePoints: 200,
        }).pipe(Effect.orDie),
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

      const input: GetChallengeInput = {
        challengeId: "challenge-loc",
      };

      // Act
      const program = getChallengeUseCase(input).pipe(
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
      expect(result.submissionType).toBe("IMAGE_LOCATION");
      expect(result.requiresLocation).toBe(true);
      expect(result.targetLatitude).toBe(52.2297);
      expect(result.targetLongitude).toBe(21.0122);
    });

    it("should return challenge with QR code requirements for QR_CODE type", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        Challenge.create({
          id: "challenge-qr",
          tripId: "trip-qr",
          name: "QR Code Challenge",
          submissionType: SubmissionType.QR_CODE,
          scoringCategory: ScoringCategory.UNLIMITED,
          expectedValue: "secret-qr-code",
          basePoints: 150,
        }).pipe(Effect.orDie),
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

      const input: GetChallengeInput = {
        challengeId: "challenge-qr",
      };

      // Act
      const program = getChallengeUseCase(input).pipe(
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
      expect(result.submissionType).toBe("QR_CODE");
      expect(result.requiresQRCode).toBe(true);
      expect(result.expectedValue).toBe("secret-qr-code");
    });

    it("should return challenge with voting phase info for PEER_VOTING category", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        Challenge.create({
          id: "challenge-vote",
          tripId: "trip-vote",
          name: "Peer Voting Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.PEER_VOTING,
          firstPlacePoints: 500,
          basePoints: 50,
        }).pipe(Effect.orDie),
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

      const input: GetChallengeInput = {
        challengeId: "challenge-vote",
      };

      // Act
      const program = getChallengeUseCase(input).pipe(
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
      expect(result.scoringCategory).toBe("PEER_VOTING");
      expect(result.hasVotingPhase).toBe(true);
    });

    it("should return hidden challenge with correct status", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-hidden",
          name: "Hidden Challenge",
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

      const input: GetChallengeInput = {
        challengeId: "challenge-hidden",
      };

      // Act
      const program = getChallengeUseCase(input).pipe(
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
      expect(result.status).toBe("HIDDEN");
      expect(result.isActive).toBe(false);
    });
  });
});
