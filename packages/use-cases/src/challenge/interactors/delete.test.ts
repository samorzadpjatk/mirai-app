import { describe, it, expect } from "bun:test";
import {
  deleteChallengeUseCase,
  type DeleteChallengeInput,
  ChallengeNotFoundError,
  ChallengeAlreadyActiveError,
} from "./delete";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";
import type { ChallengeGateway } from "../ports/gateway";

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

  describe("[UNIT] execute", () => {
    it("should delete challenge when found and not active", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-456",
          status: ChallengeStatus.HIDDEN,
        }),
      );

      const mockRepo: ChallengeGateway = {
        create: () => Effect.succeed(mockChallenge),
        findById: () => Effect.succeed(mockChallenge),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed(mockChallenge),
        updateStatus: () => Effect.succeed(mockChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(true),
        countByTripId: () => Effect.succeed(1),
      };

      const input: DeleteChallengeInput = {
        challengeId: "challenge-456",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeGatewayTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Challenge deleted successfully");
    });

    it("should return error when challenge not found", async () => {
      // Arrange
      const mockRepo: ChallengeGateway = {
        create: () => Effect.succeed({} as Challenge),
        findById: () => Effect.succeed(null),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed({} as Challenge),
        updateStatus: () => Effect.succeed({} as Challenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(false),
        countByTripId: () => Effect.succeed(0),
      };

      const input: DeleteChallengeInput = {
        challengeId: "non-existent-id",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeGatewayTag, mockRepo),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
        expect(either.left.message).toBe("Challenge not found");
      }
    });

    it("should return error when challenge is active", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-active",
          status: ChallengeStatus.ACTIVE,
        }),
      );

      const mockRepo: ChallengeGateway = {
        create: () => Effect.succeed(mockChallenge),
        findById: () => Effect.succeed(mockChallenge),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed(mockChallenge),
        updateStatus: () => Effect.succeed(mockChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(true),
        countByTripId: () => Effect.succeed(1),
      };

      const input: DeleteChallengeInput = {
        challengeId: "challenge-active",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeGatewayTag, mockRepo),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeAlreadyActiveError);
        expect(either.left.message).toContain("active");
      }
    });

    it("should delete completed challenges", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-completed",
          status: ChallengeStatus.COMPLETED,
        }),
      );

      const mockRepo: ChallengeGateway = {
        create: () => Effect.succeed(mockChallenge),
        findById: () => Effect.succeed(mockChallenge),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed(mockChallenge),
        updateStatus: () => Effect.succeed(mockChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(true),
        countByTripId: () => Effect.succeed(1),
      };

      const input: DeleteChallengeInput = {
        challengeId: "challenge-completed",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeGatewayTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should delete cancelled challenges", async () => {
      // Arrange
      const mockChallenge = await Effect.runPromise(
        createChallengeEffect({
          id: "challenge-cancelled",
          status: ChallengeStatus.CANCELLED,
        }),
      );

      const mockRepo: ChallengeGateway = {
        create: () => Effect.succeed(mockChallenge),
        findById: () => Effect.succeed(mockChallenge),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed(mockChallenge),
        updateStatus: () => Effect.succeed(mockChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(true),
        countByTripId: () => Effect.succeed(1),
      };

      const input: DeleteChallengeInput = {
        challengeId: "challenge-cancelled",
      };

      // Act
      const program = deleteChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeGatewayTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
