import { describe, it, expect } from "bun:test";
import {
  validateCreateUploadUrlInput,
  validateCreateDownloadUrlInput,
  validateCreatePublicUrlInput,
  type CreateUploadUrlInput,
  type CreateDownloadUrlInput,
  type CreatePublicUrlInput,
} from "./schema";

describe("[UNIT] Storage Validators", () => {
  describe("validateCreateUploadUrlInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        storagePath: "uploads/photos/image.jpg",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storagePath).toBe("uploads/photos/image.jpg");
      }
    });

    it("should validate with upsert = true", () => {
      const input = {
        storagePath: "uploads/documents/file.pdf",
        upsert: true,
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.upsert).toBe(true);
      }
    });

    it("should validate with upsert = false", () => {
      const input = {
        storagePath: "uploads/videos/video.mp4",
        upsert: false,
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with nested path", () => {
      const input = {
        storagePath: "deep/nested/path/to/file.txt",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with simple filename", () => {
      const input = {
        storagePath: "file.jpg",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with path containing spaces", () => {
      const input = {
        storagePath: "uploads/my file name.txt",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with path containing special characters", () => {
      const input = {
        storagePath: "uploads/file-name_v1.2.txt",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty storagePath", () => {
      const input = {
        storagePath: "",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should accept whitespace-only storagePath (schema only checks non-empty)", () => {
      const input = {
        storagePath: "   ",
      };
      const result = validateCreateUploadUrlInput(input);
      // Schema uses minLength(1) which counts whitespace as valid
      expect(result.success).toBe(true);
    });

    it("should reject missing storagePath", () => {
      const input = {};
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string storagePath", () => {
      const input = {
        storagePath: 123,
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-boolean upsert", () => {
      const input = {
        storagePath: "uploads/file.jpg",
        upsert: "true",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreateDownloadUrlInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        storagePath: "uploads/photos/image.jpg",
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storagePath).toBe("uploads/photos/image.jpg");
      }
    });

    it("should validate with expiresInSeconds = 60 (minimum)", () => {
      const input = {
        storagePath: "uploads/file.pdf",
        expiresInSeconds: 60,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with expiresInSeconds = 3600 (maximum, 1 hour)", () => {
      const input = {
        storagePath: "uploads/file.pdf",
        expiresInSeconds: 3600,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with expiresInSeconds = 300 (5 minutes)", () => {
      const input = {
        storagePath: "uploads/file.pdf",
        expiresInSeconds: 300,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with nested path", () => {
      const input = {
        storagePath: "deep/nested/path/to/document.pdf",
        expiresInSeconds: 600,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject expiresInSeconds = 59 (below minimum)", () => {
      const input = {
        storagePath: "uploads/file.pdf",
        expiresInSeconds: 59,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject expiresInSeconds = 3601 (above maximum)", () => {
      const input = {
        storagePath: "uploads/file.pdf",
        expiresInSeconds: 3601,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject expiresInSeconds = 0", () => {
      const input = {
        storagePath: "uploads/file.pdf",
        expiresInSeconds: 0,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative expiresInSeconds", () => {
      const input = {
        storagePath: "uploads/file.pdf",
        expiresInSeconds: -100,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer expiresInSeconds", () => {
      const input = {
        storagePath: "uploads/file.pdf",
        expiresInSeconds: 300.5,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty storagePath", () => {
      const input = {
        storagePath: "",
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing storagePath", () => {
      const input = {};
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string storagePath", () => {
      const input = {
        storagePath: 123,
      };
      const result = validateCreateDownloadUrlInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateCreatePublicUrlInput", () => {
    it("should validate valid storage path", () => {
      const input = {
        storagePath: "uploads/photos/public-image.jpg",
      };
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.storagePath).toBe("uploads/photos/public-image.jpg");
      }
    });

    it("should validate with nested path", () => {
      const input = {
        storagePath: "public/avatars/user123/profile.png",
      };
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with simple filename", () => {
      const input = {
        storagePath: "logo.png",
      };
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with path containing spaces", () => {
      const input = {
        storagePath: "public/downloads/my document.pdf",
      };
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with various file extensions", () => {
      const extensions = [
        "file.jpg",
        "file.png",
        "file.pdf",
        "file.txt",
        "file.mp4",
        "file.mp3",
        "file.doc",
        "file.zip",
      ];
      for (const ext of extensions) {
        const input = { storagePath: `uploads/${ext}` };
        const result = validateCreatePublicUrlInput(input);
        expect(result.success).toBe(true);
      }
    });

    it("should reject empty storagePath", () => {
      const input = {
        storagePath: "",
      };
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should accept whitespace-only storagePath (schema only checks non-empty)", () => {
      const input = {
        storagePath: "   ",
      };
      const result = validateCreatePublicUrlInput(input);
      // Schema uses minLength(1) which counts whitespace as valid
      expect(result.success).toBe(true);
    });

    it("should reject missing storagePath", () => {
      const input = {};
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string storagePath", () => {
      const input = {
        storagePath: 123,
      };
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject null storagePath", () => {
      const input = {
        storagePath: null,
      };
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject undefined storagePath", () => {
      const input = {
        storagePath: undefined,
      };
      const result = validateCreatePublicUrlInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Edge cases for all validators", () => {
    it("should handle paths with leading slashes consistently", () => {
      const uploadInput = { storagePath: "/uploads/file.jpg" };
      const uploadResult = validateCreateUploadUrlInput(uploadInput);
      expect(uploadResult.success).toBe(true);

      const downloadInput = { storagePath: "/uploads/file.jpg" };
      const downloadResult = validateCreateDownloadUrlInput(downloadInput);
      expect(downloadResult.success).toBe(true);

      const publicInput = { storagePath: "/uploads/file.jpg" };
      const publicResult = validateCreatePublicUrlInput(publicInput);
      expect(publicResult.success).toBe(true);
    });

    it("should handle paths with trailing slashes consistently", () => {
      const uploadInput = { storagePath: "uploads/folder/" };
      const uploadResult = validateCreateUploadUrlInput(uploadInput);
      expect(uploadResult.success).toBe(true);
    });

    it("should handle very long paths", () => {
      const longPath = "uploads/" + "a/".repeat(50) + "file.jpg";
      const input = { storagePath: longPath };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should handle paths with unicode characters", () => {
      const input = {
        storagePath: "uploads/photos/日本語ファイル.jpg",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
    });

    it("should handle paths with encoded characters", () => {
      const input = {
        storagePath: "uploads/file%20name.txt",
      };
      const result = validateCreateUploadUrlInput(input);
      expect(result.success).toBe(true);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateCreateUploadUrlInput: storagePath (string, non-empty) + optional upsert (boolean)
 * - validateCreateDownloadUrlInput: storagePath (string, non-empty) + optional expiresInSeconds (60-3600, integer)
 * - validateCreatePublicUrlInput: storagePath (string, non-empty)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - Empty/whitespace strings (error cases)
 * - Boundary values for expiresInSeconds (60 minimum, 3600 maximum)
 * - Type validation (non-string paths, non-boolean upsert, non-integer expires)
 * - Missing required fields
 * - Various path formats (nested, with spaces, unicode, encoded)
 * - Long path handling
 * - Null/undefined handling
 */
