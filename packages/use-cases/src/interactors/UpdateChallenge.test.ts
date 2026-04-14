import { describe, it, expect } from "bun:test";
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

describe("[UNIT] updateChallengeUseCase (Effect)", () => {
  const createMockChallenge = async (
    overrides?: Partial<{
      id: string;
      tripId: string;
      name: string;
      description: string | null;
      submissionType: SubmissionType;
      scoringCategory: ScoringCategory;
      status: ChallengeStatus;
      basePoints: number;
    }>,
  ): Promise<Challenge> => {
    return await Effect.runPromise(
      Challenge.create({
        id: overrides?.id ?? "challenge-123",
        tripId: overrides?.tripId ?? "trip-123",
        name: overrides?.name ?? "Test Challenge",
        description: overrides?.description ?? "Original description",
        image: null,
        submissionType: overrides?.submissionType ?? SubmissionType.IMAGE,
        scoringCategory:
          overrides?.scoringCategory ?? ScoringCategory.UNLIMITED,
        isRecurring: false,
        dailyStartTime: null,
        dailyEndTime: null,
        basePoints: overrides?.basePoints ?? 100,
        firstPlacePoints: null,
        secondPlacePoints: null,
        thirdPlacePoints: null,
        status: overrides?.status ?? ChallengeStatus.HIDDEN,
        startTime: null,
        endTime: null,
        votingStartTime: null,
        votingEndTime: null,
        targetLatitude: null,
        targetLongitude: null,
        expectedValue: null,
        autoApprove: false,
      }).pipe(Effect.orDie),
    );
  };

  describe("[UNIT] execute", () => {
    it("should update challenge name", async () => {
      const existingChallenge = await createMockChallenge({
        id: "challenge-456",
        name: "Original Name",
      });
      const updatedChallenge = await createMockChallenge({
        id: "challenge-456",
        name: "Updated Challenge Name",
      });

      const mockRepo = {
        create: () => Effect.succeed(existingChallenge),
        findById: () => Effect.succeed(existingChallenge),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed(updatedChallenge),
        updateStatus: () => Effect.succeed(updatedChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(true),
        countByTripId: () => Effect.succeed(1),
      };

      const input: UpdateChallengeInput = {
        challengeId: "challenge-456",
        name: "Updated Challenge Name",
      };

      const result = await Effect.runPromise(
        updateChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeRepositoryTag, mockRepo),
        ),
      );

      expect(result.name).toBe("Updated Challenge Name");
    });

    it("should return error when challenge not found", async () => {
      const mockChallenge = await createMockChallenge();
      const mockRepo = {
        create: () => Effect.succeed(mockChallenge),
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
        update: () => Effect.succeed(mockChallenge),
        updateStatus: () => Effect.succeed(mockChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(false),
        countByTripId: () => Effect.succeed(0),
      };

      const input: UpdateChallengeInput = {
        challengeId: "non-existent",
        name: "New Name",
      };

      const program = updateChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
      }
    });

    it("should return error when challenge is in terminal state (COMPLETED)", async () => {
      const completedChallenge = await createMockChallenge({
        id: "challenge-completed",
        status: ChallengeStatus.COMPLETED,
      });

      const mockRepo = {
        create: () => Effect.succeed(completedChallenge),
        findById: () => Effect.succeed(completedChallenge),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed(completedChallenge),
        updateStatus: () => Effect.succeed(completedChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(true),
        countByTripId: () => Effect.succeed(1),
      };

      const input: UpdateChallengeInput = {
        challengeId: "challenge-completed",
        name: "New Name",
      };

      const program = updateChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeTerminalStateError);
        expect(either.left.message).toContain("completed or cancelled");
      }
    });

    it("should return error when challenge is in terminal state (CANCELLED)", async () => {
      const cancelledChallenge = await createMockChallenge({
        id: "challenge-cancelled",
        status: ChallengeStatus.CANCELLED,
      });

      const mockRepo = {
        create: () => Effect.succeed(cancelledChallenge),
        findById: () => Effect.succeed(cancelledChallenge),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed(cancelledChallenge),
        updateStatus: () => Effect.succeed(cancelledChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(true),
        countByTripId: () => Effect.succeed(1),
      };

      const input: UpdateChallengeInput = {
        challengeId: "challenge-cancelled",
        name: "New Name",
      };

      const program = updateChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeTerminalStateError);
        expect(either.left.message).toContain("completed or cancelled");
      }
    });

    it("should return error when name is empty", async () => {
      const existingChallenge = await createMockChallenge({
        id: "challenge-empty",
      });

      const mockRepo = {
        create: () => Effect.succeed(existingChallenge),
        findById: () => Effect.succeed(existingChallenge),
        findByTripId: () => Effect.succeed([]),
        findByStatus: () => Effect.succeed([]),
        findByTripIdAndStatus: () => Effect.succeed([]),
        findBySubmissionType: () => Effect.succeed([]),
        findByScoringCategory: () => Effect.succeed([]),
        findActive: () => Effect.succeed([]),
        findOpenForSubmission: () => Effect.succeed([]),
        findRecurring: () => Effect.succeed([]),
        findAll: () => Effect.succeed([]),
        update: () => Effect.succeed(existingChallenge),
        updateStatus: () => Effect.succeed(existingChallenge),
        delete: () => Effect.succeed(void 0),
        exists: () => Effect.succeed(true),
        countByTripId: () => Effect.succeed(1),
      };

      const input: UpdateChallengeInput = {
        challengeId: "challenge-empty",
        name: "",
      };

      const program = updateChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeUpdateValidationError);
        expect(either.left.message).toContain("name");
      }
    });
  });
});
