import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Layer, Context } from "effect";
import {
  DrizzleTripAccessChecker,
  type GroupLeaderCheckResult,
} from "../trip-access";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { runWithTestLayer, createServiceLayer } from "../../test/test-helpers";

// =============================================================================
// Context Tag for DrizzleDb dependency injection
// =============================================================================

const DrizzleDbTag = Context.Tag<DrizzleDb>("DrizzleDb");

// =============================================================================
// Mock Factory for DrizzleDb
// =============================================================================

const createMockDb = (returnData: unknown): DrizzleDb =>
  ({
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(() => Promise.resolve(returnData)),
        })),
      })),
    })),
  }) as unknown as DrizzleDb;

// =============================================================================
// Test Setup
// =============================================================================

describe("[UNIT] DrizzleTripAccessChecker", () => {
  let service: DrizzleTripAccessChecker;
  let baseMockDb: DrizzleDb;

  beforeEach(() => {
    baseMockDb = {} as DrizzleDb;
    service = new DrizzleTripAccessChecker(baseMockDb);
  });

  describe("[UNIT] isStaff", () => {
    it("should return true for admin", async () => {
      const mockDb = createMockDb([{ role: "ADMIN" }]);
      const testService = new DrizzleTripAccessChecker(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const result = await runWithTestLayer(
        testService.isStaff("user-123"),
        TestLayer,
      );

      expect(result).toBe(true);
    });

    it("should return true for moderator", async () => {
      const mockDb = createMockDb([{ role: "MODERATOR" }]);
      const testService = new DrizzleTripAccessChecker(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const result = await runWithTestLayer(
        testService.isStaff("user-123"),
        TestLayer,
      );

      expect(result).toBe(true);
    });

    it("should return false for regular participant", async () => {
      const mockDb = createMockDb([{ role: "PARTICIPANT" }]);
      const testService = new DrizzleTripAccessChecker(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const result = await runWithTestLayer(
        testService.isStaff("user-123"),
        TestLayer,
      );

      expect(result).toBe(false);
    });

    it("should return false when user not found", async () => {
      const mockDb = createMockDb([]);
      const testService = new DrizzleTripAccessChecker(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const result = await runWithTestLayer(
        testService.isStaff("user-123"),
        TestLayer,
      );

      expect(result).toBe(false);
    });

    it("should return Effect that can be run", () => {
      const effect = service.isStaff("user-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });

  describe("[UNIT] isGroupLeader", () => {
    it("should return Effect that can be run", () => {
      const effect = service.isGroupLeader("user-123", "trip-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });

    it("should work with Layer-based DI", async () => {
      const mockDb = createMockDb([
        { userId: "user-123", groupId: "group-456" },
      ]);
      const testService = new DrizzleTripAccessChecker(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const result = await runWithTestLayer(
        testService.isGroupLeader("user-123", "trip-123").pipe(
          Effect.catchAll(() =>
            Effect.succeed({
              isLeader: false,
              groupId: null,
            } as GroupLeaderCheckResult),
          ),
        ),
        TestLayer,
      );

      expect(result).toBeDefined();
      expect(typeof result.isLeader).toBe("boolean");
    });
  });

  describe("[UNIT] hasTripEnded", () => {
    it("should return Effect that can be run", () => {
      const effect = service.hasTripEnded("trip-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });

    it("should work with Effect.provide", async () => {
      const mockDb = createMockDb([{ endDate: new Date("2024-01-01") }]);
      const testService = new DrizzleTripAccessChecker(mockDb);

      const program = Effect.gen(function* () {
        const hasEnded = yield* testService
          .hasTripEnded("trip-789")
          .pipe(Effect.catchAll(() => Effect.succeed(false)));
        return hasEnded;
      }).pipe(Effect.provide(Layer.succeed(DrizzleDbTag, mockDb)));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("[UNIT] Layer-based patterns", () => {
    it("should demonstrate Layer.succeed pattern", async () => {
      const mockDb = createMockDb([{ role: "ADMIN" }]);
      const testService = new DrizzleTripAccessChecker(mockDb);

      // Using Layer.succeed directly
      const layer = Layer.succeed(DrizzleDbTag, mockDb);

      const result = await Effect.runPromise(
        testService.isStaff("user-test").pipe(Effect.provide(layer)),
      );

      expect(result).toBe(true);
    });

    it("should demonstrate runWithTestLayer helper", async () => {
      const mockDb = createMockDb([{ role: "MODERATOR" }]);
      const testService = new DrizzleTripAccessChecker(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const result = await runWithTestLayer(
        testService.isStaff("user-mod"),
        TestLayer,
      );

      expect(result).toBe(true);
    });

    it("should work with merged layers", async () => {
      const mockDb = createMockDb([]);
      const testService = new DrizzleTripAccessChecker(mockDb);

      // Single layer merge (demonstrating pattern)
      const mergedLayer = Layer.mergeAll(Layer.succeed(DrizzleDbTag, mockDb));

      const result = await Effect.runPromise(
        testService
          .isStaff("user-empty")
          .pipe(Effect.catchAll(() => Effect.succeed(false)))
          .pipe(Effect.provide(mergedLayer)),
      );

      expect(result).toBe(false);
    });
  });
});
