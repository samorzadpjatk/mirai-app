import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  BulkToggleNotificationScheduleActiveUseCase,
  type BulkToggleNotificationScheduleActiveInput,
} from "./BulkToggleNotificationScheduleActive";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

describe("[UNIT] BulkToggleNotificationScheduleActiveUseCase", () => {
  let useCase: BulkToggleNotificationScheduleActiveUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      bulkToggleActive: mock(() => Promise.resolve(3)),
    } as unknown as NotificationScheduleRepository;

    useCase = new BulkToggleNotificationScheduleActiveUseCase(mockRepository);
  });

  describe("execute", () => {
    it("should activate multiple schedules", async () => {
      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1", "schedule-2", "schedule-3"],
        isActive: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.success).toBe(true);
        expect(result.value.updatedCount).toBe(3);
      }
    });

    it("should deactivate multiple schedules", async () => {
      mockRepository.bulkToggleActive = mock(() => Promise.resolve(2));

      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1", "schedule-2"],
        isActive: false,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.updatedCount).toBe(2);
      }
    });

    it("should return error when no IDs provided", async () => {
      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: [],
        isActive: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("At least one ID must be provided");
      }
    });

    it("should call repository with correct parameters", async () => {
      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["id-1", "id-2"],
        isActive: true,
      };

      await useCase.execute(input);

      expect(mockRepository.bulkToggleActive).toHaveBeenCalledWith(
        ["id-1", "id-2"],
        true,
      );
    });

    it("should handle partial updates", async () => {
      mockRepository.bulkToggleActive = mock(() => Promise.resolve(2));

      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1", "schedule-2", "schedule-3"],
        isActive: false,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.updatedCount).toBe(2); // Only 2 were updated
      }
    });

    it("should handle single ID", async () => {
      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1"],
        isActive: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.updatedCount).toBe(3); // from mock
      }
    });
  });
});
