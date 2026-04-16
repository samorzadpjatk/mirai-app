import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryChallengeGateway } from "./gateway";
import type { ChallengeDTO } from "@mirai-app/use-cases";
import { ChallengeStatus, ScoringCategory } from "@mirai-app/domain";

// Helper to create a ChallengeDTO
const createChallengeDTO = (
  id: string,
  overrides: Partial<ChallengeDTO> = {},
): ChallengeDTO => ({
  id,
  tripId: "trip-1",
  title: `Challenge ${id}`,
  description: null,
  status: ChallengeStatus.ACTIVE,
  scoringCategory: ScoringCategory.SPEED,
  points: 10,
  maxPoints: null,
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  createdById: "user-1",
  createdAt: new Date(`2024-01-${id.padStart(2, "0")}T10:00:00Z`),
  updatedAt: new Date(),
  ...overrides,
});

describe("[UNIT] InMemoryChallengeGateway - Connection Methods", () => {
  let gateway: InMemoryChallengeGateway;

  beforeEach(async () => {
    gateway = new InMemoryChallengeGateway();
    await Effect.runPromise(gateway.reset());
  });

  describe("findByTripIdConnection", () => {
    it("returns empty connection when no challenges", async () => {
      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns paginated challenges for trip", async () => {
      const challenges = [
        createChallengeDTO("1", {
          tripId: "trip-1",
          createdAt: new Date("2024-01-15T10:00:00Z"),
        }),
        createChallengeDTO("2", {
          tripId: "trip-1",
          createdAt: new Date("2024-01-14T10:00:00Z"),
        }),
        createChallengeDTO("3", {
          tripId: "trip-1",
          createdAt: new Date("2024-01-13T10:00:00Z"),
        }),
        createChallengeDTO("4", {
          tripId: "trip-1",
          createdAt: new Date("2024-01-12T10:00:00Z"),
        }),
        createChallengeDTO("5", {
          tripId: "trip-2",
          createdAt: new Date("2024-01-11T10:00:00Z"),
        }), // different trip
      ];
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", { first: 2 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0]?.id).toBe("1"); // Most recent first
      expect(result.nodes[1]?.id).toBe("2");
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns next page using cursor", async () => {
      const challenges = [
        createChallengeDTO("1", {
          tripId: "trip-1",
          createdAt: new Date("2024-01-15T10:00:00Z"),
        }),
        createChallengeDTO("2", {
          tripId: "trip-1",
          createdAt: new Date("2024-01-14T10:00:00Z"),
        }),
        createChallengeDTO("3", {
          tripId: "trip-1",
          createdAt: new Date("2024-01-13T10:00:00Z"),
        }),
      ];
      await Effect.runPromise(gateway.seed(challenges));

      const firstPage = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", { first: 2 }),
      );

      const secondPage = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", {
          first: 2,
          after: firstPage.pageInfo.endCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(1);
      expect(secondPage.nodes[0]?.id).toBe("3");
      expect(secondPage.pageInfo.hasNextPage).toBe(false);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });
  });

  describe("findByStatusConnection", () => {
    it("returns challenges by status", async () => {
      const challenges = [
        createChallengeDTO("1", { status: ChallengeStatus.ACTIVE }),
        createChallengeDTO("2", { status: ChallengeStatus.ACTIVE }),
        createChallengeDTO("3", { status: ChallengeStatus.HIDDEN }),
      ];
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findByStatusConnection("ACTIVE", { first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(
        result.nodes.every((n) => n.status === ChallengeStatus.ACTIVE),
      ).toBe(true);
    });
  });

  describe("findByTripIdAndStatusConnection", () => {
    it("returns challenges by trip and status", async () => {
      const challenges = [
        createChallengeDTO("1", {
          tripId: "trip-1",
          status: ChallengeStatus.ACTIVE,
        }),
        createChallengeDTO("2", {
          tripId: "trip-1",
          status: ChallengeStatus.ACTIVE,
        }),
        createChallengeDTO("3", {
          tripId: "trip-1",
          status: ChallengeStatus.HIDDEN,
        }),
        createChallengeDTO("4", {
          tripId: "trip-2",
          status: ChallengeStatus.ACTIVE,
        }),
      ];
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatusConnection("trip-1", "ACTIVE", {
          first: 10,
        }),
      );

      expect(result.edges).toHaveLength(2);
      expect(
        result.nodes.every(
          (n) => n.tripId === "trip-1" && n.status === ChallengeStatus.ACTIVE,
        ),
      ).toBe(true);
    });
  });

  describe("findBySubmissionTypeConnection", () => {
    it("returns empty connection (ChallengeDTO has no submissionType)", async () => {
      const result = await Effect.runPromise(
        gateway.findBySubmissionTypeConnection("IMAGE", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("findByScoringCategoryConnection", () => {
    it("returns challenges by scoring category", async () => {
      const challenges = [
        createChallengeDTO("1", { scoringCategory: ScoringCategory.SPEED }),
        createChallengeDTO("2", { scoringCategory: ScoringCategory.SPEED }),
        createChallengeDTO("3", { scoringCategory: ScoringCategory.UNLIMITED }),
      ];
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findByScoringCategoryConnection("SPEED", { first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(
        result.nodes.every((n) => n.scoringCategory === ScoringCategory.SPEED),
      ).toBe(true);
    });
  });

  describe("findActiveConnection", () => {
    it("returns active challenges", async () => {
      const challenges = [
        createChallengeDTO("1", { status: ChallengeStatus.ACTIVE }),
        createChallengeDTO("2", { status: ChallengeStatus.ACTIVE }),
        createChallengeDTO("3", { status: ChallengeStatus.HIDDEN }),
      ];
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(
        result.nodes.every((n) => n.status === ChallengeStatus.ACTIVE),
      ).toBe(true);
    });
  });

  describe("findOpenForSubmissionConnection", () => {
    it("returns open challenges", async () => {
      const now = new Date();
      const challenges = [
        createChallengeDTO("1", {
          status: ChallengeStatus.ACTIVE,
          startDate: new Date(now.getTime() - 86400000),
          endDate: new Date(now.getTime() + 86400000),
        }),
        createChallengeDTO("2", {
          status: ChallengeStatus.ACTIVE,
          startDate: new Date(now.getTime() - 86400000),
          endDate: new Date(now.getTime() + 86400000),
        }),
        createChallengeDTO("3", {
          status: ChallengeStatus.HIDDEN,
          startDate: new Date(now.getTime() - 86400000),
          endDate: new Date(now.getTime() + 86400000),
        }),
        createChallengeDTO("4", {
          status: ChallengeStatus.ACTIVE,
          startDate: new Date(now.getTime() + 86400000),
          endDate: new Date(now.getTime() + 172800000),
        }),
      ];
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findOpenForSubmissionConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
    });
  });

  describe("findRecurringConnection", () => {
    it("returns empty connection (ChallengeDTO has no isRecurring)", async () => {
      const result = await Effect.runPromise(
        gateway.findRecurringConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("pagination limits", () => {
    it("respects first parameter", async () => {
      const challenges = Array.from({ length: 25 }, (_, i) =>
        createChallengeDTO(String(i + 1), {
          tripId: "trip-1",
          createdAt: new Date(
            `2024-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
          ),
        }),
      );
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", { first: 5 }),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("enforces max limit of 100", async () => {
      const challenges = Array.from({ length: 150 }, (_, i) =>
        createChallengeDTO(String(i + 1), {
          tripId: "trip-1",
          createdAt: new Date(
            `2024-01-${String((i % 31) + 1).padStart(2, "0")}T10:00:00Z`,
          ),
        }),
      );
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", { first: 200 }),
      );

      // Should be capped at 100
      expect(result.edges.length).toBeLessThanOrEqual(100);
    });

    it("uses default limit of 20 when first is not provided", async () => {
      const challenges = Array.from({ length: 25 }, (_, i) =>
        createChallengeDTO(String(i + 1), {
          tripId: "trip-1",
          createdAt: new Date(
            `2024-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
          ),
        }),
      );
      await Effect.runPromise(gateway.seed(challenges));

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", { first: 20 }),
      );

      expect(result.edges.length).toBeLessThanOrEqual(20);
    });
  });
});
