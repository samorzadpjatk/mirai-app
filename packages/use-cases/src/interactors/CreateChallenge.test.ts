import { describe, it, expect, beforeEach } from "bun:test";
import {
  createChallengeUseCase,
  type CreateChallengeInput,
  ChallengeCreationError,
  ChallengeRepositoryError,
} from "./CreateChallenge";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeRepositoryTag } from "../ports/ChallengeRepository";

describe("[UNIT] createChallengeUseCase (Effect)", () => {
  const createMockChallenge = (
    overrides?: Partial<{
      id: string;
      tripId: string;
      name: string;
      submissionType: SubmissionType;
      scoringCategory: ScoringCategory;
      status: ChallengeStatus;
      basePoints: number;
    }>,
  ) => ({
    id: overrides?.id ?? "challenge-123",
    tripId: overrides?.tripId ?? "trip-123",
    name: overrides?.name ?? "Test Challenge",
    description: "A test challenge description",
    image: null,
    submissionType: overrides?.submissionType ?? SubmissionType.IMAGE,
    scoringCategory: overrides?.scoringCategory ?? ScoringCategory.UNLIMITED,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMockRepo = (overrides?: {
    create?: () => Effect.Effect<Challenge, never, never>;
    findById?: () => Effect.Effect<Challenge | null, never, never>;
    findByTripId?: () => Effect.Effect<Challenge[], never, never>;
    exists?: () => Effect.Effect<boolean, never, never>;
    countByTripId?: () => Effect.Effect<number, never, never>;
  }) => ({
    create:
      overrides?.create ??
      (() => Effect.succeed(createMockChallenge() as Challenge)),
    findById: overrides?.findById ?? (() => Effect.succeed(null)),
    findByTripId: overrides?.findByTripId ?? (() => Effect.succeed([])),
    findByStatus: () => Effect.succeed([]),
    findByTripIdAndStatus: () => Effect.succeed([]),
    findBySubmissionType: () => Effect.succeed([]),
    findByScoringCategory: () => Effect.succeed([]),
    findActive: () => Effect.succeed([]),
    findOpenForSubmission: () => Effect.succeed([]),
    findRecurring: () => Effect.succeed([]),
    findAll: () => Effect.succeed([]),
    update: () => Effect.succeed(createMockChallenge() as Challenge),
    updateStatus: () => Effect.succeed(createMockChallenge() as Challenge),
    delete: () => Effect.succeed(void 0),
    exists: overrides?.exists ?? (() => Effect.succeed(false)),
    countByTripId: overrides?.countByTripId ?? (() => Effect.succeed(0)),
  });

  describe("execute", () => {
    it("should create challenge with valid input", async () => {
      const mockChallenge = createMockChallenge({
        id: "challenge-new",
        tripId: "trip-123",
        name: "Test Challenge",
      });
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockChallenge as Challenge),
      });

      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "Test Challenge",
        description: "A test challenge description",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        basePoints: 100,
      };

      const program = createChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result.tripId).toBe("trip-123");
      expect(result.name).toBe("Test Challenge");
      expect(result.submissionType).toBe("IMAGE");
      expect(result.scoringCategory).toBe("UNLIMITED");
      expect(result.status).toBe("HIDDEN");
      expect(result.basePoints).toBe(100);
    });

    it("should use HIDDEN as default status when not provided", async () => {
      const mockChallenge = createMockChallenge({
        id: "challenge-456",
        status: ChallengeStatus.HIDDEN,
      });
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockChallenge as Challenge),
      });

      const input: CreateChallengeInput = {
        tripId: "trip-456",
        name: "Another Challenge",
        submissionType: SubmissionType.TEXT,
        scoringCategory: ScoringCategory.SPEED,
      };

      const program = createChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result.status).toBe("HIDDEN");
    });

    it("should fail when name is empty", async () => {
      const mockRepo = createMockRepo();

      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      };

      const program = createChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeCreationError);
        expect(either.left.message).toContain("name");
      }
    });

    it("should fail when tripId is empty", async () => {
      const mockRepo = createMockRepo();

      const input: CreateChallengeInput = {
        tripId: "",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      };

      const program = createChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeCreationError);
        expect(either.left.message).toContain("tripId");
      }
    });

    it("should fail when basePoints is negative", async () => {
      const mockRepo = createMockRepo();

      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        basePoints: -10,
      };

      const program = createChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeCreationError);
        expect(either.left.message).toContain("basePoints");
      }
    });

    it("should create challenge with location submission type", async () => {
      const mockChallenge = createMockChallenge({
        submissionType: SubmissionType.LOCATION,
        scoringCategory: ScoringCategory.SPEED,
      });
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockChallenge as Challenge),
      });

      const input: CreateChallengeInput = {
        tripId: "trip-loc",
        name: "Location Challenge",
        submissionType: SubmissionType.LOCATION,
        scoringCategory: ScoringCategory.SPEED,
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
        basePoints: 200,
      };

      const result = await Effect.runPromise(
        createChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeRepositoryTag, mockRepo),
        ),
      );

      expect(result.submissionType).toBe("LOCATION");
      expect(result.scoringCategory).toBe("SPEED");
    });

    it("should create challenge with peer voting scoring category", async () => {
      const mockChallenge = createMockChallenge({
        scoringCategory: ScoringCategory.PEER_VOTING,
      });
      const mockRepo = createMockRepo({
        create: () => Effect.succeed(mockChallenge as Challenge),
      });

      const input: CreateChallengeInput = {
        tripId: "trip-vote",
        name: "Photo Contest",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.PEER_VOTING,
        firstPlacePoints: 500,
        secondPlacePoints: 300,
        thirdPlacePoints: 100,
        basePoints: 50,
      };

      const result = await Effect.runPromise(
        createChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeRepositoryTag, mockRepo),
        ),
      );

      expect(result.scoringCategory).toBe("PEER_VOTING");
    });
  });
});
