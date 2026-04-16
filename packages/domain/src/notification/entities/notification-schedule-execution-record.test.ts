import { describe, it, expect } from "bun:test";
import type { NotificationScheduleExecutionRecord } from "./notification-schedule-execution-record";

/**
 * NotificationScheduleExecutionRecord Interface Tests
 *
 * This is a pure data interface (not a class with behavior),
 * so we primarily verify type structure and data shapes.
 */
describe("[UNIT] NotificationScheduleExecutionRecord", () => {
  // ============================================================================
  // Interface Structure Tests
  // ============================================================================
  describe("interface structure", () => {
    it("accepts valid execution record with all fields", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-123",
        executedAt: new Date("2024-06-15T10:00:00Z"),
        notification: {
          id: "notif-456",
          title: "Test Notification",
          body: "This is the notification body",
          createdAt: new Date("2024-06-15T09:00:00Z"),
        },
      };

      expect(record.id).toBe("exec-123");
      expect(record.executedAt).toBeInstanceOf(Date);
      expect(record.notification).not.toBeNull();
      expect(record.notification!.id).toBe("notif-456");
      expect(record.notification!.title).toBe("Test Notification");
      expect(record.notification!.body).toBe("This is the notification body");
      expect(record.notification!.createdAt).toBeInstanceOf(Date);
    });

    it("accepts valid execution record with null notification", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-456",
        executedAt: new Date("2024-06-15T10:00:00Z"),
        notification: null,
      };

      expect(record.id).toBe("exec-456");
      expect(record.executedAt).toBeInstanceOf(Date);
      expect(record.notification).toBeNull();
    });
  });

  // ============================================================================
  // ID Field Tests
  // ============================================================================
  describe("id field", () => {
    it("accepts UUID format", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        executedAt: new Date(),
        notification: null,
      };

      expect(record.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("accepts custom ID format", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "execution_20240615_001",
        executedAt: new Date(),
        notification: null,
      };

      expect(record.id).toBe("execution_20240615_001");
    });

    it("accepts numeric ID as string", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "12345",
        executedAt: new Date(),
        notification: null,
      };

      expect(record.id).toBe("12345");
    });
  });

  // ============================================================================
  // executedAt Field Tests
  // ============================================================================
  describe("executedAt field", () => {
    it("accepts past date", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-123",
        executedAt: new Date("2020-01-01T00:00:00Z"),
        notification: null,
      };

      expect(record.executedAt.toISOString()).toBe("2020-01-01T00:00:00.000Z");
    });

    it("accepts current date", () => {
      const now = new Date();
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-123",
        executedAt: now,
        notification: null,
      };

      expect(record.executedAt).toBe(now);
    });

    it("accepts future date", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-123",
        executedAt: new Date("2030-12-31T23:59:59Z"),
        notification: null,
      };

      expect(record.executedAt.getFullYear()).toBe(2030);
    });
  });

  // ============================================================================
  // notification Field Tests
  // ============================================================================
  describe("notification field", () => {
    it("accepts notification with all fields populated", () => {
      const notification = {
        id: "notif-abc",
        title: "Daily Ranking",
        body: "Check out today's rankings!",
        createdAt: new Date("2024-06-15T08:00:00Z"),
      };

      const record: NotificationScheduleExecutionRecord = {
        id: "exec-123",
        executedAt: new Date(),
        notification,
      };

      expect(record.notification).toEqual(notification);
    });

    it("accepts empty string title and body", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-123",
        executedAt: new Date(),
        notification: {
          id: "notif-empty",
          title: "",
          body: "",
          createdAt: new Date(),
        },
      };

      expect(record.notification!.title).toBe("");
      expect(record.notification!.body).toBe("");
    });

    it("accepts long title and body", () => {
      const longTitle = "a".repeat(1000);
      const longBody = "b".repeat(5000);

      const record: NotificationScheduleExecutionRecord = {
        id: "exec-123",
        executedAt: new Date(),
        notification: {
          id: "notif-long",
          title: longTitle,
          body: longBody,
          createdAt: new Date(),
        },
      };

      expect(record.notification!.title).toHaveLength(1000);
      expect(record.notification!.body).toHaveLength(5000);
    });

    it("handles notification with special characters", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-123",
        executedAt: new Date(),
        notification: {
          id: "notif-special",
          title: "Title with emojis",
          body: "Body with unicode: 日本語, العربية, emoji ",
          createdAt: new Date(),
        },
      };

      expect(record.notification!.title).toContain("emojis");
      expect(record.notification!.body).toContain("日本語");
    });
  });

  // ============================================================================
  // Use Case Examples
  // ============================================================================
  describe("use case examples", () => {
    it("represents a successful daily ranking execution", () => {
      const execution: NotificationScheduleExecutionRecord = {
        id: "exec-daily-20240615",
        executedAt: new Date("2024-06-15T10:00:00Z"),
        notification: {
          id: "notif-daily-001",
          title: "Daily Ranking Update",
          body: "You ranked #5 in yesterday's challenge!",
          createdAt: new Date("2024-06-15T09:59:00Z"),
        },
      };

      // Verify execution completed successfully
      expect(execution.notification).not.toBeNull();
      expect(execution.notification!.title).toContain("Daily Ranking");
    });

    it("represents a failed execution (null notification)", () => {
      const execution: NotificationScheduleExecutionRecord = {
        id: "exec-failed-20240615",
        executedAt: new Date("2024-06-15T10:00:00Z"),
        notification: null, // Failed to create notification
      };

      // Verify failure state
      expect(execution.notification).toBeNull();
    });

    it("represents an INFO type schedule execution", () => {
      const execution: NotificationScheduleExecutionRecord = {
        id: "exec-info-001",
        executedAt: new Date("2024-06-15T14:30:00Z"),
        notification: {
          id: "notif-info-001",
          title: "System Maintenance",
          body: "Scheduled maintenance in 30 minutes",
          createdAt: new Date("2024-06-15T14:30:00Z"),
        },
      };

      expect(execution.notification!.title).toBe("System Maintenance");
    });
  });

  // ============================================================================
  // Array/Collection Tests
  // ============================================================================
  describe("collection handling", () => {
    it("works correctly in an array", () => {
      const executions: NotificationScheduleExecutionRecord[] = [
        {
          id: "exec-1",
          executedAt: new Date("2024-06-15T10:00:00Z"),
          notification: {
            id: "notif-1",
            title: "First",
            body: "First execution",
            createdAt: new Date(),
          },
        },
        {
          id: "exec-2",
          executedAt: new Date("2024-06-15T10:30:00Z"),
          notification: null,
        },
        {
          id: "exec-3",
          executedAt: new Date("2024-06-15T11:00:00Z"),
          notification: {
            id: "notif-3",
            title: "Third",
            body: "Third execution",
            createdAt: new Date(),
          },
        },
      ];

      expect(executions).toHaveLength(3);
      expect(executions[0]!.id).toBe("exec-1");
      expect(executions[1]!.notification).toBeNull();
      expect(executions[2]!.executedAt.getHours()).toBe(11);
    });

    it("can be sorted by executedAt", () => {
      const executions: NotificationScheduleExecutionRecord[] = [
        {
          id: "exec-3",
          executedAt: new Date("2024-06-15T12:00:00Z"),
          notification: null,
        },
        {
          id: "exec-1",
          executedAt: new Date("2024-06-15T10:00:00Z"),
          notification: null,
        },
        {
          id: "exec-2",
          executedAt: new Date("2024-06-15T11:00:00Z"),
          notification: null,
        },
      ];

      const sorted = [...executions].sort(
        (a, b) => a.executedAt.getTime() - b.executedAt.getTime(),
      );

      expect(sorted[0]!.id).toBe("exec-1");
      expect(sorted[1]!.id).toBe("exec-2");
      expect(sorted[2]!.id).toBe("exec-3");
    });

    it("can filter successful executions", () => {
      const executions: NotificationScheduleExecutionRecord[] = [
        {
          id: "exec-1",
          executedAt: new Date(),
          notification: {
            id: "n1",
            title: "T1",
            body: "B1",
            createdAt: new Date(),
          },
        },
        {
          id: "exec-2",
          executedAt: new Date(),
          notification: null,
        },
        {
          id: "exec-3",
          executedAt: new Date(),
          notification: {
            id: "n3",
            title: "T3",
            body: "B3",
            createdAt: new Date(),
          },
        },
      ];

      const successful = executions.filter((e) => e.notification !== null);

      expect(successful).toHaveLength(2);
      expect(successful[0]!.id).toBe("exec-1");
      expect(successful[1]!.id).toBe("exec-3");
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe("edge cases", () => {
    it("handles very old execution dates", () => {
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-old",
        executedAt: new Date("1990-01-01T00:00:00Z"),
        notification: null,
      };

      expect(record.executedAt.getFullYear()).toBe(1990);
    });

    it("handles very recent execution dates", () => {
      const now = new Date();
      const record: NotificationScheduleExecutionRecord = {
        id: "exec-now",
        executedAt: now,
        notification: {
          id: "notif-now",
          title: "Just now",
          body: "This just happened",
          createdAt: now,
        },
      };

      expect(record.executedAt.getTime()).toBe(now.getTime());
    });

    it("handles notification created before execution", () => {
      const createdAt = new Date("2024-06-15T09:00:00Z");
      const executedAt = new Date("2024-06-15T10:00:00Z");

      const record: NotificationScheduleExecutionRecord = {
        id: "exec-delayed",
        executedAt,
        notification: {
          id: "notif-prepared",
          title: "Prepared",
          body: "Prepared earlier",
          createdAt,
        },
      };

      expect(record.notification!.createdAt.getTime()).toBeLessThan(
        record.executedAt.getTime(),
      );
    });
  });
});
