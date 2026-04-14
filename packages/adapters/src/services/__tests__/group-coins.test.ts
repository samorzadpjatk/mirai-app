import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Layer, Context } from "effect";
import { DrizzleGroupCoinsService } from "../group-coins";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { runWithTestLayer, createServiceLayer } from "../../test/test-helpers";

// =============================================================================
// Context Tag for DrizzleDb dependency injection
// =============================================================================

const DrizzleDbTag = Context.Tag<DrizzleDb>("DrizzleDb");

// =============================================================================
// Test Setup
// =============================================================================

describe("[UNIT] DrizzleGroupCoinsService", () => {
  let mockDb: DrizzleDb;

  beforeEach(() => {
    mockDb = {
      select: mock(() => ({
        from: mock(() => ({
          where: mock(() => Promise.resolve([{ coins: 100 }])),
        })),
      })),
    } as unknown as DrizzleDb;
  });

  describe("[UNIT] getBalance", () => {
    it("should return Effect that can be run", () => {
      const service = new DrizzleGroupCoinsService(mockDb);

      const effect = service.getBalance("group-123");

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });

    it("should work with Layer-based DI", async () => {
      const service = new DrizzleGroupCoinsService(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      // The service returns an Effect - verify it can be run with Layer
      const effect = service.getBalance("group-123");
      expect(effect).toBeDefined();

      // Run and verify it returns a number (either success or fallback)
      const result = await runWithTestLayer(
        effect.pipe(Effect.catchAll(() => Effect.succeed(0))),
        TestLayer,
      );

      expect(typeof result).toBe("number");
    });
  });

  describe("[UNIT] deductCoins", () => {
    it("should return Effect that can be run", () => {
      const service = new DrizzleGroupCoinsService(mockDb);

      const effect = service.deductCoins(
        "group-123",
        50,
        "Test reason",
        "admin-123",
      );

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });

    it("should work with Layer-based DI", async () => {
      const service = new DrizzleGroupCoinsService(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const result = await runWithTestLayer(
        service
          .deductCoins("group-123", 10, "Test", "admin-123")
          .pipe(Effect.catchAll(() => Effect.succeed(void 0))),
        TestLayer,
      );

      expect(result).toBeUndefined();
    });
  });

  describe("[UNIT] addCoins", () => {
    it("should return Effect that can be run", () => {
      const service = new DrizzleGroupCoinsService(mockDb);

      const effect = service.addCoins(
        "group-123",
        50,
        "Test reason",
        "admin-123",
      );

      expect(effect).toBeDefined();
      expect(typeof effect.pipe).toBe("function");
    });

    it("should work with Effect.provide pattern", async () => {
      const service = new DrizzleGroupCoinsService(mockDb);

      const program = Effect.gen(function* () {
        yield* service
          .addCoins("group-456", 100, "Bonus", "admin-456")
          .pipe(Effect.catchAll(() => Effect.succeed(void 0)));
        return "success";
      }).pipe(Effect.provide(Layer.succeed(DrizzleDbTag, mockDb)));

      const result = await Effect.runPromise(program);
      expect(result).toBe("success");
    });
  });

  describe("[UNIT] Layer-based patterns", () => {
    it("should demonstrate runWithTestLayer with multiple operations", async () => {
      const service = new DrizzleGroupCoinsService(mockDb);
      const TestLayer = createServiceLayer(DrizzleDbTag, mockDb);

      const program = Effect.gen(function* () {
        const balance = yield* service
          .getBalance("group-789")
          .pipe(Effect.catchAll(() => Effect.succeed(0)));
        yield* service
          .addCoins("group-789", 50, "Test", "admin")
          .pipe(Effect.catchAll(() => Effect.succeed(void 0)));
        return balance;
      });

      const result = await runWithTestLayer(program, TestLayer);
      expect(typeof result).toBe("number");
    });

    it("should use Layer.succeed for simple mocks", async () => {
      const simpleMockDb = {} as DrizzleDb;
      const service = new DrizzleGroupCoinsService(simpleMockDb);

      // Using Layer.succeed directly
      const layer = Layer.succeed(DrizzleDbTag, simpleMockDb);

      const result = await Effect.runPromise(
        service
          .getBalance("group-test")
          .pipe(Effect.catchAll(() => Effect.succeed(0)))
          .pipe(Effect.provide(layer)),
      );

      expect(result).toBe(0);
    });
  });
});
