import type { ImageTransformName } from "@mirai-app/common/storage";
import { orpc } from "@mirai-app/orpc/client";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60;
const DEFAULT_STALE_TIME_MS = 30 * 60 * 1000;
const DEFAULT_GC_TIME_MS = 55 * 60 * 1000;

export interface ImageUrlData {
  signedUrl: string;
  expiresAt: string;
}

export function buildImageUrlQueryKey(
  storagePath: string,
  cacheKey?: string | null,
  transform?: ImageTransformName,
): readonly [string, string, string, string] {
  // The transform belongs in the key: the same object at two render sizes is two
  // different URLs, and without this the first size to load would be served to both.
  return ["cached-image-url", storagePath, cacheKey ?? "default", transform ?? "original"] as const;
}

export function useImageUrl(
  storagePath?: string | null,
  cacheKey?: string | null,
  transform?: ImageTransformName,
): UseQueryResult<ImageUrlData> {
  return useQuery({
    ...orpc.storage.createDownloadUrl.queryOptions({
      input: {
        storagePath: storagePath ?? "",
        expiresInSeconds: DEFAULT_EXPIRES_IN_SECONDS,
        ...(transform ? { transform } : {}),
      },
    }),
    queryKey: buildImageUrlQueryKey(storagePath ?? "", cacheKey, transform),
    enabled: Boolean(storagePath),
    staleTime: DEFAULT_STALE_TIME_MS,
    gcTime: DEFAULT_GC_TIME_MS,
    retry: 1,
  });
}
