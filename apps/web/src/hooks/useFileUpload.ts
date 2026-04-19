/**
 * File Upload Hook - SeaweedFS Filer Native TUS Support
 *
 * Implements resumable file upload with progress tracking using SeaweedFS Filer's
 * native TUS protocol support. Uses Effect for error handling and async orchestration.
 *
 * Features:
 * - Resumable uploads (auto-resume on network interruption)
 * - Real-time progress tracking
 * - Pause/resume capability
 * - File validation (type, size)
 * - Effect-based error handling
 *
 * ## TUS Protocol Implementation
 *
 * SeaweedFS Filer natively supports the TUS protocol (resumable uploads).
 * The flow:
 * 1. Get upload URL via GraphQL mutation
 * 2. Create TUS upload with file metadata
 * 3. Upload in chunks with progress tracking
 * 4. Auto-resume on network failure using TUS protocol
 * 5. Return public URL on completion
 *
 * Note: This uses SeaweedFS Filer native TUS, NOT tusd server.
 *
 * @module @mirai-app/web/hooks/useFileUpload
 */

import { useState, useRef, useCallback } from "react";
import { Effect, Data, Either } from "effect";
import * as Upload from "tus-js-client";
import { useMutation, gql } from "urql";
import { ENV } from "@/lib/env";

// =============================================================================
// GraphQL Definitions
// =============================================================================

/**
 * GraphQL mutation to get upload URL for file storage
 */
export const GetUploadUrlDocument = gql`
  query GetUploadUrl($input: GetUploadUrlInput!) {
    uploadUrl(input: $input) {
      url
      path
      expiresAt
    }
  }
`;

/**
 * Upload URL result type
 */
export interface StorageUploadUrl {
  url: string;
  path: string;
  expiresAt: Date | null;
}

/**
 * Upload URL query result type
 */
export interface GetUploadUrlQueryResult {
  uploadUrl: StorageUploadUrl | null;
}

/**
 * Upload URL query variables type
 */
export interface GetUploadUrlQueryVariables {
  input: {
    bucket?: string | null;
    contentType: string;
    filename: string;
  };
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Base upload error class using Effect Data.TaggedError
 */
export class FileUploadError extends Data.TaggedError("FileUploadError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class FileValidationError extends Data.TaggedError("FileValidationError")<{
  readonly message: string;
  readonly field: "type" | "size" | "name";
}> {}

export class UploadUrlError extends Data.TaggedError("UploadUrlError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly message: string;
  readonly retryable: boolean;
}> {}

// =============================================================================
// Upload State Types
// =============================================================================

export type UploadStatus =
  | "idle"
  | "validating"
  | "getting-url"
  | "uploading"
  | "paused"
  | "completed"
  | "error";

export interface UseFileUploadResult {
  /** Upload a file and return the resulting URL */
  upload: (file: File) => Promise<string>;

  /** Current upload progress (0-100) */
  progress: number;

  /** Current upload status */
  status: UploadStatus;

  /** Error if upload failed */
  error: Error | null;

  /** Pause the current upload */
  pause: () => void;

  /** Resume a paused upload */
  resume: () => void;

  /** Reset the upload state */
  reset: () => void;

  /** Currently selected file (for UI display) */
  selectedFile: File | null;

  /** Resulting file URL after successful upload */
  uploadedUrl: string | null;
}

export interface UseFileUploadOptions {
  /** Accepted MIME types (e.g., "image/jpeg,image/png") */
  accept?: string;

  /** Maximum file size in bytes (default: 50MB) */
  maxSize?: number;

  /** Storage bucket (optional) */
  bucket?: string;

  /** Called when upload completes */
  onComplete?: (url: string) => void;

  /** Called when upload errors */
  onError?: (error: Error) => void;

  /** Called on progress updates */
  onProgress?: (progress: number) => void;
}

// =============================================================================
// Validation Logic
// =============================================================================

/**
 * Default accepted file types for images
 */
const DEFAULT_ACCEPT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Default maximum file size (50MB)
 */
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

/**
 * Validate file type against accepted MIME types
 */
const validateFileType = (
  file: File,
  acceptTypes: string[]
): Effect.Effect<void, FileValidationError, never> => {
  return Effect.gen(function* () {
    if (acceptTypes.length === 0) {
      return yield* Effect.void;
    }

    const isValid = acceptTypes.some((type) => {
      if (type.includes("/*")) {
        const category = type.split("/")[0];
        return file.type.startsWith(`${category}/`);
      }
      return file.type === type;
    });

    if (!isValid) {
      return yield* Effect.fail(
        new FileValidationError({
          message: `Invalid file type: ${file.type}. Accepted types: ${acceptTypes.join(", ")}`,
          field: "type",
        })
      );
    }

    return yield* Effect.void;
  });
};

/**
 * Validate file size against maximum
 */
const validateFileSize = (
  file: File,
  maxSize: number
): Effect.Effect<void, FileValidationError, never> => {
  return Effect.gen(function* () {
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      return yield* Effect.fail(
        new FileValidationError({
          message: `File too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`,
          field: "size",
        })
      );
    }

    return yield* Effect.void;
  });
};

/**
 * Validate file name (no path traversal, reasonable length)
 */
const validateFileName = (
  file: File
): Effect.Effect<void, FileValidationError, never> => {
  return Effect.gen(function* () {
    const name = file.name;

    if (!name || name.trim().length === 0) {
      return yield* Effect.fail(
        new FileValidationError({
          message: "File name is required",
          field: "name",
        })
      );
    }

    if (name.length > 255) {
      return yield* Effect.fail(
        new FileValidationError({
          message: "File name too long (max 255 characters)",
          field: "name",
        })
      );
    }

    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return yield* Effect.fail(
        new FileValidationError({
          message: "Invalid characters in file name",
          field: "name",
        })
      );
    }

    return yield* Effect.void;
  });
};

/**
 * Run all file validations
 */
const validateFile = (
  file: File,
  accept?: string,
  maxSize?: number
): Effect.Effect<void, FileValidationError, never> => {
  return Effect.gen(function* () {
    const acceptTypes = accept
      ? accept.split(",").map((t) => t.trim())
      : DEFAULT_ACCEPT_TYPES;
    const maxFileSize = maxSize ?? DEFAULT_MAX_SIZE;

    yield* validateFileName(file);
    yield* validateFileType(file, acceptTypes);
    yield* validateFileSize(file, maxFileSize);
  });
};

// =============================================================================
// Upload Logic
// =============================================================================

/**
 * Interface for TUS upload callbacks
 */
interface TusUploadCallbacks {
  onProgress: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

/**
 * Create a TUS upload instance
 */
const createTusUpload = (
  file: File,
  uploadUrl: string,
  callbacks: TusUploadCallbacks
): Upload.Upload => {
  return new Upload.Upload(file, {
    endpoint: ENV.STORAGE.TUS_URL,
    uploadUrl,
    retryDelays: [0, 1000, 3000, 5000, 10000], // Exponential backoff
    chunkSize: ENV.STORAGE.MAX_CHUNK_SIZE,
    metadata: {
      filename: file.name,
      filetype: file.type,
    },
    onError: (error) => {
      console.error("[useFileUpload] TUS upload error:", error);
      callbacks.onError(error);
    },
    onProgress: (bytesUploaded, bytesTotal) => {
      callbacks.onProgress(bytesUploaded, bytesTotal);
    },
    onSuccess: () => {
      console.log("[useFileUpload] TUS upload completed");
      callbacks.onSuccess();
    },
  });
};

/**
 * Start TUS upload and return promise that resolves with URL
 */
const startTusUpload = (
  tusUpload: Upload.Upload
): Effect.Effect<string, FileUploadError | NetworkError, never> => {
  return Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: () =>
        new Promise<string>((resolve, reject) => {
          // Override callbacks for promise resolution
          tusUpload.options.onSuccess = () => {
            // Construct the public URL from upload URL
            // SeaweedFS returns the file at the upload URL
            const fileUrl = tusUpload.url ?? "";
            resolve(fileUrl);
          };

          tusUpload.options.onError = (error) => {
            reject(error);
          };

          tusUpload.start();
        }),
      catch: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Determine if error is retryable
        const isRetryable =
          errorMessage.toLowerCase().includes("network") ||
          errorMessage.toLowerCase().includes("timeout") ||
          errorMessage.toLowerCase().includes("connection");

        if (isRetryable) {
          return new NetworkError({
            message: errorMessage,
            retryable: true,
          });
        }

        return new FileUploadError({
          message: errorMessage,
          cause: error,
        });
      },
    });
  });
};

// =============================================================================
// React Hook
// =============================================================================

/**
 * Hook for resumable file uploads using SeaweedFS Filer native TUS
 *
 * This hook manages the entire upload lifecycle:
 * - File validation
 * - Upload URL fetching via GraphQL
 * - TUS upload with progress tracking
 * - Pause/resume capability
 * - Error handling and recovery
 *
 * ## Usage
 *
 * ```tsx
 * const { upload, progress, status, error, pause, resume } = useFileUpload({
 *   accept: "image/jpeg,image/png",
 *   maxSize: 50 * 1024 * 1024, // 50MB
 *   onComplete: (url) => console.log("Uploaded to:", url),
 *   onError: (err) => console.error("Upload failed:", err),
 * });
 *
 * // In your component:
 * <input
 *   type="file"
 *   accept="image/jpeg,image/png"
 *   onChange={(e) => {
 *     const file = e.target.files?.[0];
 *     if (file) upload(file);
 *   }}
 * />
 * <progress value={progress} max={100} />
 * {status === "uploading" && <button onClick={pause}>Pause</button>}
 * {status === "paused" && <button onClick={resume}>Resume</button>}
 * ```
 *
 * @param options - Configuration options for the upload
 * @returns Upload state and control functions
 */
export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadResult {
  const { accept, maxSize, bucket, onComplete, onError, onProgress } = options;

  // State
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Refs for TUS upload instance and abort control
  const tusUploadRef = useRef<Upload.Upload | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // GraphQL mutation for getting upload URL
  const [, executeGetUploadUrl] = useMutation<
    GetUploadUrlQueryResult,
    GetUploadUrlQueryVariables
  >(GetUploadUrlDocument);

  // Reset state
  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setSelectedFile(null);
    setUploadedUrl(null);

    if (tusUploadRef.current) {
      tusUploadRef.current.abort();
      tusUploadRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Pause upload
  const pause = useCallback(() => {
    if (tusUploadRef.current && status === "uploading") {
      tusUploadRef.current.abort();
      setStatus("paused");
    }
  }, [status]);

  // Resume upload
  const resume = useCallback(() => {
    if (tusUploadRef.current && status === "paused") {
      setStatus("uploading");
      tusUploadRef.current.start();
    }
  }, [status]);

  // Main upload function
  const upload = useCallback(
    async (file: File): Promise<string> => {
      // Reset previous state
      reset();

      // Store selected file for UI
      setSelectedFile(file);

      // Create abort controller for this upload
      abortControllerRef.current = new AbortController();

      const uploadEffect = Effect.gen(function* () {
        // Step 1: Validate file
        setStatus("validating");
        yield* validateFile(file, accept, maxSize);

        // Step 2: Get upload URL from GraphQL
        setStatus("getting-url");

        const urlResult = yield* Effect.tryPromise({
          try: async () => {
            const result = await executeGetUploadUrl({
              input: {
                filename: file.name,
                contentType: file.type || "application/octet-stream",
                bucket,
              },
            });

            if (result.error) {
              throw new Error(`GraphQL error: ${result.error.message}`);
            }

            if (!result.data?.uploadUrl?.url) {
              throw new Error("No upload URL returned from server");
            }

            return result.data.uploadUrl;
          },
          catch: (error) => new UploadUrlError({
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          }),
        });

        // Step 3: Start TUS upload
        setStatus("uploading");
        setProgress(0);

        const tusUpload = createTusUpload(file, urlResult.url, {
          onProgress: (bytesUploaded, bytesTotal) => {
            const percent = bytesTotal > 0 ? (bytesUploaded / bytesTotal) * 100 : 0;
            const rounded = Math.round(percent);
            setProgress(rounded);
            onProgress?.(rounded);
          },
          onSuccess: () => {
            // Handled by promise resolution
          },
          onError: (err) => {
            // Handled by promise rejection
            console.error("TUS error:", err);
          },
        });

        tusUploadRef.current = tusUpload;

        const fileUrl = yield* startTusUpload(tusUpload);

        // Step 4: Complete
        setStatus("completed");
        setUploadedUrl(fileUrl);
        onComplete?.(fileUrl);

        return fileUrl;
      });

      // Run the Effect and handle errors
      const either = await Effect.runPromise(
        Effect.either(
          uploadEffect.pipe(
            Effect.catchTag("FileValidationError", (err) => {
              const error = new Error(err.message);
              setError(error);
              setStatus("error");
              onError?.(error);
              return Effect.fail(err);
            }),
            Effect.catchTag("UploadUrlError", (err) => {
              const error = new Error(err.message);
              setError(error);
              setStatus("error");
              onError?.(error);
              return Effect.fail(err);
            }),
            Effect.catchTag("NetworkError", (err) => {
              const error = new Error(err.message);
              setError(error);
              setStatus("error");
              onError?.(error);
              return Effect.fail(err);
            }),
            Effect.catchTag("FileUploadError", (err) => {
              const error = new Error(err.message);
              setError(error);
              setStatus("error");
              onError?.(error);
              return Effect.fail(err);
            })
          )
        )
      );

      if (Either.isLeft(either)) {
        const err = either.left;
        throw err instanceof Error ? err : new Error(String(err));
      }

      return either.right;
    },
    [accept, maxSize, bucket, onComplete, onError, onProgress, reset, executeGetUploadUrl]
  );

  return {
    upload,
    progress,
    status,
    error,
    pause,
    resume,
    reset,
    selectedFile,
    uploadedUrl,
  };
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { Upload } from "tus-js-client";
