import {
  IMAGE_TRANSFORMS,
  type ImageTransform,
  type ImageTransformName,
  buildDownloadResponse,
  buildPublicUrlResponse,
  buildUploadResponse,
  calculateExpiresAtISO,
  classifyStorageError,
  isPublicBucket,
  rewriteSignedUrlHost,
} from "@mirai-app/common/storage";
import { ORPCError } from "@orpc/server";
import { env } from "bun";
import { getPublicUrl, getResumableEndpoint, resolveStoragePath } from "./utils";

export const createUploadUrl = async (
  context: {
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUploadUrl: (
            path: string,
            options: { upsert: boolean },
          ) => Promise<{ data: { token?: string | null } | null; error: unknown }>;
        };
      };
    };
  },
  input: {
    storagePath: string;
    upsert?: boolean;
    fileSize?: number;
    contentType?: string;
  },
) => {
  const objectInfo = resolveStoragePath(input.storagePath);

  const { data, error } = await context.supabase.storage
    .from(objectInfo.bucket)
    .createSignedUploadUrl(objectInfo.path, { upsert: Boolean(input.upsert) });

  if (error || !data?.token) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to create signed upload URL",
    });
  }

  return buildUploadResponse(
    data.token,
    objectInfo.bucket,
    objectInfo.path,
    objectInfo.storagePath,
    getResumableEndpoint(),
  );
};

export const createDownloadUrl = async (
  context: {
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
            options?: { transform: ImageTransform },
          ) => Promise<{
            data: { signedUrl?: string | null } | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  },
  input: {
    storagePath: string;
    expiresInSeconds?: number;
    transform?: ImageTransformName;
  },
) => {
  const objectInfo = resolveStoragePath(input.storagePath);
  const expiresIn = input.expiresInSeconds ?? 10 * 60;
  const bucket = context.supabase.storage.from(objectInfo.bucket);

  // Only raster buckets go through imgproxy; asking it to resize a video errors out.
  const transform =
    input.transform && objectInfo.bucket !== "videos"
      ? IMAGE_TRANSFORMS[input.transform]
      : undefined;

  if (transform) {
    const transformed = await bucket.createSignedUrl(objectInfo.path, expiresIn, { transform });
    if (!transformed.error && transformed.data?.signedUrl) {
      return buildDownloadResponse(
        rewriteSignedUrlHost(transformed.data.signedUrl, env.SUPABASE_PUBLIC_URL),
        calculateExpiresAtISO(expiresIn, Date.now()),
      );
    }
    // imgproxy answers 422 "Invalid source image" for sources it cannot decode
    // (very large iPhone captures, for one). Serving the original is slow but
    // visible, which beats a hole in the feed.
  }

  const { data, error } = await bucket.createSignedUrl(objectInfo.path, expiresIn);

  if (error || !data?.signedUrl) {
    const message =
      typeof error?.message === "string" ? error.message : "Unable to create signed URL";
    const classified = classifyStorageError(message);

    throw new ORPCError(classified.code, {
      message: classified.message,
    });
  }

  const signedUrl = rewriteSignedUrlHost(data.signedUrl, env.SUPABASE_PUBLIC_URL);

  const expiresAt = calculateExpiresAtISO(expiresIn, Date.now());

  return buildDownloadResponse(signedUrl, expiresAt);
};

export const createPublicUrl = (
  _context: unknown,
  input: {
    storagePath: string;
  },
) => {
  const objectInfo = resolveStoragePath(input.storagePath);

  if (!isPublicBucket(objectInfo.bucket)) {
    throw new ORPCError("BAD_REQUEST", {
      message:
        "Public URLs are only available for files-public bucket. Use createDownloadUrl for other buckets.",
    });
  }

  const publicUrlBase = getPublicUrl();

  return buildPublicUrlResponse(`${publicUrlBase}/${objectInfo.bucket}/${objectInfo.path}`);
};
