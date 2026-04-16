/**
 * S3StorageAdapter - StoragePort implementation using AWS S3
 *
 * This adapter implements the StoragePort interface using AWS S3
 * for file operations. It wraps the AWS S3 client and maps
 * S3-specific operations to the domain port interface.
 *
 * Key Design Decisions:
 * - Uses Effect for explicit error handling and composable async operations
 * - Maps S3 errors to domain StorageError types (NoSuchKey -> FileNotFoundError, etc.)
 * - Thin wrapper with no business logic (just mapping)
 * - Compatible with Effect Layers for dependency injection
 * - Uses presigned URLs for createSignedUrl
 *
 * @module gateways
 */

import { Effect } from "effect";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  NoSuchKey,
  NoSuchBucket,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  type StoragePort,
  type FileMetadata,
  type UploadOptions,
  type SignedUrlInfo,
  type DownloadResult,
  StorageError,
  FileNotFoundError,
  UploadError,
  BucketNotFoundError,
  DownloadError,
  DeleteError,
} from "@mirai-app/use-cases";

// =============================================================================
// Error Mapping
// =============================================================================

/**
 * Maps AWS S3 errors to domain StorageError types
 */
function mapS3ErrorToStorageError(
  error: unknown,
  operation: string,
  bucket: string,
  path?: string,
):
  | StorageError
  | FileNotFoundError
  | UploadError
  | BucketNotFoundError
  | DownloadError
  | DeleteError {
  // Handle AWS SDK error types
  if (error instanceof NoSuchKey) {
    return new FileNotFoundError({
      message: `File not found during ${operation}: ${error.message}`,
      bucket,
      path: path ?? "unknown",
    });
  }

  if (error instanceof NoSuchBucket) {
    return new BucketNotFoundError({
      message: `Bucket not found during ${operation}: ${error.message}`,
      bucket,
    });
  }

  // Handle generic Error instances (check error name/code/message)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const errorName = error.name?.toLowerCase() ?? "";

    // Bucket not found errors - check BEFORE file not found to avoid misclassification
    if (
      errorName.includes("nosuchbucket") ||
      (message.includes("bucket") &&
        (message.includes("not found") || message.includes("does not exist")))
    ) {
      return new BucketNotFoundError({
        message: `Bucket not found during ${operation}: ${error.message}`,
        bucket,
      });
    }

    // File not found errors
    if (
      errorName.includes("nosuchkey") ||
      message.includes("no such key") ||
      message.includes("not found") ||
      message.includes("404") ||
      message.includes("object not found")
    ) {
      return new FileNotFoundError({
        message: `File not found during ${operation}: ${error.message}`,
        bucket,
        path: path ?? "unknown",
      });
    }

    // Access denied errors (treat as file not found for security)
    if (
      errorName.includes("accessdenied") ||
      message.includes("access denied") ||
      message.includes("forbidden")
    ) {
      // For delete operations with multiple paths, use DeleteError
      if (operation === "delete" && path) {
        return new DeleteError({
          message: `Access denied during ${operation}: ${error.message}`,
          bucket,
          paths: [path],
        });
      }
      return new FileNotFoundError({
        message: `Access denied or file not found during ${operation}: ${error.message}`,
        bucket,
        path: path ?? "unknown",
      });
    }

    // Upload-specific errors
    if (operation === "upload") {
      return new UploadError({
        message: `Upload failed: ${error.message}`,
        bucket,
        path: path ?? "unknown",
      });
    }

    // Download-specific errors
    if (operation === "download") {
      return new DownloadError({
        message: `Download failed: ${error.message}`,
        bucket,
        path: path ?? "unknown",
      });
    }

    // Delete-specific errors
    if (operation === "delete") {
      return new DeleteError({
        message: `Delete failed: ${error.message}`,
        bucket,
        paths: path ? [path] : [],
      });
    }

    // Generic storage error
    return new StorageError({
      message: `${operation} failed: ${error.message}`,
    });
  }

  // Unknown error type
  return new StorageError({
    message: `Unknown ${operation} error occurred`,
  });
}

/**
 * Helper to narrow error types for upload operation
 */
function narrowUploadError(
  error:
    | StorageError
    | FileNotFoundError
    | UploadError
    | BucketNotFoundError
    | DownloadError
    | DeleteError,
): StorageError | UploadError | BucketNotFoundError {
  if (error instanceof UploadError || error instanceof BucketNotFoundError) {
    return error;
  }
  return new StorageError({ message: error.message });
}

/**
 * Helper to narrow error types for download operation
 */
function narrowDownloadError(
  error:
    | StorageError
    | FileNotFoundError
    | UploadError
    | BucketNotFoundError
    | DownloadError
    | DeleteError,
): StorageError | FileNotFoundError | DownloadError {
  if (error instanceof FileNotFoundError || error instanceof DownloadError) {
    return error;
  }
  return new StorageError({ message: error.message });
}

/**
 * Helper to narrow error types for delete operation
 */
function narrowDeleteError(
  error:
    | StorageError
    | FileNotFoundError
    | UploadError
    | BucketNotFoundError
    | DownloadError
    | DeleteError,
): StorageError | DeleteError | FileNotFoundError {
  if (error instanceof DeleteError || error instanceof FileNotFoundError) {
    return error;
  }
  return new StorageError({ message: error.message });
}

/**
 * Helper to narrow error types for createSignedUrl operation
 */
function narrowSignedUrlError(
  error:
    | StorageError
    | FileNotFoundError
    | UploadError
    | BucketNotFoundError
    | DownloadError
    | DeleteError,
): StorageError | FileNotFoundError {
  if (error instanceof FileNotFoundError) {
    return error;
  }
  return new StorageError({ message: error.message });
}

// =============================================================================
// Metadata Mapping
// =============================================================================

/**
 * Maps S3 HeadObject response to domain FileMetadata
 */
function mapS3HeadToMetadata(
  bucket: string,
  path: string,
  s3Data: {
    ContentLength?: number;
    ContentType?: string;
    LastModified?: Date;
    ETag?: string;
  },
): FileMetadata {
  const now = new Date();
  return {
    path: `${bucket}/${path}`,
    bucket,
    size: s3Data.ContentLength ?? 0,
    contentType: s3Data.ContentType,
    createdAt: s3Data.LastModified ?? now,
    updatedAt: s3Data.LastModified ?? now,
    etag: s3Data.ETag?.replace(/"/g, ""), // Remove quotes from ETag
  };
}

// =============================================================================
// S3StorageAdapter
// =============================================================================

/**
 * S3StorageAdapter
 *
 * Implements StoragePort using AWS S3 for file upload, download,
 * delete, and signed URL operations.
 *
 * Compatible with Effect Layers.
 *
 * @example
 * ```typescript
 * // Direct instantiation
 * const s3Client = new S3Client({ region: "us-east-1" });
 * const storagePort = new S3StorageAdapter(s3Client);
 * const metadata = await Effect.runPromise(
 *   storagePort.upload("my-bucket", "avatar.png", fileBuffer)
 * );
 * ```
 */
export class S3StorageAdapter implements StoragePort {
  /**
   * Creates a new S3StorageAdapter
   *
   * @param s3Client - S3Client instance
   */
  constructor(private readonly s3Client: S3Client) {}

  /**
   * Upload a file to S3
   *
   * @param bucket - The S3 bucket name
   * @param path - The object key (file path within the bucket)
   * @param file - The file data (Buffer or Blob)
   * @param options - Optional upload configuration
   * @returns Effect.Effect<FileMetadata, StorageError | UploadError | BucketNotFoundError, never>
   */
  upload(
    bucket: string,
    path: string,
    file: Buffer | Blob,
    options?: UploadOptions,
  ): Effect.Effect<
    FileMetadata,
    StorageError | UploadError | BucketNotFoundError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        // Convert Blob to Buffer if necessary
        let body: Buffer | Uint8Array;
        let size: number;

        if (file instanceof Blob) {
          const arrayBuffer = await file.arrayBuffer();
          body = Buffer.from(arrayBuffer);
          size = body.length;
        } else {
          body = file;
          size = file.length;
        }

        // Build command with options
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: path,
          Body: body,
          ContentType: options?.contentType,
          ContentLength: size,
          Metadata: options?.metadata,
        });

        const result = await this.s3Client.send(command);

        // Build metadata from response
        const now = new Date();
        const metadata: FileMetadata = {
          path: `${bucket}/${path}`,
          bucket,
          size,
          contentType: options?.contentType,
          createdAt: now,
          updatedAt: now,
          etag: result.ETag?.replace(/"/g, ""),
        };

        return metadata;
      },
      catch: (error) => mapS3ErrorToStorageError(error, "upload", bucket, path),
    }).pipe(Effect.mapError(narrowUploadError));
  }

  /**
   * Download a file from S3
   *
   * @param bucket - The S3 bucket name
   * @param path - The object key (file path within the bucket)
   * @returns Effect.Effect<DownloadResult, StorageError | FileNotFoundError | DownloadError, never>
   */
  download(
    bucket: string,
    path: string,
  ): Effect.Effect<
    DownloadResult,
    StorageError | FileNotFoundError | DownloadError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: path,
        });

        const response = await this.s3Client.send(command);

        // Convert stream to Buffer
        const chunks: Uint8Array[] = [];
        const stream = response.Body as ReadableStream<Uint8Array> | null;

        if (!stream) {
          throw new DownloadError({
            message: "Download completed but no body returned",
            bucket,
            path,
          });
        }

        // Read the stream
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
        } finally {
          reader.releaseLock();
        }

        // Combine chunks into single buffer
        const totalLength = chunks.reduce(
          (acc, chunk) => acc + chunk.length,
          0,
        );
        const data = Buffer.concat(
          chunks.map((c) => Buffer.from(c)),
          totalLength,
        );

        // Build metadata from response
        const metadata = mapS3HeadToMetadata(bucket, path, {
          ContentLength: response.ContentLength,
          ContentType: response.ContentType,
          LastModified: response.LastModified,
          ETag: response.ETag,
        });

        return {
          data,
          metadata,
          contentType: response.ContentType,
        };
      },
      catch: (e) => {
        if (
          e instanceof StorageError ||
          e instanceof FileNotFoundError ||
          e instanceof DownloadError
        ) {
          return e;
        }
        return mapS3ErrorToStorageError(e, "download", bucket, path);
      },
    }).pipe(Effect.mapError(narrowDownloadError));
  }

  /**
   * Delete one or more files from S3
   *
   * @param bucket - The S3 bucket name
   * @param paths - Array of object keys (file paths) to delete
   * @returns Effect.Effect<void, StorageError | DeleteError | FileNotFoundError, never>
   */
  delete(
    bucket: string,
    paths: string[],
  ): Effect.Effect<
    void,
    StorageError | DeleteError | FileNotFoundError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        // For single file, use simple delete
        if (paths.length === 1) {
          const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: paths[0]!,
          });

          await this.s3Client.send(command);
          return;
        }

        // For multiple files, use batch delete
        const command = new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: paths.map((key) => ({ Key: key })),
          },
        });

        const result = await this.s3Client.send(command);

        // Check for errors in batch delete
        if (result.Errors && result.Errors.length > 0) {
          const failedKeys = result.Errors.map((e) => e.Key).filter(
            (k): k is string => k !== undefined,
          );

          throw new DeleteError({
            message: `Some files failed to delete: ${result.Errors.length} errors`,
            bucket,
            paths: failedKeys.length > 0 ? failedKeys : paths,
          });
        }
      },
      catch: (e) => {
        if (
          e instanceof StorageError ||
          e instanceof DeleteError ||
          e instanceof FileNotFoundError
        ) {
          return e;
        }
        // For delete, use first path if available
        return mapS3ErrorToStorageError(e, "delete", bucket, paths[0]);
      },
    }).pipe(
      Effect.mapError((err) => {
        if (
          err instanceof StorageError ||
          err instanceof DeleteError ||
          err instanceof FileNotFoundError
        ) {
          return err;
        }
        // Wrap other errors in StorageError
        return new StorageError({
          message:
            err instanceof Error ? err.message : "Unknown error during delete",
        });
      }),
    );
  }

  /**
   * Create a presigned URL for temporary access to a file
   *
   * @param bucket - The S3 bucket name
   * @param path - The object key (file path within the bucket)
   * @param expiresInSeconds - URL expiration time in seconds
   * @returns Effect.Effect<SignedUrlInfo, StorageError | FileNotFoundError, never>
   */
  createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Effect.Effect<SignedUrlInfo, StorageError | FileNotFoundError, never> {
    return Effect.tryPromise({
      try: async () => {
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: path,
        });

        const signedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: expiresInSeconds,
        });

        const signedUrlInfo: SignedUrlInfo = {
          url: signedUrl,
          expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
          expiresInSeconds,
        };

        return signedUrlInfo;
      },
      catch: (e) => {
        if (e instanceof StorageError || e instanceof FileNotFoundError) {
          return e;
        }
        return mapS3ErrorToStorageError(e, "createSignedUrl", bucket, path);
      },
    }).pipe(Effect.mapError(narrowSignedUrlError));
  }

  /**
   * Fetch file metadata from S3 using HeadObject
   *
   * @param bucket - The S3 bucket name
   * @param path - The object key (file path within the bucket)
   * @returns Effect.Effect<FileMetadata, StorageError | FileNotFoundError, never>
   */
  private fetchFileMetadata(
    bucket: string,
    path: string,
  ): Effect.Effect<FileMetadata, StorageError | FileNotFoundError, never> {
    return Effect.tryPromise({
      try: async () => {
        const command = new HeadObjectCommand({
          Bucket: bucket,
          Key: path,
        });

        const result = await this.s3Client.send(command);

        const metadata = mapS3HeadToMetadata(bucket, path, {
          ContentLength: result.ContentLength,
          ContentType: result.ContentType,
          LastModified: result.LastModified,
          ETag: result.ETag,
        });

        return metadata;
      },
      catch: (e) => {
        if (e instanceof StorageError || e instanceof FileNotFoundError) {
          return e;
        }
        return mapS3ErrorToStorageError(e, "fetchFileMetadata", bucket, path);
      },
    }).pipe(Effect.mapError(narrowSignedUrlError));
  }
}
