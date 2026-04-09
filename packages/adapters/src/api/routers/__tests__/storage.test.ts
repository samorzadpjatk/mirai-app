import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
    findUnique: mock(() => Promise.resolve(null)),
  },
});

const createMockSupabase = () => {
  const getUserMock = mock(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = mock(() =>
    Promise.resolve({
      data: { user: { id: "auth-user-1", banned_until: null } },
      error: null,
    }),
  );
  return {
    auth: {
      getUser: getUserMock,
      admin: {
        getUserById: adminGetUserByIdMock,
      },
    },
    storage: {
      from: mock().mockReturnValue({
        createSignedUploadUrl: mock().mockResolvedValue({
          data: { token: "upload-token-123" },
        }),
        createSignedUrl: mock().mockResolvedValue({
          data: { signedUrl: "https://example.com/signed" },
          error: null,
        }),
      }),
    },
  };
};

describe("[INTEGRATION] storage router", () => {
  let mockCtx: any;

  const setupUserMocks = (userId = "user-1", role = "USER") => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}`, banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
  };

  beforeEach(() => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
    };
  });

  describe("createUploadUrl", () => {
    test("creates signed upload URL", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.storage.createUploadUrl({
        storagePath: "avatar/user-1.jpg",
      });
      expect(result.token).toBe("upload-token-123");
      expect(result.bucket).toBe("images");
      expect(result.objectPath).toBe("avatar/user-1.jpg");
    });

    test("creates upload URL with upsert option", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.storage.createUploadUrl({
        storagePath: "avatar/user-1.jpg",
        upsert: true,
      });
      expect(result.token).toBeDefined();
    });

    test("throws error for unsupported storage reference", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      await expect(
        caller.storage.createUploadUrl({ storagePath: "invalid://path" }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws INTERNAL_SERVER_ERROR when supabase returns error", async () => {
      setupUserMocks();
      mockCtx.supabase.storage
        .from()
        .createSignedUploadUrl.mockResolvedValueOnce({
          data: null,
          error: { message: "Permission denied" },
        });
      const caller = createCaller(mockCtx);
      await expect(
        caller.storage.createUploadUrl({ storagePath: "avatar/user-1.jpg" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("createDownloadUrl", () => {
    test("creates signed download URL", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.storage.createDownloadUrl({
        storagePath: "images/document.pdf",
      });
      expect(result.signedUrl).toBe("https://example.com/signed");
      expect(result.expiresAt).toBeDefined();
    });

    test("uses custom expiration time", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.storage.createDownloadUrl({
        storagePath: "images/document.pdf",
        expiresInSeconds: 300,
      });
      expect(result.signedUrl).toBeDefined();
    });

    test("throws error for unsupported storage reference", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      await expect(
        caller.storage.createDownloadUrl({ storagePath: "invalid://path" }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws NOT_FOUND when file does not exist", async () => {
      setupUserMocks();
      mockCtx.supabase.storage.from().createSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.storage.createDownloadUrl({
          storagePath: "images/missing.pdf",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws INTERNAL_SERVER_ERROR for other errors", async () => {
      setupUserMocks();
      mockCtx.supabase.storage.from().createSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: "Service unavailable" },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.storage.createDownloadUrl({
          storagePath: "images/doc.pdf",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("createPublicUrl", () => {
    test("creates public URL for files-public bucket", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      const result = await caller.storage.createPublicUrl({
        storagePath: "files-public/document.pdf",
      });
      expect(result.publicUrl).toContain("files-public");
    });

    test("throws BAD_REQUEST for non-files-public bucket", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      await expect(
        caller.storage.createPublicUrl({ storagePath: "avatars/user-1.jpg" }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws error for unsupported storage reference", async () => {
      setupUserMocks();
      const caller = createCaller(mockCtx);
      await expect(
        caller.storage.createPublicUrl({ storagePath: "invalid://path" }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
