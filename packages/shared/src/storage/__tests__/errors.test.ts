import { describe, it, expect } from "vitest";
import {
  classifyStorageError,
  isPublicBucket,
  validateKnownBucket,
} from "../../storage/errors";

describe("Error Utilities", () => {
  describe("classifyStorageError", () => {
    it("should classify error with 'not found' message as NOT_FOUND", () => {
      const result = classifyStorageError("Object not found");
      expect(result).toEqual({
        code: "NOT_FOUND",
        message: "Storage object not found",
      });
    });

    it("should classify error with 'does not exist' message as NOT_FOUND", () => {
      const result = classifyStorageError("The object does not exist");
      expect(result).toEqual({
        code: "NOT_FOUND",
        message: "Storage object not found",
      });
    });

    it("should be case-insensitive for not found detection", () => {
      const result = classifyStorageError("NOT FOUND error");
      expect(result).toEqual({
        code: "NOT_FOUND",
        message: "Storage object not found",
      });
    });

    it("should classify generic error as INTERNAL_SERVER_ERROR", () => {
      const result = classifyStorageError("Something went wrong");
      expect(result).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create signed URL",
      });
    });

    it("should classify error without message as INTERNAL_SERVER_ERROR", () => {
      const result = classifyStorageError("");
      expect(result).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create signed URL",
      });
    });

    it("should classify string error as INTERNAL_SERVER_ERROR", () => {
      const result = classifyStorageError("some error");
      expect(result).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create signed URL",
      });
    });

    it("should classify empty string as INTERNAL_SERVER_ERROR", () => {
      const result = classifyStorageError("");
      expect(result).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to create signed URL",
      });
    });
  });

  describe("isPublicBucket", () => {
    it("should return true for files-public bucket", () => {
      expect(isPublicBucket("files-public")).toBe(true);
    });

    it("should return false for images bucket", () => {
      expect(isPublicBucket("images")).toBe(false);
    });

    it("should return false for videos bucket", () => {
      expect(isPublicBucket("videos")).toBe(false);
    });

    it("should return false for unknown bucket", () => {
      expect(isPublicBucket("unknown")).toBe(false);
    });
  });

  describe("validateKnownBucket", () => {
    it("should validate a known bucket", () => {
      const knownBuckets = new Set(["images", "videos", "files-public"]);
      const result = validateKnownBucket("images", knownBuckets);
      expect(result).toEqual({ valid: true });
    });

    it("should invalidate an unknown bucket", () => {
      const knownBuckets = new Set(["images", "videos", "files-public"]);
      const result = validateKnownBucket("unknown", knownBuckets);
      expect(result).toEqual({
        valid: false,
        error: "Invalid storage bucket",
      });
    });

    it("should invalidate bucket not in empty set", () => {
      const knownBuckets = new Set<string>();
      const result = validateKnownBucket("images", knownBuckets);
      expect(result).toEqual({
        valid: false,
        error: "Invalid storage bucket",
      });
    });

    it("should validate files-public as known bucket", () => {
      const knownBuckets = new Set(["images", "videos", "files-public"]);
      const result = validateKnownBucket("files-public", knownBuckets);
      expect(result).toEqual({ valid: true });
    });
  });
});
