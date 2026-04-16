import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  StorageController,
  validateCreateUploadUrlInput,
  validateCreateDownloadUrlInput,
  validateCreatePublicUrlInput,
} from "./controller";
import {
  ConfigurationError,
  ServiceUnavailableError,
  NotFoundError,
} from "@mirai-app/domain";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

/**
 * Type for mock storage bucket operations
 */
interface MockBucketOperations {
  createSignedUploadUrl: (
    path: string,
    options?: { upsert?: boolean },
  ) => Promise<{
    data: { token: string } | null;
    error: { message: string } | null;
  }>;
  createSignedUrl: (
    path: string,
    expiresIn: number,
  ) => Promise<{
    data: { signedUrl: string } | null;
    error: { message: string } | null;
  }>;
}

/**
 * Type for mock storage response
 */
interface MockStorageFrom {
  bucket: MockBucketOperations;
}

/**
 * Create a mock Supabase client for storage testing
 */
function createMockSupabaseClient(
  bucketMocks: Map<string, MockBucketOperations> = new Map(),
): SupabaseClient {
  return {
    storage: {
      from: (bucketName: string): MockBucketOperations => {
        const bucket = bucketMocks.get(bucketName);
        if (!bucket) {
          return {
            createSignedUploadUrl: async () => ({
              data: null,
              error: { message: "Bucket not found" },
            }),
            createSignedUrl: async () => ({
              data: null,
              error: { message: "Bucket not found" },
            }),
          };
        }
        return bucket;
      },
    },
  } as unknown as SupabaseClient;
}

/**
 * Create a mock bucket that returns successful responses
 */
function createSuccessMockBucket(bucketName: string): MockBucketOperations {
  return {
    createSignedUploadUrl: async (
      _path: string,
      options?: { upsert?: boolean },
    ) => ({
      data: { token: `token-${bucketName}-12345` },
      error: null,
    }),
    createSignedUrl: async (_path: string, _expiresIn: number) => ({
      data: {
        signedUrl: `https://storage.example.com/${bucketName}/signed/test-file.jpg`,
      },
      error: null,
    }),
  };
}

/**
 * Create a mock bucket that simulates service errors
 */
function createErrorMockBucket(errorMessage: string): MockBucketOperations {
  return {
    createSignedUploadUrl: async () => ({
      data: null,
      error: { message: errorMessage },
    }),
    createSignedUrl: async () => ({
      data: null,
      error: { message: errorMessage },
    }),
  };
}

/**
 * Create a mock bucket that simulates "not found" errors
 */
function createNotFoundMockBucket(): MockBucketOperations {
  return {
    createSignedUploadUrl: async () => ({
      data: null,
      error: { message: "Object not found" },
    }),
    createSignedUrl: async () => ({
      data: null,
      error: { message: "The object does not exist" },
    }),
  };
}

/**
 * Helper to set environment variables for tests
 */
function withEnv<T>(env: Record<string, string>, fn: () => T): T {
  const originalEnv = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    process.env = originalEnv;
  }
}

describe("[UNIT] StorageController", () => {
  let controller: StorageController;
  let mockBucketMocks: Map<string, MockBucketOperations>;

  beforeEach(() => {
    mockBucketMocks = new Map();
    const mockClient = createMockSupabaseClient(mockBucketMocks);
    controller = new StorageController(mockClient);
  });

  describe("createUploadUrl", () => {
    it("creates upload URL for valid public bucket path", async () => {
      mockBucketMocks.set(
        "files-public",
        createSuccessMockBucket("files-public"),
      );

      const result = await withEnv(
        { SUPABASE_URL: "https://test.supabase.co" },
        async () => {
          return await controller.createUploadUrl({
            storagePath: "files-public/test-file.jpg",
            upsert: true,
          });
        },
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe("token-files-public-12345");
        expect(result.data.bucket).toBe("files-public");
        expect(result.data.objectPath).toBe("test-file.jpg");
        expect(result.data.storagePath).toBe("files-public/test-file.jpg");
        expect(result.data.resumableUrl).toContain(
          "storage.supabase.co/storage/v1/upload/resumable/sign",
        );
      }
    });

    it("creates upload URL for avatar path", async () => {
      mockBucketMocks.set("images", createSuccessMockBucket("images"));

      const result = await withEnv(
        { SUPABASE_URL: "https://test.supabase.co" },
        async () => {
          return await controller.createUploadUrl({
            storagePath: "avatar/user-123.jpg",
          });
        },
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bucket).toBe("images");
        expect(result.data.objectPath).toBe("avatar/user-123.jpg");
      }
    });

    it("creates upload URL for challenge image", async () => {
      mockBucketMocks.set("images", createSuccessMockBucket("images"));

      const result = await withEnv(
        { SUPABASE_URL: "https://test.supabase.co" },
        async () => {
          return await controller.createUploadUrl({
            storagePath: "challenge/challenge-123.jpg",
          });
        },
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bucket).toBe("images");
      }
    });

    it("creates upload URL for challenge video", async () => {
      mockBucketMocks.set("videos", createSuccessMockBucket("videos"));

      const result = await withEnv(
        { SUPABASE_URL: "https://test.supabase.co" },
        async () => {
          return await controller.createUploadUrl({
            storagePath: "challenge/challenge-123.mp4",
          });
        },
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bucket).toBe("videos");
      }
    });

    it("returns error for invalid input", async () => {
      const result = await controller.createUploadUrl({
        storagePath: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error for unsupported storage path", async () => {
      const result = await controller.createUploadUrl({
        storagePath: "unknown/path/file.jpg",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unsupported storage reference");
      }
    });

    it("returns error when SUPABASE_URL is not set", async () => {
      mockBucketMocks.set(
        "files-public",
        createSuccessMockBucket("files-public"),
      );

      const result = await withEnv({}, async () => {
        delete process.env.SUPABASE_URL;
        return await controller.createUploadUrl({
          storagePath: "files-public/test.jpg",
        });
      });

      expect(result.success).toBe(false);
    });

    it("returns error when storage service fails", async () => {
      mockBucketMocks.set(
        "files-public",
        createErrorMockBucket("Storage service unavailable"),
      );

      const result = await withEnv(
        { SUPABASE_URL: "https://test.supabase.co" },
        async () => {
          return await controller.createUploadUrl({
            storagePath: "files-public/test.jpg",
          });
        },
      );

      expect(result.success).toBe(false);
    });

    it("returns error when token is missing from response", async () => {
      mockBucketMocks.set("files-public", {
        createSignedUploadUrl: async () => ({
          data: { token: "" },
          error: null,
        }),
        createSignedUrl: async () => ({
          data: null,
          error: { message: "Not implemented" },
        }),
      });

      const result = await withEnv(
        { SUPABASE_URL: "https://test.supabase.co" },
        async () => {
          return await controller.createUploadUrl({
            storagePath: "files-public/test.jpg",
          });
        },
      );

      expect(result.success).toBe(false);
    });
  });

  describe("createDownloadUrl", () => {
    it("creates download URL for valid path", async () => {
      mockBucketMocks.set(
        "files-public",
        createSuccessMockBucket("files-public"),
      );

      const result = await controller.createDownloadUrl({
        storagePath: "files-public/document.pdf",
        expiresInSeconds: 300,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.signedUrl).toContain("signed");
        expect(result.data.expiresAt).toBeDefined();
      }
    });

    it("uses default expiration when not specified", async () => {
      mockBucketMocks.set(
        "files-public",
        createSuccessMockBucket("files-public"),
      );

      const result = await controller.createDownloadUrl({
        storagePath: "files-public/document.pdf",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.signedUrl).toBeDefined();
        expect(result.data.expiresAt).toBeDefined();
      }
    });

    it("returns error for invalid input", async () => {
      const result = await controller.createDownloadUrl({
        storagePath: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error for unsupported storage path", async () => {
      const result = await controller.createDownloadUrl({
        storagePath: "unknown-bucket/file.jpg",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unsupported storage reference");
      }
    });

    it("returns error when object does not exist", async () => {
      mockBucketMocks.set("files-public", createNotFoundMockBucket());

      const result = await controller.createDownloadUrl({
        storagePath: "files-public/non-existent.pdf",
      });

      expect(result.success).toBe(false);
    });

    it("returns error for service failure", async () => {
      mockBucketMocks.set(
        "files-public",
        createErrorMockBucket("Connection timeout"),
      );

      const result = await controller.createDownloadUrl({
        storagePath: "files-public/test.pdf",
      });

      expect(result.success).toBe(false);
    });

    it("returns error when signedUrl is missing from response", async () => {
      mockBucketMocks.set("files-public", {
        createSignedUploadUrl: async () => ({
          data: null,
          error: { message: "Not implemented" },
        }),
        createSignedUrl: async () => ({
          data: { signedUrl: "" },
          error: null,
        }),
      });

      const result = await controller.createDownloadUrl({
        storagePath: "files-public/test.pdf",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createPublicUrl", () => {
    it("creates public URL for files-public bucket", async () => {
      const result = await withEnv(
        {
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_PUBLIC_URL: "https://test.storage.supabase.co",
        },
        async () => {
          return await controller.createPublicUrl({
            storagePath: "files-public/logo.png",
          });
        },
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publicUrl).toContain("files-public/logo.png");
        expect(result.data.publicUrl).toContain("/storage/v1/object/public");
      }
    });

    it("creates public URL using SUPABASE_URL when PUBLIC_URL not set", async () => {
      const result = await withEnv(
        { SUPABASE_URL: "https://test.supabase.co" },
        async () => {
          return await controller.createPublicUrl({
            storagePath: "files-public/logo.png",
          });
        },
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publicUrl).toContain("storage.supabase.co");
      }
    });

    it("returns error for non-public buckets", async () => {
      const result = await withEnv(
        { SUPABASE_URL: "https://test.supabase.co" },
        async () => {
          return await controller.createPublicUrl({
            storagePath: "images/private-file.jpg",
          });
        },
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("files-public bucket");
      }
    });

    it("returns error for invalid input", async () => {
      const result = await controller.createPublicUrl({
        storagePath: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error for unsupported storage path", async () => {
      const result = await controller.createPublicUrl({
        storagePath: "unknown/path/file.jpg",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unsupported storage reference");
      }
    });

    it("returns error when SUPABASE_URL is not set", async () => {
      const result = await withEnv({}, async () => {
        delete process.env.SUPABASE_URL;
        return await controller.createPublicUrl({
          storagePath: "files-public/test.jpg",
        });
      });

      expect(result.success).toBe(false);
    });
  });

  describe("validators", () => {
    describe("validateCreateUploadUrlInput", () => {
      it("validates valid input", () => {
        const result = validateCreateUploadUrlInput({
          storagePath: "files-public/test.jpg",
          upsert: true,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.storagePath).toBe("files-public/test.jpg");
          expect(result.data.upsert).toBe(true);
        }
      });

      it("rejects empty storage path", () => {
        const result = validateCreateUploadUrlInput({
          storagePath: "",
        });

        expect(result.success).toBe(false);
      });

      it("allows optional upsert field", () => {
        const result = validateCreateUploadUrlInput({
          storagePath: "files-public/test.jpg",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.upsert).toBeUndefined();
        }
      });

      it("rejects non-string storage path", () => {
        const result = validateCreateUploadUrlInput({
          storagePath: 123,
        });

        expect(result.success).toBe(false);
      });
    });

    describe("validateCreateDownloadUrlInput", () => {
      it("validates valid input with expiration", () => {
        const result = validateCreateDownloadUrlInput({
          storagePath: "files-public/test.jpg",
          expiresInSeconds: 300,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.storagePath).toBe("files-public/test.jpg");
          expect(result.data.expiresInSeconds).toBe(300);
        }
      });

      it("rejects expiration below minimum", () => {
        const result = validateCreateDownloadUrlInput({
          storagePath: "files-public/test.jpg",
          expiresInSeconds: 30,
        });

        expect(result.success).toBe(false);
      });

      it("rejects expiration above maximum", () => {
        const result = validateCreateDownloadUrlInput({
          storagePath: "files-public/test.jpg",
          expiresInSeconds: 4000,
        });

        expect(result.success).toBe(false);
      });

      it("allows optional expiration field", () => {
        const result = validateCreateDownloadUrlInput({
          storagePath: "files-public/test.jpg",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expiresInSeconds).toBeUndefined();
        }
      });

      it("rejects non-integer expiration", () => {
        const result = validateCreateDownloadUrlInput({
          storagePath: "files-public/test.jpg",
          expiresInSeconds: 300.5,
        });

        expect(result.success).toBe(false);
      });
    });

    describe("validateCreatePublicUrlInput", () => {
      it("validates valid input", () => {
        const result = validateCreatePublicUrlInput({
          storagePath: "files-public/test.jpg",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.storagePath).toBe("files-public/test.jpg");
        }
      });

      it("rejects empty storage path", () => {
        const result = validateCreatePublicUrlInput({
          storagePath: "",
        });

        expect(result.success).toBe(false);
      });

      it("rejects non-string storage path", () => {
        const result = validateCreatePublicUrlInput({
          storagePath: null,
        });

        expect(result.success).toBe(false);
      });
    });
  });
});

/**
 * Summary:
 *
 * This test suite covers the StorageController with comprehensive unit tests:
 *
 * 1. **createUploadUrl**: Tests for valid paths (public bucket, avatar, challenge images/videos),
 *    invalid input validation, unsupported storage paths, missing SUPABASE_URL, and service failures.
 *
 * 2. **createDownloadUrl**: Tests for valid download URLs, default expiration, invalid input,
 *    unsupported paths, missing objects, and service errors.
 *
 * 3. **createPublicUrl**: Tests for public URLs with SUPABASE_PUBLIC_URL or SUPABASE_URL,
 *    rejection of non-public buckets, invalid input handling, and missing environment variables.
 *
 * 4. **Validators**: Tests for input validation schemas (upload, download, public URL) including
 *    edge cases like empty paths, invalid types, and expiration constraints.
 *
 * Mocks:
 * - SupabaseClient with storage.from() operations
 * - Bucket operations (createSignedUploadUrl, createSignedUrl)
 * - Environment variables via withEnv helper
 *
 * Error cases covered:
 * - Invalid input (empty paths, wrong types)
 * - Unsupported storage paths
 * - Missing environment variables
 * - Service unavailable errors
 * - Object not found errors
 * - Missing tokens in responses
 */
