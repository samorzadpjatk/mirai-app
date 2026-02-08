import { useCallback, useEffect, useRef, useState } from "react";
import { Directory, File, Paths } from "expo-file-system";
import { useTRPCClient } from "@integral-2025-app/trpc/client";

type DownloadStatus = "idle" | "loading" | "success" | "error";

type DownloadAssetType = "IMAGE" | "VIDEO";

interface DownloadInput {
  tripId: string;
  submissionId: string;
  assetType: DownloadAssetType;
  imageIndex?: number;
  expiresInSeconds?: number;
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
        const { signedUrl } = await trpcClient.challengeSubmission.getAssetDownloadUrl.query(
          input,
        );
        const destination = new Directory(Paths.cache, "downloads");
        destination.create();
        
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

export type { DownloadInput, DownloadResult, DownloadProgress, DownloadAssetType };
