import {
  STANDARD_BUCKETS,
  normalizeBucketName,
  normalizeStoragePath,
} from "@mirai-app/common/storage";

const SUPABASE_OBJECT_PREFIXES = new Set(["public", "sign", "authenticated"]);

// Legacy constants - use STANDARD_BUCKETS instead
const IMAGE_BUCKET = STANDARD_BUCKETS.IMAGES;
const VIDEO_BUCKET = STANDARD_BUCKETS.VIDEOS;
const PUBLIC_BUCKET = STANDARD_BUCKETS.PUBLIC;

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "avi", "mkv"]);

const KNOWN_BUCKETS = new Set<string>(Object.values(STANDARD_BUCKETS));

const getFileExtension = (path: string): string | null => {
  const fileName = path.split("/").pop();
  if (!fileName) return null;
  const parts = fileName.split(".");
  if (parts.length < 2) return null;
  const ext = parts.pop();
  if (!ext) return null;
  return ext.toLowerCase();
};

const inferBucketFromPath = (rawPath: string): { bucket: string; path: string } | null => {
  const normalized = rawPath.replace(/^\/+/, "");
  if (!normalized) return null;

  if (normalized.startsWith("files-public/")) {
    return { bucket: PUBLIC_BUCKET, path: normalized.slice("files-public/".length) };
  }

  if (normalized.startsWith("avatar/")) {
    return { bucket: IMAGE_BUCKET, path: normalized };
  }

  if (normalized.startsWith("challenge/")) {
    const extension = getFileExtension(normalized);
    const bucket = extension && VIDEO_EXTENSIONS.has(extension) ? VIDEO_BUCKET : IMAGE_BUCKET;
    return { bucket, path: normalized };
  }

  if (normalized.startsWith("group/")) {
    return { bucket: IMAGE_BUCKET, path: normalized };
  }

  if (normalized.startsWith("trips/")) {
    return { bucket: IMAGE_BUCKET, path: normalized };
  }

  if (normalized.startsWith("rewards/") || normalized.startsWith("activity/")) {
    return { bucket: IMAGE_BUCKET, path: normalized };
  }

  if (!normalized.includes("/")) {
    return { bucket: PUBLIC_BUCKET, path: normalized };
  }

  return null;
};

export const parseSupabaseStorageObject = (
  value: string,
): { bucket: string; path: string } | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let rawPath = trimmed;
  if (trimmed.startsWith("http")) {
    try {
      const url = new URL(trimmed);
      rawPath = url.pathname;
    } catch {
      return null;
    }
  }

  const normalizedPath = rawPath.split("?")[0] ?? "";
  const objectPrefix = "/storage/v1/object/";
  const objectIndex = normalizedPath.indexOf(objectPrefix);
  let objectPath =
    objectIndex >= 0 ? normalizedPath.slice(objectIndex + objectPrefix.length) : normalizedPath;

  objectPath = objectPath.replace(/^\/+/, "");
  if (!objectPath) return null;

  const segments = objectPath.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  if (SUPABASE_OBJECT_PREFIXES.has(segments[0] ?? "")) {
    segments.shift();
  }

  if (segments.length < 2) return null;

  const bucket = normalizeBucketName(segments.shift());
  const path = normalizeStoragePath(segments.join("/"));
  if (!bucket || !path) return null;

  return { bucket, path };
};

export const parseSupabaseStoragePath = (
  value: string,
): { bucket: string; path: string } | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http")) {
    return parseSupabaseStorageObject(trimmed);
  }

  const normalizedPath = trimmed.replace(/^\/+/, "");
  const segments = normalizedPath.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const firstSegment = segments[0] ?? "";
    if (KNOWN_BUCKETS.has(firstSegment)) {
      const bucket = normalizeBucketName(segments.shift());
      if (!bucket) return null;

      const path = normalizeStoragePath(segments.join("/"));
      if (!path) return null;

      return { bucket, path };
    }

    if (
      !SUPABASE_OBJECT_PREFIXES.has(firstSegment) &&
      !["challenge", "group", "avatar", "files-public", "trips", "rewards", "activity"].includes(
        firstSegment,
      )
    ) {
      const bucket = normalizeBucketName(segments.shift());
      if (!bucket) return null;

      const path = normalizeStoragePath(segments.join("/"));
      if (!path) return null;

      return { bucket, path };
    }
  }

  const inferred = inferBucketFromPath(normalizedPath);
  if (!inferred) return null;

  return {
    bucket: inferred.bucket,
    path: normalizeStoragePath(inferred.path),
  };
};

export const normalizeSupabaseStoragePath = (
  value: string,
): { bucket: string; path: string; storagePath: string } | null => {
  const parsed = parseSupabaseStoragePath(value);
  if (!parsed) return null;

  const bucket = normalizeBucketName(parsed.bucket);
  if (!bucket) return null;

  const path = normalizeStoragePath(parsed.path);
  const storagePath = `${bucket}/${path}`;

  return { bucket, path, storagePath };
};

export { SUPABASE_OBJECT_PREFIXES, IMAGE_BUCKET, VIDEO_BUCKET, PUBLIC_BUCKET };
