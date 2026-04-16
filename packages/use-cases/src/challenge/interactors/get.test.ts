import { describe, it, expect } from "bun:test";
import {
  getChallengeUseCase,
  type GetChallengeInput,
  ChallengeNotFoundError,
} from "./get";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";

describe("[UNIT] getChallengeUseCase (Effect)", () => {
  const createMockChallenge = async (
    overrides?: Partial<{
      id: string;
      tripId: string;
      name: string;
      submissionType: SubmissionType;
      scoringCategory: ScoringCategory;
      status: ChallengeStatus;
      basePoints: number;
      targetLatitude?: number | null;
      targetLongitude?: number | null;
      expectedValue?: string | null;
      firstPlacePoints?: number | null;
    }>,
  ): Promise<Challenge> => {
    return await Effect.runPromise(
      Challenge.create({
        id: overrides?.id ?? "challenge-123",
        tripId: overrides?.tripId ?? "trip-123",
        name: overrides?.name ?? "Test Challenge",
        description: "A test challenge description",
        image: null,
        submissionType: overrides?.submissionType ?? SubmissionType.IMAGE,
        scoringCategory:
          overrides?.scoringCategory ?? ScoringCategory.UNLIMITED,
        isRecurring: false,
        dailyStartTime: null,
        dailyEndTime: null,
        basePoints: overrides?.basePoints ?? 100,
        firstPlacePoints: overrides?.firstPlacePoints ?? null,
        secondPlacePoints: null,
        thirdPlacePoints: null,
        status: overrides?.status ?? ChallengeStatus.ACTIVE,
        startTime: null,
        endTime: null,
        votingStartTime: null,
        votingEndTime: null,
        targetLatitude: overrides?.targetLatitude ?? null,
        targetLongitude: overrides?.targetLongitude ?? null,
        expectedValue: overrides?.expectedValue ?? null,
        autoApprove: false,
      }).pipe(Effect.orDie),
    );
  };

  const createMockRepo = (challenge: Challenge) => ({
    create: () => Effect.succeed(challenge),
    findById: () => Effect.succeed(challenge),
    findByTripId: () => Effect.succeed([]),
    findByStatus: () => Effect.succeed([]),
    findByTripIdAndStatus: () => Effect.succeed([]),
    findBySubmissionType: () => Effect.succeed([]),
    findByScoringCategory: () => Effect.succeed([]),
    findActive: () => Effect.succeed([]),
    findOpenForSubmission: () => Effect.succeed([]),
    findRecurring: () => Effect.succeed([]),
    findAll: () => Effect.succeed([]),
    update: () => Effect.succeed(challenge),
    updateStatus: () => Effect.succeed(challenge),
    delete: () => Effect.succeed(void 0),
    exists: () => Effect.succeed(true),
    countByTripId: () => Effect.succeed(1),
  });

  describe("[UNIT] execute", () => {
    it("should return challenge when found by ID", async () => {
      const mockChallenge = await createMockChallenge({
        id: "challenge-456",
        name: "Photo Challenge",
      });
      const mockRepo = createMockRepo(mockChallenge);

      const input: GetChallengeInput = {
        challengeId: "challenge-456",
      };

      const result = await Effect.runPromise(
        getChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeGatewayTag, mockRepo),
        ),
      );

      expect(result.id).toBe("challenge-456");
      expect(result.name).toBe("Photo Challenge");
      expect(result.tripId).toBe("trip-123");
      expect(result.status).toBe("ACTIVE");
      expect(result.basePoints).toBe(100);
      expect(result.submissionType).toBe("IMAGE");
      expect(result.scoringCategory).toBe("UNLIMITED");
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

      const input: GetChallengeInput = {
        challengeId: "non-existent-id",
      };

      const program = getChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeGatewayTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
        expect(either.left.message).toBe("Challenge not found");
      }
    });

    it("should return challenge with location requirements for IMAGE_LOCATION type", async () => {
      const mockChallenge = await createMockChallenge({
        id: "challenge-loc",
        submissionType: SubmissionType.IMAGE_LOCATION,
        scoringCategory: ScoringCategory.SPEED,
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
      });
      const mockRepo = createMockRepo(mockChallenge);

      const input: GetChallengeInput = {
        challengeId: "challenge-loc",
      };

      const result = await Effect.runPromise(
        getChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeGatewayTag, mockRepo),
        ),
      );

      expect(result.submissionType).toBe("IMAGE_LOCATION");
      expect(result.targetLatitude).toBe(52.2297);
      expect(result.targetLongitude).toBe(21.0122);
    });

    it("should return challenge with QR code requirements for QR_CODE type", async () => {
      const mockChallenge = await createMockChallenge({
        id: "challenge-qr",
        submissionType: SubmissionType.QR_CODE,
        expectedValue: "secret-qr-code",
      });
      const mockRepo = createMockRepo(mockChallenge);

      const input: GetChallengeInput = {
        challengeId: "challenge-qr",
      };

      const result = await Effect.runPromise(
        getChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeGatewayTag, mockRepo),
        ),
      );

      expect(result.submissionType).toBe("QR_CODE");
      expect(result.expectedValue).toBe("secret-qr-code");
    });

    it("should return challenge with voting phase info for PEER_VOTING category", async () => {
      const mockChallenge = await createMockChallenge({
        id: "challenge-vote",
        scoringCategory: ScoringCategory.PEER_VOTING,
        firstPlacePoints: 500,
      });
      const mockRepo = createMockRepo(mockChallenge);

      const input: GetChallengeInput = {
        challengeId: "challenge-vote",
      };

      const result = await Effect.runPromise(
        getChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeGatewayTag, mockRepo),
        ),
      );

      expect(result.scoringCategory).toBe("PEER_VOTING");
    });

    it("should return hidden challenge with correct status", async () => {
      const mockChallenge = await createMockChallenge({
        id: "challenge-hidden",
        name: "Hidden Challenge",
        status: ChallengeStatus.HIDDEN,
      });
      const mockRepo = createMockRepo(mockChallenge);

      const input: GetChallengeInput = {
        challengeId: "challenge-hidden",
      };

      const result = await Effect.runPromise(
        getChallengeUseCase(input).pipe(
          Effect.provideService(ChallengeGatewayTag, mockRepo),
        ),
      );

      expect(result.status).toBe("HIDDEN");
    });
  });
});
