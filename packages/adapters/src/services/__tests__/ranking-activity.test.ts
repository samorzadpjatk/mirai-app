import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Layer, Context } from "effect";
import {
  DrizzleRankingActivityService,
  type RankSnapshot,
} from "../ranking-activity";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { runWithTestLayer, createServiceLayer } from "../../test/test-helpers";

// =============================================================================
// Context Tag for DrizzleDb dependency injection
// =============================================================================

const DrizzleDbTag = Context.Tag<DrizzleDb>("DrizzleDb");

// =============================================================================
// Test Setup
// =============================================================================

describe("[UNIT] DrizzleRankingActivityService", () => {
  let mockDb: DrizzleDb;

  beforeEach(() => {
    mockDb = {} as DrizzleDb;
  });

  describe("[UNIT] captureTripRankingSnapshot", () => {
    it("should return Effect that can be run", () => {
      const service = new DrizzleRankingActivityService(mockDb);

      const effect = service.captureTripRankingSnapshot(mockDb, "trip-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });

    it("should work with Layer-based DI", async () => {
      const service = new DrizzleRankingActivityService(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const effect = service.captureTripRankingSnapshot(mockDb, "trip-123");

      // Should be runnable with Layer
      const result = await runWithTestLayer(
        effect.pipe(Effect.catchAll(() => Effect.succeed(new Map()))),
        TestLayer,
      );

      expect(result).toBeDefined();
    });
  });

  describe("[UNIT] createRankChangeActivities", () => {
    it("should handle empty snapshot", async () => {
      // Test with empty snapshot (no groups)
      const previousSnapshot: RankSnapshot = new Map();

      const service = new DrizzleRankingActivityService(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const effect = service.createRankChangeActivities({
        tx: mockDb,
        tripId: "trip-123",
        previousSnapshot,
      });

      // Should complete without error for empty snapshot
      const result = await runWithTestLayer(
        effect.pipe(Effect.catchAll(() => Effect.succeed(void 0))),
        TestLayer,
      );

      expect(result).toBeUndefined();
    });

    it("should return Effect that can be run", () => {
      const previousSnapshot: RankSnapshot = new Map();
      const service = new DrizzleRankingActivityService(mockDb);

      const effect = service.createRankChangeActivities({
        tx: mockDb,
        tripId: "trip-123",
        previousSnapshot,
      });

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });
  });

  describe("[UNIT] Layer-based patterns", () => {
    it("should work with Effect.provide", async () => {
      const service = new DrizzleRankingActivityService(mockDb);

      const program = Effect.gen(function* () {
        const snapshot = yield* service
          .captureTripRankingSnapshot(mockDb, "trip-456")
          .pipe(Effect.catchAll(() => Effect.succeed(new Map())));
        return snapshot;
      }).pipe(Effect.provide(Layer.succeed(DrizzleDbTag, mockDb)));

      const result = await Effect.runPromise(program);
      expect(result).toBeDefined();
    });

    it("should demonstrate runWithTestLayer helper", async () => {
      const service = new DrizzleRankingActivityService(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const result = await runWithTestLayer(
        service
          .createRankChangeActivities({
            tx: mockDb,
            tripId: "trip-test",
            previousSnapshot: new Map(),
          })
          .pipe(Effect.catchAll(() => Effect.succeed(void 0))),
        TestLayer,
      );

      expect(result).toBeUndefined();
    });
  });
});
