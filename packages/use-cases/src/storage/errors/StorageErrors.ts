import { Data } from "effect";

/**
 * Storage path resolution failed
 */
export class StoragePathResolutionError extends Data.TaggedError(
  "StoragePathResolutionError",
)<{
  storagePath: string;
  reason: string;
}> {}

/**
 * Invalid storage bucket error
 */
export class InvalidStorageBucketError extends Data.TaggedError(
  "InvalidStorageBucketError",
)<{
  bucket: string;
  allowedBuckets: string[];
}> {}

/**
 * Storage object not found error
 */
export class StorageObjectNotFoundError extends Data.TaggedError(
  "StorageObjectNotFoundError",
)<{
  bucket: string;
  path: string;
}> {}

/**
 * Signed URL creation failed error
 */
export class SignedUrlCreationError extends Data.TaggedError(
  "SignedUrlCreationError",
)<{
  operation: "upload" | "download";
  bucket: string;
  path: string;
  cause?: unknown;
}> {}

/**
 * Configuration missing error
 */
export class StorageConfigurationError extends Data.TaggedError(
  "StorageConfigurationError",
)<{
  configKey: string;
}> {}
