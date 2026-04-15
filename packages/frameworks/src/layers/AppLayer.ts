import { Layer } from "effect";
import { makeRepositoryLayer, type DrizzleDb } from "./RepositoryLayer";
import { makeServiceLayer, type ServiceLayerConfig } from "./ServiceLayer";
import { AllUseCasesLayer } from "@mirai-app/use-cases";

// =============================================================================
// Configuration Interface
// =============================================================================

/**
 * Configuration options for creating the complete AppLayer
 *
 * Combines both RepositoryLayer and ServiceLayer requirements:
 * - Drizzle database client (for repositories and telemetry)
 * - Supabase client (for auth, realtime, storage services)
 */
export interface AppLayerConfig {
  /** Supabase client for auth, realtime, storage, and other Supabase services */
  supabase: ServiceLayerConfig["supabase"];
  /** Drizzle database client for repositories and telemetry */
  db: DrizzleDb;
}


export const makeAppLayer = (config: AppLayerConfig) =>
  Layer.mergeAll(
    makeRepositoryLayer(config.db),
    makeServiceLayer(config),
    AllUseCasesLayer,
  );
