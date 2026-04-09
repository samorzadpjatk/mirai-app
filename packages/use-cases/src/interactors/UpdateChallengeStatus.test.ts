import { describe, it, expect, mock } from "bun:test";
import {
  UpdateChallengeStatusUseCase,
  UpdateChallengeStatusInput,
} from "./UpdateChallengeStatus";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@repo/domain";
import type { ChallengeRepository } from "../ports/ChallengeRepository";

describe("[UNIT] UpdateChallengeStatusUseCase", () => {
  // Helper to create a challenge with specific status
  const createChallengeWithStatus = (
    id: string,
    status: ChallengeStatus,
  ): Challenge => {
    const result = Challenge.create({
      id,
      tripId: "trip-123",
      name: "Test Challenge",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.UNLIMITED,
      status,
      basePoints: 100,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create challenge: ${result.error}`);
    }
    return result.value;
  };

  // Helper to update challenge status
  const updateChallengeStatus = (
    challenge: Challenge,
    newStatus: ChallengeStatus,
  ): Challenge => {
    return challenge.updateStatus(newStatus);
  };

  describe("execute", () => {
    it("should update status from HIDDEN to VISIBLE", async () => {
      // Arrange
      const hiddenChallenge = createChallengeWithStatus(
        "challenge-1",
        ChallengeStatus.HIDDEN,
      );
      const visibleChallenge = updateChallengeStatus(
        hiddenChallenge,
        ChallengeStatus.VISIBLE,
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(hiddenChallenge)),
        findById: mock(() => Promise.resolve(hiddenChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(visibleChallenge)),
        updateStatus: mock(() => Promise.resolve(visibleChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeStatusUseCase(mockRepo);
      const input: UpdateChallengeStatusInput = {
        challengeId: "challenge-1",
        newStatus: ChallengeStatus.VISIBLE,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.previousStatus).toBe("HIDDEN");
        expect(result.value.newStatus).toBe("VISIBLE");
        expect(result.value.id).toBe("challenge-1");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("challenge-1");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update status from VISIBLE to ACTIVE", async () => {
      // Arrange
      const visibleChallenge = createChallengeWithStatus(
        "challenge-2",
        ChallengeStatus.VISIBLE,
      );
      const activeChallenge = updateChallengeStatus(
        visibleChallenge,
        ChallengeStatus.ACTIVE,
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(visibleChallenge)),
        findById: mock(() => Promise.resolve(visibleChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(activeChallenge)),
        updateStatus: mock(() => Promise.resolve(activeChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeStatusUseCase(mockRepo);
      const input: UpdateChallengeStatusInput = {
        challengeId: "challenge-2",
        newStatus: ChallengeStatus.ACTIVE,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.previousStatus).toBe("VISIBLE");
        expect(result.value.newStatus).toBe("ACTIVE");
      }
    });

    it("should update status from ACTIVE to COMPLETED", async () => {
      // Arrange
      const activeChallenge = createChallengeWithStatus(
        "challenge-3",
        ChallengeStatus.ACTIVE,
      );
      const completedChallenge = updateChallengeStatus(
        activeChallenge,
        ChallengeStatus.COMPLETED,
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(activeChallenge)),
        findById: mock(() => Promise.resolve(activeChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(completedChallenge)),
        updateStatus: mock(() => Promise.resolve(completedChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeStatusUseCase(mockRepo);
      const input: UpdateChallengeStatusInput = {
        challengeId: "challenge-3",
        newStatus: ChallengeStatus.COMPLETED,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.previousStatus).toBe("ACTIVE");
        expect(result.value.newStatus).toBe("COMPLETED");
      }
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

      const useCase = new UpdateChallengeStatusUseCase(mockRepo);
      const input: UpdateChallengeStatusInput = {
        challengeId: "non-existent",
        newStatus: ChallengeStatus.ACTIVE,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Challenge not found");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error for invalid status transition from HIDDEN to ACTIVE", async () => {
      // Arrange
      const hiddenChallenge = createChallengeWithStatus(
        "challenge-hidden",
        ChallengeStatus.HIDDEN,
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(hiddenChallenge)),
        findById: mock(() => Promise.resolve(hiddenChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(hiddenChallenge)),
        updateStatus: mock(() => Promise.resolve(hiddenChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeStatusUseCase(mockRepo);
      const input: UpdateChallengeStatusInput = {
        challengeId: "challenge-hidden",
        newStatus: ChallengeStatus.ACTIVE, // Invalid: HIDDEN -> ACTIVE not allowed
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Invalid status transition");
        expect(result.error).toContain("HIDDEN");
        expect(result.error).toContain("ACTIVE");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error for invalid status transition from COMPLETED to any status", async () => {
      // Arrange
      const completedChallenge = createChallengeWithStatus(
        "challenge-completed",
        ChallengeStatus.COMPLETED,
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(completedChallenge)),
        findById: mock(() => Promise.resolve(completedChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(completedChallenge)),
        updateStatus: mock(() => Promise.resolve(completedChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeStatusUseCase(mockRepo);
      const input: UpdateChallengeStatusInput = {
        challengeId: "challenge-completed",
        newStatus: ChallengeStatus.VISIBLE, // Invalid: COMPLETED is terminal
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Invalid status transition");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should allow transition from ACTIVE to VOTING_PHASE for peer voting challenges", async () => {
      // Arrange - create a peer voting challenge
      const result = Challenge.create({
        id: "challenge-voting",
        tripId: "trip-123",
        name: "Photo Contest",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.PEER_VOTING,
        status: ChallengeStatus.ACTIVE,
        basePoints: 100,
      });
      if (result.kind === "err") {
        throw new Error(`Failed to create challenge: ${result.error}`);
      }
      const activeChallenge = result.value;
      const votingChallenge = updateChallengeStatus(
        activeChallenge,
        ChallengeStatus.VOTING_PHASE,
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(activeChallenge)),
        findById: mock(() => Promise.resolve(activeChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(votingChallenge)),
        updateStatus: mock(() => Promise.resolve(votingChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeStatusUseCase(mockRepo);
      const input: UpdateChallengeStatusInput = {
        challengeId: "challenge-voting",
        newStatus: ChallengeStatus.VOTING_PHASE,
      };

      // Act
      const result2 = await useCase.execute(input);

      // Assert
      expect(result2.kind).toBe("ok");
      if (result2.kind === "ok") {
        expect(result2.value.previousStatus).toBe("ACTIVE");
        expect(result2.value.newStatus).toBe("VOTING_PHASE");
      }
    });

    it("should allow cancelling from any non-terminal status", async () => {
      // Arrange
      const visibleChallenge = createChallengeWithStatus(
        "challenge-cancel",
        ChallengeStatus.VISIBLE,
      );
      const cancelledChallenge = updateChallengeStatus(
        visibleChallenge,
        ChallengeStatus.CANCELLED,
      );

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(visibleChallenge)),
        findById: mock(() => Promise.resolve(visibleChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(cancelledChallenge)),
        updateStatus: mock(() => Promise.resolve(cancelledChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeStatusUseCase(mockRepo);
      const input: UpdateChallengeStatusInput = {
        challengeId: "challenge-cancel",
        newStatus: ChallengeStatus.CANCELLED,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.previousStatus).toBe("VISIBLE");
        expect(result.value.newStatus).toBe("CANCELLED");
      }
    });
  });
});
