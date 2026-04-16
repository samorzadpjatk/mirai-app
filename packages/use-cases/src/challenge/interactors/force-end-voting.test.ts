import { describe, it, expect } from "bun:test";
import {
  forceEndVotingUseCase,
  type ForceEndVotingInput,
  ForceEndChallengeNotFoundError,
  ForceEndValidationError,
} from "./force-end-voting";
import { Effect, Either } from "effect";
import { ChallengeVoteGatewayTag } from "../ports/vote/gateway";
import { ChallengeGatewayTag } from "../ports/gateway";
import { ChallengeSubmissionGatewayTag } from "../ports/submission/gateway";
import {
  Challenge,
  ChallengeStatus,
  ScoringCategory,
  SubmissionType,
} from "@mirai-app/domain";
import { ChallengeVote, ChallengeVoteId } from "@mirai-app/domain";
import type {
  ChallengeVote as ChallengeVoteType,
  Challenge as ChallengeType,
  ChallengeSubmission as ChallengeSubmissionType,
} from "@mirai-app/domain";

// Helper to create valid challenge
const createValidChallenge = (
  overrides?: Partial<{
    id: string;
    status: ChallengeStatus;
    scoringCategory: ScoringCategory;
    tripId: string;
  }>,
): Challenge => {
  const effect = Challenge.create({
    id: overrides?.id ?? "challenge-123",
    tripId: overrides?.tripId ?? "trip-123",
    name: "Test Challenge",
    description: "Test description",
    basePoints: 100,
    submissionType: SubmissionType.IMAGE,
    scoringCategory: overrides?.scoringCategory ?? ScoringCategory.JUDGED_STAFF,
    status: overrides?.status ?? ChallengeStatus.ACTIVE,
    startTime: new Date("2026-01-01"),
    endTime: new Date(Date.now() - 86400000), // Yesterday
  });
  return Effect.runSync(effect);
};

const createValidVote = (
  overrides?: Partial<{
    id: ChallengeVoteId;
    challengeId: string;
  }>,
): ChallengeVote => {
  const effect = ChallengeVote.create({
    id: overrides?.id ?? ChallengeVoteId.unsafeCreate("vote-123"),
    challengeId: overrides?.challengeId ?? "challenge-123",
    submissionId: "submission-123",
    voterId: "voter-123",
    position: 1,
    points: 10,
    weight: 1.0,
  });
  return Effect.runSync(effect);
};

// Create mock repository services
const createMockVoteRepoService = (overrides?: {
  findByChallengeId?: (challengeId: string) => Promise<ChallengeVoteType[]>;
}) => ({
  create: () => Effect.promise(() => Promise.resolve(createValidVote())),
  createMany: () => Effect.promise(() => Promise.resolve([])),
  findById: () => Effect.promise(() => Promise.resolve(null)),
  findByChallengeId: (challengeId: string) =>
    Effect.promise(() =>
      overrides?.findByChallengeId
        ? overrides.findByChallengeId(challengeId)
        : Promise.resolve([]),
    ),
  findByChallengeAndVoter: () => Effect.promise(() => Promise.resolve([])),
  findBySubmissionId: () => Effect.promise(() => Promise.resolve([])),
  hasVoted: () => Effect.promise(() => Promise.resolve(false)),
  hasVotedForPosition: () => Effect.promise(() => Promise.resolve(false)),
  getVotedPositions: () => Effect.promise(() => Promise.resolve([])),
  delete: () => Effect.promise(() => Promise.resolve()),
  deleteByChallengeId: () => Effect.promise(() => Promise.resolve()),
});

const createMockChallengeRepoService = (overrides?: {
  findById?: (id: string) => Promise<ChallengeType | null>;
}) => ({
  create: () => Effect.promise(() => Promise.resolve(createValidChallenge())),
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
  findActiveForTrip: () => Effect.promise(() => Promise.resolve([])),
  findVisibleForTrip: () => Effect.promise(() => Promise.resolve([])),
  findUpcomingForTrip: () => Effect.promise(() => Promise.resolve([])),
  findActiveBetween: () => Effect.promise(() => Promise.resolve([])),
  update: () => Effect.promise(() => Promise.resolve(createValidChallenge())),
  updateStatus: () =>
    Effect.promise(() => Promise.resolve(createValidChallenge())),
  delete: () => Effect.promise(() => Promise.resolve()),
  exists: () => Effect.promise(() => Promise.resolve(false)),
  countByTripId: () => Effect.promise(() => Promise.resolve(0)),
  countByTripIdAndStatus: () => Effect.promise(() => Promise.resolve(0)),
});

const createMockSubmissionRepoService = () => ({
  create: () =>
    Effect.promise(() => Promise.resolve({} as ChallengeSubmissionType)),
  findById: () => Effect.promise(() => Promise.resolve(null)),
  findByChallengeAndGroup: () => Effect.promise(() => Promise.resolve(null)),
  findByChallengeId: () => Effect.promise(() => Promise.resolve([])),
  findByGroupId: () => Effect.promise(() => Promise.resolve([])),
  findByStatus: () => Effect.promise(() => Promise.resolve([])),
  findMany: () => Effect.promise(() => Promise.resolve([])),
  update: () =>
    Effect.promise(() => Promise.resolve({} as ChallengeSubmissionType)),
  delete: () => Effect.promise(() => Promise.resolve()),
  existsForChallengeAndGroup: () =>
    Effect.promise(() => Promise.resolve(false)),
  countByChallengeId: () => Effect.promise(() => Promise.resolve(0)),
  countByChallengeAndStatus: () => Effect.promise(() => Promise.resolve(0)),
});

// Helper to run use case with services
const runUseCase = async (
  input: ForceEndVotingInput,
  overrides?: {
    voteRepo?: Parameters<typeof createMockVoteRepoService>[0];
    challengeRepo?: Parameters<typeof createMockChallengeRepoService>[0];
  },
) => {
  const program = forceEndVotingUseCase(input).pipe(
    Effect.provideService(
      ChallengeVoteGatewayTag,
      createMockVoteRepoService(overrides?.voteRepo),
    ),
    Effect.provideService(
      ChallengeGatewayTag,
      createMockChallengeRepoService(overrides?.challengeRepo),
    ),
    Effect.provideService(
      ChallengeSubmissionGatewayTag,
      createMockSubmissionRepoService(),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] forceEndVotingUseCase (Effect)", () => {
  describe("[UNIT] execute", () => {
    it("should return error when challengeId is empty", async () => {
      const program = forceEndVotingUseCase({
        challengeId: "",
        tripId: "trip-123",
        adminId: "admin-123",
      }).pipe(
        Effect.provideService(
          ChallengeVoteGatewayTag,
          createMockVoteRepoService(),
        ),
        Effect.provideService(
          ChallengeGatewayTag,
          createMockChallengeRepoService(),
        ),
        Effect.provideService(
          ChallengeSubmissionGatewayTag,
          createMockSubmissionRepoService(),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ForceEndValidationError);
      }
    });

    it("should return error when challenge not found", async () => {
      const program = forceEndVotingUseCase({
        challengeId: "non-existent",
        tripId: "trip-123",
        adminId: "admin-123",
      }).pipe(
        Effect.provideService(
          ChallengeVoteGatewayTag,
          createMockVoteRepoService(),
        ),
        Effect.provideService(
          ChallengeGatewayTag,
          createMockChallengeRepoService({
            findById: () => Promise.resolve(null),
          }),
        ),
        Effect.provideService(
          ChallengeSubmissionGatewayTag,
          createMockSubmissionRepoService(),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ForceEndChallengeNotFoundError);
      }
    });
  });
});
