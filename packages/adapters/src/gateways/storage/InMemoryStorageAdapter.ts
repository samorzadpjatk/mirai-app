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
 * - Compatible with awilix-modular dependency injection
 *
 * @module gateways
 */

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
 * Compatible with awilix-modular dependency injection.
 *
 * @example
 * ```typescript
 * // In test setup
 * const container = createTestContainer();
 * container.register({
 *   storagePort: asClass(InMemoryStorageAdapter).singleton(),
 * });
 *
 * // Use in tests
 * const storagePort = container.resolve<InMemoryStorageAdapter>("storagePort");
 *
 * // Upload a file
 * const fileBuffer = Buffer.from("Hello World");
 * const result = await storagePort.upload("files", "test.txt", fileBuffer, {
 *   contentType: "text/plain"
 * });
 *
 * // Download the file
 * const downloadResult = await storagePort.download("files", "test.txt");
 *
 * // Verify
 * expect(downloadResult.kind).toBe("ok");
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
  async upload(
    bucket: string,
    path: string,
    file: Buffer | Blob,
    options?: UploadOptions,
  ): Promise<
    Result<FileMetadata, StorageError | UploadError | BucketNotFoundError>
  > {
    try {
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
      const contentType = options?.contentType ?? this.detectContentType(path);

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
        return err(
          new UploadError({
            message: `File already exists at ${fileKey}. Use upsert option to overwrite.`,
            bucket,
            path,
          }),
        );
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

      return ok(metadata);
    } catch (error) {
      return err(
        new UploadError({
          message: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          bucket,
          path,
        }),
      );
    }
  }

  /**
   * Download a file from in-memory storage
   *
   * Retrieves previously stored file data.
   */
  async download(
    bucket: string,
    path: string,
  ): Promise<Result<Buffer | Blob, StorageError | FileNotFoundError>> {
    try {
      const fileKey = `${bucket}/${path}`;
      const file = this.files.get(fileKey);

      if (!file) {
        return err(
          new FileNotFoundError({
            message: `File not found: ${fileKey}`,
            bucket,
            path,
          }),
        );
      }

      // Return a copy of the buffer to prevent external mutation
      return ok(Buffer.from(file.data));
    } catch (error) {
      return err(
        new StorageError({
          message: `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
    }
  }

  /**
   * Delete one or more files from in-memory storage
   *
   * Removes files from the in-memory store.
   */
  async delete(
    bucket: string,
    paths: string[],
  ): Promise<Result<void, StorageError | FileNotFoundError>> {
    try {
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
        for (const [urlKey, urlInfo] of this.signedUrls) {
          if (urlKey.startsWith(fileKey)) {
            this.signedUrls.delete(urlKey);
          }
        }
      }

      // If any files were not found, return error
      if (notFoundPaths.length > 0) {
        return err(
          new FileNotFoundError({
            message: `Some files were not found: ${notFoundPaths.join(", ")}`,
            bucket,
            path: paths.join(", "),
          }),
        );
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new StorageError({
          message: `Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
    }
  }

  /**
   * Create a signed URL for temporary access to a file
   *
   * Generates a mock signed URL that can be validated against this adapter.
   */
  async createSignedUrl(
    bucket: string,
    path: string,
    expiresInSeconds: number,
  ): Promise<Result<SignedUrlInfo, StorageError | FileNotFoundError>> {
    try {
      const fileKey = `${bucket}/${path}`;
      const file = this.files.get(fileKey);

      if (!file) {
        return err(
          new FileNotFoundError({
            message: `File not found: ${fileKey}`,
            bucket,
            path,
          }),
        );
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

      return ok(signedUrlInfo);
    } catch (error) {
      return err(
        new StorageError({
          message: `Failed to create signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
    }
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
      hash = ((hash << 5) - hash + char) | 0;
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
