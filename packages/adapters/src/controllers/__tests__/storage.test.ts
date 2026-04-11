import { describe, it, expect, mock, beforeEach } from "bun:test";
import { StorageController } from "../storage";
import type { StoragePort } from "@mirai-app/use-cases";

describe("[UNIT] StorageController", () => {
  let controller: StorageController;
  let mockStoragePort: StoragePort;

  beforeEach(() => {
    mockStoragePort = {
      upload: mock(() =>
        Promise.resolve({
          path: "images/test.jpg",
          publicUrl: "https://example.com/test.jpg",
        }),
      ),
      download: mock(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
      delete: mock(() => Promise.resolve()),
      getPublicUrl: mock(() => "https://example.com/test.jpg"),
      exists: mock(() => Promise.resolve(true)),
    } as unknown as StoragePort;

    controller = new StorageController(mockStoragePort);
  });

  describe("upload", () => {
    it("should upload file", async () => {
      const input = {
        bucket: "images",
        path: "test.jpg",
        data: new Uint8Array([1, 2, 3]),
        contentType: "image/jpeg",
      };

      const result = await controller.upload(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.path).toBe("images/test.jpg");
        expect(result.data.publicUrl).toBeDefined();
      }
    });

    it("should return error for invalid bucket", async () => {
      mockStoragePort.upload = mock(() =>
        Promise.reject(new Error("Invalid bucket")),
      );

      const result = await controller.upload({
        bucket: "invalid",
        path: "test.jpg",
        data: new Uint8Array([1, 2, 3]),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("download", () => {
    it("should download file", async () => {
      const result = await controller.download({ path: "images/test.jpg" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Uint8Array);
      }
    });

    it("should return error when file not found", async () => {
      mockStoragePort.download = mock(() =>
        Promise.reject(new Error("File not found")),
      );

      const result = await controller.download({ path: "images/missing.jpg" });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete file", async () => {
      const result = await controller.delete({ path: "images/test.jpg" });

      expect(result.success).toBe(true);
    });

    it("should return error when file not found", async () => {
      mockStoragePort.delete = mock(() =>
        Promise.reject(new Error("File not found")),
      );

      const result = await controller.delete({ path: "images/missing.jpg" });

      expect(result.success).toBe(false);
    });
  });

  describe("getPublicUrl", () => {
    it("should return public URL", async () => {
      const result = await controller.getPublicUrl({ path: "images/test.jpg" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe("https://example.com/test.jpg");
      }
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      const result = await controller.exists({ path: "images/test.jpg" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exists).toBe(true);
      }
    });

    it("should return false for non-existing file", async () => {
      mockStoragePort.exists = mock(() => Promise.resolve(false));

      const result = await controller.exists({ path: "images/missing.jpg" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.exists).toBe(false);
      }
    });
  });
});
