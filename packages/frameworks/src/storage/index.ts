/**
 * Storage utilities
 *
 * Standard bucket and path normalization utilities used across the entire codebase
 * to ensure consistency in file storage operations.
 */

export {
  STANDARD_BUCKETS,
  normalizeStoragePath,
  normalizeBucketName,
  createStoragePath,
  parseStoragePath,
  type StandardBucket,
} from "./standard";
