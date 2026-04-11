import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  BulkDeleteNotificationSchedulesUseCase,
  type BulkDeleteNotificationSchedulesInput,
} from "./BulkDeleteNotificationSchedules";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

describe("[UNIT] BulkDeleteNotificationSchedulesUseCase", () => {
  let useCase: BulkDeleteNotificationSchedulesUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      exists: mock(() => Promise.resolve(true)),
      deleteMany: mock((ids: string[]) => Promise.resolve(ids.length)),
    } as unknown as NotificationScheduleRepository;

    useCase = new BulkDeleteNotificationSchedulesUseCase(mockRepository);
  });

  describe("execute", () => {
    it("should delete multiple schedules successfully", async () => {
      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1", "schedule-2"],
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.success).toBe(true);
        expect(result.value.requestedCount).toBe(2);
        // deletedCount matches the number of existing IDs passed to deleteMany
        expect(result.value.deletedCount).toBe(2);
      }
    });

    it("should return error when no IDs provided", async () => {
      const input: BulkDeleteNotificationSchedulesInput = {
        ids: [],
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("At least one ID must be provided");
      }
    });

    it("should identify not found IDs", async () => {
      mockRepository.exists = mock((id: string) =>
        Promise.resolve(id !== "schedule-2"),
      );

      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1", "schedule-2", "schedule-3"],
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.notFoundIds).toContain("schedule-2");
        expect(result.value.deletedCount).toBe(2);
        expect(result.value.requestedCount).toBe(3);
      }
    });

    it("should handle all IDs not found", async () => {
      mockRepository.exists = mock(() => Promise.resolve(false));

      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1", "schedule-2"],
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.deletedCount).toBe(0);
        expect(result.value.notFoundIds).toEqual(["schedule-1", "schedule-2"]);
      }
      expect(mockRepository.deleteMany).not.toHaveBeenCalled();
    });

    it("should delete only existing schedules", async () => {
      mockRepository.exists = mock((id: string) =>
        Promise.resolve(id === "schedule-1"),
      );

      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1", "schedule-2"],
      };

      await useCase.execute(input);

      expect(mockRepository.deleteMany).toHaveBeenCalledWith(["schedule-1"]);
    });

    it("should check existence for each ID", async () => {
      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["id-1", "id-2", "id-3"],
      };

      await useCase.execute(input);

      expect(mockRepository.exists).toHaveBeenCalledTimes(3);
    });

    it("should handle single ID deletion", async () => {
      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1"],
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.deletedCount).toBe(1);
        expect(result.value.requestedCount).toBe(1);
        expect(result.value.notFoundIds).toBeUndefined();
      }
    });
  });
});
