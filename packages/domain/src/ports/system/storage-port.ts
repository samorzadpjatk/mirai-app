import type { Effect } from "effect";

/**
 * StoragePort - File Storage Port Interface
 *
 * This interface defines file storage operations needed by the use cases layer.
 * It abstracts the storage mechanism, allowing different implementations
 * (Supabase Storage, S3, local filesystem, etc.) in the adapters layer.
 */

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
 */
export interface StoragePort {
  /**
   * Upload a file to storage
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
   */
  delete(
    bucket: string,
    paths: string[],
  ): Effect.Effect<void, StorageError | DeleteError | FileNotFoundError, never>;

  /**
   * Create a signed URL for temporary access to a file
   */
  createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Effect.Effect<SignedUrlInfo, StorageError | FileNotFoundError, never>;
}
