import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Directory, File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { orpc } from "@mirai-app/orpc/client";

type DownloadStatus = "idle" | "loading" | "success" | "error";
interface DownloadInput {
  storagePath: string;
  expiresInSeconds?: number;
  skipCache?: boolean;
  publicUrl?: string;
}
interface DownloadProgress {
  loadedBytes: number;
  totalBytes: number | null;
  percent: number | null;
}
interface DownloadResult {
  uri: string;
  contentType: string | null;
  fileName: string | null;
  totalBytes: number;
}

// Deduplicate concurrent requests for the same storage path to avoid
// hitting the backend rate limit when multiple images load simultaneously.
const inFlightUrlRequests = new Map<string, Promise<{ signedUrl: string }>>();

const getSignedUrl = async (
  callFn: (input: {
    storagePath: string;
    expiresInSeconds?: number;
  }) => Promise<{ signedUrl: string }>,
  storagePath: string,
  expiresInSeconds?: number,
): Promise<string> => {
  const cacheKey = `${storagePath}:${expiresInSeconds ?? "default"}`;
  const existing = inFlightUrlRequests.get(cacheKey);
  if (existing) {
    const response = await existing;
    return response.signedUrl;
  }
  const promise = callFn({ storagePath, expiresInSeconds });
  inFlightUrlRequests.set(cacheKey, promise);
  try {
    const response = await promise;
    return response.signedUrl;
  } finally {
    inFlightUrlRequests.delete(cacheKey);
  }
};
interface FileLike {
  uri: string;
  type: string | null;
  size: number;
}

export function toDownloadResult(file: FileLike, fileName: string): DownloadResult {
  return {
    uri: file.uri,
    contentType: file.type,
    fileName,
    totalBytes: file.size,
  };
}

export function isDestinationAlreadyExistsError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.toLowerCase().includes("destination already exists");
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  );
}

export function getDownloadErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const buildCacheFileName = async (storagePath: string, url: string): Promise<string> => {
  const sanitizedUrl = url.split("?")[0] ?? url;
  const ext = sanitizedUrl.split(".").pop();
  // Use a stable hash so cache key doesn't rely on unsafe characters
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, storagePath);
  if (ext) {
    return `${hash}.${ext}`;
  }
  return hash;
};
const buildCacheFileNameFromStoragePath = async (storagePath: string): Promise<string> => {
  const ext = storagePath.split(".").pop();
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, storagePath);
  if (ext && ext.length > 0) {
    return `${hash}.${ext}`;
  }
  return hash;
};
export const deleteCachedDownload = async (storagePath: string): Promise<void> => {
  const cachedFileName = await buildCacheFileNameFromStoragePath(storagePath);
  const destinationDir = new Directory(Paths.cache, "downloads");
  const targetFile = new File(destinationDir, cachedFileName);
  if (targetFile.exists) {
    targetFile.delete();
  }
};
export const useFileDownload = () => {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [file, setFile] = useState<DownloadResult | null>(null);
  const mountedRef = useRef(true);
  const abortRequestedRef = useRef(false);

  const createDownloadUrlMutation = useMutation(orpc.storage.createDownloadUrl.mutationOptions());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const abort = useCallback(() => {
    abortRequestedRef.current = true;
    if (mountedRef.current) {
      setStatus("idle");
      setError(null);
    }
  }, []);
  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus("idle");
    setError(null);
    setFile(null);
  }, []);
  const download = useCallback(
    async (input: DownloadInput): Promise<DownloadResult> => {
      // Reset abort state and set to loading
      abortRequestedRef.current = false;
      if (!mountedRef.current) {
        throw new Error("Download aborted: component unmounted");
      }
      setStatus("loading");
      setError(null);
      setFile(null);
      try {
        const destinationDir = new Directory(Paths.cache, "downloads");
        if (!destinationDir.exists) {
          destinationDir.create();
        }
        const stableCachedFileName = await buildCacheFileNameFromStoragePath(input.storagePath);
        const stableCachedFile = new File(destinationDir, stableCachedFileName);
        // Try local cache first so offline users can still see previously downloaded files.
        if (stableCachedFile.exists && !input.skipCache) {
          const cachedResult = toDownloadResult(stableCachedFile, stableCachedFileName);
          if (mountedRef.current) {
            setFile(cachedResult);
            setStatus("success");
          }
          return cachedResult;
        }
        if (stableCachedFile.exists && input.skipCache) {
          try {
            stableCachedFile.delete();
          } catch {
            // Silently ignore cache cleanup errors
          }
        }
        // Use public URL if available, otherwise get signed URL (deduplicated)
        let signedUrl: string;
        if (input.publicUrl) {
          signedUrl = input.publicUrl;
        } else {
          signedUrl = await getSignedUrl(
            createDownloadUrlMutation.mutateAsync,
            input.storagePath,
            input.expiresInSeconds,
          );
        }
        const cachedFileName = await buildCacheFileName(input.storagePath, signedUrl);
        const targetFile = new File(destinationDir, cachedFileName);
        // Backward compatibility: older cache entries can use URL-derived extension.
        if (targetFile.exists && !input.skipCache) {
          const cachedResult = toDownloadResult(targetFile, cachedFileName);
          if (mountedRef.current) {
            setFile(cachedResult);
            setStatus("success");
          }
          return cachedResult;
        }
        if (targetFile.exists && input.skipCache) {
          try {
            targetFile.delete();
          } catch {
            // Silently ignore cache cleanup errors
          }
        }
        // Download the file to the target file; if destination already exists, clear it once and retry
        const performDownload = async () => {
          try {
            if (targetFile.exists) targetFile.delete();
            return await File.downloadFileAsync(signedUrl, targetFile);
          } catch (err) {
            if (isDestinationAlreadyExistsError(err)) {
              try {
                if (targetFile.exists) targetFile.delete();
              } catch {
                // Silently ignore cleanup errors
              }
              try {
                return await File.downloadFileAsync(signedUrl, targetFile);
              } catch (retryErr) {
                if (isDestinationAlreadyExistsError(retryErr) && targetFile.exists) {
                  // Another parallel download already wrote the same file.
                  // Reuse it instead of crashing with a race-condition error.
                  return targetFile;
                }
                throw retryErr;
              }
            }
            throw err;
          }
        };
        const downloadResult = await performDownload();
        const totalBytes = downloadResult.size;
        const contentType = downloadResult.type;
        const fileName = cachedFileName;
        const result: DownloadResult = {
          uri: downloadResult.uri,
          contentType,
          fileName,
          totalBytes,
        };
        if (mountedRef.current) {
          setFile(result);
          setStatus("success");
        }
        return result;
      } catch (downloadError) {
        const errorObject = downloadError as Error;
        const isAbortErrorResult = abortRequestedRef.current || isAbortError(errorObject);
        if (mountedRef.current) {
          setStatus(isAbortErrorResult ? "idle" : "error");
          if (!isAbortErrorResult) {
            setError(errorObject);
          }
        }
        throw errorObject;
      }
    },
    [createDownloadUrlMutation],
  );
  return {
    download,
    abort,
    reset,
    status,
    error,
    file,
  } as const;
};
export type { DownloadInput, DownloadResult, DownloadProgress };
