import { describe, it, expect, mock, beforeEach } from "bun:test";
import { StorageController } from "../storage";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

describe("[UNIT] StorageController", () => {
  let controller: StorageController;
  let mockSupabaseClient: SupabaseClient;

  // Set up environment variable before tests
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_PUBLIC_URL = "https://test.supabase.co";
  });

  beforeEach(() => {
    mockSupabaseClient = {
      storage: {
        from: mock((bucket: string) => ({
          createSignedUploadUrl: mock(() =>
            Promise.resolve({
              data: { token: "test-token", path: "test.jpg" },
              error: null,
            }),
          ),
          createSignedUrl: mock(() =>
            Promise.resolve({
              data: {
                signedUrl: "https://example.com/signed-url",
                path: "test.jpg",
              },
              error: null,
            }),
          ),
          getPublicUrl: mock(() => ({
            data: {
              publicUrl: `https://test.supabase.co/storage/v1/object/public/${bucket}/test.jpg`,
            },
          })),
        })),
      },
    } as unknown as SupabaseClient;

    controller = new StorageController(mockSupabaseClient);
  });

  describe("createUploadUrl", () => {
    it("should create upload URL", async () => {
      const result = await controller.createUploadUrl({
        storagePath: "images/test.jpg",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe("test-token");
        expect(result.data.bucket).toBe("images");
      }
    });

    it("should return error for invalid storage path", async () => {
      const result = await controller.createUploadUrl({
        storagePath: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createDownloadUrl", () => {
    it("should create download URL", async () => {
      const result = await controller.createDownloadUrl({
        storagePath: "images/test.jpg",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.signedUrl).toBeDefined();
      }
    });

    it("should return error when file not found", async () => {
      mockSupabaseClient.storage.from = mock(() => ({
        createSignedUrl: mock(() =>
          Promise.resolve({
            data: null,
            error: { message: "Object not found" },
          }),
        ),
      }));

      const result = await controller.createDownloadUrl({
        storagePath: "images/missing.jpg",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createPublicUrl", () => {
    it("should return public URL for public bucket", async () => {
      const result = await controller.createPublicUrl({
        storagePath: "files-public/test.jpg",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publicUrl).toContain("files-public");
      }
    });

    it("should return error for non-public bucket", async () => {
      const result = await controller.createPublicUrl({
        storagePath: "private-bucket/test.jpg",
      });

      expect(result.success).toBe(false);
    });
  });
});
