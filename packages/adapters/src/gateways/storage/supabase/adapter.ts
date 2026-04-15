/**
 * SupabaseStorageAdapter - StoragePort implementation using Supabase Storage
 *
 * This adapter implements the StoragePort interface using Supabase Storage
 * for file operations. It wraps the Supabase storage client and maps
 * Supabase-specific operations to the domain port interface.
 *
 * Key Design Decisions:
 * - Uses Effect for explicit error handling and composable async operations
 * - Maps Supabase storage errors to domain StorageError types
 * - Thin wrapper with no business logic (just mapping)
 * - Compatible with Effect Layers for dependency injection
 *
 * @module gateways
 */

import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import {
  type StoragePort,
  type FileMetadata,
  type UploadOptions,
  type SignedUrlInfo,
  StorageError,
  FileNotFoundError,
  UploadError,
  BucketNotFoundError,
  DownloadError,
  DeleteError,
} from "@mirai-app/domain/ports/StoragePort";

// =============================================================================
// Error Mapping
// =============================================================================

/**
 * Maps Supabase storage errors to domain StorageError types
 */
function mapSupabaseErrorToStorageError(
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
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // File not found errors
    if (
      message.includes("not found") ||
      message.includes("does not exist") ||
      message.includes("404") ||
      message.includes("object not found")
    ) {
      return new FileNotFoundError({
        message: `File not found during ${operation}: ${error.message}`,
        bucket,
        path: path ?? "unknown",
      });
    }

    // Bucket not found errors
    if (
      message.includes("bucket") &&
      (message.includes("not found") || message.includes("does not exist"))
    ) {
      return new BucketNotFoundError({
        message: `Bucket not found during ${operation}: ${error.message}`,
        bucket,
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
): StorageError | DeleteError {
  if (error instanceof DeleteError) {
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
 * Maps Supabase file object to domain FileMetadata
 */
function mapSupabaseFileToMetadata(
  bucket: string,
  path: string,
  supabaseData: {
    id?: string;
    name?: string;
    size?: number;
    content_type?: string;
    created_at?: string;
    updated_at?: string;
    metadata?: { etag?: string };
  },
): FileMetadata {
  return {
    path: `${bucket}/${path}`,
    bucket,
    size: supabaseData.size ?? 0,
    contentType: supabaseData.content_type,
    createdAt: supabaseData.created_at
      ? new Date(supabaseData.created_at)
      : new Date(),
    updatedAt: supabaseData.updated_at
      ? new Date(supabaseData.updated_at)
      : new Date(),
    etag: supabaseData.metadata?.etag,
  };
}

// =============================================================================
// SupabaseStorageAdapter
// =============================================================================

/**
 * SupabaseStorageAdapter
 *
 * Implements StoragePort using Supabase Storage for file upload, download,
 * delete, and signed URL operations.
 *
 * Compatible with Effect Layers.
 *
 * @example
 * ```typescript
 * // Direct instantiation
 * const storagePort = new SupabaseStorageAdapter(supabaseClient);
 * const metadata = await Effect.runPromise(
 *   storagePort.upload("files", "avatar.png", fileBuffer)
 * );
 * ```
 */
export class SupabaseStorageAdapter implements StoragePort {
  /**
   * Creates a new SupabaseStorageAdapter
   *
   * @param supabase - SupabaseClient instance
   */
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Upload a file to Supabase Storage
   *
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
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
        const uploadOptions: {
          contentType?: string;
          upsert?: boolean;
          cacheControl?: string;
        } = {};

        if (options?.contentType) {
          uploadOptions.contentType = options.contentType;
        }
        if (options?.upsert !== undefined) {
          uploadOptions.upsert = options.upsert;
        }
        if (options?.cacheControl) {
          uploadOptions.cacheControl = options.cacheControl;
        }

        const { data, error } = await this.supabase.storage
          .from(bucket)
          .upload(path, file, uploadOptions);

        if (error) {
          throw mapSupabaseErrorToStorageError(error, "upload", bucket, path);
        }

        if (!data) {
          throw new UploadError({
            message: "Upload completed but no data returned",
            bucket,
            path,
          });
        }

        return { bucket, path, file, options };
      },
      catch: (e) =>
        e instanceof StorageError ||
        e instanceof UploadError ||
        e instanceof BucketNotFoundError
          ? e
          : mapSupabaseErrorToStorageError(e, "upload", bucket, path),
    }).pipe(
      Effect.mapError(narrowUploadError),
      Effect.andThen(({ bucket, path, file, options }) =>
        // Fetch metadata after upload - if it fails, return basic metadata
        Effect.matchEffect(this.fetchFileMetadata(bucket, path), {
          onSuccess: (metadata) => Effect.succeed(metadata),
          onFailure: () =>
            Effect.succeed({
              path: `${bucket}/${path}`,
              bucket,
              size: file instanceof Buffer ? file.length : 0,
              contentType: options?.contentType,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
        }),
      ),
    );
  }

  /**
   * Download a file from Supabase Storage
   *
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @returns Effect.Effect<DownloadResult, StorageError | FileNotFoundError | DownloadError, never>
   */
  download(
    bucket: string,
    path: string,
  ): Effect.Effect<
    import("@mirai-app/use-cases/ports/StoragePort").DownloadResult,
    StorageError | FileNotFoundError | DownloadError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.storage
          .from(bucket)
          .download(path);

        if (error) {
          throw mapSupabaseErrorToStorageError(error, "download", bucket, path);
        }

        if (!data) {
          throw new DownloadError({
            message: "Download completed but no data returned",
            bucket,
            path,
          });
        }

        return { bucket, path, data };
      },
      catch: (e) =>
        e instanceof StorageError ||
        e instanceof FileNotFoundError ||
        e instanceof DownloadError
          ? e
          : mapSupabaseErrorToStorageError(e, "download", bucket, path),
    }).pipe(
      Effect.mapError(narrowDownloadError),
      Effect.andThen(({ bucket, path, data }) =>
        // Fetch metadata for the downloaded file
        Effect.matchEffect(this.fetchFileMetadata(bucket, path), {
          onSuccess: (metadata) =>
            Effect.succeed({
              data,
              metadata,
              contentType: metadata.contentType,
            }),
          onFailure: () =>
            Effect.succeed({
              data,
              metadata: {
                path: `${bucket}/${path}`,
                bucket,
                size: data instanceof Blob ? data.size : 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            }),
        }),
      ),
    );
  }

  /**
   * Delete one or more files from Supabase Storage
   *
   * @param bucket - The bucket name
   * @param paths - Array of file paths to delete
   * @returns Effect.Effect<void, StorageError | DeleteError, never>
   */
  delete(
    bucket: string,
    paths: string[],
  ): Effect.Effect<void, StorageError | DeleteError, never> {
    return Effect.tryPromise({
      try: async () => {
        const { error } = await this.supabase.storage
          .from(bucket)
          .remove(paths);

        if (error) {
          throw mapSupabaseErrorToStorageError(error, "delete", bucket);
        }
      },
      catch: (e) =>
        e instanceof StorageError || e instanceof DeleteError
          ? e
          : mapSupabaseErrorToStorageError(e, "delete", bucket),
    }).pipe(Effect.mapError(narrowDeleteError));
  }

  /**
   * Create a signed URL for temporary access to a file
   *
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
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
        const { data, error } = await this.supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresInSeconds);

        if (error) {
          throw mapSupabaseErrorToStorageError(
            error,
            "createSignedUrl",
            bucket,
            path,
          );
        }

        if (!data?.signedUrl) {
          throw new StorageError({
            message: "Failed to create signed URL: no URL returned",
          });
        }

        const signedUrlInfo: SignedUrlInfo = {
          url: data.signedUrl,
          expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
          expiresInSeconds,
        };

        return signedUrlInfo;
      },
      catch: (e) =>
        e instanceof StorageError || e instanceof FileNotFoundError
          ? e
          : mapSupabaseErrorToStorageError(e, "createSignedUrl", bucket, path),
    }).pipe(Effect.mapError(narrowSignedUrlError));
  }

  /**
   * Fetch file metadata from Supabase Storage
   *
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @returns Effect.Effect<FileMetadata, StorageError | FileNotFoundError, never>
   */
  private fetchFileMetadata(
    bucket: string,
    path: string,
  ): Effect.Effect<FileMetadata, StorageError | FileNotFoundError, never> {
    return Effect.tryPromise({
      try: async () => {
        // List files to get metadata
        const pathParts = path.split("/");
        const folderPath =
          pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";
        const fileName = pathParts[pathParts.length - 1];

        const { data, error } = await this.supabase.storage
          .from(bucket)
          .list(folderPath, {
            search: fileName,
            limit: 1,
          });

        if (error) {
          throw new StorageError({
            message: `Failed to fetch metadata: ${error.message}`,
          });
        }

        if (!data || data.length === 0) {
          throw new FileNotFoundError({
            message: "File metadata not found",
            bucket,
            path,
          });
        }

        const fileData = data[0]!;
        const metadata = mapSupabaseFileToMetadata(bucket, path, {
          id: fileData.id ?? undefined,
          name: fileData.name ?? undefined,
          size: fileData.metadata?.size,
          content_type: fileData.metadata?.mimetype,
          created_at: fileData.created_at ?? undefined,
          updated_at: fileData.updated_at ?? undefined,
          metadata: { etag: fileData.metadata?.eTag },
        });

        return metadata;
      },
      catch: (e) =>
        e instanceof StorageError || e instanceof FileNotFoundError
          ? e
          : new StorageError({
              message: `Failed to fetch metadata: ${e instanceof Error ? e.message : "Unknown error"}`,
            }),
    }).pipe(Effect.mapError(narrowSignedUrlError));
  }
}
