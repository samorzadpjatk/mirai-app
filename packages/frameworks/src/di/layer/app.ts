/**
 * App Layer - Complete Application Layer Composition
 *
 * Composes all repository and service layers into a unified Layer
 * that can be provided to Effect programs.
 */

import { Layer, Effect } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { NotificationServicePortTag } from "@mirai-app/use-cases/notification/ports/NotificationPort";
import {
  NotificationPortTag,
  PushSubscriptionPortTag,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { NotificationServiceGateway } from "@mirai-app/adapters";
import { makeRepositoryLayer } from "./repository";
import { makeServiceLayer, setupEventBusHandlerRuntime } from "./service";
import { makeAuthLayer } from "./auth";
import { EventBusTag } from "@mirai-app/use-cases";
import { RedisEventBusGateway } from "@mirai-app/adapters";

/**
 * Configuration for creating the complete App Layer
 */
export interface AppLayerConfig {
  /** Drizzle database client */
  db: DrizzleDb;
}

/**
 * Creates the complete application Layer with all repositories and services.
 *
 * This Layer provides all Context.Tags required by use cases:
 * - UserPortTag
 * - TripPortTag
 * - GroupPortTag
 * - ChallengePortTag
 * - And all other repository ports
 * - EventBusTag (via service layer)
 * - NotificationServicePortTag (requires repository ports)
 *
 * @example
 * ```typescript
 * const appLayer = makeAppLayer({ db });
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserPortTag;
 *   return yield* userRepo.findById("123");
 * }).pipe(Effect.provide(appLayer));
 * ```
 */
export const makeAppLayer = (config: AppLayerConfig): Layer.Layer<never> => {
  const authLayer = makeAuthLayer({ db: config.db });
  const repoLayer = makeRepositoryLayer({ db: config.db });
  const serviceLayer = makeServiceLayer({ db: config.db });

  // NotificationServiceGateway requires repository ports from repoLayer.
  // Use Layer.effect + Layer.provide to properly compose dependencies.
  const notificationServiceLayer = Layer.effect(
    NotificationServicePortTag,
    Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;
      const pushSubscriptionPort = yield* PushSubscriptionPortTag;
      return new NotificationServiceGateway(notificationPort, pushSubscriptionPort);
    }),
  ).pipe(Layer.provide(repoLayer));  // Satisfies NotificationPortTag and PushSubscriptionPortTag requirements

  // EventBus handler runtime setup - requires notification ports from repoLayer
  const eventBusSetupLayer = Layer.effect(
    EventBusTag,
    Effect.gen(function* () {
      // Get the existing event bus gateway from service layer
      const eventBus = yield* EventBusTag;
      
      // Set up handler runtime with notification ports
      yield* setupEventBusHandlerRuntime(eventBus as RedisEventBusGateway);
      
      return eventBus;
    }),
  ).pipe(Layer.provide(Layer.mergeAll(serviceLayer, repoLayer)));

  // Now all layers have no unsatisfied requirements
  return Layer.mergeAll(
    authLayer, 
    repoLayer, 
    serviceLayer, 
    notificationServiceLayer,
    eventBusSetupLayer
  ) as unknown as Layer.Layer<never>;
};

/**
 * Creates a Layer with only repositories (no services).
 * Useful when services are provided separately.
 */
export const makeRepositoriesOnlyLayer = (config: { db: DrizzleDb }) => {
  return makeRepositoryLayer(config);
};

/**
 * Creates a Layer with only services (no repositories).
 * Useful when repositories are provided separately.
 */
export const makeServicesOnlyLayer = (config: { db: DrizzleDb }) => {
  return makeServiceLayer(config);
};
