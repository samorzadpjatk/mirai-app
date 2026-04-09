import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetChallengeUseCase } from "./GetChallenge";
import type { GetChallengeInput } from "./GetChallenge";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@repo/domain";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import { createTestContainer, TYPES } from "@repo/frameworks/di";
import type { Container } from "inversify";

describe("[UNIT] GetChallengeUseCase", () => {
  let container: Container;

  beforeEach(() => {
    container = createTestContainer();
  });

  // Helper to create a valid challenge
  const createValidChallenge = (
    overrides?: Partial<{ id: string; name: string; status: ChallengeStatus }>,
  ): Challenge => {
    const result = Challenge.create({
      id: overrides?.id ?? "challenge-123",
      tripId: "trip-123",
      name: overrides?.name ?? "Test Challenge",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.UNLIMITED,
      status: overrides?.status ?? ChallengeStatus.ACTIVE,
      basePoints: 100,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create challenge: ${result.error}`);
    }
    return result.value;
  };

  describe("execute", () => {
    it("should return challenge when found by ID", async () => {
      // Arrange
      const mockChallenge = createValidChallenge({
        id: "challenge-456",
        name: "Photo Challenge",
        status: ChallengeStatus.ACTIVE,
      });
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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new GetChallengeUseCase(challengeRepo);
      const input: GetChallengeInput = {
        challengeId: "challenge-456",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("challenge-456");
        expect(result.value.name).toBe("Photo Challenge");
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.status).toBe("ACTIVE");
        expect(result.value.basePoints).toBe(100);
        expect(result.value.isActive).toBe(true);
        expect(result.value.submissionType).toBe("IMAGE");
        expect(result.value.scoringCategory).toBe("UNLIMITED");
        expect(result.value.requiresLocation).toBe(false);
        expect(result.value.requiresQRCode).toBe(false);
      }
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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new GetChallengeUseCase(challengeRepo);
      const input: GetChallengeInput = {
        challengeId: "non-existent-id",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Challenge not found");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("non-existent-id");
    });

    it("should return challenge with location requirements for IMAGE_LOCATION type", async () => {
      // Arrange
      const result = Challenge.create({
        id: "challenge-loc",
        tripId: "trip-loc",
        name: "Location Photo Challenge",
        submissionType: SubmissionType.IMAGE_LOCATION,
        scoringCategory: ScoringCategory.SPEED,
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
        basePoints: 200,
      });
      if (result.kind === "err") {
        throw new Error(`Failed to create challenge: ${result.error}`);
      }
      const mockChallenge = result.value;

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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new GetChallengeUseCase(challengeRepo);
      const input: GetChallengeInput = {
        challengeId: "challenge-loc",
      };

      // Act
      const result2 = await useCase.execute(input);

      // Assert
      expect(result2.kind).toBe("ok");
      if (result2.kind === "ok") {
        expect(result2.value.submissionType).toBe("IMAGE_LOCATION");
        expect(result2.value.requiresLocation).toBe(true);
        expect(result2.value.targetLatitude).toBe(52.2297);
        expect(result2.value.targetLongitude).toBe(21.0122);
      }
    });

    it("should return challenge with QR code requirements for QR_CODE type", async () => {
      // Arrange
      const result = Challenge.create({
        id: "challenge-qr",
        tripId: "trip-qr",
        name: "QR Code Challenge",
        submissionType: SubmissionType.QR_CODE,
        scoringCategory: ScoringCategory.UNLIMITED,
        expectedValue: "secret-qr-code",
        basePoints: 150,
      });
      if (result.kind === "err") {
        throw new Error(`Failed to create challenge: ${result.error}`);
      }
      const mockChallenge = result.value;

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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new GetChallengeUseCase(challengeRepo);
      const input: GetChallengeInput = {
        challengeId: "challenge-qr",
      };

      // Act
      const result2 = await useCase.execute(input);

      // Assert
      expect(result2.kind).toBe("ok");
      if (result2.kind === "ok") {
        expect(result2.value.submissionType).toBe("QR_CODE");
        expect(result2.value.requiresQRCode).toBe(true);
        expect(result2.value.expectedValue).toBe("secret-qr-code");
      }
    });

    it("should return challenge with voting phase info for PEER_VOTING category", async () => {
      // Arrange
      const result = Challenge.create({
        id: "challenge-vote",
        tripId: "trip-vote",
        name: "Peer Voting Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.PEER_VOTING,
        firstPlacePoints: 500,
        basePoints: 50,
      });
      if (result.kind === "err") {
        throw new Error(`Failed to create challenge: ${result.error}`);
      }
      const mockChallenge = result.value;

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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new GetChallengeUseCase(challengeRepo);
      const input: GetChallengeInput = {
        challengeId: "challenge-vote",
      };

      // Act
      const result2 = await useCase.execute(input);

      // Assert
      expect(result2.kind).toBe("ok");
      if (result2.kind === "ok") {
        expect(result2.value.scoringCategory).toBe("PEER_VOTING");
        expect(result2.value.hasVotingPhase).toBe(true);
      }
    });

    it("should return hidden challenge with correct status", async () => {
      // Arrange
      const mockChallenge = createValidChallenge({
        id: "challenge-hidden",
        name: "Hidden Challenge",
        status: ChallengeStatus.HIDDEN,
      });
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

      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const useCase = new GetChallengeUseCase(challengeRepo);
      const input: GetChallengeInput = {
        challengeId: "challenge-hidden",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("HIDDEN");
        expect(result.value.isActive).toBe(false);
      }
    });
  });
});
