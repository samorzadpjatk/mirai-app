import { parseStoragePath, normalizeStoragePath, normalizeBucketName } from "./standard";

const SUPABASE_OBJECT_PREFIXES = new Set(["public", "sign", "authenticated"]);

const inferBucketFromPath = (rawPath: string): { bucket: string; path: string } | null => {
  const normalized = rawPath.replace(/^\/+/, "");
  if (!normalized) return null;

  if (normalized.startsWith("files-public/")) {
    return { bucket: "files-public", path: normalized.slice("files-public/".length) };
  }
  if (normalized.startsWith("avatar/")) {
    return { bucket: "images", path: normalized };
  }
  if (normalized.startsWith("challenge/")) {
    return { bucket: "images", path: normalized };
  }
  if (normalized.startsWith("group/")) {
    return { bucket: "images", path: normalized };
  }
  if (normalized.startsWith("trips/")) {
    return { bucket: "images", path: normalized };
  }
  if (normalized.startsWith("rewards/") || normalized.startsWith("activity/")) {
    return { bucket: "images", path: normalized };
  }
  return null;
};

const parseSupabaseStorageObject = (value: string): { bucket: string; path: string } | null => {
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

const parseSupabaseStoragePath = (value: string): { bucket: string; path: string } | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http")) {
    return parseSupabaseStorageObject(trimmed);
  }

  const directParsed = parseStoragePath(trimmed);
  if (directParsed) {
    return { bucket: directParsed.bucket, path: directParsed.path };
  }

  const inferred = inferBucketFromPath(trimmed);
  if (inferred) {
    return { bucket: inferred.bucket, path: normalizeStoragePath(inferred.path) };
  }

  return null;
};

/**
 * Normalizes an image reference to a standard storage path.
 * Returns undefined for empty input.
 * For valid Supabase storage paths/URLs, returns the normalized bucket/path.
 * For other values (e.g. external HTTP URLs), returns the original value.
 * Pure: no side effects, no async, no DB calls.
 */
export const normalizeImageReference = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const normalized = parseSupabaseStoragePath(value);
  if (normalized) {
    return `${normalized.bucket}/${normalized.path}`;
  }
  return value;
};

export const replaceSupabaseHost = (url: string): string => {
  try {
    const parsed = new URL(url);
    const host = parsed.host;
    if (host.endsWith(".supabase.co") && !host.includes(".storage.")) {
      parsed.host = host.replace(".supabase.co", ".storage.supabase.co");
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

export const buildResumableUrl = (baseUrl: string): string => {
  try {
    const url = new URL(baseUrl);
    const host = url.host;
    if (host.endsWith(".supabase.co") && !host.includes(".storage.")) {
      url.host = host.replace(".supabase.co", ".storage.supabase.co");
    }
    url.pathname = "/storage/v1/upload/resumable/sign";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return `${baseUrl.replace(/\/$/, "")}/storage/v1/upload/resumable/sign`;
  }
};

export const buildPublicObjectUrl = (baseUrl: string): string => {
  try {
    const url = new URL(baseUrl);
    const host = url.host;
    if (host.endsWith(".supabase.co") && !host.includes(".storage.")) {
      url.host = host.replace(".supabase.co", ".storage.supabase.co");
    }
    url.pathname = "/storage/v1/object/public";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public`;
  }
};

export const rewriteSignedUrlHost = (signedUrl: string, publicUrlBase?: string): string => {
  if (!publicUrlBase) return signedUrl;

  try {
    const signed = new URL(signedUrl);
    const pub = new URL(publicUrlBase);
    signed.host = pub.host;
    signed.protocol = pub.protocol;
    signed.port = pub.port;
    return signed.toString();
  } catch {
    return signedUrl;
  }
};
