import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { File } from "expo-file-system";
import { useTRPCClient } from "@integral-2025-app/trpc/client";
import { tusUrlStorage } from "~/lib/tusUrlStorage";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number | null;
  percent: number | null;
}

interface UploadInput {
  tripId: string;
  challengeId: string;
  assetType: "IMAGE" | "VIDEO";
  fileUri: string;
  fileName?: string;
  contentType?: string;
}

interface UploadResult {
  uploadUrl: string;
  bucket: string;
  objectPath: string;
  storagePath: string;
}

const getFileNameFromUri = (uri: string): string => {
  const parts = uri.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "upload";
};

export const useFileUpload = () => {
  const trpcClient = useTRPCClient();
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
      if (!mountedRef.current) {
        throw new Error("Upload aborted: component unmounted");
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

        const fileName = input.fileName ?? getFileNameFromUri(input.fileUri);
        const contentType = input.contentType ?? "application/octet-stream";

        const uploadTicket =
          await trpcClient.challengeSubmission.createAssetUploadUrl.mutate({
            tripId: input.tripId,
            challengeId: input.challengeId,
            assetType: input.assetType,
            fileName,
            contentType,
          });

        const fileResponse = await fetch(input.fileUri);
        const fileBlob = await fileResponse.blob();
        const bytesTotal = fileInfo.size ?? fileBlob.size ?? null;

        return await new Promise<UploadResult>((resolve, reject) => {
          const tusUpload = new tus.Upload(fileBlob, {
            uploadUrl: uploadTicket.uploadUrl,
            uploadSize: bytesTotal ?? undefined,
            urlStorage,
            metadata: {
              filename: fileName,
              filetype: contentType,
              bucketName: uploadTicket.bucket,
              objectName: uploadTicket.objectPath,
            },
            retryDelays: [0, 1000, 3000, 5000],
            onError: (uploadError) => {
              const errorObject =
                uploadError instanceof Error
                  ? uploadError
                  : new Error("Upload failed");

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
                setResult(uploadTicket);
                setProgress({
                  bytesUploaded: bytesTotal ?? 0,
                  bytesTotal,
                  percent: 1,
                });
              }
              resolve(uploadTicket);
            },
          });

          uploadRef.current = tusUpload;

          tusUpload
            .findPreviousUploads()
            .then((previousUploads) => {
              const previousUpload = previousUploads[0];
              if (previousUpload) {
                tusUpload.resumeFromPreviousUpload(previousUpload);
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
                      : new Error("Failed to resume upload");

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
    [abort, trpcClient, urlStorage],
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
