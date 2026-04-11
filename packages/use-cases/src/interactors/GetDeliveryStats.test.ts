import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetDeliveryStatsUseCase,
  type GetDeliveryStatsInput,
} from "./GetDeliveryStats";
import type {
  NotificationDeliveryRepository,
  DeliveryStats,
} from "../ports/NotificationDeliveryRepository";

describe("[UNIT] GetDeliveryStatsUseCase", () => {
  let useCase: GetDeliveryStatsUseCase;
  let mockDeliveryRepo: NotificationDeliveryRepository;

  beforeEach(() => {
    mockDeliveryRepo = {
      getStats: mock(() =>
        Promise.resolve({
          total: 100,
          successful: 95,
          failed: 5,
          pending: 0,
          successRate: 0.95,
        } as DeliveryStats),
      ),
    } as unknown as NotificationDeliveryRepository;

    useCase = new GetDeliveryStatsUseCase(mockDeliveryRepo);
  });

  describe("execute", () => {
    it("should return delivery stats", async () => {
      const input: GetDeliveryStatsInput = {};

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.total).toBe(100);
        expect(result.value.successful).toBe(95);
        expect(result.value.failed).toBe(5);
        expect(result.value.pending).toBe(0);
        expect(result.value.successRate).toBe(0.95);
      }
    });

    it("should pass filters to repository", async () => {
      const filters = { tripId: "trip-123", status: "completed" };
      const input: GetDeliveryStatsInput = { filters };

      await useCase.execute(input);

      expect(mockDeliveryRepo.getStats).toHaveBeenCalledWith(filters);
    });

    it("should handle undefined filters", async () => {
      const input: GetDeliveryStatsInput = {};

      await useCase.execute(input);

      expect(mockDeliveryRepo.getStats).toHaveBeenCalledWith(undefined);
    });

    it("should handle repository error", async () => {
      mockDeliveryRepo.getStats = mock(() =>
        Promise.reject(new Error("Database error")),
      );

      const input: GetDeliveryStatsInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Failed to get delivery stats");
        expect(result.error).toContain("Database error");
      }
    });

    it("should handle different stat values", async () => {
      mockDeliveryRepo.getStats = mock(() =>
        Promise.resolve({
          total: 50,
          successful: 25,
          failed: 20,
          pending: 5,
          successRate: 0.5,
        } as DeliveryStats),
      );

      const input: GetDeliveryStatsInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.total).toBe(50);
        expect(result.value.successful).toBe(25);
        expect(result.value.failed).toBe(20);
        expect(result.value.pending).toBe(5);
        expect(result.value.successRate).toBe(0.5);
      }
    });

    it("should handle zero deliveries", async () => {
      mockDeliveryRepo.getStats = mock(() =>
        Promise.resolve({
          total: 0,
          successful: 0,
          failed: 0,
          pending: 0,
          successRate: 0,
        } as DeliveryStats),
      );

      const input: GetDeliveryStatsInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.total).toBe(0);
      }
    });
  });
});
