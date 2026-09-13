import type { TransactionDB } from "@mirai-app/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type RecurringTemplate,
  precreateRecurringInstancesForTemplate,
  resolveRecurringChallengeIdForTrip,
} from "../recurringChallenges";

describe("recurringChallenges", () => {
  let mockTx: TransactionDB;

  beforeEach(() => {
    vi.clearAllMocks();

    const challengeMock = {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    };

    const createSelectChain = () => {
      let hasLimit = false;
      const chain = {
        from: vi.fn(() => chain),
        leftJoin: vi.fn(() => chain),
        innerJoin: vi.fn(() => chain),
        where: vi.fn(() => chain),
        limit: vi.fn(() => {
          hasLimit = true;
          return chain;
        }),
        then: vi.fn((resolve) => {
          if (hasLimit) {
            const result = challengeMock.findFirst();
            return Promise.resolve(result).then((r) => resolve(r ? [r] : []));
          }
          const result = challengeMock.findMany();
          return Promise.resolve(result).then((r) => resolve(r));
        }),
      };
      return chain;
    };

    mockTx = {
      challenge: challengeMock,
      query: {
        challenges: challengeMock,
      },
      select: vi.fn(() => createSelectChain()),
      insert: vi.fn(() => ({
        values: vi.fn((data) => ({
          returning: vi.fn(() => {
            const result = challengeMock.create({ data });
            return result instanceof Promise
              ? result.then((r: unknown) => [r])
              : Promise.resolve([result]);
          }),
        })),
      })),
    } as TransactionDB;
  });

  const createMockTemplate = (overrides: Partial<RecurringTemplate> = {}): RecurringTemplate => ({
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
    textExpectedPhrase: null,
    qrCodeValue: null,
    autoApprove: false,
    createdAt: new Date("2024-01-01"),
    isRecurring: true,
    ...overrides,
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
      mockTx.challenge.findFirst.mockResolvedValue(null);

      mockTx.challenge.create.mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      });

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
      mockTx.challenge.findFirst
        .mockResolvedValueOnce({ id: "existing-1", status: "ACTIVE" })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "existing-2", status: "ACTIVE" });

      mockTx.challenge.create.mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      });

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
      mockTx.challenge.findFirst.mockResolvedValue(null);

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
      mockTx.challenge.findFirst.mockResolvedValue(null);

      mockTx.challenge.create.mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      });

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

    it("should use createdAt as fallback when both endTime and startTime are null", async () => {
      mockTx.challenge.findFirst.mockResolvedValue(null);

      mockTx.challenge.create.mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      });

      const template = createMockTemplate({
        startTime: null,
        endTime: null,
        createdAt: new Date("2024-01-01"),
      });

      await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(mockTx.challenge.create).toHaveBeenCalled();
    });

    it("should skip result when created[0] is null", async () => {
      mockTx.challenge.findFirst.mockResolvedValue(null);

      mockTx.challenge.create.mockResolvedValue(null);

      const template = createMockTemplate({
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-01"),
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(result).toEqual([]);
    });

    it("should insert challengeText when textExpectedPhrase is set", async () => {
      mockTx.challenge.findFirst.mockResolvedValue(null);

      mockTx.challenge.create.mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      });

      const template = createMockTemplate({
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-01"),
        textExpectedPhrase: "expected phrase",
      });

      await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(mockTx.insert).toHaveBeenCalledTimes(4);
    });

    it("should insert challengeQrCode when qrCodeValue is set", async () => {
      mockTx.challenge.findFirst.mockResolvedValue(null);

      mockTx.challenge.create.mockResolvedValue({
        id: "new-1",
        status: "ACTIVE",
      });

      const template = createMockTemplate({
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-01"),
        qrCodeValue: "qr-value",
      });

      await precreateRecurringInstancesForTemplate({
        tx: mockTx,
        template,
      });

      expect(mockTx.insert).toHaveBeenCalledTimes(4);
    });
  });

  describe("resolveRecurringChallengeIdForTrip", () => {
    it("should return null when challenge not found", async () => {
      mockTx.challenge.findFirst.mockResolvedValue(null);

      const result = await resolveRecurringChallengeIdForTrip({
        tx: mockTx,
        tripId: "trip-1",
        challengeId: "challenge-1",
      });

      expect(result).toBeNull();
    });

    it("should return challenge ID when not recurring", async () => {
      mockTx.challenge.findFirst.mockResolvedValue({
        id: "challenge-1",
        isRecurring: false,
      });

      const result = await resolveRecurringChallengeIdForTrip({
        tx: mockTx,
        tripId: "trip-1",
        challengeId: "challenge-1",
      });

      expect(result).toBe("challenge-1");
    });

    it("should return instance ID when challenge is recurring", async () => {
      mockTx.challenge.findFirst.mockResolvedValue({
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
      });

      mockTx.challenge.findFirst
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
        })
        .mockResolvedValueOnce({
          id: "instance-1",
          status: "ACTIVE",
        });

      const result = await resolveRecurringChallengeIdForTrip({
        tx: mockTx,
        tripId: "trip-1",
        challengeId: "template-1",
        now: new Date("2024-01-02T12:00:00"),
      });

      expect(result).toBe("instance-1");
    });

    it("should return template ID when the day has no instance", async () => {
      mockTx.challenge.findFirst
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
        })
        .mockResolvedValueOnce(null);

      const result = await resolveRecurringChallengeIdForTrip({
        tx: mockTx,
        tripId: "trip-1",
        challengeId: "template-1",
        now: new Date("2024-01-02T12:00:00"),
      });

      // Nothing is generated on read any more, so an absent day falls back to the template.
      expect(result).toBe("template-1");
    });
  });
});
