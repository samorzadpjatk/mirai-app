/**
 * App Layer - Complete Application Layer Composition
 *
 * Composes all repository and service layers into a unified Layer
 * that can be provided to Effect programs.
 */

import { Layer, Effect } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import { NotificationServicePortTag } from "@mirai-app/use-cases/notification/ports/NotificationPort";
import {
  NotificationPortTag,
  PushSubscriptionPortTag,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { NotificationServiceGateway } from "@mirai-app/adapters";
import { makeRepositoryLayer } from "./repository";
import { makeServiceLayer } from "./service";

/**
 * Configuration for creating the complete App Layer
 */
export interface AppLayerConfig {
  /** Drizzle database client */
  db: DrizzleDb;
  /** Supabase client for auth, storage, and realtime */
  supabase: SupabaseClient;
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
 * const appLayer = makeAppLayer({ db, supabase });
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserPortTag;
 *   return yield* userRepo.findById("123");
 * }).pipe(Effect.provide(appLayer));
 * ```
 */
export const makeAppLayer = (config: AppLayerConfig) => {
  const repoLayer = makeRepositoryLayer({ db: config.db });
  const serviceLayer = makeServiceLayer({ supabase: config.supabase });

  // NotificationServiceGateway requires repository ports from repoLayer context
  const notificationServiceLayer = Layer.effect(
    NotificationServicePortTag,
    Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;
      const pushSubscriptionPort = yield* PushSubscriptionPortTag;
      return new NotificationServiceGateway(notificationPort, pushSubscriptionPort);
    }),
  );

  return Layer.mergeAll(repoLayer, serviceLayer, notificationServiceLayer);
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
export const makeServicesOnlyLayer = (config: { supabase: SupabaseClient }) => {
  return makeServiceLayer(config);
};
