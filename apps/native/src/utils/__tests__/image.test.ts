import { describe, it, expect } from "@jest/globals";
import { getImageExtension, getImageContentType } from "../image";
import type { ImagePickerAsset } from "expo-image-picker";

describe("Image Utilities", () => {
  describe("getImageExtension", () => {
    it("should extract extension from fileName with extension", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        fileName: "photo.png",
        mimeType: "image/jpeg",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("png");
    });

    it("should extract extension from fileName with multiple dots", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        fileName: "my.photo.backup.webp",
        mimeType: "image/jpeg",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("webp");
    });

    it("should convert extension to lowercase", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test.jpg",
        fileName: "photo.PNG",
        mimeType: "image/jpeg",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("png");
    });

    it("should fallback to mimeType when fileName has no extension", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        fileName: "photo",
        mimeType: "image/png",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("png");
    });

    it("should fallback to mimeType when fileName is undefined", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        mimeType: "image/webp",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("webp");
    });

    it("should return heic for image/heic mimeType", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        mimeType: "image/heic",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("heic");
    });

    it("should return heic for image/heif mimeType", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        mimeType: "image/heif",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("heic");
    });

    it("should default to jpg when no fileName and no mimeType", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("jpg");
    });

    it("should default to jpg for unknown mimeType", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        mimeType: "image/gif",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("jpg");
    });

    it("should handle empty fileName", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        fileName: "",
        mimeType: "image/png",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("png");
    });

    it("should handle fileName ending with dot", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        fileName: "photo.",
        mimeType: "image/jpeg",
        width: 100,
        height: 100,
      };

      // Current behavior: returns empty string for trailing dot (not null/undefined, so ?? doesn't trigger)
      expect(getImageExtension(asset)).toBe("");
    });

    it("should handle fileName with only dots", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        fileName: "...",
        mimeType: "image/png",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("");
    });

    it("should handle fileName with multiple trailing dots", () => {
      const asset: ImagePickerAsset = {
        uri: "file://test",
        fileName: "photo...",
        mimeType: "image/webp",
        width: 100,
        height: 100,
      };

      expect(getImageExtension(asset)).toBe("");
    });
  });

  describe("getImageContentType", () => {
    it("should return image/png for png extension", () => {
      expect(getImageContentType("png")).toBe("image/png");
    });

    it("should return image/webp for webp extension", () => {
      expect(getImageContentType("webp")).toBe("image/webp");
    });

    it("should return image/heic for heic extension", () => {
      expect(getImageContentType("heic")).toBe("image/heic");
    });

    it("should return image/heic for heif extension", () => {
      expect(getImageContentType("heif")).toBe("image/heic");
    });

    it("should return image/jpeg for jpg extension", () => {
      expect(getImageContentType("jpg")).toBe("image/jpeg");
    });

    it("should return image/jpeg for jpeg extension", () => {
      expect(getImageContentType("jpeg")).toBe("image/jpeg");
    });

    it("should default to image/jpeg for unknown extension", () => {
      expect(getImageContentType("gif")).toBe("image/jpeg");
      expect(getImageContentType("bmp")).toBe("image/jpeg");
      expect(getImageContentType("")).toBe("image/jpeg");
    });
  });
});
