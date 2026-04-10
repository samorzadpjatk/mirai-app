/**
 * SupabaseStorageAdapter - StoragePort implementation using Supabase Storage
 *
 * This adapter implements the StoragePort interface using Supabase Storage
 * for file operations. It wraps the Supabase storage client and maps
 * Supabase-specific operations to the domain port interface.
 *
 * Key Design Decisions:
 * - Uses Result type for explicit error handling (no exceptions for expected errors)
 * - Maps Supabase storage errors to domain StorageError types
 * - Thin wrapper with no business logic (just mapping)
 * - Compatible with awilix-modular dependency injection
 *
 * @module gateways
 */

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
} from "@mirai-app/use-cases/ports/StoragePort";
import { type Result, ok, err } from "@mirai-app/domain";

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
): StorageError | FileNotFoundError | UploadError | BucketNotFoundError {
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
 * Compatible with awilix-modular dependency injection.
 * Registered in the DI module with scoped lifetime.
 *
 * @example
 * ```typescript
 * // With DI container (awilix-modular)
 * const storagePort = container.resolve("storagePort");
 * const result = await storagePort.upload("files", "avatar.png", fileBuffer);
 *
 * // Manual instantiation (backward-compatible)
 * const storagePort = new SupabaseStorageAdapter(supabaseClient);
 * const result = await storagePort.download("files", "document.pdf");
 * ```
 */
export class SupabaseStorageAdapter implements StoragePort {
  /**
   * Creates a new SupabaseStorageAdapter
   *
   * @param supabase - SupabaseClient instance (injected by awilix or passed manually)
   */
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Upload a file to Supabase Storage
   *
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @param file - The file data (Buffer or Blob)
   * @param options - Optional upload configuration
   * @returns Promise<Result<FileMetadata, StorageError>>
   */
  async upload(
    bucket: string,
    path: string,
    file: Buffer | Blob,
    options?: UploadOptions,
  ): Promise<
    Result<FileMetadata, StorageError | UploadError | BucketNotFoundError>
  > {
    try {
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
        return err(
          mapSupabaseErrorToStorageError(error, "upload", bucket, path),
        );
      }

      if (!data) {
        return err(
          new UploadError({
            message: "Upload completed but no data returned",
            bucket,
            path,
          }),
        );
      }

      // Fetch metadata after upload
      const metadataResult = await this.fetchFileMetadata(bucket, path);
      if (metadataResult.kind === "ok") {
        return ok(metadataResult.value);
      }

      // Return basic metadata if fetch fails
      return ok({
        path: `${bucket}/${path}`,
        bucket,
        size: file instanceof Buffer ? file.length : 0,
        contentType: options?.contentType,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      return err(mapSupabaseErrorToStorageError(error, "upload", bucket, path));
    }
  }

  /**
   * Download a file from Supabase Storage
   *
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @returns Promise<Result<Buffer | Blob, StorageError>>
   */
  async download(
    bucket: string,
    path: string,
  ): Promise<Result<Buffer | Blob, StorageError | FileNotFoundError>> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        return err(
          mapSupabaseErrorToStorageError(error, "download", bucket, path),
        );
      }

      if (!data) {
        return err(
          new FileNotFoundError({
            message: "Download completed but no data returned",
            bucket,
            path,
          }),
        );
      }

      return ok(data);
    } catch (error) {
      return err(
        mapSupabaseErrorToStorageError(error, "download", bucket, path),
      );
    }
  }

  /**
   * Delete one or more files from Supabase Storage
   *
   * @param bucket - The bucket name
   * @param paths - Array of file paths to delete
   * @returns Promise<Result<void, StorageError>>
   */
  async delete(
    bucket: string,
    paths: string[],
  ): Promise<Result<void, StorageError | FileNotFoundError>> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        return err(mapSupabaseErrorToStorageError(error, "delete", bucket));
      }

      // Check if any files were not found
      if (data && Array.isArray(data)) {
        const notFoundFiles = data.filter(
          (item: { error?: { message?: string } }) =>
            item.error?.message?.toLowerCase().includes("not found"),
        );

        if (notFoundFiles.length > 0) {
          return err(
            new FileNotFoundError({
              message: `Some files were not found: ${notFoundFiles.length} files`,
              bucket,
              path: paths.join(", "),
            }),
          );
        }
      }

      return ok(undefined);
    } catch (error) {
      return err(mapSupabaseErrorToStorageError(error, "delete", bucket));
    }
  }

  /**
   * Create a signed URL for temporary access to a file
   *
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @param expiresInSeconds - URL expiration time in seconds
   * @returns Promise<Result<SignedUrlInfo, StorageError>>
   */
  async createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<Result<SignedUrlInfo, StorageError | FileNotFoundError>> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

      if (error) {
        return err(
          mapSupabaseErrorToStorageError(
            error,
            "createSignedUrl",
            bucket,
            path,
          ),
        );
      }

      if (!data?.signedUrl) {
        return err(
          new StorageError({
            message: "Failed to create signed URL: no URL returned",
          }),
        );
      }

      const signedUrlInfo: SignedUrlInfo = {
        url: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        expiresInSeconds,
      };

      return ok(signedUrlInfo);
    } catch (error) {
      return err(
        mapSupabaseErrorToStorageError(error, "createSignedUrl", bucket, path),
      );
    }
  }

  /**
   * Fetch file metadata from Supabase Storage
   *
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @returns Promise<Result<FileMetadata, StorageError>>
   */
  private async fetchFileMetadata(
    bucket: string,
    path: string,
  ): Promise<Result<FileMetadata, StorageError>> {
    try {
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
        return err(
          new StorageError({
            message: `Failed to fetch metadata: ${error.message}`,
          }),
        );
      }

      if (!data || data.length === 0) {
        return err(
          new FileNotFoundError({
            message: "File metadata not found",
            bucket,
            path,
          }),
        );
      }

      const fileData = data[0];
      const metadata = mapSupabaseFileToMetadata(bucket, path, {
        id: fileData.id,
        name: fileData.name,
        size: fileData.metadata?.size,
        content_type: fileData.metadata?.mimetype,
        created_at: fileData.created_at,
        updated_at: fileData.updated_at,
        metadata: { etag: fileData.metadata?.eTag },
      });

      return ok(metadata);
    } catch (error) {
      return err(
        new StorageError({
          message: `Failed to fetch metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
    }
  }
}
