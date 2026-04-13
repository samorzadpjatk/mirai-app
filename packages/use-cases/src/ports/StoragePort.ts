/**
 * StoragePort - File Storage Port Interface
 *
 * This interface defines file storage operations needed by the use cases layer.
 * It abstracts the storage mechanism, allowing different implementations
 * (Supabase Storage, S3, local filesystem, etc.) in the adapters layer.
 *
 * Key Design Decisions:
 * - Uses Effect for explicit error handling and composable async operations
 * - Supports upload, download, delete, and signed URL operations
 * - Uses Buffer/Blob for file data (implementation-agnostic)
 * - No framework dependencies (pure TypeScript interface, except Effect types)
 * - Operations return Effect for composability
 *
 * Implementations:
 * - SupabaseStorageAdapter: Uses Supabase Storage
 * - InMemoryStorageAdapter: For testing (stores in memory)
 * - S3StorageAdapter: Uses AWS S3
 * - LocalStorageAdapter: Uses local filesystem
 *
 * @module ports
 */

import { Context, Effect } from "effect";

// =============================================================================
// Domain Errors
// =============================================================================

/**
 * Base error for storage operation failures
 */
export class StorageError extends Error {
  readonly _tag = "StorageError" as const;
  readonly code = "STORAGE_ERROR" as const;
  override readonly message: string;

  constructor(props: { message: string }) {
    super(props.message);
    this.message = props.message;
  }
}

/**
 * Error thrown when a file is not found
 */
export class FileNotFoundError extends Error {
  readonly _tag = "FileNotFoundError" as const;
  readonly code = "FILE_NOT_FOUND" as const;
  readonly bucket: string;
  readonly path: string;
  override readonly message: string;

  constructor(props: { message: string; bucket: string; path: string }) {
    super(props.message);
    this.message = props.message;
    this.bucket = props.bucket;
    this.path = props.path;
  }
}

/**
 * Error thrown when upload fails
 */
export class UploadError extends Error {
  readonly _tag = "UploadError" as const;
  readonly code = "UPLOAD_ERROR" as const;
  readonly bucket: string;
  readonly path: string;
  override readonly message: string;

  constructor(props: { message: string; bucket: string; path: string }) {
    super(props.message);
    this.message = props.message;
    this.bucket = props.bucket;
    this.path = props.path;
  }
}

/**
 * Error thrown when download fails
 */
export class DownloadError extends Error {
  readonly _tag = "DownloadError" as const;
  readonly code = "DOWNLOAD_ERROR" as const;
  readonly bucket: string;
  readonly path: string;
  override readonly message: string;

  constructor(props: { message: string; bucket: string; path: string }) {
    super(props.message);
    this.message = props.message;
    this.bucket = props.bucket;
    this.path = props.path;
  }
}

/**
 * Error thrown when delete fails
 */
export class DeleteError extends Error {
  readonly _tag = "DeleteError" as const;
  readonly code = "DELETE_ERROR" as const;
  readonly bucket: string;
  readonly paths: string[];
  override readonly message: string;

  constructor(props: { message: string; bucket: string; paths: string[] }) {
    super(props.message);
    this.message = props.message;
    this.bucket = props.bucket;
    this.paths = props.paths;
  }
}

/**
 * Error thrown when bucket does not exist or is not accessible
 */
export class BucketNotFoundError extends Error {
  readonly _tag = "BucketNotFoundError" as const;
  readonly code = "BUCKET_NOT_FOUND" as const;
  readonly bucket: string;
  override readonly message: string;

  constructor(props: { message: string; bucket: string }) {
    super(props.message);
    this.message = props.message;
    this.bucket = props.bucket;
  }
}

// =============================================================================
// Domain Types
// =============================================================================

/**
 * Metadata for a stored file
 */
export interface FileMetadata {
  /** Full path to the file */
  path: string;
  /** Bucket name */
  bucket: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  contentType?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modified timestamp */
  updatedAt: Date;
  /** ETag or checksum */
  etag?: string;
}

/**
 * Options for upload operations
 */
export interface UploadOptions {
  /** Content type/MIME type */
  contentType?: string;
  /** Whether to overwrite existing file */
  upsert?: boolean;
  /** Cache control headers */
  cacheControl?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Signed URL with expiration information
 */
export interface SignedUrlInfo {
  /** The signed URL */
  url: string;
  /** When the URL expires */
  expiresAt: Date;
  /** URL expiration in seconds from creation */
  expiresInSeconds: number;
}

/**
 * Storage configuration options
 */
export interface StorageConfig {
  /** Default bucket name */
  defaultBucket: string;
  /** Region for storage */
  region?: string;
  /** Endpoint URL (for S3-compatible services) */
  endpoint?: string;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Allowed MIME types */
  allowedContentTypes?: string[];
}

/**
 * Result of a download operation
 */
export interface DownloadResult {
  /** File data */
  data: Buffer | Blob;
  /** File metadata */
  metadata: FileMetadata;
  /** Content type */
  contentType?: string;
}

// =============================================================================
// Port Interface
// =============================================================================

/**
 * StoragePort defines the contract for file storage operations
 *
 * This port abstracts the storage mechanism from the use cases,
 * enabling different implementations without changing business logic.
 */
export interface StoragePort {
  /**
   * Upload a file to storage
   *
   * @param bucket - The bucket/container name
   * @param path - The file path within the bucket
   * @param file - The file data (Buffer or Blob)
   * @param options - Optional upload configuration
   * @returns Effect.Effect<FileMetadata, StorageError | UploadError | BucketNotFoundError, never>
   *
   * @example
   * ```typescript
   * const fileBuffer = Buffer.from("Hello World");
   * const metadata = await Effect.runPromise(
   *   storagePort.upload(
   *     "user-files",
   *     "user-123/avatar.png",
   *     fileBuffer,
   *     { contentType: "image/png", upsert: true }
   *   )
   * );
   *
   * console.log("File uploaded:", metadata.path);
   * ```
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
  >;

  /**
   * Download a file from storage
   *
   * @param bucket - The bucket/container name
   * @param path - The file path within the bucket
   * @returns Effect.Effect<DownloadResult, StorageError | FileNotFoundError | DownloadError, never>
   *
   * @example
   * ```typescript
   * const downloadResult = await Effect.runPromise(
   *   storagePort.download("user-files", "user-123/avatar.png")
   * );
   *
   * const fileData = downloadResult.data;
   * // Process file data
   * ```
   */
  download(
    bucket: string,
    path: string,
  ): Effect.Effect<
    DownloadResult,
    StorageError | FileNotFoundError | DownloadError,
    never
  >;

  /**
   * Delete one or more files from storage
   *
   * @param bucket - The bucket/container name
   * @param paths - Array of file paths to delete
   * @returns Effect.Effect<void, StorageError | DeleteError, never>
   *
   * @example
   * ```typescript
   * await Effect.runPromise(
   *   storagePort.delete("user-files", ["user-123/avatar.png", "user-123/document.pdf"])
   * );
   *
   * console.log("Files deleted successfully");
   * ```
   */
  delete(
    bucket: string,
    paths: string[],
  ): Effect.Effect<void, StorageError | DeleteError, never>;

  /**
   * Create a signed URL for temporary access to a file
   *
   * @param bucket - The bucket/container name
   * @param path - The file path within the bucket
   * @param expiresInSeconds - URL expiration time in seconds
   * @returns Effect.Effect<SignedUrlInfo, StorageError | FileNotFoundError, never>
   *
   * @example
   * ```typescript
   * const signedUrlInfo = await Effect.runPromise(
   *   storagePort.createSignedUrl("private-files", "confidential.pdf", 3600) // 1 hour
   * );
   *
   * console.log("Signed URL:", signedUrlInfo.url);
   * console.log("Expires at:", signedUrlInfo.expiresAt);
   * ```
   */
  createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Effect.Effect<SignedUrlInfo, StorageError | FileNotFoundError, never>;
}

/**
 * StoragePort Context.Tag for Effect dependency injection
 */
export class StoragePortTag extends Context.Tag("StoragePort")<
  StoragePortTag,
  {
    upload: (
      bucket: string,
      path: string,
      file: Buffer | Blob,
      options?: UploadOptions,
    ) => Effect.Effect<
      FileMetadata,
      StorageError | UploadError | BucketNotFoundError,
      never
    >;
    download: (
      bucket: string,
      path: string,
    ) => Effect.Effect<
      DownloadResult,
      StorageError | FileNotFoundError | DownloadError,
      never
    >;
    delete: (
      bucket: string,
      paths: string[],
    ) => Effect.Effect<void, StorageError | DeleteError, never>;
    createSignedUrl: (
      bucket: string,
      path: string,
      expiresInSeconds: number,
    ) => Effect.Effect<SignedUrlInfo, StorageError | FileNotFoundError, never>;
  }
>() {}
