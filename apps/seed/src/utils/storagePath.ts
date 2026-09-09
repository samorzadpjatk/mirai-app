import { env } from "../config/env";

export interface SeedStorageTarget {
  /** Bucket the object is uploaded to. */
  bucket: string;
  /** Object path inside the bucket. */
  objectPath: string;
  /**
   * `${bucket}/${objectPath}` — the only shape the backend can resolve back to
   * a bucket, so this is what gets persisted in the database.
   */
  storagePath: string;
  /** Source file location, relative to `apps/seed/assets/<seedEnv>/`. */
  sourcePath: string;
  /** False when the configured prefix was not recognised. */
  knownPrefix: boolean;
}

interface PrefixTarget {
  /** Prefix accepted at the start of a configured `storagePath`. */
  prefix: string;
  /** Bucket the prefix maps to, read lazily so env overrides are honoured. */
  bucket: () => string;
  /** Directory the source file lives in inside the asset tree. */
  sourceDir: string;
}

/**
 * The asset tree keeps public files under `public/` while the bucket that
 * receives them is called `files-public`, so both spellings are accepted on
 * input and both resolve to the same bucket and the same source directory.
 * Order matters: `files-public` has to be tested before `public`.
 */
const PREFIX_TARGETS: PrefixTarget[] = [
  { prefix: "files-public", bucket: () => env.publicBucket, sourceDir: "public" },
  { prefix: "public", bucket: () => env.publicBucket, sourceDir: "public" },
  { prefix: "images", bucket: () => env.imageBucket, sourceDir: "images" },
  { prefix: "videos", bucket: () => env.videoBucket, sourceDir: "videos" },
];

/**
 * Turns the `storagePath` of a seed config into the bucket and object path the
 * upload needs, plus the bucket-qualified reference the app needs.
 *
 * A configured path names a location in the asset tree (`public/x.pdf`), which
 * is not the same thing as a storage reference: the backend resolves a
 * reference by reading its first segment as a bucket name, and `public` is a
 * Supabase object prefix rather than a bucket, so it resolves to nothing.
 * Persisting the configured path verbatim produced rows the app could never
 * download.
 *
 * An unrecognised prefix keeps the historical fallback — the whole path becomes
 * an object in the public bucket — but `knownPrefix` lets the caller warn.
 */
export const resolveSeedStorageTarget = (configuredPath: string): SeedStorageTarget => {
  const normalized = configuredPath.replace(/^\/+/, "");

  for (const target of PREFIX_TARGETS) {
    const marker = `${target.prefix}/`;
    if (!normalized.startsWith(marker)) continue;

    const objectPath = normalized.slice(marker.length);
    if (!objectPath) break;

    const bucket = target.bucket();
    return {
      bucket,
      objectPath,
      storagePath: `${bucket}/${objectPath}`,
      sourcePath: `${target.sourceDir}/${objectPath}`,
      knownPrefix: true,
    };
  }

  const bucket = env.publicBucket;
  return {
    bucket,
    objectPath: normalized,
    storagePath: `${bucket}/${normalized}`,
    sourcePath: normalized,
    knownPrefix: false,
  };
};
