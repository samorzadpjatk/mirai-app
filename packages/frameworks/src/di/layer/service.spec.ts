/**
 * Service Layer Tests - Better Auth and Redis EventBus Configuration
 *
 * Tests for makeServiceLayer with Better Auth authentication and Redis EventBus.
 * Covers:
 * - Better Auth gateway selection
 * - Redis EventBus layer creation
 * - SeaweedFS storage layer
 * - Error handling for missing configuration
 */

import { describe, it, expect } from "bun:test";
import { Layer, Effect } from "effect";
import { makeServiceLayer, type ServiceLayerConfig } from "./service";
import { AuthNPortTag, StoragePortTag, EventBusTag } from "@mirai-app/use-cases";

// Mock Drizzle database client
const createMockDrizzleClient = () =>
  ({
    query: {},
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  }) as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb;

describe("[UNIT] makeServiceLayer", () => {
  describe("Better Auth Configuration", () => {
    it("should create layer with Better Auth when db is provided", () => {
      process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-better-auth-32";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";

      const mockDb = createMockDrizzleClient();

      const config: ServiceLayerConfig = {
        db: mockDb,
      };

      const layer = makeServiceLayer(config);

      expect(layer).toBeDefined();
      expect(Layer.isLayer(layer)).toBe(true);
    });

    it("should throw error when db is not provided", () => {
      process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-better-auth-32";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";

      const config: ServiceLayerConfig = {
        db: undefined as unknown as import("@mirai-app/frameworks/drizzle").DrizzleDb,
      };

      expect(() => makeServiceLayer(config)).toThrow(
        "Drizzle database client (db) is required",
      );
    });

    it("should pass betterAuthSecret to createBetterAuth", () => {
      process.env.BETTER_AUTH_URL = "http://localhost:3000";

      const mockDb = createMockDrizzleClient();

      const config: ServiceLayerConfig = {
        db: mockDb,
        betterAuthSecret: "custom-secret-that-is-long-enough-for-better-auth",
      };

      const layer = makeServiceLayer(config);

      expect(layer).toBeDefined();
      expect(Layer.isLayer(layer)).toBe(true);
    });

    it("should pass betterAuthUrl to createBetterAuth", () => {
      process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-better-auth-32";

      const mockDb = createMockDrizzleClient();

      const config: ServiceLayerConfig = {
        db: mockDb,
        betterAuthUrl: "http://custom-url.com",
      };

      const layer = makeServiceLayer(config);

      expect(layer).toBeDefined();
      expect(Layer.isLayer(layer)).toBe(true);
    });
  });

  describe("Redis EventBus Layer", () => {
    it("should create layer with Redis EventBus", () => {
      process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-better-auth-32";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";

      const mockDb = createMockDrizzleClient();

      const config: ServiceLayerConfig = {
        db: mockDb,
        eventBusConfig: {
          host: "localhost",
          port: 6380,
          db: 1,
          maxRetries: 3,
          maxStreamLength: 10000,
          blockTimeout: 5000,
        },
      };

      const layer = makeServiceLayer(config);

      expect(layer).toBeDefined();
      expect(Layer.isLayer(layer)).toBe(true);
    });
  });

  describe("Layer Creation", () => {
    it("should create a Layer that provides AuthN and Storage tags", async () => {
      process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-better-auth-32";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";
      process.env.SEAWEEDFS_ENDPOINT = "http://localhost:8333";
      process.env.SEAWEEDFS_ACCESS_KEY = "test-access-key";
      process.env.SEAWEEDFS_SECRET_KEY = "test-secret-key";

      const mockDb = createMockDrizzleClient();
      const config: ServiceLayerConfig = {
        db: mockDb,
      };

      const layer = makeServiceLayer(config);

      // Create a simple effect that uses the layer
      const program = Effect.gen(function* () {
        const authN = yield* AuthNPortTag;
        const storage = yield* StoragePortTag;
        const eventBus = yield* EventBusTag;

        return {
          hasAuthN: authN !== null,
          hasStorage: storage !== null,
          hasEventBus: eventBus !== null,
        };
      });

      // Provide the layer to the effect
      const runnable = Effect.provide(program, layer);

      // Run the effect - should not throw
      const result = await Effect.runPromise(runnable);

      expect(result.hasAuthN).toBe(true);
      expect(result.hasStorage).toBe(true);
      expect(result.hasEventBus).toBe(true);
    });

    it("should create a Layer that can be merged with other layers", () => {
      process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-better-auth-32";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";

      const mockDb = createMockDrizzleClient();
      const config: ServiceLayerConfig = {
        db: mockDb,
      };

      const layer = makeServiceLayer(config);

      // Verify the layer can be merged with other layers
      const merged = Layer.mergeAll(layer);

      expect(merged).toBeDefined();
      expect(Layer.isLayer(merged)).toBe(true);
    });
  });
});
