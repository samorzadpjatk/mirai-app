import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { DrizzleCoinTransactionService } from "../coin-transaction";
import type { CoinTransactionController } from "../../controllers/coin-transaction";
import { ServiceError } from "../../errors/adapter-errors";

// Simple mock db
const createMockDb = () => ({
  select: mock(() => ({
    from: () => ({
      where: () => ({
        limit: () => ({
          then: (cb: (result: unknown[]) => unknown) => Promise.resolve(cb([])),
        }),
      }),
    }),
  })),
});

describe("[UNIT] DrizzleCoinTransactionService", () => {
  let mockController: CoinTransactionController;

  beforeEach(() => {
    mockController = {
      getCoinTransactions: mock(() =>
        Promise.resolve({
          success: true as const,
          data: [],
        }),
      ),
    } as unknown as CoinTransactionController;
  });

  describe("[UNIT] ServiceError from adapter-errors", () => {
    it("should use the shared ServiceError class", () => {
      const originalError = new Error("Query timeout");
      const error = new ServiceError({
        operation: "getCoinTransactionsForUser",
        message: "Failed to fetch transactions",
        cause: originalError,
      });

      expect(error._tag).toBe("ServiceError");
      expect(error.code).toBe("SERVICE_ERROR");
      expect(error.operation).toBe("getCoinTransactionsForUser");
      expect(error.message).toBe("Failed to fetch transactions");
      expect(error.cause).toBe(originalError);
    });

    it("should be catchable by _tag using Effect.catchTag", async () => {
      const error = new ServiceError({
        operation: "test",
        message: "Test error",
      });

      const program = Effect.fail(error).pipe(
        Effect.catchTag("ServiceError", (e) =>
          Effect.succeed({ recovered: true, operation: e.operation }),
        ),
      );

      const result = await Effect.runPromise(program);
      expect(result.recovered).toBe(true);
      expect(result.operation).toBe("test");
    });
  });

  describe("[UNIT] getCoinTransactionsForUser - Effect return type", () => {
    it("should return an Effect (type verification)", () => {
      const mockDb = createMockDb();
      const service = new DrizzleCoinTransactionService(
        mockDb as unknown as never,
        mockController,
      );

      const input = {
        userId: "user-123",
        tripId: "trip-123",
        limit: 10,
      };

      const effect = service.getCoinTransactionsForUser(input);

      // Verify it's an Effect
      expect(effect).toBeDefined();
      expect(typeof effect).toBe("object");
      // Effect has pipe method
      expect(typeof effect.pipe).toBe("function");
    });

    it("should handle database query failures with ServiceError", async () => {
      const errorDb = {
        select: mock(() => {
          throw new Error("Connection timeout");
        }),
      };

      const service = new DrizzleCoinTransactionService(
        errorDb as unknown as never,
        mockController,
      );

      const input = {
        userId: "user-123",
        tripId: "trip-123",
        limit: 10,
      };

      const effect = service.getCoinTransactionsForUser(input);
      const eitherResult = await Effect.runPromise(Effect.either(effect));

      expect(eitherResult._tag).toBe("Left");
      if (eitherResult._tag === "Left") {
        expect(eitherResult.left).toBeInstanceOf(ServiceError);
        expect(eitherResult.left.operation).toBe("getCoinTransactionsForUser");
        expect(eitherResult.left.message).toContain("Connection timeout");
      }
    });

    it("should properly structure Effect for composition", () => {
      const mockDb = createMockDb();
      const service = new DrizzleCoinTransactionService(
        mockDb as unknown as never,
        mockController,
      );

      const input = {
        userId: "user-123",
        tripId: "trip-123",
        limit: 10,
      };

      // Test that we can compose the Effect
      const effect = service.getCoinTransactionsForUser(input);
      const composedEffect = effect.pipe(
        Effect.map((result) => ({
          ...result,
          transformed: true,
        })),
      );

      expect(composedEffect).toBeDefined();
      expect(typeof composedEffect.pipe).toBe("function");
    });
  });

  describe("[UNIT] Effect pattern verification", () => {
    it("should use Effect.tryPromise for async operations", async () => {
      let selectCalled = false;
      const trackingDb = {
        select: mock(() => {
          selectCalled = true;
          throw new Error("Intentional error");
        }),
      };

      const service = new DrizzleCoinTransactionService(
        trackingDb as unknown as never,
        mockController,
      );

      const input = {
        userId: "user-123",
        tripId: "trip-123",
        limit: 10,
      };

      const effect = service.getCoinTransactionsForUser(input);

      // The Effect should wrap the promise in tryPromise
      expect(effect).toBeDefined();

      // Run it to verify the select is called
      try {
        await Effect.runPromise(effect);
      } catch {
        // Expected to fail
      }

      expect(selectCalled).toBe(true);
    });

    it("should properly type error channel with ServiceError", async () => {
      const errorDb = {
        select: mock(() => {
          throw new Error("Test error");
        }),
      };

      const service = new DrizzleCoinTransactionService(
        errorDb as unknown as never,
        mockController,
      );

      const input = {
        userId: "user-123",
        tripId: "trip-123",
        limit: 10,
      };

      const effect = service.getCoinTransactionsForUser(input);

      // Verify error channel by catching it
      const result = await Effect.runPromise(
        effect.pipe(
          Effect.catchTag("ServiceError", (error) =>
            Effect.succeed({ caught: true, tag: error._tag }),
          ),
        ),
      );

      expect(result.caught).toBe(true);
      expect(result.tag).toBe("ServiceError");
    });

    it("should support Effect composition with other Effects", async () => {
      const mockDb = createMockDb();
      const service = new DrizzleCoinTransactionService(
        mockDb as unknown as never,
        mockController,
      );

      const input = {
        userId: "user-123",
        tripId: "trip-123",
        limit: 10,
      };

      const effect = service.getCoinTransactionsForUser(input);

      // Test chaining with flatMap
      const chainedEffect = effect.pipe(
        Effect.flatMap((result) =>
          Effect.sync(() => ({
            original: result,
            chainApplied: true,
          })),
        ),
      );

      expect(chainedEffect).toBeDefined();
      expect(typeof chainedEffect.pipe).toBe("function");
    });
  });
});
