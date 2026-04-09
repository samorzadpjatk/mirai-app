import { describe, it, expect, mock, beforeEach } from "bun:test";
import { PrismaChallengeRepository } from "../gateways/PrismaChallengeRepository";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

describe("[INTEGRATION] PrismaChallengeRepository", () => {
  // Create mock Prisma client
  const createMockPrisma = () => ({
    challenge: {
      create: mock(() => Promise.resolve({})),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve(0)),
    },
  });

  // Sample Prisma challenge data
  const createPrismaChallenge = (
    overrides: Partial<{
      id: string;
      tripId: string;
      name: string;
      description: string | null;
      image: string | null;
      submissionType: string;
      scoringCategory: string;
      isRecurring: boolean;
      dailyStartTime: string | null;
      dailyEndTime: string | null;
      basePoints: number;
      firstPlacePoints: number | null;
      secondPlacePoints: number | null;
      thirdPlacePoints: number | null;
      status: string;
      startTime: Date | null;
      endTime: Date | null;
      votingStartTime: Date | null;
      votingEndTime: Date | null;
      targetLatitude: number | null;
      targetLongitude: number | null;
      expectedValue: string | null;
      autoApprove: boolean;
      createdAt: Date;
      updatedAt: Date;
    }> = {},
  ) => ({
    id: "challenge-123",
    tripId: "trip-456",
    name: "Test Challenge",
    description: "A test challenge",
    image: null,
    submissionType: "IMAGE",
    scoringCategory: "UNLIMITED",
    isRecurring: false,
    dailyStartTime: null,
    dailyEndTime: null,
    basePoints: 10,
    firstPlacePoints: null,
    secondPlacePoints: null,
    thirdPlacePoints: null,
    status: "HIDDEN",
    startTime: null,
    endTime: null,
    votingStartTime: null,
    votingEndTime: null,
    targetLatitude: null,
    targetLongitude: null,
    expectedValue: null,
    autoApprove: false,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("create", () => {
    it("should create a challenge and return domain entity", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenge = createPrismaChallenge();
      mockPrisma.challenge.create = mock(() =>
        Promise.resolve(prismaChallenge),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const challenge = Challenge.create({
        tripId: "trip-456",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      }).value;

      const result = await repository.create(challenge);

      expect(mockPrisma.challenge.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tripId: "trip-456",
          name: "Test Challenge",
          submissionType: "IMAGE",
          scoringCategory: "UNLIMITED",
        }),
      });
      expect(result.id).toBe("challenge-123");
      expect(result.name).toBe("Test Challenge");
    });

    it("should propagate database errors", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.create = mock(() =>
        Promise.reject(new Error("Database error")),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const challenge = Challenge.create({
        tripId: "trip-1",
        name: "Test",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      }).value;

      await expect(repository.create(challenge)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("findById", () => {
    it("should find challenge by id and return domain entity", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenge = createPrismaChallenge({ id: "challenge-789" });
      mockPrisma.challenge.findUnique = mock(() =>
        Promise.resolve(prismaChallenge),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const result = await repository.findById("challenge-789");

      expect(mockPrisma.challenge.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findUnique).toHaveBeenCalledWith({
        where: { id: "challenge-789" },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe("challenge-789");
    });

    it("should return null when challenge not found", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findUnique = mock(() => Promise.resolve(null));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByTripId", () => {
    it("should find challenges by tripId", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenges = [
        createPrismaChallenge({ id: "c1", tripId: "trip-abc" }),
        createPrismaChallenge({ id: "c2", tripId: "trip-abc" }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findByTripId("trip-abc");

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        where: { tripId: "trip-abc" },
        orderBy: { createdAt: "desc" },
      });
      expect(results).toHaveLength(2);
      expect(results[0].tripId).toBe("trip-abc");
      expect(results[1].tripId).toBe("trip-abc");
    });

    it("should return empty array when no challenges found", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findMany = mock(() => Promise.resolve([]));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findByTripId("empty-trip");

      expect(results).toEqual([]);
    });

    it("should order results by createdAt desc", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findMany = mock(() => Promise.resolve([]));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      await repository.findByTripId("trip-1");

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });

  describe("findByStatus", () => {
    it("should find challenges by status", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenges = [
        createPrismaChallenge({ id: "c1", status: "ACTIVE" }),
        createPrismaChallenge({ id: "c2", status: "ACTIVE" }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findByStatus(ChallengeStatus.ACTIVE);

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        where: { status: ChallengeStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
      });
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe(ChallengeStatus.ACTIVE);
    });

    it("should handle all status types", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findMany = mock((args: any) =>
        Promise.resolve([
          createPrismaChallenge({ status: args?.where?.status }),
        ]),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);

      for (const status of Object.values(ChallengeStatus)) {
        const results = await repository.findByStatus(
          status as ChallengeStatus,
        );
        expect(results[0].status).toBe(status);
      }
    });
  });

  describe("findByTripIdAndStatus", () => {
    it("should find challenges by tripId and status", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenges = [
        createPrismaChallenge({
          id: "c1",
          tripId: "trip-1",
          status: "VISIBLE",
        }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findByTripIdAndStatus(
        "trip-1",
        ChallengeStatus.VISIBLE,
      );

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        where: { tripId: "trip-1", status: ChallengeStatus.VISIBLE },
        orderBy: { createdAt: "desc" },
      });
      expect(results).toHaveLength(1);
      expect(results[0].tripId).toBe("trip-1");
      expect(results[0].status).toBe(ChallengeStatus.VISIBLE);
    });
  });

  describe("findBySubmissionType", () => {
    it("should find challenges by submission type", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenges = [
        createPrismaChallenge({ id: "c1", submissionType: "QR_CODE" }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findBySubmissionType(
        SubmissionType.QR_CODE,
      );

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        where: { submissionType: SubmissionType.QR_CODE },
        orderBy: { createdAt: "desc" },
      });
      expect(results[0].submissionType).toBe(SubmissionType.QR_CODE);
    });

    it("should handle all submission types", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findMany = mock((args: any) =>
        Promise.resolve([
          createPrismaChallenge({
            submissionType: args?.where?.submissionType,
          }),
        ]),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);

      for (const type of Object.values(SubmissionType)) {
        const results = await repository.findBySubmissionType(
          type as SubmissionType,
        );
        expect(results[0].submissionType).toBe(type);
      }
    });
  });

  describe("findByScoringCategory", () => {
    it("should find challenges by scoring category", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenges = [
        createPrismaChallenge({ id: "c1", scoringCategory: "SPEED" }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findByScoringCategory(
        ScoringCategory.SPEED,
      );

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        where: { scoringCategory: ScoringCategory.SPEED },
        orderBy: { createdAt: "desc" },
      });
      expect(results[0].scoringCategory).toBe(ScoringCategory.SPEED);
    });

    it("should handle all scoring categories", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findMany = mock((args: any) =>
        Promise.resolve([
          createPrismaChallenge({
            scoringCategory: args?.where?.scoringCategory,
          }),
        ]),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);

      for (const category of Object.values(ScoringCategory)) {
        const results = await repository.findByScoringCategory(
          category as ScoringCategory,
        );
        expect(results[0].scoringCategory).toBe(category);
      }
    });
  });

  describe("findActive", () => {
    it("should find active challenges", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenges = [
        createPrismaChallenge({ id: "c1", status: "ACTIVE" }),
        createPrismaChallenge({ id: "c2", status: "ACTIVE" }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findActive();

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });
      expect(results).toHaveLength(2);
      expect(results.every((c) => c.isActive())).toBe(true);
    });
  });

  describe("findOpenForSubmission", () => {
    it("should query with correct time filters", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findMany = mock(() => Promise.resolve([]));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      await repository.findOpenForSubmission();

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledTimes(1);
      const callArgs = mockPrisma.challenge.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBe("ACTIVE");
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.AND).toBeDefined();
    });

    it("should filter challenges by isOpenForSubmission", async () => {
      const now = new Date();
      const mockPrisma = createMockPrisma();
      // Create challenges that pass the Prisma query
      const prismaChallenges = [
        createPrismaChallenge({
          id: "c1",
          status: "ACTIVE",
          startTime: new Date(now.getTime() - 1000), // Started 1 second ago
          endTime: new Date(now.getTime() + 10000), // Ends in 10 seconds
        }),
        createPrismaChallenge({
          id: "c2",
          status: "ACTIVE",
          startTime: new Date(now.getTime() - 1000),
          endTime: new Date(now.getTime() + 10000),
        }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findOpenForSubmission();

      expect(results.every((c) => c.isOpenForSubmission())).toBe(true);
    });
  });

  describe("findRecurring", () => {
    it("should find recurring challenges", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenges = [
        createPrismaChallenge({ id: "c1", isRecurring: true }),
        createPrismaChallenge({ id: "c2", isRecurring: true }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findRecurring();

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        where: { isRecurring: true },
        orderBy: { createdAt: "desc" },
      });
      expect(results.every((c) => c.isRecurring)).toBe(true);
    });
  });

  describe("findAll", () => {
    it("should return all challenges without options", async () => {
      const mockPrisma = createMockPrisma();
      const prismaChallenges = [
        createPrismaChallenge({ id: "c1" }),
        createPrismaChallenge({ id: "c2" }),
        createPrismaChallenge({ id: "c3" }),
      ];
      mockPrisma.challenge.findMany = mock(() =>
        Promise.resolve(prismaChallenges),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const results = await repository.findAll();

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        take: undefined,
        skip: undefined,
        orderBy: { createdAt: "desc" },
      });
      expect(results).toHaveLength(3);
    });

    it("should respect limit and offset options", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findMany = mock(() => Promise.resolve([]));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      await repository.findAll({ limit: 10, offset: 5 });

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        take: 10,
        skip: 5,
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("update", () => {
    it("should update challenge and return updated domain entity", async () => {
      const mockPrisma = createMockPrisma();
      const updatedPrismaChallenge = createPrismaChallenge({
        id: "challenge-123",
        name: "Updated Challenge",
        basePoints: 50,
      });
      mockPrisma.challenge.update = mock(() =>
        Promise.resolve(updatedPrismaChallenge),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const challenge = Challenge.create({
        id: "challenge-123",
        tripId: "trip-456",
        name: "Updated Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        basePoints: 50,
      }).value;

      const result = await repository.update(challenge);

      expect(mockPrisma.challenge.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.update).toHaveBeenCalledWith({
        where: { id: "challenge-123" },
        data: expect.objectContaining({
          name: "Updated Challenge",
          basePoints: 50,
        }),
      });
      expect(result.name).toBe("Updated Challenge");
      expect(result.basePoints).toBe(50);
    });

    it("should propagate update errors", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.update = mock(() =>
        Promise.reject(new Error("Update failed")),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const challenge = Challenge.create({
        id: "c1",
        tripId: "trip-1",
        name: "Test",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
      }).value;

      await expect(repository.update(challenge)).rejects.toThrow(
        "Update failed",
      );
    });
  });

  describe("updateStatus", () => {
    it("should update challenge status", async () => {
      const mockPrisma = createMockPrisma();
      const updatedPrismaChallenge = createPrismaChallenge({
        id: "challenge-123",
        status: "ACTIVE",
      });
      mockPrisma.challenge.update = mock(() =>
        Promise.resolve(updatedPrismaChallenge),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const result = await repository.updateStatus(
        "challenge-123",
        ChallengeStatus.ACTIVE,
      );

      expect(mockPrisma.challenge.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.update).toHaveBeenCalledWith({
        where: { id: "challenge-123" },
        data: { status: ChallengeStatus.ACTIVE },
      });
      expect(result.status).toBe(ChallengeStatus.ACTIVE);
    });

    it("should handle all status transitions", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.update = mock((args: any) =>
        Promise.resolve(createPrismaChallenge({ status: args.data.status })),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);

      for (const status of Object.values(ChallengeStatus)) {
        const result = await repository.updateStatus(
          "c1",
          status as ChallengeStatus,
        );
        expect(result.status).toBe(status);
      }
    });
  });

  describe("delete", () => {
    it("should delete challenge by id", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.delete = mock(() => Promise.resolve({}));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      await repository.delete("challenge-123");

      expect(mockPrisma.challenge.delete).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.delete).toHaveBeenCalledWith({
        where: { id: "challenge-123" },
      });
    });

    it("should propagate delete errors", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.delete = mock(() =>
        Promise.reject(new Error("Delete failed")),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      await expect(repository.delete("challenge-123")).rejects.toThrow(
        "Delete failed",
      );
    });
  });

  describe("exists", () => {
    it("should return true when challenge exists", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findUnique = mock(() =>
        Promise.resolve({ id: "challenge-123" }),
      );

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const result = await repository.exists("challenge-123");

      expect(mockPrisma.challenge.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.findUnique).toHaveBeenCalledWith({
        where: { id: "challenge-123" },
      });
      expect(result).toBe(true);
    });

    it("should return false when challenge does not exist", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.findUnique = mock(() => Promise.resolve(null));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const result = await repository.exists("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("countByTripId", () => {
    it("should return count of challenges for trip", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.count = mock(() => Promise.resolve(5));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const result = await repository.countByTripId("trip-123");

      expect(mockPrisma.challenge.count).toHaveBeenCalledTimes(1);
      expect(mockPrisma.challenge.count).toHaveBeenCalledWith({
        where: { tripId: "trip-123" },
      });
      expect(result).toBe(5);
    });

    it("should return 0 for trip with no challenges", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.challenge.count = mock(() => Promise.resolve(0));

      const repository = new PrismaChallengeRepository(mockPrisma as any);
      const result = await repository.countByTripId("empty-trip");

      expect(result).toBe(0);
    });
  });
});
