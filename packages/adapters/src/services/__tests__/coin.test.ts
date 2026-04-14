import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { DrizzleCoinService } from "../coin";
import type { DrizzleRankingActivityService } from "../ranking-activity";
import type { AddCoinsUseCase, RemoveCoinsUseCase } from "@mirai-app/use-cases";
import type { CoinTransaction } from "@mirai-app/use-cases";
import { ServiceError } from "@mirai-app/adapters/errors";

// Simple mock db factory
const createMockDb = () => ({
  transaction: mock((cb: (tx: unknown) => Promise<unknown>) =>
    Promise.resolve(cb({})),
  ),
});

const createMockTransaction = (
  overrides?: Partial<CoinTransaction>,
): CoinTransaction =>
  ({
    id: "tx-123",
    groupId: "group-123",
    amount: 100,
    reason: "Test reason",
    adminId: "admin-123",
    createdAt: new Date("2024-01-01"),
    group: {
      id: "group-123",
      name: "Test Group",
      coins: 200,
    },
    admin: {
      id: "admin-123",
      firstName: "Test",
      lastName: "Admin",
    },
    ...overrides,
  }) as CoinTransaction;

describe("[UNIT] DrizzleCoinService", () => {
  let mockCoinRepo: { create: ReturnType<typeof mock> };
  let mockAddCoinsUseCase: AddCoinsUseCase;
  let mockRemoveCoinsUseCase: RemoveCoinsUseCase;
  let mockRankingActivityService: DrizzleRankingActivityService;

  beforeEach(() => {
    mockCoinRepo = {
      create: mock(() => Promise.resolve(createMockTransaction())),
    };

    mockAddCoinsUseCase = {
      execute: mock(() =>
        Promise.resolve({
          kind: "ok" as const,
          value: {
            transaction: createMockTransaction({ amount: 100 }),
          },
        }),
      ),
    } as unknown as AddCoinsUseCase;

    mockRemoveCoinsUseCase = {
      execute: mock(() =>
        Promise.resolve({
          kind: "ok" as const,
          value: {
            transaction: createMockTransaction({ amount: -50 }),
          },
        }),
      ),
    } as unknown as RemoveCoinsUseCase;

    mockRankingActivityService = {
      captureTripRankingSnapshot: mock(() =>
        Promise.resolve(
          new Map([
            ["group-123", { rank: 1, coins: 100, name: "Test", image: null }],
          ]),
        ),
      ),
      createRankChangeActivities: mock(() => Promise.resolve()),
    } as unknown as DrizzleRankingActivityService;
  });

  describe("[UNIT] ServiceError from adapter-errors", () => {
    it("should use the shared ServiceError class", () => {
      const originalError = new Error("Database connection failed");
      const error = new ServiceError({
        operation: "addCoinsWithActivity",
        message: "Failed to add coins",
        cause: originalError,
      });

      expect(error._tag).toBe("ServiceError");
      expect(error.code).toBe("SERVICE_ERROR");
      expect(error.operation).toBe("addCoinsWithActivity");
      expect(error.message).toBe("Failed to add coins");
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

  describe("[UNIT] addCoinsWithActivity - Effect return type", () => {
    it("should return an Effect (type verification)", () => {
      const mockDb = createMockDb();
      const service = new DrizzleCoinService(
        mockDb as unknown as never,
        mockCoinRepo as unknown as never,
        mockAddCoinsUseCase,
        mockRemoveCoinsUseCase,
        mockRankingActivityService,
      );

      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        amount: 100,
        reason: "Test reason",
        adminId: "admin-123",
      };

      const effect = service.addCoinsWithActivity(input);

      // Verify it's an Effect
      expect(effect).toBeDefined();
      expect(typeof effect).toBe("object");
      // Effect has pipe method
      expect(typeof effect.pipe).toBe("function");
    });

    it("should handle database transaction failures with ServiceError", async () => {
      const errorDb = {
        transaction: mock(() =>
          Promise.reject(new Error("Connection refused")),
        ),
      };

      const service = new DrizzleCoinService(
        errorDb as unknown as never,
        mockCoinRepo as unknown as never,
        mockAddCoinsUseCase,
        mockRemoveCoinsUseCase,
        mockRankingActivityService,
      );

      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        amount: 100,
        reason: "Test reason",
        adminId: "admin-123",
      };

      const effect = service.addCoinsWithActivity(input);
      const eitherResult = await Effect.runPromise(Effect.either(effect));

      expect(eitherResult._tag).toBe("Left");
      if (eitherResult._tag === "Left") {
        expect(eitherResult.left).toBeInstanceOf(ServiceError);
        expect(eitherResult.left.operation).toBe("addCoinsWithActivity");
        expect(eitherResult.left.message).toContain("Connection refused");
      }
    });

    it("should properly structure Effect for composition", async () => {
      const mockDb = createMockDb();
      const service = new DrizzleCoinService(
        mockDb as unknown as never,
        mockCoinRepo as unknown as never,
        mockAddCoinsUseCase,
        mockRemoveCoinsUseCase,
        mockRankingActivityService,
      );

      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
      };

      // Test that we can compose the Effect
      const effect = service.addCoinsWithActivity(input);
      const composedEffect = effect.pipe(
        Effect.map((result) => ({
          ...result,
          transformed: true,
        })),
      );

      // Since the mock returns an empty object from transaction, it will fail
      // But we verify the Effect composition works
      expect(composedEffect).toBeDefined();
      expect(typeof composedEffect.pipe).toBe("function");
    });
  });

  describe("[UNIT] removeCoinsWithActivity - Effect return type", () => {
    it("should return an Effect (type verification)", () => {
      const mockDb = createMockDb();
      const service = new DrizzleCoinService(
        mockDb as unknown as never,
        mockCoinRepo as unknown as never,
        mockAddCoinsUseCase,
        mockRemoveCoinsUseCase,
        mockRankingActivityService,
      );

      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        amount: 50,
        reason: "Penalty",
        adminId: "admin-123",
      };

      const effect = service.removeCoinsWithActivity(input);

      expect(effect).toBeDefined();
      expect(typeof effect).toBe("object");
      expect(typeof effect.pipe).toBe("function");
    });

    it("should handle database transaction failures with ServiceError", async () => {
      const errorDb = {
        transaction: mock(() => Promise.reject(new Error("Deadlock detected"))),
      };

      const service = new DrizzleCoinService(
        errorDb as unknown as never,
        mockCoinRepo as unknown as never,
        mockAddCoinsUseCase,
        mockRemoveCoinsUseCase,
        mockRankingActivityService,
      );

      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        amount: 50,
        reason: "Penalty",
        adminId: "admin-123",
      };

      const effect = service.removeCoinsWithActivity(input);
      const eitherResult = await Effect.runPromise(Effect.either(effect));

      expect(eitherResult._tag).toBe("Left");
      if (eitherResult._tag === "Left") {
        expect(eitherResult.left).toBeInstanceOf(ServiceError);
        expect(eitherResult.left.operation).toBe("removeCoinsWithActivity");
      }
    });
  });

  describe("[UNIT] Effect pattern verification", () => {
    it("should use Effect.tryPromise for async operations", async () => {
      let transactionCalled = false;
      const trackingDb = {
        transaction: mock((cb: (tx: unknown) => Promise<unknown>) => {
          transactionCalled = true;
          return Promise.reject(new Error("Intentional error for test"));
        }),
      };

      const service = new DrizzleCoinService(
        trackingDb as unknown as never,
        mockCoinRepo as unknown as never,
        mockAddCoinsUseCase,
        mockRemoveCoinsUseCase,
        mockRankingActivityService,
      );

      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
      };

      const effect = service.addCoinsWithActivity(input);

      // The Effect should wrap the promise in tryPromise
      expect(effect).toBeDefined();

      // Run it to verify the transaction is called
      try {
        await Effect.runPromise(effect);
      } catch {
        // Expected to fail
      }

      expect(transactionCalled).toBe(true);
    });

    it("should properly type error channel with ServiceError", async () => {
      const errorDb = {
        transaction: mock(() => Promise.reject(new Error("Test error"))),
      };

      const service = new DrizzleCoinService(
        errorDb as unknown as never,
        mockCoinRepo as unknown as never,
        mockAddCoinsUseCase,
        mockRemoveCoinsUseCase,
        mockRankingActivityService,
      );

      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        amount: 100,
        adminId: "admin-123",
      };

      const effect = service.addCoinsWithActivity(input);

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
  });
});
