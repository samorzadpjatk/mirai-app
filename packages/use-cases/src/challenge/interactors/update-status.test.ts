import { describe, it, expect } from "bun:test";
import {
  updateChallengeStatusUseCase,
  type UpdateChallengeStatusInput,
  ChallengeNotFoundError,
  InvalidStatusTransitionError,
} from "./update-status";
import { Effect, Either } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import type { Challenge as ChallengeType } from "@mirai-app/domain";

describe("[UNIT] updateChallengeStatusUseCase (Effect)", () => {
  // Helper to create a challenge with specific status
  const createChallengeWithStatus = (
    id: string,
    status: ChallengeStatus,
  ): Challenge => {
    const effect = Challenge.create({
      id,
      tripId: "trip-123",
      name: "Test Challenge",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.UNLIMITED,
      status,
      basePoints: 100,
    });
    return Effect.runSync(effect);
  };

  // Helper to update challenge status
  const updateChallengeStatus = (
    challenge: Challenge,
    newStatus: ChallengeStatus,
  ): Challenge => {
    const effect = challenge.updateStatus(newStatus);
    return Effect.runSync(effect);
  };

  // Create mock repository service
  const createMockRepoService = (overrides?: {
    findById?: (id: string) => Promise<ChallengeType | null>;
    update?: (challenge: ChallengeType) => Promise<ChallengeType>;
  }) => ({
    create: (challenge: ChallengeType) =>
      Effect.promise(() => Promise.resolve(challenge)),
    findById: (id: string) =>
      Effect.promise(() =>
        overrides?.findById ? overrides.findById(id) : Promise.resolve(null),
      ),
    findByTripId: () => Effect.promise(() => Promise.resolve([])),
    findByStatus: () => Effect.promise(() => Promise.resolve([])),
    findByTripIdAndStatus: () => Effect.promise(() => Promise.resolve([])),
    findBySubmissionType: () => Effect.promise(() => Promise.resolve([])),
    findByScoringCategory: () => Effect.promise(() => Promise.resolve([])),
    findActive: () => Effect.promise(() => Promise.resolve([])),
    findOpenForSubmission: () => Effect.promise(() => Promise.resolve([])),
    findRecurring: () => Effect.promise(() => Promise.resolve([])),
    findAll: () => Effect.promise(() => Promise.resolve([])),
    update: (challenge: ChallengeType) =>
      Effect.promise(() =>
        overrides?.update
          ? overrides.update(challenge)
          : Promise.resolve(challenge),
      ),
    updateStatus: () =>
      Effect.promise(() => Promise.resolve({} as ChallengeType)),
    delete: () => Effect.promise(() => Promise.resolve()),
    exists: () => Effect.promise(() => Promise.resolve(false)),
    countByTripId: () => Effect.promise(() => Promise.resolve(0)),
  });

  // Helper to run use case with repository service
  const runUseCase = async (
    input: UpdateChallengeStatusInput,
    repoOverrides?: {
      findById?: (id: string) => Promise<ChallengeType | null>;
      update?: (challenge: ChallengeType) => Promise<ChallengeType>;
    },
  ) => {
    const program = updateChallengeStatusUseCase(input).pipe(
      Effect.provideService(
        ChallengeGatewayTag,
        createMockRepoService(repoOverrides),
      ),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should update status from HIDDEN to VISIBLE", async () => {
      const hiddenChallenge = createChallengeWithStatus(
        "challenge-1",
        ChallengeStatus.HIDDEN,
      );
      const visibleChallenge = updateChallengeStatus(
        hiddenChallenge,
        ChallengeStatus.VISIBLE,
      );

      const result = await runUseCase(
        { challengeId: "challenge-1", newStatus: ChallengeStatus.VISIBLE },
        {
          findById: () => Promise.resolve(hiddenChallenge),
          update: () => Promise.resolve(visibleChallenge),
        },
      );

      expect(result.previousStatus).toBe("HIDDEN");
      expect(result.newStatus).toBe("VISIBLE");
      expect(result.id).toBe("challenge-1");
    });

    it("should fail when challenge not found", async () => {
      const program = updateChallengeStatusUseCase({
        challengeId: "non-existent",
        newStatus: ChallengeStatus.ACTIVE,
      }).pipe(
        Effect.provideService(
          ChallengeGatewayTag,
          createMockRepoService({ findById: () => Promise.resolve(null) }),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
      }
    });

    it("should fail for invalid status transition", async () => {
      const hiddenChallenge = createChallengeWithStatus(
        "challenge-hidden",
        ChallengeStatus.HIDDEN,
      );

      const program = updateChallengeStatusUseCase({
        challengeId: "challenge-hidden",
        newStatus: ChallengeStatus.ACTIVE,
      }).pipe(
        Effect.provideService(
          ChallengeGatewayTag,
          createMockRepoService({
            findById: () => Promise.resolve(hiddenChallenge),
          }),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(InvalidStatusTransitionError);
      }
    });
  });
});
