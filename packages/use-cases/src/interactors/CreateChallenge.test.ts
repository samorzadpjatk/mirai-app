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
import { InMemoryChallengeRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] createChallengeUseCase (Effect)", () => {
  let repo: InMemoryChallengeRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeRepository();
  });

  // Helper to create a valid challenge input
  const createValidInput = (): CreateChallengeInput => ({
    tripId: "trip-123",
    name: "Test Challenge",
    description: "A test challenge description",
    submissionType: SubmissionType.IMAGE,
    scoringCategory: ScoringCategory.UNLIMITED,
    basePoints: 100,
  });

  // Helper to run use case with repository
  const runUseCase = async (input: CreateChallengeInput) => {
    const program = createChallengeUseCase(input).pipe(
      Effect.provideService(ChallengeRepositoryTag, {
        create: (challenge: Challenge) =>
          Effect.promise(() => repo.create(challenge)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => repo.findByTripId(tripId)),
        findByStatus: (status: ChallengeStatus) =>
          Effect.promise(() => repo.findByStatus(status)),
        findByTripIdAndStatus: (tripId: string, status: ChallengeStatus) =>
          Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
        findBySubmissionType: (type: SubmissionType) =>
          Effect.promise(() => repo.findBySubmissionType(type)),
        findByScoringCategory: (category: ScoringCategory) =>
          Effect.promise(() => repo.findByScoringCategory(category)),
        findActive: () => Effect.promise(() => repo.findActive()),
        findOpenForSubmission: () =>
          Effect.promise(() => repo.findOpenForSubmission()),
        findRecurring: () => Effect.promise(() => repo.findRecurring()),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => repo.findAll(options)),
        update: (challenge: Challenge) =>
          Effect.promise(() => repo.update(challenge)),
        updateStatus: (id: string, status: ChallengeStatus) =>
          Effect.promise(() => repo.updateStatus(id, status)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        countByTripId: (tripId: string) =>
          Effect.promise(() => repo.countByTripId(tripId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should create challenge with valid input", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.tripId).toBe("trip-123");
      expect(result.name).toBe("Test Challenge");
      expect(result.description).toBe("A test challenge description");
      expect(result.submissionType).toBe("IMAGE");
      expect(result.scoringCategory).toBe("UNLIMITED");
      expect(result.status).toBe("HIDDEN");
      expect(result.basePoints).toBe(100);

      // Verify challenge was actually stored
      const stored = await repo.findByTripId("trip-123");
      expect(stored).toHaveLength(1);
      expect(stored[0]?.name).toBe("Test Challenge");
    });

    it("should use HIDDEN as default status when not provided", async () => {
      // Arrange
      const input = {
        tripId: "trip-456",
        name: "Another Challenge",
        submissionType: SubmissionType.TEXT,
        scoringCategory: ScoringCategory.SPEED,
        // status not provided
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe("HIDDEN");

      // Verify stored challenge has HIDDEN status
      const stored = await repo.findByTripId("trip-456");
      expect(stored[0]?.status).toBe(ChallengeStatus.HIDDEN);
    });

    it("should fail when name is empty", async () => {
      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "", // Empty name
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      };

      // Act
      const program = createChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, {
          create: (challenge: Challenge) =>
            Effect.promise(() => repo.create(challenge)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: ChallengeStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: ChallengeStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findBySubmissionType: (type: SubmissionType) =>
            Effect.promise(() => repo.findBySubmissionType(type)),
          findByScoringCategory: (category: ScoringCategory) =>
            Effect.promise(() => repo.findByScoringCategory(category)),
          findActive: () => Effect.promise(() => repo.findActive()),
          findOpenForSubmission: () =>
            Effect.promise(() => repo.findOpenForSubmission()),
          findRecurring: () => Effect.promise(() => repo.findRecurring()),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (challenge: Challenge) =>
            Effect.promise(() => repo.update(challenge)),
          updateStatus: (id: string, status: ChallengeStatus) =>
            Effect.promise(() => repo.updateStatus(id, status)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByTripId: (tripId: string) =>
            Effect.promise(() => repo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeCreationError);
        expect(either.left.message).toContain("name");
      }

      // Verify no challenge was stored
      const stored = await repo.findAll();
      expect(stored).toHaveLength(0);
    });

    it("should fail when tripId is empty", async () => {
      const input: CreateChallengeInput = {
        tripId: "", // Empty tripId
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      };

      // Act
      const program = createChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, {
          create: (challenge: Challenge) =>
            Effect.promise(() => repo.create(challenge)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: ChallengeStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: ChallengeStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findBySubmissionType: (type: SubmissionType) =>
            Effect.promise(() => repo.findBySubmissionType(type)),
          findByScoringCategory: (category: ScoringCategory) =>
            Effect.promise(() => repo.findByScoringCategory(category)),
          findActive: () => Effect.promise(() => repo.findActive()),
          findOpenForSubmission: () =>
            Effect.promise(() => repo.findOpenForSubmission()),
          findRecurring: () => Effect.promise(() => repo.findRecurring()),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (challenge: Challenge) =>
            Effect.promise(() => repo.update(challenge)),
          updateStatus: (id: string, status: ChallengeStatus) =>
            Effect.promise(() => repo.updateStatus(id, status)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByTripId: (tripId: string) =>
            Effect.promise(() => repo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeCreationError);
        expect(either.left.message).toContain("tripId");
      }

      // Verify no challenge was stored
      const stored = await repo.findAll();
      expect(stored).toHaveLength(0);
    });

    it("should fail when basePoints is negative", async () => {
      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        basePoints: -10, // Negative points
      };

      // Act
      const program = createChallengeUseCase(input).pipe(
        Effect.provideService(ChallengeRepositoryTag, {
          create: (challenge: Challenge) =>
            Effect.promise(() => repo.create(challenge)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: ChallengeStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: ChallengeStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findBySubmissionType: (type: SubmissionType) =>
            Effect.promise(() => repo.findBySubmissionType(type)),
          findByScoringCategory: (category: ScoringCategory) =>
            Effect.promise(() => repo.findByScoringCategory(category)),
          findActive: () => Effect.promise(() => repo.findActive()),
          findOpenForSubmission: () =>
            Effect.promise(() => repo.findOpenForSubmission()),
          findRecurring: () => Effect.promise(() => repo.findRecurring()),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (challenge: Challenge) =>
            Effect.promise(() => repo.update(challenge)),
          updateStatus: (id: string, status: ChallengeStatus) =>
            Effect.promise(() => repo.updateStatus(id, status)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByTripId: (tripId: string) =>
            Effect.promise(() => repo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ChallengeCreationError);
        expect(either.left.message).toContain("basePoints");
      }

      // Verify no challenge was stored
      const stored = await repo.findAll();
      expect(stored).toHaveLength(0);
    });

    it("should create challenge with location submission type", async () => {
      // Arrange
      const input: CreateChallengeInput = {
        tripId: "trip-loc",
        name: "Location Challenge",
        submissionType: SubmissionType.LOCATION,
        scoringCategory: ScoringCategory.SPEED,
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
        basePoints: 200,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.submissionType).toBe("LOCATION");
      expect(result.scoringCategory).toBe("SPEED");

      // Verify stored challenge
      const stored = await repo.findByTripId("trip-loc");
      expect(stored).toHaveLength(1);
      expect(stored[0]?.submissionType).toBe(SubmissionType.LOCATION);
    });

    it("should create challenge with peer voting scoring category", async () => {
      // Arrange
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

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.scoringCategory).toBe("PEER_VOTING");

      // Verify stored challenge
      const stored = await repo.findByTripId("trip-vote");
      expect(stored).toHaveLength(1);
      expect(stored[0]?.scoringCategory).toBe(ScoringCategory.PEER_VOTING);
    });
  });
});
