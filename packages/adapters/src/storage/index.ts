/**
 * Storage adapters module
 *
 * This module provides storage-related adapters including:
 * - Storage gateways for different providers (Supabase, In-Memory)
 * - Storage path utilities for normalization and parsing
 */

// Gateway exports
export {
  SupabaseStorageAdapter,
  InMemoryStorageGateway,
  DefaultStoragePathResolver,
} from "./gateways";

// Utility exports
export {
  STANDARD_BUCKETS,
  normalizeStoragePath,
  normalizeBucketName,
  createStoragePath,
  parseStoragePath,
  type StandardBucket,
} from "./utils";
