/**
 * Test Layer - Mock layers and test utilities for Effect-based DI
 *
 * Provides utilities for creating test layers with mocked implementations.
 */

import { Layer, Effect, Context } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";

// Use-cases ports - using available exports
import {
  UserPortTag,
  type IUserPort,
} from "@mirai-app/use-cases/user/ports/UserPort";
import {
  GroupPortTag,
  type GroupUseCasePort,
} from "@mirai-app/use-cases/group/ports/GroupPort";

// In-memory implementations for testing
import { InMemoryUserGateway, InMemoryGroupGateway } from "@mirai-app/adapters";

/**
 * Configuration for creating test layers
 */
export interface TestLayerConfig {
  /** Optional pre-configured database client */
  db?: DrizzleDb;
  /** Optional custom user port implementation */
  userPort?: IUserPort;
  /** Optional custom group port implementation */
  groupPort?: GroupUseCasePort;
}

/**
 * Test Layer type - combines all mock repository layers
 */
export type TestLayer = Layer.Layer<never>;

/**
 * Creates a test Layer with in-memory repositories.
 *
 * All repositories are empty by default - seed them in your tests.
 *
 * @example
 * ```typescript
 * const testLayer = createTestLayer();
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserPortTag;
 *   const user = yield* userRepo.findById("123");
 *   return user;
 * }).pipe(Effect.provide(testLayer));
 * ```
 */
export const createTestLayer = (config: TestLayerConfig = {}) => {
  const userLayer = config.userPort
    ? Layer.succeed(UserPortTag, config.userPort)
    : Layer.succeed(UserPortTag, new InMemoryUserGateway());

  const groupLayer = config.groupPort
    ? Layer.succeed(GroupPortTag, config.groupPort)
    : Layer.succeed(GroupPortTag, new InMemoryGroupGateway());

  return Layer.merge(userLayer, groupLayer);
};

/**
 * Creates a mock Layer for a specific Context.Tag.
 *
 * @example
 * ```typescript
 * const mockUserLayer = mockLayerOf(UserPortTag, {
 *   findById: () => Effect.succeed(null),
 *   save: (user) => Effect.succeed(user),
 * });
 * ```
 */
export const mockLayerOf = <Tag extends Context.Tag<any, any>>(
  tag: Tag,
  implementation: Tag extends Context.Tag<infer _Self, infer Service>
    ? Service
    : never,
) => {
  return Layer.succeed(tag, implementation);
};

/**
 * Creates a mock repository layer with only in-memory implementations.
 * This is a convenience function for tests that only need basic CRUD.
 */
export const createMockRepositoryLayer = () => {
  return createTestLayer();
};

/**
 * Runs an Effect program with a test layer.
 *
 * @example
 * ```typescript
 * const result = await runWithTestLayer(
 *   testLayer,
 *   Effect.gen(function* () {
 *     const repo = yield* UserPortTag;
 *     return yield* repo.findById("123");
 *   })
 * );
 * ```
 */
export const runWithTestLayer = <A, E>(
  layer: TestLayer,
  effect: Effect.Effect<A, E, never>,
) => {
  const provided = Effect.provide(effect, layer);
  return Effect.runPromise(provided);
};
