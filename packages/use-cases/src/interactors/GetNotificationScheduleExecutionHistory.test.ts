import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetNotificationScheduleExecutionHistoryUseCase,
  type GetNotificationScheduleExecutionHistoryInput,
} from "./GetNotificationScheduleExecutionHistory";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

describe("[UNIT] GetNotificationScheduleExecutionHistoryUseCase", () => {
  let useCase: GetNotificationScheduleExecutionHistoryUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      exists: mock(() => Promise.resolve(true)),
      getExecutionHistory: mock(() =>
        Promise.resolve([
          {
            id: "exec-1",
            executedAt: new Date("2024-01-01T09:00:00"),
            notification: {
              id: "notif-1",
              title: "Test 1",
              body: "Body 1",
              createdAt: new Date("2024-01-01T09:00:00"),
            },
          },
          {
            id: "exec-2",
            executedAt: new Date("2024-01-02T09:00:00"),
            notification: {
              id: "notif-2",
              title: "Test 2",
              body: "Body 2",
              createdAt: new Date("2024-01-02T09:00:00"),
            },
          },
        ]),
      ),
    } as unknown as NotificationScheduleRepository;

    useCase = new GetNotificationScheduleExecutionHistoryUseCase(
      mockRepository,
    );
  });

  describe("execute", () => {
    it("should return execution history for schedule", async () => {
      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.executions).toHaveLength(2);
        expect(result.value.executions[0].id).toBe("exec-1");
        expect(result.value.executions[1].id).toBe("exec-2");
      }
    });

    it("should return error when schedule not found", async () => {
      mockRepository.exists = mock(() => Promise.resolve(false));

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "nonexistent",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification schedule not found");
      }
    });

    it("should use default limit of 20", async () => {
      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      await useCase.execute(input);

      expect(mockRepository.getExecutionHistory).toHaveBeenCalledWith(
        "schedule-123",
        20,
      );
    });

    it("should use custom limit when provided", async () => {
      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
        limit: 50,
      };

      await useCase.execute(input);

      expect(mockRepository.getExecutionHistory).toHaveBeenCalledWith(
        "schedule-123",
        50,
      );
    });

    it("should check schedule existence before fetching history", async () => {
      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-456",
      };

      await useCase.execute(input);

      expect(mockRepository.exists).toHaveBeenCalledWith("schedule-456");
    });

    it("should not fetch history if schedule doesn't exist", async () => {
      mockRepository.exists = mock(() => Promise.resolve(false));

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "nonexistent",
      };

      await useCase.execute(input);

      expect(mockRepository.getExecutionHistory).not.toHaveBeenCalled();
    });

    it("should handle empty execution history", async () => {
      mockRepository.getExecutionHistory = mock(() => Promise.resolve([]));

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.executions).toEqual([]);
      }
    });

    it("should return execution with notification details", async () => {
      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const execution = result.value.executions[0];
        expect(execution.id).toBe("exec-1");
        expect(execution.executedAt).toBeInstanceOf(Date);
        expect(execution.notification).not.toBeNull();
        expect(execution.notification?.id).toBe("notif-1");
        expect(execution.notification?.title).toBe("Test 1");
      }
    });
  });
});
