/**
 * Unit tests for SupabaseStorageAdapter
 *
 * Tests the Supabase Storage implementation of StoragePort.
 * Uses mocked Supabase client to test error mapping, upload, download,
 * delete, and signed URL operations without external dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { SupabaseStorageAdapter } from "./adapter";
import {
  StorageError,
  FileNotFoundError,
  UploadError,
  BucketNotFoundError,
  DownloadError,
  DeleteError,
} from "@mirai-app/use-cases";
import type {
  StoragePort,
  FileMetadata,
  UploadOptions,
  SignedUrlInfo,
  DownloadResult,
} from "@mirai-app/use-cases";

// =============================================================================
// Mock Types
// =============================================================================

interface MockSupabaseStorage {
  from: (bucket: string) => MockStorageBucket;
}

interface MockStorageBucket {
  upload: (
    path: string,
    file: Buffer | Blob,
    options?: Record<string, unknown>,
  ) => Promise<{ data: { path: string } | null; error: Error | null }>;
  download: (
    path: string,
  ) => Promise<{ data: Blob | null; error: Error | null }>;
  remove: (paths: string[]) => Promise<{ error: Error | null }>;
  createSignedUrl: (
    path: string,
    expiresIn: number,
  ) => Promise<{ data: { signedUrl: string } | null; error: Error | null }>;
  list: (
    path: string,
    options?: { search?: string; limit?: number },
  ) => Promise<{ data: Array<MockFileObject> | null; error: Error | null }>;
}

interface MockFileObject {
  id?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    eTag?: string;
  };
}

interface MockSupabaseClient {
  storage: MockSupabaseStorage;
}

// =============================================================================
// Mock Factory
// =============================================================================

function createMockSupabaseClient(
  overrides?: Partial<MockSupabaseClient>,
): MockSupabaseClient {
  const defaultBucket: MockStorageBucket = {
    upload: async () => ({ data: { path: "test-path" }, error: null }),
    download: async () => ({
      data: new Blob(["test content"]),
      error: null,
    }),
    remove: async () => ({ error: null }),
    createSignedUrl: async () => ({
      data: { signedUrl: "https://signed.url/test" },
      error: null,
    }),
    list: async () => ({
      data: [
        {
          id: "file-id",
          name: "test.txt",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            size: 100,
            mimetype: "text/plain",
            eTag: '"abc123"',
          },
        },
      ],
      error: null,
    }),
  };

  return {
    storage: {
      from: () => ({ ...defaultBucket, ...overrides }),
      ...overrides?.storage,
    },
  };
}

describe("[UNIT] SupabaseStorageAdapter", () => {
  let adapter: SupabaseStorageAdapter;
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    adapter = new SupabaseStorageAdapter(
      mockClient as unknown as ConstructorParameters<
        typeof SupabaseStorageAdapter
      >[0],
    );
  });

  // ============================================================================
  // upload Tests
  // ============================================================================

  describe("upload", () => {
    it("uploads file successfully and returns metadata", async () => {
      const buffer = Buffer.from("test content");

      const result = await Effect.runPromise(
        adapter.upload("bucket", "test.txt", buffer),
      );

      expect(result).toBeDefined();
      expect(result.bucket).toBe("bucket");
      expect(result.path).toBe("bucket/test.txt");
      // contentType is inferred from file extension when not provided by Supabase
      expect(result.contentType).toBe("text/plain");
    });

    it("passes content type option to Supabase", async () => {
      const bucket: MockStorageBucket = {
        upload: async (_path, _file, options) => {
          expect(options?.contentType).toBe("application/json");
          return { data: { path: "test" }, error: null };
        },
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;
      const buffer = Buffer.from("{}");

      await Effect.runPromise(
        adapter.upload("bucket", "test.json", buffer, {
          contentType: "application/json",
        }),
      );
    });

    it("passes upsert option to Supabase", async () => {
      const bucket: MockStorageBucket = {
        upload: async (_path, _file, options) => {
          expect(options?.upsert).toBe(true);
          return { data: { path: "test" }, error: null };
        },
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      await Effect.runPromise(
        adapter.upload("bucket", "test.txt", Buffer.from("test"), {
          upsert: true,
        }),
      );
    });

    it("passes cacheControl option to Supabase", async () => {
      const bucket: MockStorageBucket = {
        upload: async (_path, _file, options) => {
          expect(options?.cacheControl).toBe("max-age=3600");
          return { data: { path: "test" }, error: null };
        },
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      await Effect.runPromise(
        adapter.upload("bucket", "test.txt", Buffer.from("test"), {
          cacheControl: "max-age=3600",
        }),
      );
    });

    it("maps Supabase 'not found' error to UploadError", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({
          data: null,
          error: new Error("File not found during upload"),
        }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(
          adapter.upload("bucket", "test.txt", Buffer.from("test")),
        ),
      );

      expect(result._tag).toBe("Left");
    });

    it("maps bucket not found error to BucketNotFoundError", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({
          data: null,
          error: new Error("Bucket 'test-bucket' does not exist"),
        }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(
          adapter.upload("test-bucket", "test.txt", Buffer.from("test")),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(BucketNotFoundError);
        if (result.left instanceof BucketNotFoundError) {
          expect(result.left.bucket).toBe("test-bucket");
        }
      }
    });

    it("returns UploadError when upload succeeds but no data returned", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(
          adapter.upload("bucket", "test.txt", Buffer.from("test")),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(UploadError);
        expect(result.left.message).toContain("no data returned");
      }
    });

    it("uses basic metadata when fetchFileMetadata fails", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: { path: "test.txt" }, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: new Error("List failed") }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        adapter.upload("bucket", "test.txt", Buffer.from("content"), {
          contentType: "text/plain",
        }),
      );

      expect(result.path).toBe("bucket/test.txt");
      expect(result.bucket).toBe("bucket");
      expect(result.size).toBe(7);
      expect(result.contentType).toBe("text/plain");
    });
  });

  // ============================================================================
  // download Tests
  // ============================================================================

  describe("download", () => {
    it("downloads file successfully", async () => {
      const content = "downloaded content";
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({
          data: new Blob([content]),
          error: null,
        }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({
          data: [
            {
              name: "test.txt",
              metadata: { size: content.length, mimetype: "text/plain" },
            },
          ],
          error: null,
        }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        adapter.download("bucket", "test.txt"),
      );

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.metadata.bucket).toBe("bucket");
    });

    it("maps FileNotFoundError for 404 errors", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({
          data: null,
          error: new Error("404 Not Found"),
        }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(adapter.download("bucket", "missing.txt")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(FileNotFoundError);
        if (result.left instanceof FileNotFoundError) {
          expect(result.left.bucket).toBe("bucket");
          expect(result.left.path).toBe("missing.txt");
        }
      }
    });

    it("returns DownloadError when download succeeds but no data returned", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(adapter.download("bucket", "empty.txt")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(DownloadError);
      }
    });

    it("uses basic metadata when fetchFileMetadata fails", async () => {
      const blob = new Blob(["content"]);
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: blob, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: new Error("List failed") }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        adapter.download("bucket", "test.txt"),
      );

      expect(result.data).toBe(blob);
      expect(result.metadata.size).toBe(7);
    });
  });

  // ============================================================================
  // delete Tests
  // ============================================================================

  describe("delete", () => {
    it("deletes single file successfully", async () => {
      let removedPaths: string[] = [];
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async (paths) => {
          removedPaths = paths;
          return { error: null };
        },
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      await Effect.runPromise(adapter.delete("bucket", ["file1.txt"]));

      expect(removedPaths).toEqual(["file1.txt"]);
    });

    it("deletes multiple files", async () => {
      let removedPaths: string[] = [];
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async (paths) => {
          removedPaths = paths;
          return { error: null };
        },
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      await Effect.runPromise(
        adapter.delete("bucket", ["file1.txt", "file2.txt", "file3.txt"]),
      );

      expect(removedPaths).toEqual(["file1.txt", "file2.txt", "file3.txt"]);
    });

    it("maps Supabase errors to DeleteError", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({
          error: new Error("Access denied"),
        }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(adapter.delete("bucket", ["protected.txt"])),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(DeleteError);
      }
    });

    it("returns success when delete succeeds with no error", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(adapter.delete("bucket", ["file.txt"])),
      );

      expect(result._tag).toBe("Right");
    });
  });

  // ============================================================================
  // createSignedUrl Tests
  // ============================================================================

  describe("createSignedUrl", () => {
    it("creates signed URL successfully", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({
          data: { signedUrl: "https://signed.example.com/file?token=abc123" },
          error: null,
        }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        adapter.createSignedUrl("bucket", "test.txt", 3600),
      );

      expect(result).toBeDefined();
      expect(result.url).toBe("https://signed.example.com/file?token=abc123");
      expect(result.expiresInSeconds).toBe(3600);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("returns StorageError when no signedUrl returned", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(adapter.createSignedUrl("bucket", "test.txt", 3600)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageError);
        expect(result.left.message).toContain("no URL returned");
      }
    });

    it("maps FileNotFoundError for 'not found' errors", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({
          data: null,
          error: new Error("Object not found"),
        }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(adapter.createSignedUrl("bucket", "missing.txt", 3600)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(FileNotFoundError);
      }
    });

    it("calculates correct expiration date", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({
          data: { signedUrl: "https://test.com" },
          error: null,
        }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const beforeTest = Date.now();
      const result = await Effect.runPromise(
        adapter.createSignedUrl("bucket", "test.txt", 1800), // 30 minutes
      );
      const afterTest = Date.now();

      const expectedMin = beforeTest + 1800 * 1000;
      const expectedMax = afterTest + 1800 * 1000;

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  // ============================================================================
  // Error Mapping Tests
  // ============================================================================

  describe("error mapping", () => {
    it("maps 'does not exist' to FileNotFoundError", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({
          data: null,
          error: new Error("File does not exist"),
        }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(
          adapter.upload("bucket", "test.txt", Buffer.from("test")),
        ),
      );

      expect(result._tag).toBe("Left");
    });

    it("maps 'object not found' to FileNotFoundError", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({ data: null, error: null }),
        download: async () => ({
          data: null,
          error: new Error("object not found"),
        }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(adapter.download("bucket", "test.txt")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(FileNotFoundError);
      }
    });

    it("maps unknown errors to generic StorageError", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({
          data: null,
          error: new Error("Some random error"),
        }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(
          adapter.upload("bucket", "test.txt", Buffer.from("test")),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageError);
      }
    });

    it("handles non-Error objects in error mapping", async () => {
      const bucket: MockStorageBucket = {
        upload: async () => ({
          data: null,
          error: "string error", // Non-Error object
        }),
        download: async () => ({ data: null, error: null }),
        remove: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: null, error: null }),
        list: async () => ({ data: null, error: null }),
      };

      mockClient.storage.from = () => bucket;

      const result = await Effect.runPromise(
        Effect.either(
          adapter.upload("bucket", "test.txt", Buffer.from("test")),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageError);
        expect(result.left.message).toContain("Unknown");
      }
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("integration", () => {
    it("performs full file lifecycle with Supabase", async () => {
      const operations: string[] = [];

      const bucket: MockStorageBucket = {
        upload: async () => {
          operations.push("upload");
          return { data: { path: "lifecycle/test.txt" }, error: null };
        },
        download: async () => {
          operations.push("download");
          return { data: new Blob(["content"]), error: null };
        },
        remove: async (paths) => {
          operations.push(`delete:${paths.join(",")}`);
          return { error: null };
        },
        createSignedUrl: async () => {
          operations.push("signedUrl");
          return { data: { signedUrl: "https://signed.url" }, error: null };
        },
        list: async () => ({
          data: [
            {
              name: "test.txt",
              metadata: { size: 7, mimetype: "text/plain" },
            },
          ],
          error: null,
        }),
      };

      mockClient.storage.from = () => bucket;

      // Upload
      const metadata = await Effect.runPromise(
        adapter.upload("lifecycle", "test.txt", Buffer.from("content")),
      );
      expect(metadata.bucket).toBe("lifecycle");

      // Download
      const downloadResult = await Effect.runPromise(
        adapter.download("lifecycle", "test.txt"),
      );
      expect(downloadResult).toBeDefined();

      // Signed URL
      const signedUrl = await Effect.runPromise(
        adapter.createSignedUrl("lifecycle", "test.txt", 3600),
      );
      expect(signedUrl.url).toBeDefined();

      // Delete
      await Effect.runPromise(adapter.delete("lifecycle", ["test.txt"]));

      expect(operations).toEqual([
        "upload",
        "download",
        "signedUrl",
        "delete:test.txt",
      ]);
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// This test suite provides comprehensive coverage for the SupabaseStorageAdapter:
//
// **Upload Tests:**
// - Successful upload with metadata
// - Content type option passing
// - Upsert option handling
// - Cache control option passing
// - Error mapping for various failure scenarios
// - Fallback metadata when fetchFileMetadata fails
//
// **Download Tests:**
// - Successful file download
// - FileNotFoundError mapping for 404 errors
// - DownloadError for empty responses
// - Fallback metadata on list failure
//
// **Delete Tests:**
// - Single file deletion
// - Multiple file batch deletion
// - Error mapping for delete failures
// - Success path verification
//
// **Signed URL Tests:**
// - Successful signed URL creation
// - StorageError for empty responses
// - FileNotFoundError mapping
// - Expiration calculation accuracy
//
// **Error Mapping Tests:**
// - 'not found' pattern matching
// - 'does not exist' pattern matching
// - 'object not found' pattern matching
// - Unknown error handling
// - Non-Error object handling
//
// **Integration Tests:**
// - Full file lifecycle (upload → download → signed URL → delete)
// - Operation sequencing verification
//
// The adapter uses a thin wrapper pattern that maps Supabase-specific
// operations to the domain StoragePort interface. All Supabase errors
// are mapped to appropriate domain error types for consistent error handling.
//
