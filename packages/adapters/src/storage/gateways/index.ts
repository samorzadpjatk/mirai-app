// Storage gateways exports
export { SupabaseStorageGateway } from "./supabase/SupabaseStorageGateway";
export { InMemoryStorageGateway } from "./in-memory/InMemoryStorageGateway";
export { DefaultStoragePathResolver } from "./default/DefaultStoragePathResolver";

// SeaweedFS Storage Gateway exports (simplified - no tusd/ticket dependencies)
export {
  // Core gateway
  SeaweedFSStorageGateway,

  // Configuration types
  type SeaweedFSConfig,

  // Default configuration values
  defaultSeaweedFSConfig,

  // Validation functions
  validateSeaweedFSConfig,
  loadConfigFromEnv,

  // Configuration errors
  ConfigurationError,
} from "./seaweedfs";
