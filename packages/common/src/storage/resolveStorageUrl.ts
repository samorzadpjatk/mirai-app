import type { ImageTransform } from "./imageTransform";
import { parseStoragePath } from "./standard";

export const DEFAULT_SIGNED_URL_SECONDS = 60 * 60 * 24;

type StorageClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number,
        options?: { transform: ImageTransform },
      ) => Promise<{
        data: { signedUrl?: string | null } | null;
        error: unknown;
      }>;
    };
  };
};

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "avi", "mkv"]);

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
    return { bucket: "files-public", path: normalized.slice("files-public/".length) };
  }

  if (normalized.startsWith("avatar/")) {
    return { bucket: "images", path: normalized };
  }

  if (normalized.startsWith("challenge/")) {
    const extension = getFileExtension(normalized);
    const bucket = extension && VIDEO_EXTENSIONS.has(extension) ? "videos" : "images";
    return { bucket, path: normalized };
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

export const resolveStorageUrl = async (
  supabase: StorageClient,
  path: string | null | undefined,
  seconds: number = DEFAULT_SIGNED_URL_SECONDS,
  transform?: ImageTransform,
): Promise<string | null> => {
  if (!path) return null;

  const parsed = parseStoragePath(path) ?? inferBucketFromPath(path);
  if (!parsed) {
    return path;
  }

  const bucket = supabase.storage.from(parsed.bucket);
  // Only raster buckets go through imgproxy; asking it to resize a video errors out.
  const wantsTransform = Boolean(transform) && parsed.bucket !== "videos";

  if (wantsTransform && transform) {
    const transformed = await bucket.createSignedUrl(parsed.path, seconds, { transform });
    if (!transformed.error && transformed.data?.signedUrl) {
      return transformed.data.signedUrl;
    }
    // imgproxy answers 422 "Invalid source image" for sources it cannot decode
    // (very large iPhone captures, for one). Serving the original is slow but
    // visible, which beats a hole in the feed.
  }

  const { data, error } = await bucket.createSignedUrl(parsed.path, seconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
};

export const resolveStorageUrls = async <T extends { image: string | null }>(
  supabase: StorageClient,
  items: T[],
  seconds?: number,
  transform?: ImageTransform,
): Promise<(T & { image: string | null })[]> =>
  Promise.all(
    items.map(async (item) => ({
      ...item,
      image: await resolveStorageUrl(supabase, item.image, seconds, transform),
    })),
  );
