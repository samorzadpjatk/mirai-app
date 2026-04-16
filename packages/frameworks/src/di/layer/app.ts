/**
 * App Layer - Complete Dependency Injection Composition
 *
 * This module provides the unified application layer that combines
 * all repository and service layers into a single composable Layer.
 *
 * ## Usage
 *
 * ```typescript
 * import { makeAppLayer } from "./app";
 * import { createDrizzleClient } from "../../drizzle";
 * import { createSupabaseClient } from "../../supabase";
 *
 * const db = createDrizzleClient(process.env.DATABASE_URL);
 * const supabase = createSupabaseClient(url, key);
 *
 * const appLayer = makeAppLayer({ db, supabase });
 *
 * // Use in Effect programs
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserGatewayTag;
 *   // ...
 * }).pipe(Effect.provide(appLayer));
 * ```
 */

import { Layer } from "effect";
import type { DrizzleDb } from "../../drizzle/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeRepositoryLayer, type RepositoryLayerConfig } from "./repository";
import { makeServiceLayer, type ServiceLayerConfig } from "./service";

/**
 * Configuration for the complete application layer
 */
export interface AppLayerConfig {
  /** Drizzle database client */
  db: DrizzleDb;
  /** Supabase client for auth, storage, and realtime */
  supabase: SupabaseClient;
}

/**
 * Creates the complete application Layer with all dependencies
 *
 * This combines repository layers (domain gateways) and service layers
 * (infrastructure services) into a unified Layer that satisfies all
 * Context.Tag requirements for the application.
 *
 * @param config - Configuration containing db and supabase clients
 * @returns A Layer providing all application dependencies
 *
 * @example
 * ```typescript
 * const appLayer = makeAppLayer({
 *   db: createDrizzleClient(process.env.DATABASE_URL),
 *   supabase: createSupabaseClient(url, key)
 * });
 *
 * // Run any program with full dependencies
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(appLayer))
 * );
 * ```
 */
export const makeAppLayer = (config: AppLayerConfig) => {
  const repositoryConfig: RepositoryLayerConfig = { db: config.db };
  const serviceConfig: ServiceLayerConfig = { supabase: config.supabase };

  const repoLayer = makeRepositoryLayer(repositoryConfig);
  const serviceLayer = makeServiceLayer(serviceConfig);

  return repoLayer.pipe(Layer.merge(serviceLayer));
};

/**
 * Creates a repository-only Layer
 *
 * Use this when you only need database access without infrastructure services.
 * Useful for background jobs or simple CRUD operations.
 *
 * @param db - Drizzle database client
 * @returns A Layer providing only repository dependencies
 */
export const makeRepositoriesOnlyLayer = (db: DrizzleDb) =>
  makeRepositoryLayer({ db });

/**
 * Creates a service-only Layer
 *
 * Use this when you only need infrastructure services without database access.
 * Rarely used directly; prefer makeAppLayer for complete composition.
 *
 * @param supabase - Supabase client
 * @returns A Layer providing only service dependencies
 */
export const makeServicesOnlyLayer = (supabase: SupabaseClient) =>
  makeServiceLayer({ supabase });
