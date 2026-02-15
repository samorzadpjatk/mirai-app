import { useCallback, useEffect, useRef, useState } from "react";
import { Directory, File, Paths } from "expo-file-system";
import { useTRPCClient } from "@integral-2025-app/trpc/client";

type DownloadStatus = "idle" | "loading" | "success" | "error";

interface DownloadInput {
  storagePath: string;
  expiresInSeconds?: number;
  skipCache?: boolean;
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

const getFileNameFromUrl = (url: string): string => {
  const sanitizedUrl = url.split("?")[0] ?? url;
  const parts = sanitizedUrl.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "download";
};

export const useFileDownload = () => {
  const trpcClient = useTRPCClient();
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [file, setFile] = useState<DownloadResult | null>(null);
  const mountedRef = useRef(true);
  const abortRequestedRef = useRef(false);

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
      abort();
      abortRequestedRef.current = false;
      if (!mountedRef.current) {
        throw new Error("Download aborted: component unmounted");
      }

      setStatus("loading");
      setError(null);
      setFile(null);

      try {
        const { signedUrl } = await trpcClient.storage.createDownloadUrl.query({
          storagePath: input.storagePath,
          expiresInSeconds: input.expiresInSeconds,
        });
        const destination = new Directory(Paths.cache, "downloads");
        if (!destination.exists) {
          destination.create();
        }

        const cachedFileName = getFileNameFromUrl(signedUrl);
        const cachedFile = new File(destination, cachedFileName);

        if (cachedFile.exists && input.skipCache) {
          try {
            cachedFile.delete();
          } catch (deleteError) {
            console.warn("[Download] Failed to clear cached file", {
              storagePath: input.storagePath,
              message:
                deleteError instanceof Error
                  ? deleteError.message
                  : "Unknown error",
            });
          }
        }

        if (cachedFile.exists && !input.skipCache) {
          const cachedResult: DownloadResult = {
            uri: cachedFile.uri,
            contentType: cachedFile.type,
            fileName: cachedFileName,
            totalBytes: cachedFile.size,
          };

          if (mountedRef.current) {
            setFile(cachedResult);
            setStatus("success");
          }

          return cachedResult;
        }

        const downloadResult = await File.downloadFileAsync(signedUrl, destination);

        const totalBytes = downloadResult.size;
        const contentType = downloadResult.type;
        const fileName = downloadResult.uri.split("/").pop() ?? null;

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
        const isAbortError =
          abortRequestedRef.current ||
          (errorObject as { name?: string }).name === "AbortError";

        if (mountedRef.current) {
          setStatus(isAbortError ? "idle" : "error");
          if (!isAbortError) {
            setError(errorObject);
          }
        }

        throw errorObject;
      }
    },
    [abort, trpcClient],
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
