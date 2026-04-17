/**
 * App Layer - Complete Application Layer Composition
 *
 * Composes all repository and service layers into a unified Layer
 * that can be provided to Effect programs.
 */

import { Layer } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import { makeRepositoryLayer, type RepositoryLayerConfig } from "./repository";
import { makeServiceLayer, type ServiceLayerConfig } from "./service";

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

  return Layer.merge(repoLayer, serviceLayer);
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
