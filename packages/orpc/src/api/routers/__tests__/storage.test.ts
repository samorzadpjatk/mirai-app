 
 
 
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { storageRouter } from "../../routers/storage";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User } from "@mirai-app/db";

vi.mock("../../../utils/storage", () => ({
  normalizeSupabaseStoragePath: vi.fn().mockImplementation((value: string) => {
    if (!value) return null;
    if (value.startsWith("http")) return null;
    if (value.startsWith("images/")) {
      return { bucket: "images", path: value.replace("images/", ""), storagePath: value };
    }
    if (value.startsWith("files-public/")) {
      return { bucket: "files-public", path: value.replace("files-public/", ""), storagePath: value };
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

const createCaller = (ctx: TRPCContext) => createRouterClient(storageRouter, { context: ctx });

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
  let mockDb: DB;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv, SUPABASE_URL: "https://test.supabase.co", SUPABASE_PUBLIC_URL: undefined };

    mockUser = createMockUser({ id: "user-123" });

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
    } as unknown as SupabaseClient;

    // Setup mock database client
    mockDb = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUser),
        findFirst: vi.fn().mockResolvedValue(mockUser),
      },
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Helper to create authenticated context
  const createAuthContext = (user: User, token = "test-token"): TRPCContext => ({
    db: mockDb,
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
      vi.mocked(normalizeSupabaseStoragePath).mockReturnValueOnce(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createUploadUrl({
          storagePath: "invalid-path",
        })
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
      } as unknown as SupabaseClient;

      const ctx = createAuthContext(mockUser);
      ctx.supabase = mockSupabase;
      const caller = createCaller(ctx);

      await expect(
        caller.createUploadUrl({
          storagePath: "images/test-image.jpg",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw INTERNAL_SERVER_ERROR when SUPABASE_URL is missing", async () => {
      delete process.env.SUPABASE_URL;

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createUploadUrl({
          storagePath: "images/test-image.jpg",
        })
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
      } as unknown as SupabaseClient;

      const ctx = createAuthContext(mockUser);
      ctx.supabase = mockSupabase;
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/non-existent.jpg",
        })
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
      } as unknown as SupabaseClient;

      const ctx = createAuthContext(mockUser);
      ctx.supabase = mockSupabase;
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/test-image.jpg",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST for invalid storage path", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      vi.mocked(normalizeSupabaseStoragePath).mockReturnValueOnce(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "invalid-path",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("createPublicUrl", () => {
    it("should create public URL for files-public bucket", async () => {
      process.env.SUPABASE_PUBLIC_URL = "https://public.supabase.co";

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
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST for invalid storage path", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      vi.mocked(normalizeSupabaseStoragePath).mockReturnValueOnce(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createPublicUrl({
          storagePath: "invalid-path",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw INTERNAL_SERVER_ERROR when SUPABASE_URL is missing", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_PUBLIC_URL;

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createPublicUrl({
          storagePath: "files-public/document.pdf",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should use SUPABASE_PUBLIC_URL when available", async () => {
      process.env.SUPABASE_PUBLIC_URL = "https://custom-public.supabase.co";

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.createPublicUrl({
        storagePath: "files-public/document.pdf",
      });

      expect(result.publicUrl).toContain("custom-public");
    });

    it("should fallback to SUPABASE_URL when PUBLIC_URL not set", async () => {
      delete process.env.SUPABASE_PUBLIC_URL;
      process.env.SUPABASE_URL = "https://fallback.supabase.co";

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
        caller.createUploadUrl({})
      ).rejects.toThrow();
    });

    it("should validate storagePath is required for createDownloadUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.createDownloadUrl({})
      ).rejects.toThrow();
    });

    it("should validate storagePath is required for createPublicUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.createPublicUrl({})
      ).rejects.toThrow();
    });

    it("should validate expiresInSeconds range for createDownloadUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/test.jpg",
          expiresInSeconds: 30, // Below minimum of 60
        })
      ).rejects.toThrow();
    });

    it("should validate expiresInSeconds maximum for createDownloadUrl", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createDownloadUrl({
          storagePath: "images/test.jpg",
          expiresInSeconds: 7200, // Above maximum of 3600
        })
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
      vi.mocked(normalizeSupabaseStoragePath).mockReturnValueOnce(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.createUploadUrl({
          storagePath: "https://example.com/image.jpg",
        })
      ).rejects.toThrow(ORPCError);
    });
  });
});
