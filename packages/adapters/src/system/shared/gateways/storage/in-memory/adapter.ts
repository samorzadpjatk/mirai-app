/**
 * InMemoryStorageAdapter - In-memory implementation of StoragePort for testing
 *
 * This adapter provides an in-memory implementation of the StoragePort interface
 * suitable for unit testing without external services. It stores files in memory
 * using a Map structure, simulating file storage operations.
 *
 * Key Design Decisions:
 * - Pure in-memory implementation - no external dependencies
 * - Uses Buffer for file data storage
 * - Synchronous metadata access, async operations for API compatibility
 * - Thread-safe for single-process tests (Bun test runner)
 * - Supports upload, download, delete, and signed URL operations
 * - Compatible with Effect Layers for dependency injection
 * - Uses Effect for explicit error handling and composable operations
 *
 * @module gateways
 */

import { Effect } from "effect";
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
// In-Memory File Storage
// =============================================================================

/**
 * In-memory file entry
 */
interface InMemoryFile {
  bucket: string;
  path: string;
  data: Buffer;
  metadata: FileMetadata;
  contentType?: string;
}

// =============================================================================
// InMemoryStorageAdapter
// =============================================================================

/**
 * InMemoryStorageAdapter
 *
 * In-memory implementation of StoragePort for testing purposes.
 * Simulates file storage without external dependencies.
 *
 * Compatible with Effect Layers.
 *
 * @example
 * ```typescript
 * // Direct instantiation for testing
 * const storagePort = new InMemoryStorageAdapter();
 *
 * // Upload a file
 * const fileBuffer = Buffer.from("Hello World");
 * const metadata = await Effect.runPromise(
 *   storagePort.upload("files", "test.txt", fileBuffer, {
 *     contentType: "text/plain"
 *   })
 * );
 *
 * // Download the file
 * const downloadResult = await Effect.runPromise(
 *   storagePort.download("files", "test.txt")
 * );
 *
 * // Verify
 * expect(downloadResult.data.toString()).toBe("Hello World");
 * ```
 */
export class InMemoryStorageAdapter implements StoragePort {
  private files: Map<string, InMemoryFile> = new Map();
  private buckets: Set<string> = new Set();
  private signedUrls: Map<string, SignedUrlInfo> = new Map();
  private urlCounter = 0;

  /**
   * Upload a file to in-memory storage
   *
   * Stores the file data and metadata in memory for later retrieval.
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
        let buffer: Buffer;
        if (file instanceof Blob) {
          const arrayBuffer = await file.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        } else {
          buffer = file;
        }

        // Create file key
        const fileKey = `${bucket}/${path}`;

        // Determine content type
        const contentType =
          options?.contentType ?? this.detectContentType(path);

        // Create metadata
        const now = new Date();
        const metadata: FileMetadata = {
          path: fileKey,
          bucket,
          size: buffer.length,
          contentType,
          createdAt: this.files.has(fileKey)
            ? this.files.get(fileKey)!.metadata.createdAt
            : now,
          updatedAt: now,
          etag: this.generateEtag(buffer),
        };

        // Check upsert option
        if (this.files.has(fileKey) && !options?.upsert) {
          throw new UploadError({
            message: `File already exists at ${fileKey}. Use upsert option to overwrite.`,
            bucket,
            path,
          });
        }

        // Store the file
        const inMemoryFile: InMemoryFile = {
          bucket,
          path,
          data: buffer,
          metadata,
          contentType,
        };

        this.files.set(fileKey, inMemoryFile);
        this.buckets.add(bucket);

        return metadata;
      },
      catch: (error) => {
        if (error instanceof UploadError) {
          return error;
        }
        return new UploadError({
          message: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          bucket,
          path,
        });
      },
    });
  }

  /**
   * Download a file from in-memory storage
   *
   * Retrieves previously stored file data.
   */
  download(
    bucket: string,
    path: string,
  ): Effect.Effect<
    DownloadResult,
    StorageError | FileNotFoundError | DownloadError,
    never
  > {
    return Effect.try({
      try: () => {
        const fileKey = `${bucket}/${path}`;
        const file = this.files.get(fileKey);

        if (!file) {
          throw new FileNotFoundError({
            message: `File not found: ${fileKey}`,
            bucket,
            path,
          });
        }

        // Return a copy of the buffer to prevent external mutation
        return {
          data: Buffer.from(file.data),
          metadata: file.metadata,
          contentType: file.contentType,
        };
      },
      catch: (error) => {
        if (error instanceof FileNotFoundError) {
          return error;
        }
        return new DownloadError({
          message: `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          bucket,
          path,
        });
      },
    });
  }

  /**
   * Delete one or more files from in-memory storage
   *
   * Removes files from the in-memory store.
   */
  delete(
    bucket: string,
    paths: string[],
  ): Effect.Effect<
    void,
    StorageError | DeleteError | FileNotFoundError,
    never
  > {
    return Effect.try({
      try: () => {
        const notFoundPaths: string[] = [];

        for (const path of paths) {
          const fileKey = `${bucket}/${path}`;

          if (!this.files.has(fileKey)) {
            notFoundPaths.push(path);
            continue;
          }

          // Remove the file
          this.files.delete(fileKey);

          // Remove any signed URLs for this file
          for (const [urlKey] of this.signedUrls) {
            if (urlKey.startsWith(fileKey)) {
              this.signedUrls.delete(urlKey);
            }
          }
        }

        // If any files were not found, return error
        if (notFoundPaths.length > 0) {
          throw new FileNotFoundError({
            message: `File not found: ${notFoundPaths.join(", ")}`,
            bucket,
            path: notFoundPaths[0]!,
          });
        }
      },
      catch: (error) => {
        if (error instanceof FileNotFoundError) {
          return error;
        }
        if (error instanceof DeleteError) {
          return error;
        }
        return new StorageError({
          message: `Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      },
    });
  }

  /**
   * Create a signed URL for temporary access to a file
   *
   * Generates a mock signed URL that can be validated against this adapter.
   */
  createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Effect.Effect<SignedUrlInfo, StorageError | FileNotFoundError, never> {
    return Effect.try({
      try: () => {
        const fileKey = `${bucket}/${path}`;
        const file = this.files.get(fileKey);

        if (!file) {
          throw new FileNotFoundError({
            message: `File not found: ${fileKey}`,
            bucket,
            path,
          });
        }

        // Generate signed URL
        this.urlCounter++;
        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
        const signedUrlInfo: SignedUrlInfo = {
          url: `inmemory://${bucket}/${path}?token=${this.generateToken()}&expires=${expiresAt.toISOString()}`,
          expiresAt,
          expiresInSeconds,
        };

        // Store the signed URL
        const urlKey = `${fileKey}:${this.urlCounter}`;
        this.signedUrls.set(urlKey, signedUrlInfo);

        return signedUrlInfo;
      },
      catch: (error) => {
        if (error instanceof FileNotFoundError) {
          return error;
        }
        return new StorageError({
          message: `Failed to create signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      },
    });
  }

  /**
   * Get file metadata (for testing verification)
   */
  getFileMetadata(bucket: string, path: string): FileMetadata | undefined {
    const fileKey = `${bucket}/${path}`;
    return this.files.get(fileKey)?.metadata;
  }

  /**
   * Check if a file exists (for testing verification)
   */
  fileExists(bucket: string, path: string): boolean {
    const fileKey = `${bucket}/${path}`;
    return this.files.has(fileKey);
  }

  /**
   * List files in a bucket (for testing verification)
   */
  listFiles(bucket: string): FileMetadata[] {
    const result: FileMetadata[] = [];
    for (const [, file] of this.files) {
      if (file.bucket === bucket) {
        result.push(file.metadata);
      }
    }
    return result;
  }

  /**
   * Get total storage size in bytes (for testing verification)
   */
  getTotalSize(): number {
    let total = 0;
    for (const [, file] of this.files) {
      total += file.data.length;
    }
    return total;
  }

  /**
   * Clear all stored files (for test cleanup)
   */
  clear(): void {
    this.files.clear();
    this.buckets.clear();
    this.signedUrls.clear();
    this.urlCounter = 0;
  }

  /**
   * Create a bucket (for testing setup)
   */
  createBucket(bucket: string): void {
    this.buckets.add(bucket);
  }

  /**
   * Validate a signed URL (for testing verification)
   */
  validateSignedUrl(url: string): SignedUrlInfo | undefined {
    for (const [, info] of this.signedUrls) {
      if (info.url === url) {
        // Check if expired
        if (new Date() > info.expiresAt) {
          return undefined;
        }
        return info;
      }
    }
    return undefined;
  }

  // =============================================================================
  // Private Helpers
  // =============================================================================

  /**
   * Detect content type from file extension
   */
  private detectContentType(path: string): string | undefined {
    const extension = path.split(".").pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      zip: "application/zip",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
    };

    return extension ? mimeTypes[extension] : undefined;
  }

  /**
   * Generate a simple ETag from file data
   */
  private generateEtag(buffer: Buffer): string {
    // Simple hash-like etag for testing
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i];
      if (char !== undefined) {
        hash = ((hash << 5) - hash + char) | 0;
      }
    }
    return `"${Math.abs(hash).toString(16)}"`;
  }

  /**
   * Generate a random token for signed URLs
   */
  private generateToken(): string {
    return `token-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
