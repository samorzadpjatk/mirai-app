/**
 * Storage adapters module
 *
 * This module provides storage-related adapters including:
 * - Storage gateways for different providers (Supabase, In-Memory, SeaweedFS)
 * - Storage path utilities for normalization and parsing
 */

// Gateway exports
export {
  SupabaseStorageGateway,
  InMemoryStorageGateway,
  DefaultStoragePathResolver,
} from "./gateways";

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

  // Error types
  ConfigurationError,

  // Storage error types
  StorageError,
  FileNotFoundError,
} from "./gateways/seaweedfs";

// Utility exports
export {
  STANDARD_BUCKETS,
  normalizeStoragePath,
  normalizeBucketName,
  createStoragePath,
  parseStoragePath,
  type StandardBucket,
} from "./utils";
