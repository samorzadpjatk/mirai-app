import {
  STANDARD_BUCKETS,
  normalizeStoragePath,
  normalizeBucketName,
} from "@mirai-app/frameworks/storage";

const SUPABASE_OBJECT_PREFIXES = new Set(["public", "sign", "authenticated"]);

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

const inferBucketFromPath = (
  rawPath: string,
): { bucket: string; path: string } | null => {
  const normalized = rawPath.replace(/^\/+/, "");
  if (!normalized) return null;

  if (normalized.startsWith("files-public/")) {
    return {
      bucket: STANDARD_BUCKETS.PUBLIC,
      path: normalized.slice("files-public/".length),
    };
  }

  if (normalized.startsWith("avatar/")) {
    return { bucket: STANDARD_BUCKETS.IMAGES, path: normalized };
  }

  if (normalized.startsWith("challenge/")) {
    const extension = getFileExtension(normalized);
    const bucket =
      extension && VIDEO_EXTENSIONS.has(extension)
        ? STANDARD_BUCKETS.VIDEOS
        : STANDARD_BUCKETS.IMAGES;
    return { bucket, path: normalized };
  }

  if (normalized.startsWith("group/")) {
    return { bucket: STANDARD_BUCKETS.IMAGES, path: normalized };
  }

  if (normalized.startsWith("trips/")) {
    return { bucket: STANDARD_BUCKETS.IMAGES, path: normalized };
  }

  if (normalized.startsWith("rewards/") || normalized.startsWith("activity/")) {
    return { bucket: STANDARD_BUCKETS.IMAGES, path: normalized };
  }

  if (!normalized.includes("/")) {
    // Single segment must have a file extension to be a valid file path
    const hasExtension = normalized.includes(".");
    if (!hasExtension) return null;
    return { bucket: STANDARD_BUCKETS.PUBLIC, path: normalized };
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
  const objectPrefixWithSlash = "/storage/v1/object/";
  const objectPrefixWithoutSlash = "storage/v1/object/";

  let objectPath: string;
  if (normalizedPath.startsWith(objectPrefixWithSlash)) {
    objectPath = normalizedPath.slice(objectPrefixWithSlash.length);
  } else if (normalizedPath.startsWith(objectPrefixWithoutSlash)) {
    objectPath = normalizedPath.slice(objectPrefixWithoutSlash.length);
  } else {
    objectPath = normalizedPath;
  }

  objectPath = objectPath.replace(/^\/+/, "");
  if (!objectPath) return null;

  const segments = objectPath.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  if (SUPABASE_OBJECT_PREFIXES.has(segments[0] ?? "")) {
    segments.shift();
  }

  if (segments.length < 2) return null;

  const bucketSegment = segments.shift();
  if (!bucketSegment) return null;
  const bucket = bucketSegment.toLowerCase();
  const path = normalizeStoragePath(segments.join("/"));
  if (!path) return null;

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
      ![
        "challenge",
        "group",
        "avatar",
        "files-public",
        "trips",
        "rewards",
        "activity",
      ].includes(firstSegment)
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

export { SUPABASE_OBJECT_PREFIXES };
