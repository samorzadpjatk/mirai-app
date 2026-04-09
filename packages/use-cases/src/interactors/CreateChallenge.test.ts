import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CreateChallengeUseCase } from "./CreateChallenge";
import type { CreateChallengeInput } from "./CreateChallenge";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@repo/domain";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import { createTestContainer, TYPES } from "@repo/frameworks/di";
import type { Container } from "inversify";

describe("[UNIT] CreateChallengeUseCase", () => {
  let container: Container;

  beforeEach(() => {
    container = createTestContainer();
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

  // Helper to create a challenge from input
  const createChallengeFromInput = (input: CreateChallengeInput): Challenge => {
    const result = Challenge.create({
      tripId: input.tripId,
      name: input.name,
      ...(input.description !== undefined && {
        description: input.description,
      }),
      submissionType: input.submissionType,
      scoringCategory: input.scoringCategory,
      ...(input.basePoints !== undefined && { basePoints: input.basePoints }),
      status: input.status ?? ChallengeStatus.HIDDEN,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create challenge: ${result.error}`);
    }
    return result.value;
  };

  describe("execute", () => {
    it("should create challenge with valid input", async () => {
      // Arrange
      const input = createValidInput();
      const mockChallenge = createChallengeFromInput(input);
      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
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
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new CreateChallengeUseCase(challengeRepo);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.name).toBe("Test Challenge");
        expect(result.value.description).toBe("A test challenge description");
        expect(result.value.submissionType).toBe("IMAGE");
        expect(result.value.scoringCategory).toBe("UNLIMITED");
        expect(result.value.status).toBe("HIDDEN");
        expect(result.value.basePoints).toBe(100);
      }
      expect(mockRepo.create).toHaveBeenCalled();
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
      const mockChallenge = createChallengeFromInput({
        ...input,
        basePoints: 50,
      });
      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
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
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new CreateChallengeUseCase(challengeRepo);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("HIDDEN");
      }
    });

    it("should return error when name is empty", async () => {
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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new CreateChallengeUseCase(challengeRepo);
      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "", // Empty name
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("name");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return error when tripId is empty", async () => {
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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new CreateChallengeUseCase(challengeRepo);
      const input: CreateChallengeInput = {
        tripId: "", // Empty tripId
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return error when basePoints is negative", async () => {
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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new CreateChallengeUseCase(challengeRepo);
      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        basePoints: -10, // Negative points
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("basePoints");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
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
      const mockChallenge = createChallengeFromInput(input);
      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
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
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new CreateChallengeUseCase(challengeRepo);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.submissionType).toBe("LOCATION");
        expect(result.value.scoringCategory).toBe("SPEED");
      }
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
      const mockChallenge = createChallengeFromInput(input);
      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
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
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new CreateChallengeUseCase(challengeRepo);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.scoringCategory).toBe("PEER_VOTING");
      }
    });
  });
});
