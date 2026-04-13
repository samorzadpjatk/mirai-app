import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Effect, Either } from "effect";
import { DrizzleTelemetryAdapter } from "../telemetry";
import {
  type TelemetryEvent,
  TelemetryError,
} from "@mirai-app/use-cases/ports/TelemetryPort";

describe("[UNIT] DrizzleTelemetryAdapter", () => {
  let adapter: DrizzleTelemetryAdapter;
  let mockDb: {
    insert: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    mockDb = {
      insert: mock(() => ({
        values: mock(() => Promise.resolve()),
      })),
    };
    adapter = new DrizzleTelemetryAdapter(
      mockDb as unknown as Parameters<typeof DrizzleTelemetryAdapter>[0],
    );
  });

  describe("log", () => {
    it("should log a log event successfully", async () => {
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test message",
        context: { userId: "user-123", endpoint: "/api/test" },
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(result)).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should log a metric event successfully", async () => {
      const event: TelemetryEvent = {
        type: "metric",
        name: "requests",
        value: 100,
        unit: "count",
        tags: { endpoint: "/api/users" },
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(result)).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should log a trace event successfully", async () => {
      const event: TelemetryEvent = {
        type: "trace",
        name: "database_query",
        durationMs: 150,
        status: "success",
        metadata: { query: "SELECT * FROM users" },
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(result)).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should log an error event successfully", async () => {
      const event: TelemetryEvent = {
        type: "error",
        error: new Error("Test error"),
        context: { userId: "user-123" },
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(result)).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should extract platform from iOS user agent", async () => {
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "iOS test",
        context: {
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        },
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      await Effect.runPromise(effect);

      const insertCall = mockDb.insert.mock.calls[0];
      expect(insertCall).toBeDefined();
    });

    it("should extract platform from Android user agent", async () => {
      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Android test",
        context: { userAgent: "Mozilla/5.0 (Linux; Android 10)" },
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      await Effect.runPromise(effect);

      const insertCall = mockDb.insert.mock.calls[0];
      expect(insertCall).toBeDefined();
    });

    it("should return TelemetryError when database fails", async () => {
      const dbError = new Error("Database connection failed");
      mockDb.insert = mock(() => {
        throw dbError;
      });

      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test",
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(TelemetryError);
        expect(result.left.operation).toBe("log");
        expect(result.left.message).toContain("Database connection failed");
      }
    });

    it("should handle Postgres error codes", async () => {
      const pgError = new Error("Unique constraint violation") as Error & {
        code: string;
      };
      pgError.code = "23505";
      mockDb.insert = mock(() => {
        throw pgError;
      });

      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test",
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.message).toContain("Unique constraint violation");
      }
    });
  });

  describe("logBatch", () => {
    it("should log multiple events in batch", async () => {
      const events: TelemetryEvent[] = [
        {
          type: "metric",
          name: "requests",
          value: 1,
          timestamp: new Date(),
        },
        {
          type: "metric",
          name: "latency",
          value: 150,
          unit: "ms",
          timestamp: new Date(),
        },
      ];

      const effect = adapter.logBatch(events);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(result)).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should return TelemetryError when batch insert fails", async () => {
      mockDb.insert = mock(() => {
        throw new Error("Batch insert failed");
      });

      const events: TelemetryEvent[] = [
        {
          type: "log",
          severity: "info",
          message: "Test",
          timestamp: new Date(),
        },
      ];

      const effect = adapter.logBatch(events);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(TelemetryError);
        expect(result.left.operation).toBe("logBatch");
      }
    });

    it("should handle empty batch", async () => {
      const effect = adapter.logBatch([]);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(result)).toBe(true);
    });
  });

  describe("flush", () => {
    it("should always succeed (no-op)", async () => {
      const effect = adapter.flush();
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(result)).toBe(true);
    });

    it("should be composable with other effects", async () => {
      const flushEffect = adapter.flush();
      const mappedEffect = Effect.map(flushEffect, () => "flushed");

      const result = await Effect.runPromise(mappedEffect);
      expect(result).toBe("flushed");
    });
  });

  describe("error handling", () => {
    it("should handle foreign key constraint errors", async () => {
      const pgError = new Error("Foreign key failed") as Error & {
        code: string;
      };
      pgError.code = "23503";
      mockDb.insert = mock(() => {
        throw pgError;
      });

      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test",
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.message).toContain("Foreign key constraint failed");
      }
    });

    it("should handle unknown error types", async () => {
      mockDb.insert = mock(() => {
        throw "string error";
      });

      const event: TelemetryEvent = {
        type: "log",
        severity: "info",
        message: "Test",
        timestamp: new Date(),
      };

      const effect = adapter.log(event);
      const result = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.message).toContain("Unknown error occurred");
      }
    });
  });
});
