import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { File } from "expo-file-system";
import { useTRPCClient } from "@integral-2025-app/trpc/client";
import { tusUrlStorage } from "~/services/storage/tusUrlStorage";
import { useSupabaseClient } from "@integral-2025-app/supabase/react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number | null;
  percent: number | null;
}

interface UploadInput {
  storagePath: string;
  fileUri: string;
  fileName?: string;
  contentType: string;
  upsert?: boolean;
}

interface UploadResult {
  bucket: string;
  objectPath: string;
  storagePath: string;
}

interface UploadTicket {
  resumableUrl: string;
  bucket: string;
  objectPath: string;
  token: string;
  storagePath: string;
}

export const useFileUpload = () => {
  const trpcClient = useTRPCClient();
  const supabase = useSupabaseClient();
  
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<UploadProgress>({
    bytesUploaded: 0,
    bytesTotal: null,
    percent: null,
  });
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const mountedRef = useRef(true);
  const urlStorage = useMemo(() => tusUrlStorage(), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void uploadRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus("idle");
    setProgress({ bytesUploaded: 0, bytesTotal: null, percent: null });
    setError(null);
    setResult(null);
  }, []);

  const abort = useCallback(() => {
    void uploadRef.current?.abort();
    uploadRef.current = null;
    if (mountedRef.current) {
      setStatus("idle");
      setError(null);
    }
  }, []);

  const upload = useCallback(
    async (input: UploadInput): Promise<UploadResult> => {
      abort();
      // Image picker can transiently unmount/remount screen trees on some devices.
      // Keep upload flow resilient instead of hard-failing.
      if (!mountedRef.current) {
        mountedRef.current = true;
      }

      setStatus("uploading");
      setError(null);
      setResult(null);
      setProgress({ bytesUploaded: 0, bytesTotal: null, percent: null });

      try {
        const fileInfo = new File(input.fileUri);

        if (!fileInfo.exists) {
          throw new Error("File not found");
        }

        const contentType = input.contentType;
    
        const uploadTicket = await trpcClient.storage.createUploadUrl.mutate({
          storagePath: input.storagePath,
          upsert: input.upsert,
        });

        const fileResponse = await fetch(input.fileUri);
        const fileBlob = await fileResponse.blob();
        const bytesTotal = fileInfo.size ?? fileBlob.size ?? null;

        const {data: {session}} = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) {
          throw new Error("User not authenticated");
        }

        return await new Promise<UploadResult>((resolve, reject) => {
          const maxAttempts = 2;
          let attempt = 0;
          let retrying = false;

          const shouldRetry = (message: string) =>
            message.includes(" 400") ||
            message.includes(" 403") ||
            message.includes("unable to resume upload") ||
            message.includes("without an endpoint");

          const startUpload = (ticket: UploadTicket) => {
            const tusUpload = new tus.Upload(fileBlob, {
              endpoint: ticket.resumableUrl,
              uploadSize: bytesTotal ?? undefined,
              urlStorage,
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-signature": ticket.token,
              },
              uploadDataDuringCreation: true,
              removeFingerprintOnSuccess: true,
              chunkSize: 6 * 1024 * 1024,
              metadata: {
                bucketName: ticket.bucket,
                objectName: ticket.objectPath,
                contentType,
              },
              retryDelays: [0, 1000, 3000, 5000],
              onError: (uploadError) => {
                const errorObject =
                  uploadError instanceof Error
                    ? uploadError
                    : new Error("Upload failed");

                console.error("[Upload] Tus upload error", {
                  storagePath: input.storagePath,
                  message: errorObject.message,
                });

                if (!retrying && attempt < maxAttempts - 1 && shouldRetry(errorObject.message)) {
                  retrying = true;
                  attempt += 1;
                  void tusUpload.abort().then(async () => {
                    try {
                      const refreshedTicket = await trpcClient.storage.createUploadUrl.mutate({
                        storagePath: input.storagePath,
                      });
                      console.warn("[Upload] Retrying with fresh signed URL", {
                        storagePath: input.storagePath,
                        attempt,
                      });
                      retrying = false;
                      startUpload(refreshedTicket);
                    } catch (refreshError) {
                      const refreshObject =
                        refreshError instanceof Error
                          ? refreshError
                          : new Error("Failed to refresh upload URL");
                      if (mountedRef.current) {
                        setStatus("error");
                        setError(refreshObject);
                      }
                      reject(refreshObject);
                    }
                  });
                  return;
                }

                if (mountedRef.current) {
                  setStatus("error");
                  setError(errorObject);
                }

                reject(errorObject);
              },
              onProgress: (bytesUploaded, bytesTotal) => {
                if (!mountedRef.current) return;
                setProgress({
                  bytesUploaded,
                  bytesTotal: bytesTotal ?? null,
                  percent: bytesTotal ? bytesUploaded / bytesTotal : null,
                });
              },
              onSuccess: () => {
                if (mountedRef.current) {
                  setStatus("success");
                  setResult(ticket);
                  setProgress({
                    bytesUploaded: bytesTotal ?? 0,
                    bytesTotal,
                    percent: 1,
                  });
                }
                resolve(ticket);
              },
            });

            uploadRef.current = tusUpload;

            tusUpload
              .findPreviousUploads()
              .then(async (previousUploads) => {
                if (previousUploads.length > 0) {
                  await Promise.all(
                    previousUploads.map((previousUpload) =>
                      urlStorage.removeUpload(previousUpload.urlStorageKey),
                    ),
                  );
                  console.warn(
                    "[Upload] Cleared previous resumable uploads for signed URL",
                    { storagePath: input.storagePath },
                  );
                }
                tusUpload.start();
              })
              .catch((resumeError) => {
                tusUpload
                  .abort()
                  .then(() => {
                    const errorObject =
                      resumeError instanceof Error
                        ? resumeError
                        : new Error("Failed to prepare upload");

                    if (mountedRef.current) {
                      setStatus("error");
                      setError(errorObject);
                    }
                    reject(errorObject);
                  })
                  .catch((abortError) => {
                    const errorObject =
                      abortError instanceof Error
                        ? abortError
                        : new Error("Failed to abort upload");

                    if (mountedRef.current) {
                      setStatus("error");
                      setError(errorObject);
                    }
                    reject(errorObject);
                  });
              });
          };

          void startUpload(uploadTicket);
        });
      } catch (uploadError) {
        const errorObject = uploadError as Error;
        console.error("[Upload] Failed to start upload", {
          storagePath: input.storagePath,
          message: errorObject.message,
        });
        if (mountedRef.current) {
          setStatus("error");
          setError(errorObject);
        }
        throw errorObject;
      } finally {
        uploadRef.current = null;
      }
    },
    [abort, supabase.auth, trpcClient.storage.createUploadUrl, urlStorage],
  );

  return {
    upload,
    abort,
    reset,
    status,
    progress,
    error,
    result,
  } as const;
};

export type { UploadInput, UploadResult, UploadProgress, UploadStatus };
