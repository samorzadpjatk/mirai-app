/**
 * Standard bucket and path normalization utilities
 * Used across the entire codebase to ensure consistency
 */

// Standard bucket names - these should match environment variables
export const STANDARD_BUCKETS = {
  IMAGES: "images",
  VIDEOS: "videos",
  PUBLIC: "files-public",
} as const;

export type StandardBucket = (typeof STANDARD_BUCKETS)[keyof typeof STANDARD_BUCKETS];

/**
 * Normalizes a storage path according to the established standard
 * - Removes leading/trailing slashes
 * - Converts Windows backslashes to forward slashes
 * - Decodes URI components
 * - Filters out empty segments
 */
export const normalizeStoragePath = (rawPath: string): string => {
  return rawPath
    .replace(/\\/g, "/") // Convert Windows paths
    .replace(/^\/+/, "") // Remove leading slashes
    .replace(/\/+$/, "") // Remove trailing slashes
    .split("/")
    .filter(Boolean) // Remove empty segments
    .map((segment) => decodeURIComponent(segment)) // Decode URI components
    .join("/");
};

/**
 * Normalizes bucket name to standard format
 * Uses environment variable values as the source of truth
 */
export const normalizeBucketName = (bucket: string | null | undefined): StandardBucket | null => {
  if (!bucket) return null;

  const normalized = bucket.toLowerCase();

  // Check if it's already a standard bucket name
  if (Object.values(STANDARD_BUCKETS).includes(normalized as StandardBucket)) {
    return normalized as StandardBucket;
  }

  // Handle common aliases
  const aliases: Record<string, StandardBucket> = {
    image: STANDARD_BUCKETS.IMAGES,
    video: STANDARD_BUCKETS.VIDEOS,
    public: STANDARD_BUCKETS.PUBLIC,
    "file-public": STANDARD_BUCKETS.PUBLIC,
  };

  return aliases[normalized] ?? null;
};

/**
 * Creates a standardized storage path with bucket and object path
 */
export const createStoragePath = (bucket: StandardBucket, objectPath: string): string => {
  const normalizedPath = normalizeStoragePath(objectPath);
  return `${bucket}/${normalizedPath}`;
};

/**
 * Parses a storage path into bucket and object path components
 */
export const parseStoragePath = (
  fullPath: string,
): { bucket: StandardBucket; path: string } | null => {
  const normalized = normalizeStoragePath(fullPath);
  if (!normalized) return null;

  const segments = normalized.split("/");
  if (segments.length < 2) return null;

  const bucketSegment = segments[0];
  const bucket = normalizeBucketName(bucketSegment);
  if (!bucket) return null;

  const path = segments.slice(1).join("/");
  return { bucket, path };
};
