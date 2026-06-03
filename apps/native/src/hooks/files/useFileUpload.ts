import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { File } from "expo-file-system";
import { orpc } from "@mirai-app/orpc/client";
import { tusUrlStorage } from "~/services/storage/tusUrlStorage";
import { useSupabaseClient } from "@mirai-app/supabase/react";
type UploadStatus = "idle" | "uploading" | "success" | "error";
export interface UploadProgress {
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

export function shouldRetryErrorMessage(message: string): boolean {
  return (
    message.includes(" 400") ||
    message.includes(" 403") ||
    message.includes("unable to resume upload") ||
    message.includes("without an endpoint")
  );
}

export function calculateUploadProgress(
  bytesUploaded: number,
  bytesTotal: number | null,
): UploadProgress {
  return {
    bytesUploaded,
    bytesTotal,
    percent: bytesTotal ? bytesUploaded / bytesTotal : null,
  };
}

export function toErrorObject(error: unknown, fallbackMessage: string): Error {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

export function shouldRetryUpload(
  attempt: number,
  maxAttempts: number,
  retrying: boolean,
  errorMessage: string,
  retryPredicate: (message: string) => boolean,
): boolean {
  return !retrying && attempt < maxAttempts - 1 && retryPredicate(errorMessage);
}

export function buildTusUploadOptions(
  ticket: { resumableUrl: string; token: string; bucket: string; objectPath: string },
  _fileBlob: Blob,
  bytesTotal: number | null,
  accessToken: string,
  contentType: string,
): Record<string, unknown> {
  return {
    endpoint: ticket.resumableUrl,
    uploadSize: bytesTotal ?? undefined,
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
  };
}

export const useFileUpload = () => {
  const trpcClient = orpc;
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
  const mountedRef = useRef(false);
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
        const uploadTicket = await trpcClient.storage.createUploadUrl.call({
          storagePath: input.storagePath,
          upsert: input.upsert,
        });
        const fileResponse = await fetch(input.fileUri);
        const fileBlob = await fileResponse.blob();
        const bytesTotal = fileInfo.size ?? fileBlob.size ?? null;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) {
          throw new Error("User not authenticated");
        }
        return await new Promise<UploadResult>((resolve, reject) => {
          const maxAttempts = 2;
          let attempt = 0;
          let retrying = false;
          const retryPredicate = shouldRetryErrorMessage;
          const startUpload = (ticket: UploadTicket) => {
            const options = buildTusUploadOptions(
              ticket,
              fileBlob,
              bytesTotal,
              accessToken,
              contentType,
            );
            const tusUpload = new tus.Upload(fileBlob, {
              ...options,
              urlStorage,
              onError: (uploadError) => {
                const errorObject = toErrorObject(uploadError, "Upload failed");

                if (
                  shouldRetryUpload(
                    attempt,
                    maxAttempts,
                    retrying,
                    errorObject.message,
                    retryPredicate,
                  )
                ) {
                  retrying = true;
                  attempt += 1;
                  void tusUpload.abort().then(async () => {
                    try {
                      const refreshedTicket = await trpcClient.storage.createUploadUrl.call({
                        storagePath: input.storagePath,
                      });
                      void (
                        {
                          // retry metadata available in context
                        }
                      );
                      retrying = false;
                      startUpload(refreshedTicket);
                    } catch (refreshError) {
                      const refreshObject = toErrorObject(
                        refreshError,
                        "Failed to refresh upload URL",
                      );
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
                setProgress(calculateUploadProgress(bytesUploaded, bytesTotal ?? null));
              },
              onSuccess: () => {
                if (mountedRef.current) {
                  setStatus("success");
                  setResult(ticket);
                  setProgress(calculateUploadProgress(bytesTotal ?? 0, bytesTotal));
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
                }
                tusUpload.start();
              })
              .catch((resumeError) => {
                tusUpload
                  .abort()
                  .then(() => {
                    const errorObject = toErrorObject(resumeError, "Failed to prepare upload");
                    if (mountedRef.current) {
                      setStatus("error");
                      setError(errorObject);
                    }
                    reject(errorObject);
                  })
                  .catch((abortError) => {
                    const errorObject = toErrorObject(abortError, "Failed to abort upload");
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
