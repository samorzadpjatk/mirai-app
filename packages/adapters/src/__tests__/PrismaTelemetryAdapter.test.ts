import { describe, it, expect, mock, beforeEach } from "bun:test";
import { PrismaTelemetryAdapter } from "../gateways/PrismaTelemetryAdapter";
import {
  type TelemetryEvent,
  TelemetryError,
} from "@mirai-app/use-cases/ports/TelemetryPort";
import { ok, err, isOk, isErr } from "@mirai-app/domain";

describe("[INTEGRATION] PrismaTelemetryAdapter", () => {
  // Create mock Prisma client with userAgent model
  const createMockPrisma = () => ({
    userAgent: {
      create: mock(() => Promise.resolve({})),
      createMany: mock(() => Promise.resolve({ count: 0 })),
    },
  });

  describe("constructor", () => {
    it("should create adapter with injected PrismaClient", () => {
      const mockPrisma = createMockPrisma();
      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);

      expect(adapter).toBeDefined();
      expect(adapter.log).toBeDefined();
      expect(adapter.logBatch).toBeDefined();
      expect(adapter.flush).toBeDefined();
    });
  });

  describe("log", () => {
    it("should persist log event with correct data", async () => {
      const mockPrisma = createMockPrisma();
      const createdRecord = {
        id: "telemetry-123",
        userAgent: '[INFO] User created successfully context={userId="123"}',
        platform: "unknown",
        userId: "123",
        endpoint: "/api/users",
        timestamp: new Date("2024-01-15T10:00:00Z"),
      };
      mockPrisma.userAgent.create = mock(() => Promise.resolve(createdRecord));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "User created successfully",
        context: { userId: "123", endpoint: "/api/users" },
        timestamp: new Date("2024-01-15T10:00:00Z"),
      };

      const result = await adapter.log(event);

      expect(isOk(result)).toBe(true);
      expect(mockPrisma.userAgent.create).toHaveBeenCalledTimes(1);

      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.userAgent).toContain("[INFO]");
      expect(callArg.data.userAgent).toContain("User created successfully");
      expect(callArg.data.platform).toBe("unknown");
      expect(callArg.data.userId).toBe("123");
      expect(callArg.data.endpoint).toBe("/api/users");
      expect(callArg.data.timestamp).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("should detect iOS platform from user agent", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Mobile request",
        context: {
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        },
        timestamp: new Date(),
      };

      await adapter.log(event);

      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.platform).toBe("ios");
    });

    it("should detect Android platform from user agent", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Mobile request",
        context: { userAgent: "Mozilla/5.0 (Linux; Android 13; SM-G998B)" },
        timestamp: new Date(),
      };

      await adapter.log(event);

      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.platform).toBe("android");
    });

    it("should detect web platform from user agent", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Web request",
        context: {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        },
        timestamp: new Date(),
      };

      await adapter.log(event);

      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.platform).toBe("web");
    });

    it("should persist metric event", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "metric",
        name: "request_latency",
        value: 150,
        unit: "ms",
        tags: { endpoint: "/api/users", method: "GET" },
        timestamp: new Date("2024-01-15T10:00:00Z"),
      };

      const result = await adapter.log(event);

      expect(isOk(result)).toBe(true);
      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.userAgent).toContain("[METRIC]");
      expect(callArg.data.userAgent).toContain("request_latency=150");
      expect(callArg.data.userAgent).toContain("ms");
    });

    it("should persist trace event", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "trace",
        name: "database_query",
        durationMs: 45,
        status: "success",
        metadata: { query: "SELECT * FROM users" },
        timestamp: new Date("2024-01-15T10:00:00Z"),
      };

      const result = await adapter.log(event);

      expect(isOk(result)).toBe(true);
      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.userAgent).toContain("[TRACE]");
      expect(callArg.data.userAgent).toContain("database_query");
      expect(callArg.data.userAgent).toContain("duration=45ms");
      expect(callArg.data.userAgent).toContain("status=success");
    });

    it("should persist error event", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "error",
        error: new Error("Database connection failed"),
        context: { userId: "456", endpoint: "/api/data" },
        timestamp: new Date("2024-01-15T10:00:00Z"),
      };

      const result = await adapter.log(event);

      expect(isOk(result)).toBe(true);
      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.userAgent).toContain("[ERROR]");
      expect(callArg.data.userAgent).toContain("Database connection failed");
      expect(callArg.data.userId).toBe("456");
      expect(callArg.data.endpoint).toBe("/api/data");
    });

    it("should handle events without optional context", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "debug",
        message: "Simple log message",
        timestamp: new Date(),
      };

      const result = await adapter.log(event);

      expect(isOk(result)).toBe(true);
      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.userId).toBeUndefined();
      expect(callArg.data.endpoint).toBeUndefined();
    });

    it("should return err with TelemetryError on unique constraint violation", async () => {
      const mockPrisma = createMockPrisma();
      const prismaError = new Error("Unique constraint failed");
      (prismaError as any).code = "P2002";
      mockPrisma.userAgent.create = mock(() => Promise.reject(prismaError));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test message",
        timestamp: new Date(),
      };

      const result = await adapter.log(event);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(TelemetryError);
        expect(result.error.operation).toBe("log");
        expect(result.error.message).toContain("Unique constraint violation");
        expect(result.error.cause).toBe(prismaError);
      }
    });

    it("should return err with TelemetryError on foreign key constraint failure", async () => {
      const mockPrisma = createMockPrisma();
      const prismaError = new Error("Foreign key constraint failed");
      (prismaError as any).code = "P2003";
      mockPrisma.userAgent.create = mock(() => Promise.reject(prismaError));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test message",
        timestamp: new Date(),
      };

      const result = await adapter.log(event);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain("Foreign key constraint failed");
      }
    });

    it("should return err with TelemetryError on connection timeout", async () => {
      const mockPrisma = createMockPrisma();
      const prismaError = new Error("Connection timeout");
      (prismaError as any).code = "P2024";
      mockPrisma.userAgent.create = mock(() => Promise.reject(prismaError));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test message",
        timestamp: new Date(),
      };

      const result = await adapter.log(event);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain("Timed out fetching connection");
      }
    });

    it("should return err with TelemetryError on generic database error", async () => {
      const mockPrisma = createMockPrisma();
      const dbError = new Error("Database is down");
      mockPrisma.userAgent.create = mock(() => Promise.reject(dbError));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test message",
        timestamp: new Date(),
      };

      const result = await adapter.log(event);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe("Database is down");
        expect(result.error.cause).toBe(dbError);
      }
    });

    it("should return err with TelemetryError on unknown error type", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.reject("String error"));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test message",
        timestamp: new Date(),
      };

      const result = await adapter.log(event);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain("Unknown error occurred");
      }
    });

    it("should handle all severity levels", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const severities = ["debug", "info", "warn", "error", "fatal"] as const;

      for (const severity of severities) {
        const event: TelemetryEvent = {
          type: "log",
          severity,
          message: `Message with ${severity} severity`,
          timestamp: new Date(),
        };

        const result = await adapter.log(event);
        expect(isOk(result)).toBe(true);
      }

      expect(mockPrisma.userAgent.create).toHaveBeenCalledTimes(5);
    });
  });

  describe("logBatch", () => {
    it("should persist multiple events in batch", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.createMany = mock(() =>
        Promise.resolve({ count: 2 }),
      );

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const events: TelemetryEvent[] = [
        {
          type: "metric",
          name: "requests",
          value: 1,
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
        {
          type: "metric",
          name: "latency",
          value: 150,
          unit: "ms",
          timestamp: new Date("2024-01-15T10:00:01Z"),
        },
      ];

      const result = await adapter.logBatch(events);

      expect(isOk(result)).toBe(true);
      expect(mockPrisma.userAgent.createMany).toHaveBeenCalledTimes(1);

      const callArg = mockPrisma.userAgent.createMany.mock.calls[0][0];
      expect(callArg.data).toHaveLength(2);
      expect(callArg.data[0].userAgent).toContain("[METRIC]");
      expect(callArg.data[1].userAgent).toContain("[METRIC]");
    });

    it("should return err with TelemetryError on batch failure", async () => {
      const mockPrisma = createMockPrisma();
      const dbError = new Error("Batch insert failed");
      mockPrisma.userAgent.createMany = mock(() => Promise.reject(dbError));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const events: TelemetryEvent[] = [
        {
          type: "log",
          severity: "info",
          message: "Event 1",
          timestamp: new Date(),
        },
        {
          type: "log",
          severity: "info",
          message: "Event 2",
          timestamp: new Date(),
        },
      ];

      const result = await adapter.logBatch(events);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.operation).toBe("logBatch");
        expect(result.error.message).toBe("Batch insert failed");
      }
    });

    it("should handle empty events array", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.createMany = mock(() =>
        Promise.resolve({ count: 0 }),
      );

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const events: TelemetryEvent[] = [];

      const result = await adapter.logBatch(events);

      expect(isOk(result)).toBe(true);
      const callArg = mockPrisma.userAgent.createMany.mock.calls[0][0];
      expect(callArg.data).toEqual([]);
    });

    it("should handle mixed event types in batch", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.createMany = mock(() =>
        Promise.resolve({ count: 3 }),
      );

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const events: TelemetryEvent[] = [
        {
          type: "log",
          severity: "info",
          message: "Log event",
          timestamp: new Date(),
        },
        {
          type: "metric",
          name: "metric_event",
          value: 42,
          timestamp: new Date(),
        },
        {
          type: "trace",
          name: "trace_event",
          durationMs: 100,
          status: "success",
          timestamp: new Date(),
        },
      ];

      const result = await adapter.logBatch(events);

      expect(isOk(result)).toBe(true);
      expect(mockPrisma.userAgent.createMany).toHaveBeenCalledTimes(1);

      const callArg = mockPrisma.userAgent.createMany.mock.calls[0][0];
      expect(callArg.data).toHaveLength(3);
      expect(callArg.data[0].userAgent).toContain("[INFO]");
      expect(callArg.data[1].userAgent).toContain("[METRIC]");
      expect(callArg.data[2].userAgent).toContain("[TRACE]");
    });
  });

  describe("flush", () => {
    it("should return ok immediately (no buffering)", async () => {
      const mockPrisma = createMockPrisma();
      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);

      const result = await adapter.flush();

      expect(isOk(result)).toBe(true);
      // No database calls should be made for flush
      expect(mockPrisma.userAgent.create).not.toHaveBeenCalled();
      expect(mockPrisma.userAgent.createMany).not.toHaveBeenCalled();
    });

    it("should return void value on flush", async () => {
      const mockPrisma = createMockPrisma();
      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);

      const result = await adapter.flush();

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe("error handling", () => {
    it("should handle all Prisma error codes", async () => {
      const errorCodes = [
        { code: "P2002", message: "Unique constraint violation" },
        { code: "P2003", message: "Foreign key constraint failed" },
        { code: "P2024", message: "Timed out fetching connection from pool" },
        { code: "P2025", message: "Record not found" },
        { code: "P2034", message: "Transaction conflict" },
      ];

      for (const { code, message } of errorCodes) {
        const mockPrisma = createMockPrisma();
        const prismaError = new Error("Database error");
        (prismaError as any).code = code;
        mockPrisma.userAgent.create = mock(() => Promise.reject(prismaError));

        const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
        const event: TelemetryEvent = {
          type: "log",
          severity: "info",
          message: "Test",
          timestamp: new Date(),
        };

        const result = await adapter.log(event);

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.message).toContain(message);
          expect(result.error._tag).toBe("TelemetryError");
        }
      }
    });

    it("should include error cause for debugging", async () => {
      const mockPrisma = createMockPrisma();
      const originalError = new Error("Original DB error");
      mockPrisma.userAgent.create = mock(() => Promise.reject(originalError));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test",
        timestamp: new Date(),
      };

      const result = await adapter.log(event);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.cause).toBe(originalError);
      }
    });
  });

  describe("event transformation", () => {
    it("should serialize complex context objects", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Complex event",
        context: {
          nested: { key: "value", number: 123 },
          array: [1, 2, 3],
          boolean: true,
          nullValue: null,
        },
        timestamp: new Date(),
      };

      await adapter.log(event);

      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.userAgent).toContain("nested=");
      expect(callArg.data.userAgent).toContain("array=");
    });

    it("should handle trace with error status", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const event: TelemetryEvent = {
        type: "trace",
        name: "failed_operation",
        durationMs: 5000,
        status: "error",
        metadata: { errorMessage: "Timeout" },
        timestamp: new Date(),
      };

      await adapter.log(event);

      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.userAgent).toContain("status=error");
      expect(callArg.data.userAgent).toContain("Timeout");
    });

    it("should handle error with stack trace", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.userAgent.create = mock(() => Promise.resolve({}));

      const adapter = new PrismaTelemetryAdapter(mockPrisma as any);
      const testError = new Error("Test error");
      testError.stack = "Error: Test error\n    at Test.method (file.ts:1:1)";

      const event: TelemetryEvent = {
        type: "error",
        error: testError,
        timestamp: new Date(),
      };

      await adapter.log(event);

      const callArg = mockPrisma.userAgent.create.mock.calls[0][0];
      expect(callArg.data.userAgent).toContain("Error: Test error");
      expect(callArg.data.userAgent).toContain("stack=");
    });
  });
});
