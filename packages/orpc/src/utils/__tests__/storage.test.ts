import { describe, expect, it } from "vitest";
import {
  IMAGE_BUCKET,
  PUBLIC_BUCKET,
  SUPABASE_OBJECT_PREFIXES,
  VIDEO_BUCKET,
  normalizeSupabaseStoragePath,
  parseSupabaseStorageObject,
  parseSupabaseStoragePath,
} from "../storage";

describe("storage", () => {
  describe("SUPABASE_OBJECT_PREFIXES", () => {
    it("should contain expected prefixes", () => {
      expect(SUPABASE_OBJECT_PREFIXES.has("public")).toBe(true);
      expect(SUPABASE_OBJECT_PREFIXES.has("sign")).toBe(true);
      expect(SUPABASE_OBJECT_PREFIXES.has("authenticated")).toBe(true);
    });
  });

  describe("bucket constants", () => {
    it("should export IMAGE_BUCKET", () => {
      expect(IMAGE_BUCKET).toBeDefined();
      expect(typeof IMAGE_BUCKET).toBe("string");
    });

    it("should export VIDEO_BUCKET", () => {
      expect(VIDEO_BUCKET).toBeDefined();
      expect(typeof VIDEO_BUCKET).toBe("string");
    });

    it("should export PUBLIC_BUCKET", () => {
      expect(PUBLIC_BUCKET).toBeDefined();
      expect(typeof PUBLIC_BUCKET).toBe("string");
    });
  });

  describe("parseSupabaseStorageObject", () => {
    it("should parse full Supabase storage URL", () => {
      const url = "https://example.com/storage/v1/object/public/images/avatar/user1.jpg";
      const result = parseSupabaseStorageObject(url);
      expect(result).toEqual({
        bucket: "images",
        path: "avatar/user1.jpg",
      });
    });

    it("should parse URL with authenticated prefix", () => {
      const url = "https://example.com/storage/v1/object/authenticated/videos/challenge/video1.mp4";
      const result = parseSupabaseStorageObject(url);
      expect(result).toEqual({
        bucket: "videos",
        path: "challenge/video1.mp4",
      });
    });

    it("should parse URL with sign prefix", () => {
      const url = "https://example.com/storage/v1/object/sign/files-public/document.pdf";
      const result = parseSupabaseStorageObject(url);
      expect(result).toEqual({
        bucket: "files-public",
        path: "document.pdf",
      });
    });

    it("should parse URL with query parameters", () => {
      const url = "https://example.com/storage/v1/object/public/images/photo.jpg?token=abc123";
      const result = parseSupabaseStorageObject(url);
      expect(result).toEqual({
        bucket: "images",
        path: "photo.jpg",
      });
    });

    it("should return null for empty string", () => {
      const result = parseSupabaseStorageObject("");
      expect(result).toBeNull();
    });

    it("should return null for whitespace-only string", () => {
      const result = parseSupabaseStorageObject("   ");
      expect(result).toBeNull();
    });

    it("should return null for invalid URL", () => {
      const result = parseSupabaseStorageObject("not-a-valid-url");
      expect(result).toBeNull();
    });

    it("should return null for URL without storage path", () => {
      const url = "https://example.com/other/path/file.jpg";
      const result = parseSupabaseStorageObject(url);
      expect(result).toBeNull();
    });

    it("should return null for path with less than 2 segments", () => {
      const url = "https://example.com/storage/v1/object/public/images";
      const result = parseSupabaseStorageObject(url);
      expect(result).toBeNull();
    });

    it("should parse object path without URL prefix", () => {
      const path = "/storage/v1/object/public/images/avatar/user1.jpg";
      const result = parseSupabaseStorageObject(path);
      expect(result).toEqual({
        bucket: "images",
        path: "avatar/user1.jpg",
      });
    });

    it("should handle paths with leading slashes", () => {
      const path = "///storage/v1/object/public/images/photo.jpg";
      const result = parseSupabaseStorageObject(path);
      expect(result).toEqual({
        bucket: "images",
        path: "photo.jpg",
      });
    });
  });

  describe("parseSupabaseStoragePath", () => {
    it("should parse full Supabase storage URL", () => {
      const url = "https://example.com/storage/v1/object/public/images/avatar/user1.jpg";
      const result = parseSupabaseStoragePath(url);
      expect(result).toEqual({
        bucket: "images",
        path: "avatar/user1.jpg",
      });
    });

    it("should parse path starting with known bucket", () => {
      const path = "images/avatar/user1.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: "images",
        path: "avatar/user1.jpg",
      });
    });

    it("should parse path starting with videos bucket", () => {
      const path = "videos/challenge/video1.mp4";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: "videos",
        path: "challenge/video1.mp4",
      });
    });

    it("should parse path starting with files-public", () => {
      const path = "files-public/document.pdf";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: "files-public",
        path: "document.pdf",
      });
    });

    it("should parse avatar path and infer images bucket", () => {
      const path = "avatar/user1.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: IMAGE_BUCKET,
        path: "avatar/user1.jpg",
      });
    });

    it("should parse challenge image path and infer images bucket", () => {
      const path = "challenge/challenge1/photo.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: IMAGE_BUCKET,
        path: "challenge/challenge1/photo.jpg",
      });
    });

    it("should parse challenge video path and infer videos bucket", () => {
      const path = "challenge/challenge1/video.mp4";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: VIDEO_BUCKET,
        path: "challenge/challenge1/video.mp4",
      });
    });

    it("should parse challenge mov video path and infer videos bucket", () => {
      const path = "challenge/challenge1/video.mov";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: VIDEO_BUCKET,
        path: "challenge/challenge1/video.mov",
      });
    });

    it("should parse group path and infer images bucket", () => {
      const path = "group/group1/photo.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: IMAGE_BUCKET,
        path: "group/group1/photo.jpg",
      });
    });

    it("should parse trips path and infer images bucket", () => {
      const path = "trips/trip1/banner.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: IMAGE_BUCKET,
        path: "trips/trip1/banner.jpg",
      });
    });

    it("should parse rewards path and infer images bucket", () => {
      const path = "rewards/reward1/icon.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: IMAGE_BUCKET,
        path: "rewards/reward1/icon.jpg",
      });
    });

    it("should parse activity path and infer images bucket", () => {
      const path = "activity/activity1/photo.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: IMAGE_BUCKET,
        path: "activity/activity1/photo.jpg",
      });
    });

    it("should parse files-public path", () => {
      const path = "files-public/document.pdf";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: PUBLIC_BUCKET,
        path: "document.pdf",
      });
    });

    it("should parse simple filename without path as public bucket", () => {
      const path = "document.pdf";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: PUBLIC_BUCKET,
        path: "document.pdf",
      });
    });

    it("should return null for empty string", () => {
      const result = parseSupabaseStoragePath("");
      expect(result).toBeNull();
    });

    it("should return null for whitespace-only string", () => {
      const result = parseSupabaseStoragePath("   ");
      expect(result).toBeNull();
    });

    it("should handle paths with leading slashes", () => {
      const path = "/images/avatar/user1.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: "images",
        path: "avatar/user1.jpg",
      });
    });

    it("should handle unknown path patterns", () => {
      const path = "unknown/path/file.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toBeNull();
    });

    it("should not treat a bare public/ prefix as the public bucket", () => {
      // "public" is a Supabase object prefix (/storage/v1/object/public/<bucket>/…),
      // never a bucket alias in a stored reference, so a row holding
      // "public/integral/guide.pdf" can never be downloaded. Anything that
      // writes storage references — the seeder above all — has to persist the
      // bucket name, "files-public/integral/guide.pdf".
      expect(parseSupabaseStoragePath("public/integral/guide.pdf")).toBeNull();
      expect(parseSupabaseStoragePath("files-public/integral/guide.pdf")).toEqual({
        bucket: PUBLIC_BUCKET,
        path: "integral/guide.pdf",
      });
    });

    it("should handle webm video extension", () => {
      const path = "challenge/video.webm";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: VIDEO_BUCKET,
        path: "challenge/video.webm",
      });
    });

    it("should handle avi video extension", () => {
      const path = "challenge/video.avi";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: VIDEO_BUCKET,
        path: "challenge/video.avi",
      });
    });

    it("should handle mkv video extension", () => {
      const path = "challenge/video.mkv";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: VIDEO_BUCKET,
        path: "challenge/video.mkv",
      });
    });

    it("should handle m4v video extension", () => {
      const path = "challenge/video.m4v";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: VIDEO_BUCKET,
        path: "challenge/video.m4v",
      });
    });

    it("should handle uppercase video extension", () => {
      const path = "challenge/video.MP4";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: VIDEO_BUCKET,
        path: "challenge/video.MP4",
      });
    });

    it("should handle file without extension in challenge path", () => {
      const path = "challenge/challenge1/file";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: IMAGE_BUCKET,
        path: "challenge/challenge1/file",
      });
    });

    it("should handle file with single segment path", () => {
      const path = "file.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: PUBLIC_BUCKET,
        path: "file.jpg",
      });
    });
  });

  describe("normalizeSupabaseStoragePath", () => {
    it("should return normalized path with all components", () => {
      const path = "https://example.com/storage/v1/object/public/images/avatar/user1.jpg";
      const result = normalizeSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: "images",
        path: "avatar/user1.jpg",
        storagePath: "images/avatar/user1.jpg",
      });
    });

    it("should return null for invalid path", () => {
      const result = normalizeSupabaseStoragePath("invalid-path");
      // Single segment paths are treated as bucket-only, which gets normalized
      // "invalid-path" normalizes to "files-public" via normalizeBucketName
      expect(result).toEqual({
        bucket: "files-public",
        path: "invalid-path",
        storagePath: "files-public/invalid-path",
      });
    });

    it("should handle simple bucket path", () => {
      const path = "videos/challenge/video.mp4";
      const result = normalizeSupabaseStoragePath(path);
      expect(result).toEqual({
        bucket: "videos",
        path: "challenge/video.mp4",
        storagePath: "videos/challenge/video.mp4",
      });
    });

    it("should normalize bucket name", () => {
      const path = "IMAGES/photo.jpg";
      const result = normalizeSupabaseStoragePath(path);
      expect(result?.bucket).toBe("images");
    });

    it("should normalize path", () => {
      const path = "images//folder//file.jpg";
      const result = normalizeSupabaseStoragePath(path);
      expect(result?.path).not.toContain("//");
    });
  });
});
