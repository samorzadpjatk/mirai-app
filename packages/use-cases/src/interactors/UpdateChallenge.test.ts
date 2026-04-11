import { describe, it, expect, mock } from "bun:test";
import {
  UpdateChallengeUseCase,
  UpdateChallengeInput,
} from "./UpdateChallenge";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import type { ChallengeRepository } from "../ports/ChallengeRepository";

describe("[UNIT] UpdateChallengeUseCase", () => {
  // Helper to create a valid challenge
  const createValidChallenge = (
    overrides?: Partial<{
      id: string;
      name: string;
      status: ChallengeStatus;
      description: string | null;
      basePoints: number;
    }>,
  ): Challenge => {
    const result = Challenge.create({
      id: overrides?.id ?? "challenge-123",
      tripId: "trip-123",
      name: overrides?.name ?? "Test Challenge",
      description: overrides?.description ?? "Original description",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.UNLIMITED,
      status: overrides?.status ?? ChallengeStatus.HIDDEN,
      basePoints: overrides?.basePoints ?? 100,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create challenge: ${result.error}`);
    }
    return result.value;
  };

  describe("execute", () => {
    it("should update challenge name", async () => {
      // Arrange
      const existingChallenge = createValidChallenge({ id: "challenge-456" });
      const updatedChallengeResult = existingChallenge.updateDetails({
        name: "Updated Challenge Name",
      });
      if (updatedChallengeResult.kind === "err") {
        throw new Error(
          `Failed to update challenge: ${updatedChallengeResult.error}`,
        );
      }
      const updatedChallenge = updatedChallengeResult.value;

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(existingChallenge)),
        findById: mock(() => Promise.resolve(existingChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedChallenge)),
        updateStatus: mock(() => Promise.resolve(updatedChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeUseCase(mockRepo);
      const input: UpdateChallengeInput = {
        challengeId: "challenge-456",
        name: "Updated Challenge Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Updated Challenge Name");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("challenge-456");
      expect(mockRepo.update).toHaveBeenCalled();
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

      const useCase = new UpdateChallengeUseCase(mockRepo);
      const input: UpdateChallengeInput = {
        challengeId: "non-existent",
        name: "New Name",
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

    it("should return error when challenge is in terminal state (COMPLETED)", async () => {
      // Arrange
      const completedChallenge = createValidChallenge({
        id: "challenge-completed",
        name: "Completed Challenge",
        status: ChallengeStatus.COMPLETED,
      });

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

      const useCase = new UpdateChallengeUseCase(mockRepo);
      const input: UpdateChallengeInput = {
        challengeId: "challenge-completed",
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("completed or cancelled");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when challenge is in terminal state (CANCELLED)", async () => {
      // Arrange
      const cancelledChallenge = createValidChallenge({
        id: "challenge-cancelled",
        name: "Cancelled Challenge",
        status: ChallengeStatus.CANCELLED,
      });

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(cancelledChallenge)),
        findById: mock(() => Promise.resolve(cancelledChallenge)),
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

      const useCase = new UpdateChallengeUseCase(mockRepo);
      const input: UpdateChallengeInput = {
        challengeId: "challenge-cancelled",
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("completed or cancelled");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should update challenge description", async () => {
      // Arrange
      const existingChallenge = createValidChallenge({
        id: "challenge-desc",
        description: "Old description",
      });
      const updatedChallengeResult = existingChallenge.updateDetails({
        description: "New description",
      });
      if (updatedChallengeResult.kind === "err") {
        throw new Error(
          `Failed to update challenge: ${updatedChallengeResult.error}`,
        );
      }
      const updatedChallenge = updatedChallengeResult.value;

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(existingChallenge)),
        findById: mock(() => Promise.resolve(existingChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedChallenge)),
        updateStatus: mock(() => Promise.resolve(updatedChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeUseCase(mockRepo);
      const input: UpdateChallengeInput = {
        challengeId: "challenge-desc",
        description: "New description",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.description).toBe("New description");
      }
    });

    it("should update challenge basePoints", async () => {
      // Arrange
      const existingChallenge = createValidChallenge({
        id: "challenge-points",
        basePoints: 100,
      });
      const updatedChallengeResult = existingChallenge.updatePoints({
        basePoints: 200,
      });
      if (updatedChallengeResult.kind === "err") {
        throw new Error(
          `Failed to update challenge: ${updatedChallengeResult.error}`,
        );
      }
      const updatedChallenge = updatedChallengeResult.value;

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(existingChallenge)),
        findById: mock(() => Promise.resolve(existingChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedChallenge)),
        updateStatus: mock(() => Promise.resolve(updatedChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeUseCase(mockRepo);
      const input: UpdateChallengeInput = {
        challengeId: "challenge-points",
        basePoints: 200,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.basePoints).toBe(200);
      }
    });

    it("should return error when name is empty", async () => {
      // Arrange
      const existingChallenge = createValidChallenge({ id: "challenge-empty" });

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(existingChallenge)),
        findById: mock(() => Promise.resolve(existingChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(existingChallenge)),
        updateStatus: mock(() => Promise.resolve(existingChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeUseCase(mockRepo);
      const input: UpdateChallengeInput = {
        challengeId: "challenge-empty",
        name: "", // Empty name
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error.message).toContain("name");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const existingChallenge = createValidChallenge({
        id: "challenge-multi",
        name: "Old Name",
        description: "Old description",
        basePoints: 50,
      });

      // First update name and description
      let updatedChallengeResult = existingChallenge.updateDetails({
        name: "New Name",
        description: "New description",
      });
      if (updatedChallengeResult.kind === "err") {
        throw new Error(
          `Failed to update challenge: ${updatedChallengeResult.error}`,
        );
      }
      let updatedChallenge = updatedChallengeResult.value;

      // Then update points
      const pointsResult = updatedChallenge.updatePoints({
        basePoints: 150,
      });
      if (pointsResult.kind === "err") {
        throw new Error(
          `Failed to update challenge points: ${pointsResult.error}`,
        );
      }
      updatedChallenge = pointsResult.value;

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(existingChallenge)),
        findById: mock(() => Promise.resolve(existingChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedChallenge)),
        updateStatus: mock(() => Promise.resolve(updatedChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateChallengeUseCase(mockRepo);
      const input: UpdateChallengeInput = {
        challengeId: "challenge-multi",
        name: "New Name",
        description: "New description",
        basePoints: 150,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("New Name");
        expect(result.value.description).toBe("New description");
        expect(result.value.basePoints).toBe(150);
      }
    });
  });
});
