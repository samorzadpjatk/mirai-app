import { describe, expect, test, mock, beforeEach } from "bun:test";
import {
  ensureRecurringInstanceForTemplate,
  precreateRecurringInstancesForTemplate,
  ensureRecurringInstancesForTrip,
  resolveRecurringChallengeIdForTrip,
} from "../recurringChallenges";
import type { Prisma } from "@repo/frameworks/prisma";

const createMockTx = () => {
  return {
    challenge: {
      findFirst: mock(),
      findMany: mock(),
      create: mock(),
    },
  } as unknown as Prisma.TransactionClient;
};

const createValidTemplate = (overrides = {}) => {
  return {
    id: "template-1",
    tripId: "trip-1",
    name: "Daily Challenge",
    description: "A daily recurring challenge",
    image: null,
    submissionType: "IMAGE" as const,
    scoringCategory: "SPEED" as const,
    basePoints: 100,
    firstPlacePoints: 150,
    secondPlacePoints: 125,
    thirdPlacePoints: 110,
    status: "ACTIVE" as const,
    startTime: new Date("2024-01-01T00:00:00Z"),
    endTime: new Date("2024-01-31T00:00:00Z"),
    dailyStartTime: "09:00",
    dailyEndTime: "17:00",
    targetLatitude: null,
    targetLongitude: null,
    expectedValue: null,
    autoApprove: false,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    isRecurring: true,
    ...overrides,
  };
};

describe("[UNIT] recurringChallenges", () => {
  beforeEach(() => {
    mock.restore();
  });

  describe("ensureRecurringInstanceForTemplate", () => {
    test("returns null when template is not recurring", async () => {
      const tx = createMockTx();
      const template = createValidTemplate({ isRecurring: false });

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toBeNull();
    });

    test("returns null when template status is not VISIBLE or ACTIVE", async () => {
      const tx = createMockTx();
      const template = createValidTemplate({ status: "COMPLETED" });

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toBeNull();
    });

    test("returns null when current date is before template start", async () => {
      const tx = createMockTx();
      const template = createValidTemplate({
        startTime: new Date("2024-02-01T00:00:00Z"),
      });

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toBeNull();
    });

    test("returns null when current date is after template end", async () => {
      const tx = createMockTx();
      const template = createValidTemplate();

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-02-15T10:00:00Z"),
      });

      expect(result).toBeNull();
    });

    test("returns existing instance if found", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst.mockResolvedValueOnce({
        id: "existing-challenge",
        status: "ACTIVE",
      });

      const template = createValidTemplate();

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toEqual({
        id: "existing-challenge",
        status: "ACTIVE",
        created: false,
      });
      expect(tx.challenge.create).not.toHaveBeenCalled();
    });

    test("creates new instance when none exists", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst.mockResolvedValueOnce(null);
      tx.challenge.create.mockResolvedValueOnce({
        id: "new-challenge",
        status: "VISIBLE",
      });

      const template = createValidTemplate();

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toEqual({
        id: "new-challenge",
        status: "VISIBLE",
        created: true,
      });
      expect(tx.challenge.create).toHaveBeenCalled();
    });

    test("returns null when dailyStartTime is missing", async () => {
      const tx = createMockTx();
      const template = createValidTemplate({ dailyStartTime: null });

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toBeNull();
    });

    test("returns null when dailyEndTime is missing", async () => {
      const tx = createMockTx();
      const template = createValidTemplate({ dailyEndTime: null });

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toBeNull();
    });

    test("uses createdAt as anchor when startTime is null", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst.mockResolvedValueOnce(null);
      tx.challenge.create.mockResolvedValueOnce({
        id: "new-challenge",
        status: "VISIBLE",
      });

      const template = createValidTemplate({
        startTime: null,
        createdAt: new Date("2024-01-05T00:00:00Z"),
      });

      const result = await ensureRecurringInstanceForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result?.created).toBe(true);
    });
  });

  describe("precreateRecurringInstancesForTemplate", () => {
    test("returns empty array when template is not recurring", async () => {
      const tx = createMockTx();
      const template = createValidTemplate({ isRecurring: false });

      const result = await precreateRecurringInstancesForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toEqual([]);
    });

    test("returns empty array when endDay is before anchorDay", async () => {
      const tx = createMockTx();
      const template = createValidTemplate({
        startTime: new Date("2024-01-15T00:00:00Z"),
        endTime: new Date("2024-01-10T00:00:00Z"),
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toEqual([]);
    });

    test("generates instances for each day in range", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst.mockResolvedValue(null);
      tx.challenge.create.mockResolvedValue({ id: "new-1", status: "VISIBLE" });

      const template = createValidTemplate({
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-03T00:00:00Z"),
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result.length).toBe(3);
      expect(result.every((r) => r.created)).toBe(true);
    });

    test("skips days where instance already exists", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst
        .mockResolvedValueOnce({ id: "existing-1", status: "ACTIVE" })
        .mockResolvedValueOnce(null);
      tx.challenge.create.mockResolvedValue({ id: "new-2", status: "VISIBLE" });

      const template = createValidTemplate({
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-02T00:00:00Z"),
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result.length).toBe(2);
      expect(result[0].created).toBe(false);
      expect(result[1].created).toBe(true);
    });

    test("skips days where daily bounds cannot be calculated", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst.mockResolvedValue(null);
      tx.challenge.create.mockResolvedValue({ id: "new-1", status: "VISIBLE" });

      const template = createValidTemplate({
        startTime: new Date("2024-01-01T00:00:00Z"),
        endTime: new Date("2024-01-02T00:00:00Z"),
        dailyStartTime: null,
      });

      const result = await precreateRecurringInstancesForTemplate({
        tx,
        template,
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result.length).toBe(0);
    });
  });

  describe("ensureRecurringInstancesForTrip", () => {
    test("returns empty array when no recurring templates exist", async () => {
      const tx = createMockTx();
      tx.challenge.findMany.mockResolvedValueOnce([]);

      const result = await ensureRecurringInstancesForTrip({
        tx,
        tripId: "trip-1",
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toEqual([]);
    });

    test("processes all recurring templates for trip", async () => {
      const tx = createMockTx();
      tx.challenge.findMany.mockResolvedValueOnce([createValidTemplate()]);
      tx.challenge.findFirst.mockResolvedValue(null);
      tx.challenge.create.mockResolvedValue({
        id: "new-challenge",
        status: "VISIBLE",
      });

      const result = await ensureRecurringInstancesForTrip({
        tx,
        tripId: "trip-1",
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("resolveRecurringChallengeIdForTrip", () => {
    test("returns null when challenge not found", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst.mockResolvedValueOnce(null);

      const result = await resolveRecurringChallengeIdForTrip({
        tx,
        tripId: "trip-1",
        challengeId: "challenge-1",
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toBeNull();
    });

    test("returns challenge id directly when not recurring", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst.mockResolvedValueOnce({
        ...createValidTemplate({ isRecurring: false }),
        id: "non-recurring-challenge",
      });

      const result = await resolveRecurringChallengeIdForTrip({
        tx,
        tripId: "trip-1",
        challengeId: "non-recurring-challenge",
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toBe("non-recurring-challenge");
    });

    test("returns template id when recurring but instance not ensured", async () => {
      const tx = createMockTx();
      tx.challenge.findFirst.mockResolvedValueOnce({
        ...createValidTemplate(),
        id: "template-challenge",
      });
      tx.challenge.findFirst.mockResolvedValueOnce(null);
      tx.challenge.create.mockResolvedValue({
        id: "new-instance",
        status: "VISIBLE",
      });

      const result = await resolveRecurringChallengeIdForTrip({
        tx,
        tripId: "trip-1",
        challengeId: "template-challenge",
        now: new Date("2024-01-15T10:00:00Z"),
      });

      expect(result).toBe("new-instance");
    });
  });
});
