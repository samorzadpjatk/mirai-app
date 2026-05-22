import { describe, it, expect } from "@jest/globals";
import { getFileExtension, getFileContentType, getUploadFileName } from "../image";
import type { ImagePickerAsset } from "expo-image-picker";

describe("File Utilities", () => {
  describe("getFileExtension", () => {
    it("should extract extension from fileName with extension", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        fileName: "photo.png",
        mimeType: "image/jpeg",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("png");
    });

    it("should extract extension from fileName with multiple dots", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        fileName: "my.photo.backup.webp",
        mimeType: "image/jpeg",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("webp");
    });

    it("should convert extension to lowercase", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        fileName: "photo.PNG",
        mimeType: "image/jpeg",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("png");
    });

    it("should fallback to mimeType when fileName has no extension", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        fileName: "photo",
        mimeType: "image/png",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("png");
    });

    it("should fallback to mimeType when fileName is undefined", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        mimeType: "image/webp",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("webp");
    });

    it("should return heic for image/heic mimeType", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        mimeType: "image/heic",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("heic");
    });

    it("should return heic for image/heif mimeType", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        mimeType: "image/heif",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("heic");
    });

    it("should default to jpg when no fileName and no mimeType", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("jpg");
    });

    it("should default to jpg for unknown mimeType", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        mimeType: "image/gif",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("jpg");
    });

    it("should handle empty fileName", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        fileName: "",
        mimeType: "image/png",
        width: 100,
        height: 100,
      };

      expect(getFileExtension(asset)).toBe("png");
    });

    it("should return mov for video/quicktime mimeType", () => {
      const asset = {
        uri: "file://test",
        mimeType: "video/quicktime",
      };

      expect(getFileExtension(asset)).toBe("mov");
    });

    it("should return mp4 for video/mp4 mimeType", () => {
      const asset = {
        uri: "file://test",
        mimeType: "video/mp4",
      };

      expect(getFileExtension(asset)).toBe("mp4");
    });

    it("should return webm for video/webm mimeType", () => {
      const asset = {
        uri: "file://test",
        mimeType: "video/webm",
      };

      expect(getFileExtension(asset)).toBe("webm");
    });
  });

  describe("getFileContentType", () => {
    it("should return image/png for png extension", () => {
      expect(getFileContentType("png")).toBe("image/png");
    });

    it("should return image/webp for webp extension", () => {
      expect(getFileContentType("webp")).toBe("image/webp");
    });

    it("should return image/heic for heic extension", () => {
      expect(getFileContentType("heic")).toBe("image/heic");
    });

    it("should return image/heic for heif extension", () => {
      expect(getFileContentType("heif")).toBe("image/heic");
    });

    it("should return image/jpeg for jpg extension", () => {
      expect(getFileContentType("jpg")).toBe("image/jpeg");
    });

    it("should return image/jpeg for jpeg extension", () => {
      expect(getFileContentType("jpeg")).toBe("image/jpeg");
    });

    it("should return video/quicktime for mov extension", () => {
      expect(getFileContentType("mov")).toBe("video/quicktime");
    });

    it("should return video/mp4 for mp4 extension", () => {
      expect(getFileContentType("mp4")).toBe("video/mp4");
    });

    it("should return video/webm for webm extension", () => {
      expect(getFileContentType("webm")).toBe("video/webm");
    });

    it("should default to image/jpeg for unknown extension", () => {
      expect(getFileContentType("gif")).toBe("image/jpeg");
      expect(getFileContentType("bmp")).toBe("image/jpeg");
      expect(getFileContentType("")).toBe("image/jpeg");
    });
  });

  describe("getUploadFileName", () => {
    it("should return asset fileName when available", () => {
      const asset = { uri: "file://test", fileName: "photo.png" };
      expect(getUploadFileName(asset, "png")).toBe("photo.png");
    });

    it("should return URI segment when it has extension", () => {
      const asset = { uri: "file://some/path/photo.jpg" };
      expect(getUploadFileName(asset, "jpg")).toBe("photo.jpg");
    });

    it("should generate default name with prefix when no fileName or URI extension", () => {
      const asset = { uri: "file://some/path" };
      const result = getUploadFileName(asset, "jpg");
      expect(result).toMatch(/^upload-\d+\.jpg$/);
    });

    it("should use custom prefix when provided", () => {
      const asset = { uri: "file://some/path" };
      const result = getUploadFileName(asset, "jpg", "challenge");
      expect(result).toMatch(/^challenge-\d+\.jpg$/);
    });
  });
});
