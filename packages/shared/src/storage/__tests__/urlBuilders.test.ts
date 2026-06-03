import { describe, it, expect } from "vitest";
import {
  buildResumableUrl,
  buildPublicObjectUrl,
  rewriteSignedUrlHost,
  normalizeImageReference,
} from "../../storage/urlBuilders";

describe("URL Builders", () => {
  describe("buildResumableUrl", () => {
    it("should build resumable endpoint for standard supabase URL", () => {
      const result = buildResumableUrl("https://abc123.supabase.co");
      expect(result).toBe("https://abc123.storage.supabase.co/storage/v1/upload/resumable/sign");
    });

    it("should not rewrite host if already a storage host", () => {
      const result = buildResumableUrl("https://abc123.storage.supabase.co");
      expect(result).toBe("https://abc123.storage.supabase.co/storage/v1/upload/resumable/sign");
    });

    it("should handle URL with trailing slash", () => {
      const result = buildResumableUrl("https://abc123.supabase.co/");
      expect(result).toBe("https://abc123.storage.supabase.co/storage/v1/upload/resumable/sign");
    });

    it("should handle non-supabase URL via fallback", () => {
      const result = buildResumableUrl("http://localhost:54321");
      expect(result).toBe("http://localhost:54321/storage/v1/upload/resumable/sign");
    });

    it("should handle URL with path and query via fallback", () => {
      const result = buildResumableUrl("http://example.com/path?query=1");
      expect(result).toBe("http://example.com/storage/v1/upload/resumable/sign");
    });

    it("should handle invalid URL via fallback", () => {
      const result = buildResumableUrl("not-a-url");
      expect(result).toBe("not-a-url/storage/v1/upload/resumable/sign");
    });
  });

  describe("buildPublicObjectUrl", () => {
    it("should build public URL base for standard supabase URL", () => {
      const result = buildPublicObjectUrl("https://abc123.supabase.co");
      expect(result).toBe("https://abc123.storage.supabase.co/storage/v1/object/public");
    });

    it("should not rewrite host if already a storage host", () => {
      const result = buildPublicObjectUrl("https://abc123.storage.supabase.co");
      expect(result).toBe("https://abc123.storage.supabase.co/storage/v1/object/public");
    });

    it("should handle URL with trailing slash", () => {
      const result = buildPublicObjectUrl("https://abc123.supabase.co/");
      expect(result).toBe("https://abc123.storage.supabase.co/storage/v1/object/public");
    });

    it("should handle non-supabase URL via fallback", () => {
      const result = buildPublicObjectUrl("http://localhost:54321");
      expect(result).toBe("http://localhost:54321/storage/v1/object/public");
    });

    it("should handle URL with path and query via fallback", () => {
      const result = buildPublicObjectUrl("http://example.com/path?query=1");
      expect(result).toBe("http://example.com/storage/v1/object/public");
    });

    it("should handle invalid URL via fallback", () => {
      const result = buildPublicObjectUrl("not-a-url");
      expect(result).toBe("not-a-url/storage/v1/object/public");
    });
  });

  describe("rewriteSignedUrlHost", () => {
    it("should rewrite signed URL host with public URL base", () => {
      const signedUrl =
        "https://abc123.supabase.co/storage/v1/object/sign/images/photo.jpg?token=xyz";
      const publicUrlBase = "https://cdn.example.com";
      const result = rewriteSignedUrlHost(signedUrl, publicUrlBase);
      expect(result).toBe(
        "https://cdn.example.com/storage/v1/object/sign/images/photo.jpg?token=xyz",
      );
    });

    it("should rewrite protocol and port", () => {
      const signedUrl = "http://abc123.supabase.co:8080/storage/v1/object/sign/images/photo.jpg";
      const publicUrlBase = "https://cdn.example.com:8443";
      const result = rewriteSignedUrlHost(signedUrl, publicUrlBase);
      expect(result).toBe("https://cdn.example.com:8443/storage/v1/object/sign/images/photo.jpg");
    });

    it("should return original signed URL when publicUrlBase is undefined", () => {
      const signedUrl = "https://abc123.supabase.co/storage/v1/object/sign/images/photo.jpg";
      const result = rewriteSignedUrlHost(signedUrl, undefined);
      expect(result).toBe(signedUrl);
    });

    it("should return original signed URL when publicUrlBase is empty string", () => {
      const signedUrl = "https://abc123.supabase.co/storage/v1/object/sign/images/photo.jpg";
      const result = rewriteSignedUrlHost(signedUrl, "");
      expect(result).toBe(signedUrl);
    });

    it("should fall back to original signed URL on invalid signed URL", () => {
      const signedUrl = "not-a-valid-url";
      const publicUrlBase = "https://cdn.example.com";
      const result = rewriteSignedUrlHost(signedUrl, publicUrlBase);
      expect(result).toBe(signedUrl);
    });

    it("should fall back to original signed URL on invalid public URL base", () => {
      const signedUrl = "https://abc123.supabase.co/storage/v1/object/sign/images/photo.jpg";
      const publicUrlBase = "not-a-valid-url";
      const result = rewriteSignedUrlHost(signedUrl, publicUrlBase);
      expect(result).toBe(signedUrl);
    });

    it("should preserve query parameters and path", () => {
      const signedUrl =
        "https://old.host.com/storage/v1/object/sign/bucket/file.png?token=abc&expires=123";
      const publicUrlBase = "https://new.host.com";
      const result = rewriteSignedUrlHost(signedUrl, publicUrlBase);
      expect(result).toBe(
        "https://new.host.com/storage/v1/object/sign/bucket/file.png?token=abc&expires=123",
      );
    });
  });

  describe("normalizeImageReference", () => {
    it("returns undefined for undefined input", () => {
      const result = normalizeImageReference(undefined);
      expect(result).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      const result = normalizeImageReference("");
      expect(result).toBeUndefined();
    });

    it("returns original value for external HTTP URL", () => {
      const result = normalizeImageReference("https://example.com/image.jpg");
      expect(result).toBe("https://example.com/image.jpg");
    });

    it("returns normalized path for Supabase storage URL", () => {
      const result = normalizeImageReference(
        "https://abc123.supabase.co/storage/v1/object/public/images/photo.jpg",
      );
      expect(result).toBe("images/photo.jpg");
    });

    it("returns normalized path for direct bucket/path format", () => {
      const result = normalizeImageReference("images/avatar/user1.png");
      expect(result).toBe("images/avatar/user1.png");
    });

    it("returns normalized path for inferred avatar path", () => {
      const result = normalizeImageReference("avatar/user1.png");
      expect(result).toBe("images/avatar/user1.png");
    });

    it("returns normalized path for inferred challenge path", () => {
      const result = normalizeImageReference("challenge/banner.png");
      expect(result).toBe("images/challenge/banner.png");
    });

    it("returns normalized path for inferred group path", () => {
      const result = normalizeImageReference("group/logo.png");
      expect(result).toBe("images/group/logo.png");
    });
  });
});
