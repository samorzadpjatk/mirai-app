import { describe, it, expect } from "vitest";
import {
  STANDARD_BUCKETS,
  normalizeStoragePath,
  normalizeBucketName,
  createStoragePath,
  parseStoragePath,
} from "../../storage/standard";

describe("Storage Standard Utilities", () => {
  describe("STANDARD_BUCKETS", () => {
    it("should have the correct bucket names", () => {
      expect(STANDARD_BUCKETS.IMAGES).toBe("images");
      expect(STANDARD_BUCKETS.VIDEOS).toBe("videos");
      expect(STANDARD_BUCKETS.PUBLIC).toBe("files-public");
    });
  });

  describe("normalizeStoragePath", () => {
    it("should remove leading slashes", () => {
      expect(normalizeStoragePath("/path/to/file")).toBe("path/to/file");
    });

    it("should remove trailing slashes", () => {
      expect(normalizeStoragePath("path/to/file/")).toBe("path/to/file");
    });

    it("should convert Windows backslashes to forward slashes", () => {
      expect(normalizeStoragePath("path\\to\\file")).toBe("path/to/file");
    });

    it("should decode URI components", () => {
      expect(normalizeStoragePath("path/to/file%20name")).toBe("path/to/file name");
    });

    it("should filter out empty segments", () => {
      expect(normalizeStoragePath("path//to///file")).toBe("path/to/file");
    });

    it("should handle complex paths", () => {
      expect(normalizeStoragePath("/path\\to//file%20name/")).toBe("path/to/file name");
    });
  });

  describe("normalizeBucketName", () => {
    it("should return null for null or undefined input", () => {
      expect(normalizeBucketName(null)).toBeNull();
      expect(normalizeBucketName(undefined)).toBeNull();
    });

    it("should return standard bucket names as-is", () => {
      expect(normalizeBucketName("images")).toBe("images");
      expect(normalizeBucketName("videos")).toBe("videos");
      expect(normalizeBucketName("files-public")).toBe("files-public");
    });

    it("should handle case-insensitive matching", () => {
      expect(normalizeBucketName("IMAGES")).toBe("images");
      expect(normalizeBucketName("Videos")).toBe("videos");
    });

    it("should normalize aliases to standard names", () => {
      expect(normalizeBucketName("image")).toBe("images");
      expect(normalizeBucketName("video")).toBe("videos");
      expect(normalizeBucketName("public")).toBe("files-public");
      expect(normalizeBucketName("file-public")).toBe("files-public");
    });

    it("should return null for unknown bucket names", () => {
      expect(normalizeBucketName("unknown")).toBeNull();
      expect(normalizeBucketName("random-bucket")).toBeNull();
    });
  });

  describe("createStoragePath", () => {
    it("should create a standardized storage path", () => {
      const result = createStoragePath("images", "path/to/file.jpg");
      expect(result).toBe("images/path/to/file.jpg");
    });

    it("should normalize the object path", () => {
      const result = createStoragePath("videos", "/path\\to//file.mp4");
      expect(result).toBe("videos/path/to/file.mp4");
    });
  });

  describe("parseStoragePath", () => {
    it("should parse a valid storage path", () => {
      const result = parseStoragePath("images/path/to/file.jpg");
      expect(result).toEqual({
        bucket: "images",
        path: "path/to/file.jpg",
      });
    });

    it("should return null for invalid paths", () => {
      expect(parseStoragePath("")).toBeNull();
      expect(parseStoragePath("invalid")).toBeNull();
      expect(parseStoragePath("unknown-bucket/path")).toBeNull();
    });

    it("should handle paths with normalization", () => {
      const result = parseStoragePath("/videos//path/to/file.mp4/");
      expect(result).toEqual({
        bucket: "videos",
        path: "path/to/file.mp4",
      });
    });
  });
});
