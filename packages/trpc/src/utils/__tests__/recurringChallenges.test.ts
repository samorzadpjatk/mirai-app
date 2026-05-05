import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ensureRecurringInstanceForTemplate,
  precreateRecurringInstancesForTemplate,
  ensureRecurringInstancesForTrip,
  resolveRecurringChallengeIdForTrip,
  type RecurringTemplate,
} from "../recurringChallenges";
import type { Prisma, PrismaClient } from "@mirai-app/db";

describe("recurringChallenges", () => {
  let mockTx: Prisma.TransactionClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTx = {
      challenge: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
    } as unknown as Prisma.TransactionClient;
  });

  const createMockTemplate = (
    overrides: Partial<RecurringTemplate> = {}
  ) => ({
    id: "template-1",
    tripId: "trip-1",
    name: "Daily Challenge",
    description: "A daily challenge",
    image: null,
    submissionType: "IMAGE" as const,
    scoringCategory: "SPEED" as const,
    basePoints: 10,
    firstPlacePoints: null,
    secondPlacePoints: null,
    thirdPlacePoints: null,
    status: "VISIBLE" as const,
    startTime: new Date("2024-01-01"),
    endTime: new Date("2024-01-07"),
    dailyStartTime: "09:00",
    dailyEndTime: "18:00",
    targetLatitude: null,
    targetLongitude: null,
    expectedValue: null,
    autoApprove: false,
    createdAt: new Date("2024-01-01"),
    isRecurring: true,
    ...overrides,
  });

  describe("ensureRecurringInstanceForTemplate", () => {
    it("should return null for non-recurring template", async () => {
      const template = createMockTemplate({ isRecurring: false });

      const result = await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toBeNull();
    });

    it("should return null for HIDDEN status template", async () => {
      const template = createMockTemplate({ status: "HIDDEN" });

      const result = await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toBeNull();
    });

    it("should return null when current date is before template start", async () => {
      const template = createMockTemplate({
        startTime: new Date("2024-01-05"),
      });

      const result = await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toBeNull();
    });

    it("should return null when current date is after template end", async () => {
      const template = createMockTemplate({
        endTime: new Date("2024-01-03"),
      });

      const result = await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-05T12:00:00"),
      });

      expect(result).toBeNull();
    });

    it("should return null when daily times are not set", async () => {
      const template = createMockTemplate({
        dailyStartTime: null,
        dailyEndTime: null,
      });

      const result = await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toBeNull();
    });

    it("should return null when daily times are invalid", async () => {
      const template = createMockTemplate({
        dailyStartTime: "invalid",
        dailyEndTime: "invalid",
      });

      const result = await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toBeNull();
    });

    it("should return existing instance if found", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue({
        id: "existing-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate();

      const result = await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toEqual({ id: "existing-1", status: "ACTIVE", created: false });
      expect(mockTx.challenge.findFirst).toHaveBeenCalled();
    });

    it("should create new instance if not found", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate();

      const result = await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toEqual({ id: "new-1", status: "ACTIVE", created: true });
      expect(mockTx.challenge.create).toHaveBeenCalled();
    });

    it("should use createdAt as fallback when startTime is null", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue({
        id: "existing-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate({
        startTime: null,
        createdAt: new Date("2024-01-01"),
      });

      await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(mockTx.challenge.findFirst).toHaveBeenCalled();
    });

    it("should create instance with correct day index", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate({
        startTime: new Date("2024-01-01"),
      });

      await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-03T12:00:00"),
      });

      expect(mockTx.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Daily Challenge #3",
          }),
        })
      );
    });

    it("should set VISIBLE status when now is before daily start", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "VISIBLE",
      } as never);

      const template = createMockTemplate();

      await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T08:00:00"),
      });

      expect(mockTx.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "VISIBLE",
          }),
        })
      );
    });

    it("should set ACTIVE status when now is within daily bounds", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate();

      await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(mockTx.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "ACTIVE",
          }),
        })
      );
    });

    it("should set COMPLETED status when now is after daily end", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "COMPLETED",
      } as never);

      const template = createMockTemplate();

      await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T20:00:00"),
      });

      expect(mockTx.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "COMPLETED",
          }),
        })
      );
    });

    it("should handle daily end time on next day", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate({
        dailyStartTime: "20:00",
        dailyEndTime: "02:00",
      });

      await ensureRecurringInstanceForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-02T22:00:00"),
      });

      expect(mockTx.challenge.create).toHaveBeenCalled();
    });
  });

  describe("precreateRecurringInstancesForTemplate", () => {
    it("should return empty array for non-recurring template", async () => {
      const template = createMockTemplate({ isRecurring: false });

      const result = await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(result).toEqual([]);
    });

    it("should return empty array for HIDDEN status template", async () => {
      const template = createMockTemplate({ status: "HIDDEN" });

      const result = await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(result).toEqual([]);
    });

    it("should return empty array when end is before start", async () => {
      const template = createMockTemplate({
        startTime: new Date("2024-01-07"),
        endTime: new Date("2024-01-01"),
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(result).toEqual([]);
    });

    it("should create instances for all days in range", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate({
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-03"),
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-01T12:00:00"),
      });

      expect(result).toHaveLength(3);
      expect(mockTx.challenge.create).toHaveBeenCalledTimes(3);
    });

    it("should skip existing instances", async () => {
      vi.mocked(mockTx.challenge.findFirst)
        .mockResolvedValueOnce({ id: "existing-1", status: "ACTIVE" } as never)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "existing-2", status: "ACTIVE" } as never);

      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate({
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-03"),
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
        now: new Date("2024-01-01T12:00:00"),
      });

      expect(result).toHaveLength(3);
      expect(mockTx.challenge.create).toHaveBeenCalledTimes(1);
      expect(result[0]!.created).toBe(false);
      expect(result[1]!.created).toBe(true);
      expect(result[2]!.created).toBe(false);
    });

    it("should skip days with invalid daily bounds", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);

      const template = createMockTemplate({
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-03"),
        dailyStartTime: null,
        dailyEndTime: null,
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(result).toEqual([]);
    });

    it("should use startTime as fallback for endTime", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      } as never);

      const template = createMockTemplate({
        startTime: new Date("2024-01-01"),
        endTime: null,
      });

      await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(mockTx.challenge.create).toHaveBeenCalled();
    });
  });

  describe("ensureRecurringInstancesForTrip", () => {
    it("should process all recurring templates for trip", async () => {
      const mockTemplates = [
        createMockTemplate({ id: "template-1" }),
        createMockTemplate({ id: "template-2" }),
      ];

      vi.mocked(mockTx.challenge.findMany).mockResolvedValue(
        mockTemplates as never
      );
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);
      vi.mocked(mockTx.challenge.create).mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      } as never);

      const result = await ensureRecurringInstancesForTrip({
        tx: mockTx,
        tripId: "trip-1",
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(mockTx.challenge.findMany).toHaveBeenCalledWith({
        where: {
          tripId: "trip-1",
          isRecurring: true,
        },
        select: expect.any(Object),
      });
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return empty array when no recurring templates exist", async () => {
      vi.mocked(mockTx.challenge.findMany).mockResolvedValue([]);

      const result = await ensureRecurringInstancesForTrip({
        tx: mockTx,
        tripId: "trip-1",
      });

      expect(result).toEqual([]);
    });
  });

  describe("resolveRecurringChallengeIdForTrip", () => {
    it("should return null when challenge not found", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue(null);

      const result = await resolveRecurringChallengeIdForTrip({
        tx: mockTx,
        tripId: "trip-1",
        challengeId: "challenge-1",
      });

      expect(result).toBeNull();
    });

    it("should return challenge ID when not recurring", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue({
        id: "challenge-1",
        isRecurring: false,
      } as never);

      const result = await resolveRecurringChallengeIdForTrip({
        tx: mockTx,
        tripId: "trip-1",
        challengeId: "challenge-1",
      });

      expect(result).toBe("challenge-1");
    });

    it("should return instance ID when challenge is recurring", async () => {
      vi.mocked(mockTx.challenge.findFirst).mockResolvedValue({
        id: "template-1",
        tripId: "trip-1",
        name: "Daily Challenge",
        description: null,
        image: null,
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        basePoints: 10,
        firstPlacePoints: null,
        secondPlacePoints: null,
        thirdPlacePoints: null,
        status: "VISIBLE",
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-07"),
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
        targetLatitude: null,
        targetLongitude: null,
        expectedValue: null,
        autoApprove: false,
        createdAt: new Date("2024-01-01"),
        isRecurring: true,
      } as never);

      vi.mocked(mockTx.challenge.findFirst)
        .mockResolvedValueOnce({
          id: "template-1",
          tripId: "trip-1",
          name: "Daily Challenge",
          description: null,
          image: null,
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          basePoints: 10,
          firstPlacePoints: null,
          secondPlacePoints: null,
          thirdPlacePoints: null,
          status: "VISIBLE",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-07"),
          dailyStartTime: "09:00",
          dailyEndTime: "18:00",
          targetLatitude: null,
          targetLongitude: null,
          expectedValue: null,
          autoApprove: false,
          createdAt: new Date("2024-01-01"),
          isRecurring: true,
        } as never)
        .mockResolvedValueOnce({
          id: "instance-1",
          status: "ACTIVE",
        } as never);

      const result = await resolveRecurringChallengeIdForTrip({
        tx: mockTx,
        tripId: "trip-1",
        challengeId: "template-1",
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toBe("instance-1");
    });

    it("should return template ID when instance creation fails", async () => {
      vi.mocked(mockTx.challenge.findFirst)
        .mockResolvedValueOnce({
          id: "template-1",
          tripId: "trip-1",
          name: "Daily Challenge",
          description: null,
          image: null,
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          basePoints: 10,
          firstPlacePoints: null,
          secondPlacePoints: null,
          thirdPlacePoints: null,
          status: "VISIBLE",
          startTime: new Date("2024-01-01"),
          endTime: new Date("2024-01-07"),
          dailyStartTime: "09:00",
          dailyEndTime: "18:00",
          targetLatitude: null,
          targetLongitude: null,
          expectedValue: null,
          autoApprove: false,
          createdAt: new Date("2024-01-01"),
          isRecurring: true,
        } as never)
        .mockResolvedValueOnce(null);

      // Mock create to return null to simulate instance creation failure
      vi.mocked(mockTx.challenge.create).mockResolvedValue(null as never);

      const result = await resolveRecurringChallengeIdForTrip({
        tx: mockTx,
        tripId: "trip-1",
        challengeId: "template-1",
        now: new Date("2024-01-02T12:00:00"),
      });

      // When instance creation fails, should fall back to template ID
      expect(result).toBe("template-1");
    });
  });
});
