import { describe, it, expect, beforeEach } from "bun:test";
import { CreateChallengeUseCase } from "./CreateChallenge";
import type { CreateChallengeInput } from "./CreateChallenge";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { InMemoryChallengeRepository } from "@mirai-app/adapters/test-utils";

async function runAsResult<T>(
  fn: () => Promise<T>,
): Promise<{ kind: "ok"; value: T } | { kind: "err"; error: string }> {
  try {
    const value = await fn();
    return { kind: "ok", value };
  } catch (error) {
    return {
      kind: "err",
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

describe("[UNIT] CreateChallengeUseCase", () => {
  let repo: InMemoryChallengeRepository;
  let useCase: CreateChallengeUseCase;

  beforeEach(() => {
    repo = new InMemoryChallengeRepository();
    useCase = new CreateChallengeUseCase(repo);
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

      // Act
      const result = await runAsResult(() => useCase.execute(input));

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
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("HIDDEN");
      }

      // Verify stored challenge has HIDDEN status
      const stored = await repo.findByTripId("trip-456");
      expect(stored[0]?.status).toBe(ChallengeStatus.HIDDEN);
    });

    it("should return error when name is empty", async () => {
      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "", // Empty name
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("name");
      }

      // Verify no challenge was stored
      const stored = await repo.findAll();
      expect(stored).toHaveLength(0);
    });

    it("should return error when tripId is empty", async () => {
      const input: CreateChallengeInput = {
        tripId: "", // Empty tripId
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }

      // Verify no challenge was stored
      const stored = await repo.findAll();
      expect(stored).toHaveLength(0);
    });

    it("should return error when basePoints is negative", async () => {
      const input: CreateChallengeInput = {
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        basePoints: -10, // Negative points
      };

      // Act
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("basePoints");
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
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.submissionType).toBe("LOCATION");
        expect(result.value.scoringCategory).toBe("SPEED");
      }

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
      const result = await runAsResult(() => useCase.execute(input));

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.scoringCategory).toBe("PEER_VOTING");
      }

      // Verify stored challenge
      const stored = await repo.findByTripId("trip-vote");
      expect(stored).toHaveLength(1);
      expect(stored[0]?.scoringCategory).toBe(ScoringCategory.PEER_VOTING);
    });
  });
});
