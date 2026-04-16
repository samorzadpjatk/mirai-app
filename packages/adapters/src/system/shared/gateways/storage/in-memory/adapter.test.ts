/**
 * Unit tests for InMemoryStorageAdapter
 *
 * Tests the in-memory implementation of StoragePort for file storage operations.
 * Covers upload, download, delete, signed URL creation, and all test helper methods.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryStorageAdapter } from "./adapter";
import {
  StorageError,
  FileNotFoundError,
  UploadError,
  DownloadError,
  DeleteError,
  BucketNotFoundError,
} from "@mirai-app/use-cases";
import type {
  StoragePort,
  FileMetadata,
  UploadOptions,
  SignedUrlInfo,
  DownloadResult,
} from "@mirai-app/use-cases";

describe("[UNIT] InMemoryStorageAdapter", () => {
  let adapter: InMemoryStorageAdapter;

  beforeEach(() => {
    adapter = new InMemoryStorageAdapter();
  });

  // ============================================================================
  // upload Tests
  // ============================================================================

  describe("upload", () => {
    it("stores file with Buffer data", async () => {
      const fileBuffer = Buffer.from("Hello World");
      const metadata = await Effect.runPromise(
        adapter.upload("files", "test.txt", fileBuffer),
      );

      expect(metadata).toBeDefined();
      expect(metadata.path).toBe("files/test.txt");
      expect(metadata.bucket).toBe("files");
      expect(metadata.size).toBe(11);
      expect(metadata.contentType).toBe("text/plain");
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.updatedAt).toBeInstanceOf(Date);
      expect(metadata.etag).toBeDefined();
    });

    it("stores file with Blob data", async () => {
      const blob = new Blob(["Blob content"], { type: "text/plain" });
      const metadata = await Effect.runPromise(
        adapter.upload("files", "blob.txt", blob),
      );

      expect(metadata).toBeDefined();
      expect(metadata.size).toBe(12);
      expect(metadata.contentType).toBe("text/plain");
    });

    it("uses custom content type from options", async () => {
      const fileBuffer = Buffer.from("{}");
      const metadata = await Effect.runPromise(
        adapter.upload("files", "data.txt", fileBuffer, {
          contentType: "application/json",
        }),
      );

      expect(metadata.contentType).toBe("application/json");
    });

    it("detects content type from file extension", async () => {
      const testCases = [
        { ext: "test.html", expected: "text/html" },
        { ext: "test.css", expected: "text/css" },
        { ext: "test.js", expected: "application/javascript" },
        { ext: "test.json", expected: "application/json" },
        { ext: "test.png", expected: "image/png" },
        { ext: "test.jpg", expected: "image/jpeg" },
        { ext: "test.pdf", expected: "application/pdf" },
      ];

      for (const { ext, expected } of testCases) {
        const buffer = Buffer.from("test");
        const metadata = await Effect.runPromise(
          adapter.upload("files", ext, buffer),
        );
        expect(metadata.contentType).toBe(expected);
      }
    });

    it("allows undefined content type for unknown extensions", async () => {
      const buffer = Buffer.from("test");
      const metadata = await Effect.runPromise(
        adapter.upload("files", "unknown.xyz", buffer),
      );

      expect(metadata.contentType).toBeUndefined();
    });

    it("fails when file exists and upsert is false", async () => {
      const buffer = Buffer.from("original");
      await Effect.runPromise(adapter.upload("files", "conflict.txt", buffer));

      const newBuffer = Buffer.from("new content");
      const result = await Effect.runPromise(
        Effect.either(
          adapter.upload("files", "conflict.txt", newBuffer, { upsert: false }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(UploadError);
        expect(result.left.message).toContain("already exists");
      }
    });

    it("overwrites existing file when upsert is true", async () => {
      const buffer1 = Buffer.from("original");
      await Effect.runPromise(
        adapter.upload("files", "overwrite.txt", buffer1),
      );

      const buffer2 = Buffer.from("updated content");
      const metadata = await Effect.runPromise(
        adapter.upload("files", "overwrite.txt", buffer2, { upsert: true }),
      );

      expect(metadata.size).toBe(15);
      expect(adapter.fileExists("files", "overwrite.txt")).toBe(true);
    });

    it("preserves createdAt when overwriting with upsert", async () => {
      const buffer1 = Buffer.from("original");
      const meta1 = await Effect.runPromise(
        adapter.upload("files", "preserve.txt", buffer1),
      );
      const originalCreatedAt = meta1.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const buffer2 = Buffer.from("updated");
      const meta2 = await Effect.runPromise(
        adapter.upload("files", "preserve.txt", buffer2, { upsert: true }),
      );

      expect(meta2.createdAt).toEqual(originalCreatedAt);
      expect(meta2.updatedAt.getTime()).toBeGreaterThanOrEqual(
        meta1.updatedAt.getTime(),
      );
    });

    it("generates different etags for different content", async () => {
      const buffer1 = Buffer.from("content1");
      const buffer2 = Buffer.from("content2");

      const meta1 = await Effect.runPromise(
        adapter.upload("files", "file1.txt", buffer1),
      );
      const meta2 = await Effect.runPromise(
        adapter.upload("files", "file2.txt", buffer2),
      );

      expect(meta1.etag).not.toBe(meta2.etag);
    });
  });

  // ============================================================================
  // download Tests
  // ============================================================================

  describe("download", () => {
    it("returns file data and metadata for existing file", async () => {
      const content = "Download test content";
      const buffer = Buffer.from(content);
      await Effect.runPromise(
        adapter.upload("files", "download.txt", buffer, {
          contentType: "text/plain",
        }),
      );

      const result = await Effect.runPromise(
        adapter.download("files", "download.txt"),
      );

      expect(result.data.toString()).toBe(content);
      expect(result.metadata.path).toBe("files/download.txt");
      expect(result.metadata.size).toBe(content.length);
      expect(result.contentType).toBe("text/plain");
    });

    it("returns a copy of the buffer (prevents mutation)", async () => {
      const content = "Immutable test";
      const buffer = Buffer.from(content);
      await Effect.runPromise(adapter.upload("files", "immutable.txt", buffer));

      const result1 = await Effect.runPromise(
        adapter.download("files", "immutable.txt"),
      );
      const result2 = await Effect.runPromise(
        adapter.download("files", "immutable.txt"),
      );

      result1.data[0] = 0x41; // 'A'

      expect(result2.data.toString()).toBe(content);
    });

    it("fails with FileNotFoundError for non-existent file", async () => {
      const result = await Effect.runPromise(
        Effect.either(adapter.download("files", "nonexistent.txt")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(FileNotFoundError);
        if (result.left instanceof FileNotFoundError) {
          expect(result.left.bucket).toBe("files");
          expect(result.left.path).toBe("nonexistent.txt");
        }
      }
    });

    it("fails with FileNotFoundError for non-existent bucket", async () => {
      const result = await Effect.runPromise(
        Effect.either(adapter.download("nonexistent", "file.txt")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(FileNotFoundError);
      }
    });

    it("includes correct metadata in download result", async () => {
      const buffer = Buffer.from("metadata test");
      const uploadMeta = await Effect.runPromise(
        adapter.upload("bucket", "path/file.txt", buffer, {
          contentType: "text/plain",
        }),
      );

      const downloadResult = await Effect.runPromise(
        adapter.download("bucket", "path/file.txt"),
      );

      expect(downloadResult.metadata.etag).toBe(uploadMeta.etag);
      expect(downloadResult.metadata.size).toBe(uploadMeta.size);
      expect(downloadResult.metadata.bucket).toBe(uploadMeta.bucket);
    });
  });

  // ============================================================================
  // delete Tests
  // ============================================================================

  describe("delete", () => {
    it("removes single file", async () => {
      const buffer = Buffer.from("to delete");
      await Effect.runPromise(adapter.upload("files", "delete-me.txt", buffer));

      await Effect.runPromise(adapter.delete("files", ["delete-me.txt"]));

      expect(adapter.fileExists("files", "delete-me.txt")).toBe(false);
    });

    it("removes multiple files", async () => {
      await Effect.runPromise(
        adapter.upload("files", "file1.txt", Buffer.from("1")),
      );
      await Effect.runPromise(
        adapter.upload("files", "file2.txt", Buffer.from("2")),
      );
      await Effect.runPromise(
        adapter.upload("files", "file3.txt", Buffer.from("3")),
      );

      await Effect.runPromise(
        adapter.delete("files", ["file1.txt", "file2.txt"]),
      );

      expect(adapter.fileExists("files", "file1.txt")).toBe(false);
      expect(adapter.fileExists("files", "file2.txt")).toBe(false);
      expect(adapter.fileExists("files", "file3.txt")).toBe(true);
    });

    it("fails with FileNotFoundError when file does not exist", async () => {
      const result = await Effect.runPromise(
        Effect.either(adapter.delete("files", ["nonexistent.txt"])),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(FileNotFoundError);
      }
    });

    it("fails when at least one file in batch does not exist", async () => {
      await Effect.runPromise(
        adapter.upload("files", "exists.txt", Buffer.from("exists")),
      );

      const result = await Effect.runPromise(
        Effect.either(
          adapter.delete("files", ["exists.txt", "nonexistent.txt"]),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(FileNotFoundError);
      }
      // File is deleted before the error is thrown for the non-existent file
      expect(adapter.fileExists("files", "exists.txt")).toBe(false);
    });

    it("removes signed URLs when file is deleted", async () => {
      const buffer = Buffer.from("with signed url");
      await Effect.runPromise(adapter.upload("files", "signed.txt", buffer));
      const signedUrlInfo = await Effect.runPromise(
        adapter.createSignedUrl("files", "signed.txt", 3600),
      );

      expect(adapter.validateSignedUrl(signedUrlInfo.url)).toBeDefined();

      await Effect.runPromise(adapter.delete("files", ["signed.txt"]));

      expect(adapter.validateSignedUrl(signedUrlInfo.url)).toBeUndefined();
    });
  });

  // ============================================================================
  // createSignedUrl Tests
  // ============================================================================

  describe("createSignedUrl", () => {
    it("creates signed URL for existing file", async () => {
      const buffer = Buffer.from("signed content");
      await Effect.runPromise(adapter.upload("files", "signed.txt", buffer));

      const signedUrlInfo = await Effect.runPromise(
        adapter.createSignedUrl("files", "signed.txt", 3600),
      );

      expect(signedUrlInfo.url).toMatch(/^inmemory:\/\/files\/signed\.txt/);
      expect(signedUrlInfo.expiresInSeconds).toBe(3600);
      expect(signedUrlInfo.expiresAt).toBeInstanceOf(Date);
      expect(signedUrlInfo.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("generates unique URLs for each call", async () => {
      const buffer = Buffer.from("unique test");
      await Effect.runPromise(adapter.upload("files", "unique.txt", buffer));

      const url1 = await Effect.runPromise(
        adapter.createSignedUrl("files", "unique.txt", 3600),
      );
      const url2 = await Effect.runPromise(
        adapter.createSignedUrl("files", "unique.txt", 3600),
      );

      expect(url1.url).not.toBe(url2.url);
    });

    it("fails with FileNotFoundError for non-existent file", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          adapter.createSignedUrl("files", "nonexistent.txt", 3600),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(FileNotFoundError);
      }
    });

    it("respects custom expiration time", async () => {
      const buffer = Buffer.from("expires");
      await Effect.runPromise(adapter.upload("files", "expires.txt", buffer));

      const oneHour = await Effect.runPromise(
        adapter.createSignedUrl("files", "expires.txt", 3600),
      );
      const oneDay = await Effect.runPromise(
        adapter.createSignedUrl("files", "expires.txt", 86400),
      );

      expect(oneHour.expiresInSeconds).toBe(3600);
      expect(oneDay.expiresInSeconds).toBe(86400);

      const hourDiff = oneHour.expiresAt.getTime() - Date.now();
      const dayDiff = oneDay.expiresAt.getTime() - Date.now();

      expect(dayDiff).toBeGreaterThan(hourDiff);
    });
  });

  // ============================================================================
  // Test Helper Methods
  // ============================================================================

  describe("getFileMetadata", () => {
    it("returns metadata for existing file", async () => {
      const buffer = Buffer.from("metadata helper");
      const uploadMeta = await Effect.runPromise(
        adapter.upload("files", "meta.txt", buffer),
      );

      const metadata = adapter.getFileMetadata("files", "meta.txt");

      expect(metadata).toBeDefined();
      expect(metadata?.path).toBe(uploadMeta.path);
      expect(metadata?.size).toBe(uploadMeta.size);
    });

    it("returns undefined for non-existent file", () => {
      const metadata = adapter.getFileMetadata("files", "nonexistent.txt");
      expect(metadata).toBeUndefined();
    });
  });

  describe("fileExists", () => {
    it("returns true for existing file", async () => {
      await Effect.runPromise(
        adapter.upload("files", "exists.txt", Buffer.from("exists")),
      );

      expect(adapter.fileExists("files", "exists.txt")).toBe(true);
    });

    it("returns false for non-existent file", () => {
      expect(adapter.fileExists("files", "nonexistent.txt")).toBe(false);
    });

    it("returns false for non-existent bucket", () => {
      expect(adapter.fileExists("nonexistent", "file.txt")).toBe(false);
    });
  });

  describe("listFiles", () => {
    it("returns empty array for empty bucket", () => {
      const files = adapter.listFiles("empty-bucket");
      expect(files).toHaveLength(0);
    });

    it("returns all files in bucket", async () => {
      await Effect.runPromise(
        adapter.upload("bucket1", "file1.txt", Buffer.from("1")),
      );
      await Effect.runPromise(
        adapter.upload("bucket1", "file2.txt", Buffer.from("2")),
      );
      await Effect.runPromise(
        adapter.upload("bucket2", "file3.txt", Buffer.from("3")),
      );

      const bucket1Files = adapter.listFiles("bucket1");
      const bucket2Files = adapter.listFiles("bucket2");

      expect(bucket1Files).toHaveLength(2);
      expect(bucket2Files).toHaveLength(1);
      expect(bucket1Files.map((f) => f.path).sort()).toEqual([
        "bucket1/file1.txt",
        "bucket1/file2.txt",
      ]);
    });
  });

  describe("getTotalSize", () => {
    it("returns 0 for empty storage", () => {
      expect(adapter.getTotalSize()).toBe(0);
    });

    it("returns sum of all file sizes", async () => {
      await Effect.runPromise(
        adapter.upload("files", "a.txt", Buffer.from("12345")),
      );
      await Effect.runPromise(
        adapter.upload("files", "b.txt", Buffer.from("67890abc")),
      );

      expect(adapter.getTotalSize()).toBe(13);
    });
  });

  describe("clear", () => {
    it("removes all files", async () => {
      await Effect.runPromise(
        adapter.upload("files", "a.txt", Buffer.from("a")),
      );
      await Effect.runPromise(
        adapter.upload("files", "b.txt", Buffer.from("b")),
      );

      adapter.clear();

      expect(adapter.fileExists("files", "a.txt")).toBe(false);
      expect(adapter.fileExists("files", "b.txt")).toBe(false);
      expect(adapter.getTotalSize()).toBe(0);
    });

    it("clears signed URLs", async () => {
      await Effect.runPromise(
        adapter.upload("files", "signed.txt", Buffer.from("signed")),
      );
      const signedUrl = await Effect.runPromise(
        adapter.createSignedUrl("files", "signed.txt", 3600),
      );

      adapter.clear();

      expect(adapter.validateSignedUrl(signedUrl.url)).toBeUndefined();
    });

    it("resets url counter", async () => {
      await Effect.runPromise(
        adapter.upload("files", "test.txt", Buffer.from("test")),
      );
      await Effect.runPromise(
        adapter.createSignedUrl("files", "test.txt", 3600),
      );

      adapter.clear();
      adapter.createBucket("files");
      await Effect.runPromise(
        adapter.upload("files", "test.txt", Buffer.from("test")),
      );
      const newUrl = await Effect.runPromise(
        adapter.createSignedUrl("files", "test.txt", 3600),
      );

      expect(newUrl.url).toContain("token-1");
    });
  });

  describe("createBucket", () => {
    it("registers bucket without files", () => {
      adapter.createBucket("new-bucket");

      expect(adapter.listFiles("new-bucket")).toHaveLength(0);
    });

    it("does not throw for duplicate bucket creation", () => {
      adapter.createBucket("duplicate");
      expect(() => adapter.createBucket("duplicate")).not.toThrow();
    });
  });

  describe("validateSignedUrl", () => {
    it("returns SignedUrlInfo for valid URL", async () => {
      await Effect.runPromise(
        adapter.upload("files", "valid.txt", Buffer.from("valid")),
      );
      const signedUrl = await Effect.runPromise(
        adapter.createSignedUrl("files", "valid.txt", 3600),
      );

      const validated = adapter.validateSignedUrl(signedUrl.url);

      expect(validated).toBeDefined();
      expect(validated?.url).toBe(signedUrl.url);
      expect(validated?.expiresInSeconds).toBe(3600);
    });

    it("returns undefined for unknown URL", () => {
      const validated = adapter.validateSignedUrl("inmemory://unknown");
      expect(validated).toBeUndefined();
    });

    it("returns undefined for expired URL", async () => {
      await Effect.runPromise(
        adapter.upload("files", "expired.txt", Buffer.from("expired")),
      );
      // Create URL that expires 1 second ago
      const signedUrl = await Effect.runPromise(
        adapter.createSignedUrl("files", "expired.txt", -1),
      );

      const validated = adapter.validateSignedUrl(signedUrl.url);
      expect(validated).toBeUndefined();
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("integration", () => {
    it("supports full file lifecycle", async () => {
      const content = "Full lifecycle test";
      const buffer = Buffer.from(content);

      const uploadMeta = await Effect.runPromise(
        adapter.upload("lifecycle", "test.txt", buffer, {
          contentType: "text/plain",
        }),
      );
      expect(uploadMeta.size).toBe(content.length);

      const downloadResult = await Effect.runPromise(
        adapter.download("lifecycle", "test.txt"),
      );
      expect(downloadResult.data.toString()).toBe(content);

      const signedUrl = await Effect.runPromise(
        adapter.createSignedUrl("lifecycle", "test.txt", 3600),
      );
      expect(adapter.validateSignedUrl(signedUrl.url)).toBeDefined();

      await Effect.runPromise(adapter.delete("lifecycle", ["test.txt"]));
      expect(adapter.fileExists("lifecycle", "test.txt")).toBe(false);
      expect(adapter.validateSignedUrl(signedUrl.url)).toBeUndefined();
    });

    it("supports multiple buckets", async () => {
      await Effect.runPromise(
        adapter.upload("bucket-a", "file.txt", Buffer.from("A")),
      );
      await Effect.runPromise(
        adapter.upload("bucket-b", "file.txt", Buffer.from("B")),
      );

      const downloadA = await Effect.runPromise(
        adapter.download("bucket-a", "file.txt"),
      );
      const downloadB = await Effect.runPromise(
        adapter.download("bucket-b", "file.txt"),
      );

      expect(downloadA.data.toString()).toBe("A");
      expect(downloadB.data.toString()).toBe("B");
    });

    it("maintains isolation between files with same name in different paths", async () => {
      await Effect.runPromise(
        adapter.upload("files", "path1/file.txt", Buffer.from("content1")),
      );
      await Effect.runPromise(
        adapter.upload("files", "path2/file.txt", Buffer.from("content2")),
      );

      const download1 = await Effect.runPromise(
        adapter.download("files", "path1/file.txt"),
      );
      const download2 = await Effect.runPromise(
        adapter.download("files", "path2/file.txt"),
      );

      expect(download1.data.toString()).toBe("content1");
      expect(download2.data.toString()).toBe("content2");
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// This test suite provides comprehensive coverage for the InMemoryStorageAdapter:
//
// **Upload Tests:**
// - Buffer and Blob data storage
// - Custom content types and MIME type detection
// - File extension to MIME type mapping
// - Upsert behavior (allow/disallow overwriting)
// - ETag generation for content identification
// - Preservation of createdAt during updates
//
// **Download Tests:**
// - Successful file retrieval with metadata
// - Buffer immutability (returns copies)
// - FileNotFoundError for missing files/buckets
// - Correct metadata propagation
//
// **Delete Tests:**
// - Single and batch file deletion
// - FileNotFoundError for non-existent files
// - Partial failure handling in batch deletes
// - Automatic signed URL cleanup on delete
//
// **Signed URL Tests:**
// - URL generation with expiration
// - Unique token generation per call
// - URL validation (including expiration checking)
// - FileNotFoundError for non-existent files
//
// **Test Helper Tests:**
// - getFileMetadata retrieval
// - fileExists boolean check
// - listFiles bucket listing
// - getTotalSize storage calculation
// - clear for test cleanup
// - createBucket for test setup
// - validateSignedUrl for test verification
//
// **Integration Tests:**
// - Complete file lifecycle (upload → download → signed URL → delete)
// - Multi-bucket isolation
// - Path-based file isolation
//
// All tests follow the project's testing conventions using bun:test,
// Effect.runPromise for async operations, and Effect.either for error testing.
//
