import { describe, it, expect } from "vitest";
import {
  buildUploadResponse,
  buildDownloadResponse,
  buildPublicUrlResponse,
  calculateExpiresAtISO,
} from "../../storage/responses";

describe("Response Builders", () => {
  describe("buildUploadResponse", () => {
    it("should build upload response with all fields", () => {
      const result = buildUploadResponse(
        "upload-token-123",
        "images",
        "path/to/file.jpg",
        "images/path/to/file.jpg",
        "https://resumable.example.com/upload",
      );
      expect(result).toEqual({
        token: "upload-token-123",
        bucket: "images",
        objectPath: "path/to/file.jpg",
        storagePath: "images/path/to/file.jpg",
        resumableUrl: "https://resumable.example.com/upload",
      });
    });
  });

  describe("buildDownloadResponse", () => {
    it("should build download response with signedUrl and expiresAt", () => {
      const result = buildDownloadResponse(
        "https://signed.example.com/file.jpg?token=abc",
        "2024-01-01T00:00:00.000Z",
      );
      expect(result).toEqual({
        signedUrl: "https://signed.example.com/file.jpg?token=abc",
        expiresAt: "2024-01-01T00:00:00.000Z",
      });
    });
  });

  describe("buildPublicUrlResponse", () => {
    it("should build public URL response", () => {
      const result = buildPublicUrlResponse("https://cdn.example.com/files-public/photo.jpg");
      expect(result).toEqual({
        publicUrl: "https://cdn.example.com/files-public/photo.jpg",
      });
    });
  });

  describe("calculateExpiresAtISO", () => {
    it("should calculate expiresAt from seconds", () => {
      const now = Date.now();
      const result = calculateExpiresAtISO(600, now);
      const resultTimestamp = new Date(result).getTime();

      expect(resultTimestamp).toBe(now + 600 * 1000);
    });

    it("should handle zero seconds", () => {
      const now = Date.now();
      const result = calculateExpiresAtISO(0, now);
      const resultTimestamp = new Date(result).getTime();

      expect(resultTimestamp).toBe(now);
    });

    it("should return valid ISO string", () => {
      const now = Date.now();
      const result = calculateExpiresAtISO(60, now);
      expect(new Date(result).toISOString()).toBe(result);
    });
  });
});
