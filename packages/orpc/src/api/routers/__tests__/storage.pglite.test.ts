import type { DB, User } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import { ORPCError } from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import { env } from "bun";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createContext, createMockSupabase, seedUser } from "../../../test-helpers";
import type { RequestContext } from "../../orpc";
import { storageRouter } from "../../routers/storage";

vi.mock("../../../utils/storage", () => ({
  normalizeSupabaseStoragePath: vi.fn().mockImplementation((value: string) => {
    if (!value) return null;
    if (value.startsWith("http")) return null;
    if (value.startsWith("images/")) {
      return { bucket: "images", path: value.replace("images/", ""), storagePath: value };
    }
    if (value.startsWith("files-public/")) {
      return {
        bucket: "files-public",
        path: value.replace("files-public/", ""),
        storagePath: value,
      };
    }
    return { bucket: "images", path: value, storagePath: `images/${value}` };
  }),
  parseSupabaseStorageObject: vi.fn(),
  parseSupabaseStoragePath: vi.fn(),
  SUPABASE_OBJECT_PREFIXES: new Set(["public", "sign", "authenticated"]),
  IMAGE_BUCKET: "images",
  VIDEO_BUCKET: "videos",
  PUBLIC_BUCKET: "files-public",
}));

vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: "user-123", email: "test@example.com" },
    dbUser: {
      id: "user-123",
      authUserId: "auth-123",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      hasAvatar: false,
      lastSeenOn: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }),
}));

const createCaller = (ctx: RequestContext) => createRouterClient(storageRouter, { context: ctx });

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "User",
  role: "USER",
  hasAvatar: false,
  lastSeenOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("storageRouter", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await testDb.reset();

    // Reset environment variables
    process.env.SUPABASE_URL = "https://test.supabase.co";
    delete process.env.SUPABASE_PUBLIC_URL;

    mockUser = createMockUser({ id: "user-123" });

    // Seed user for auth (the router uses protectedProcedure)
    await seedUser(
      testDb.db,
      mockUser.id,
      mockUser.authUserId,
      mockUser.firstName,
      mockUser.lastName,
    );

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-123", email: "test@example.com" } },
            error: null,
          }),
        },
      },
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://signed-url.example.com/file.jpg" },
            error: null,
          }),
          createSignedUploadUrl: vi.fn().mockResolvedValue({
            data: { token: "upload-token-123" },
            error: null,
          }),
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } satisfies SupabaseClient;
  });

  afterEach(() => {
    if (originalEnv.SUPABASE_URL) {
      process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
    } else {
      delete process.env.SUPABASE_URL;
    }
    if (originalEnv.SUPABASE_PUBLIC_URL) {
      process.env.SUPABASE_PUBLIC_URL = originalEnv.SUPABASE_PUBLIC_URL;
    } else {
      delete process.env.SUPABASE_PUBLIC_URL;
    }
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  // Helper to create authenticated context
  const createAuthContext = (user: User, token = "test-token"): RequestContext => ({
    db: testDb.db,
    supabase: mockSupabase,
    headers: new Headers({ Authorization: `Bearer ${token}` }),
    accessToken: token,
    user: { id: user.authUserId || "auth-123" },
    dbUser: user,
  });

  describe("createUploadUrl", () => {
    it("should create upload URL for valid storage path", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createUploadUrl({
        storagePath: "images/test-image.jpg",
      });

      expect(result.token).toBe("upload-token-123");
      expect(result.bucket).toBe("images");
      expect(result.objectPath).toBe("test-image.jpg");
      expect(result.storagePath).toBe("images/test-image.jpg");
      expect(result.resumableUrl).toContain("storage.supabase.co");
    });

    it("should create upload URL with upsert option", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createUploadUrl({
        storagePath: "images/test-image.jpg",
        upsert: true,
      });

      expect(result.token).toBe("upload-token-123");

      expect(mockSupabase.storage.from).toHaveBeenCalledWith("images");
    });

    it("should throw BAD_REQUEST for invalid storage path", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValueOnce(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createUploadUrl({
          storagePath: "invalid-path",
        }),
      ).rejects.toThrow(ORPCError);
    });

    it("should throw INTERNAL_SERVER_ERROR when upload URL creation fails", async () => {
      mockSupabase = {
        ...mockSupabase,
        storage: {
          from: vi.fn().mockReturnValue({
            createSignedUploadUrl: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Storage error" },
            }),
          }),
        },
      } satisfies SupabaseClient;

      const ctx = createAuthContext(mockUser);
      ctx.supabase = mockSupabase;
      const caller = createCaller(ctx);

      await expect(
        caller.createUploadUrl({
          storagePath: "images/test-image.jpg",
        }),
      ).rejects.toThrow(ORPCError);
    });

    it("should throw INTERNAL_SERVER_ERROR when SUPABASE_URL is missing", async () => {
      delete env.SUPABASE_URL;

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createUploadUrl({
          storagePath: "images/test-image.jpg",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("createDownloadUrl", () => {
    it("should create download URL with default expiration", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createDownloadUrl({
        storagePath: "images/test-image.jpg",
      });

      expect(result.signedUrl).toBe("https://signed-url.example.com/file.jpg");
      expect(result.expiresAt).toBeDefined();
    });

    it("should create download URL with custom expiration", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createDownloadUrl({
        storagePath: "images/test-image.jpg",
        expiresInSeconds: 300,
      });

      expect(result.signedUrl).toBe("https://signed-url.example.com/file.jpg");
      expect(result.expiresAt).toBeDefined();
    });

    it("signs a resized variant when a transform preset is requested", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await caller.createDownloadUrl({
        storagePath: "images/test-image.jpg",
        transform: "avatar",
      });

      const signer = (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mock.results[0].value
        .createSignedUrl;
      expect(signer).toHaveBeenCalledWith("test-image.jpg", 600, {
        transform: { width: 120, height: 120, resize: "cover", quality: 70 },
      });
    });

    it("signs the original when no transform preset is requested", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await caller.createDownloadUrl({ storagePath: "images/test-image.jpg" });

      const signer = (mockSupabase.storage.from as ReturnType<typeof vi.fn>).mock.results[0].value
        .createSignedUrl;
      expect(signer).toHaveBeenCalledWith("test-image.jpg", 600);
    });

    it("falls back to the original when the source image cannot be transformed", async () => {
      const createSignedUrl = vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: { message: "Invalid source image" } })
        .mockResolvedValueOnce({
          data: { signedUrl: "https://signed-url.example.com/original.jpg" },
          error: null,
        });
      mockSupabase = {
        ...mockSupabase,
        storage: { from: vi.fn().mockReturnValue({ createSignedUrl }) },
      } as SupabaseClient;

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createDownloadUrl({
        storagePath: "images/huge.jpg",
        transform: "feedCard",
      });

      expect(result.signedUrl).toBe("https://signed-url.example.com/original.jpg");
      expect(createSignedUrl).toHaveBeenNthCalledWith(2, "huge.jpg", 600);
    });

    it("rejects a transform preset that does not exist", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/test-image.jpg",
          transform: "gigantic",
        }),
      ).rejects.toThrow();
    });

    it("should throw NOT_FOUND when object doesn't exist", async () => {
      mockSupabase = {
        ...mockSupabase,
        storage: {
          from: vi.fn().mockReturnValue({
            createSignedUrl: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Object not found" },
            }),
          }),
        },
      } satisfies SupabaseClient;

      const ctx = createAuthContext(mockUser);
      ctx.supabase = mockSupabase;
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/non-existent.jpg",
        }),
      ).rejects.toThrow(ORPCError);
    });

    it("should throw INTERNAL_SERVER_ERROR for other storage errors", async () => {
      mockSupabase = {
        ...mockSupabase,
        storage: {
          from: vi.fn().mockReturnValue({
            createSignedUrl: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Internal storage error" },
            }),
          }),
        },
      } satisfies SupabaseClient;

      const ctx = createAuthContext(mockUser);
      ctx.supabase = mockSupabase;
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/test-image.jpg",
        }),
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST for invalid storage path", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValueOnce(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "invalid-path",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("createPublicUrl", () => {
    it("should create public URL for files-public bucket", async () => {
      env.SUPABASE_PUBLIC_URL = "https://public.supabase.co";

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createPublicUrl({
        storagePath: "files-public/document.pdf",
      });

      expect(result.publicUrl).toContain("files-public");
      expect(result.publicUrl).toContain("document.pdf");
    });

    it("should throw BAD_REQUEST for non-public buckets", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createPublicUrl({
          storagePath: "images/private-image.jpg",
        }),
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST for invalid storage path", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValueOnce(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createPublicUrl({
          storagePath: "invalid-path",
        }),
      ).rejects.toThrow(ORPCError);
    });

    it("should throw INTERNAL_SERVER_ERROR when SUPABASE_URL is missing", async () => {
      delete env.SUPABASE_URL;
      delete env.SUPABASE_PUBLIC_URL;

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createPublicUrl({
          storagePath: "files-public/document.pdf",
        }),
      ).rejects.toThrow(ORPCError);
    });

    it("should use SUPABASE_PUBLIC_URL when available", async () => {
      env.SUPABASE_PUBLIC_URL = "https://custom-public.supabase.co";

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createPublicUrl({
        storagePath: "files-public/document.pdf",
      });

      expect(result.publicUrl).toContain("custom-public");
    });

    it("should fallback to SUPABASE_URL when PUBLIC_URL not set", async () => {
      delete env.SUPABASE_PUBLIC_URL;
      env.SUPABASE_URL = "https://fallback.supabase.co";

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createPublicUrl({
        storagePath: "files-public/document.pdf",
      });

      expect(result.publicUrl).toContain("fallback");
    });
  });

  describe("Input validation", () => {
    it("should validate storagePath is required for createUploadUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.createUploadUrl({}),
      ).rejects.toThrow();
    });

    it("should validate storagePath is required for createDownloadUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.createDownloadUrl({}),
      ).rejects.toThrow();
    });

    it("should validate storagePath is required for createPublicUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.createPublicUrl({}),
      ).rejects.toThrow();
    });

    it("should validate expiresInSeconds range for createDownloadUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/test.jpg",
          expiresInSeconds: 30, // Below minimum of 60
        }),
      ).rejects.toThrow();
    });

    it("should validate expiresInSeconds maximum for createDownloadUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/test.jpg",
          expiresInSeconds: 7200, // Above maximum of 3600
        }),
      ).rejects.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle storage path with nested directories", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createUploadUrl({
        storagePath: "images/groups/group-123/avatar.jpg",
      });

      expect(result.bucket).toBe("images");
      expect(result.objectPath).toBe("groups/group-123/avatar.jpg");
    });

    it("should handle storage path with special characters", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createUploadUrl({
        storagePath: "images/user-files/test_file-123.jpg",
      });

      expect(result.token).toBe("upload-token-123");
    });

    it("should handle URL-based storage paths gracefully", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValueOnce(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createUploadUrl({
          storagePath: "https://example.com/image.jpg",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });
});
