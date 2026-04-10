/**
 * StoragePort - File Storage Port Interface
 *
 * This interface defines file storage operations needed by the use cases layer.
 * It abstracts the storage mechanism, allowing different implementations
 * (Supabase Storage, S3, local filesystem, etc.) in the adapters layer.
 *
 * Key Design Decisions:
 * - Uses Result type for explicit error handling
 * - Supports upload, download, delete, and signed URL operations
 * - Uses Buffer/Blob for file data (implementation-agnostic)
 * - No framework dependencies (pure TypeScript interface)
 * - Async operations return Promises
 *
 * Implementations:
 * - SupabaseStorageAdapter: Uses Supabase Storage
 * - InMemoryStorageAdapter: For testing (stores in memory)
 * - S3StorageAdapter: Uses AWS S3
 * - LocalStorageAdapter: Uses local filesystem
 *
 * @module ports
 */

import type { Result } from "@mirai-app/domain";

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
   * @returns Promise<Result<FileMetadata, StorageError>>
   *
   * @example
   * ```typescript
   * const fileBuffer = Buffer.from("Hello World");
   * const result = await storagePort.upload(
   *   "user-files",
   *   "user-123/avatar.png",
   *   fileBuffer,
   *   { contentType: "image/png", upsert: true }
   * );
   *
   * if (isOk(result)) {
   *   console.log("File uploaded:", result.value.path);
   * } else {
   *   console.error("Upload failed:", result.error.message);
   * }
   * ```
   */
  upload(
    bucket: string,
    path: string,
    file: Buffer | Blob,
    options?: UploadOptions,
  ): Promise<
    Result<FileMetadata, StorageError | UploadError | BucketNotFoundError>
  >;

  /**
   * Download a file from storage
   *
   * @param bucket - The bucket/container name
   * @param path - The file path within the bucket
   * @returns Promise<Result<Buffer | Blob, StorageError>>
   *
   * @example
   * ```typescript
   * const result = await storagePort.download(
   *   "user-files",
   *   "user-123/avatar.png"
   * );
   *
   * if (isOk(result)) {
   *   const fileData = result.value;
   *   // Process file data
   * } else if (result.error instanceof FileNotFoundError) {
   *   console.error("File not found");
   * } else {
   *   console.error("Download failed:", result.error.message);
   * }
   * ```
   */
  download(
    bucket: string,
    path: string,
  ): Promise<Result<Buffer | Blob, StorageError | FileNotFoundError>>;

  /**
   * Delete one or more files from storage
   *
   * @param bucket - The bucket/container name
   * @param paths - Array of file paths to delete
   * @returns Promise<Result<void, StorageError>>
   *
   * @example
   * ```typescript
   * const result = await storagePort.delete(
   *   "user-files",
   *   ["user-123/avatar.png", "user-123/document.pdf"]
   * );
   *
   * if (isOk(result)) {
   *   console.log("Files deleted successfully");
   * } else {
   *   console.error("Delete failed:", result.error.message);
   * }
   * ```
   */
  delete(
    bucket: string,
    paths: string[],
  ): Promise<Result<void, StorageError | FileNotFoundError>>;

  /**
   * Create a signed URL for temporary access to a file
   *
   * @param bucket - The bucket/container name
   * @param path - The file path within the bucket
   * @param expiresInSeconds - URL expiration time in seconds
   * @returns Promise<Result<SignedUrlInfo, StorageError>>
   *
   * @example
   * ```typescript
   * const result = await storagePort.createSignedUrl(
   *   "private-files",
   *   "confidential.pdf",
   *   3600 // 1 hour
   * );
   *
   * if (isOk(result)) {
   *   console.log("Signed URL:", result.value.url);
   *   console.log("Expires at:", result.value.expiresAt);
   * } else {
   *   console.error("Failed to create signed URL:", result.error.message);
   * }
   * ```
   */
  createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<Result<SignedUrlInfo, StorageError | FileNotFoundError>>;
}
