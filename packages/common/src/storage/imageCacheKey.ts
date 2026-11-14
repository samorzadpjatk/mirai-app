import type { ImageTransformName } from "./imageTransform";

// Avatars are re-uploaded in place (`avatar/<userId>.jpg`, `upsert: true`), so the
// path alone does not identify the picture. Every other upload gets a unique name.
const MUTABLE_PATH_PATTERN = /(^|\/)avatar\//;

/**
 * Disk-cache identity for a Storage image, or `undefined` to let the image cache key
 * on the URL.
 *
 * A signed URL carries a fresh token every time it is issued, so an image cache keyed
 * on the URL never hits across app launches: every photo in the feed was downloaded
 * and resized by imgproxy again on each cold start. Keying on the object (plus render
 * size) lets the second launch read it from disk.
 *
 * An object that is overwritten in place has no stable identity of its own: it is
 * only cached by key when the caller supplies a version (`cacheKey`, e.g. the user's
 * `updatedAt`), and otherwise keeps the URL-keyed behaviour so a new avatar shows up.
 */
export function buildImageDiskCacheKey(
  storagePath: string,
  cacheKey?: string | null,
  transform?: ImageTransformName,
): string | undefined {
  const path = storagePath.trim();
  if (!path) {
    return undefined;
  }

  const version = cacheKey?.trim() || null;
  if (!version && MUTABLE_PATH_PATTERN.test(path)) {
    return undefined;
  }

  return ["storage-image", path, transform ?? "original", version ?? "v0"].join("|");
}
