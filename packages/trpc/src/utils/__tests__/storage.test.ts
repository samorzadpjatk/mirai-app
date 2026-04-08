import { describe, expect, test, mock } from "bun:test";
import {
  parseSupabaseStorageObject,
  parseSupabaseStoragePath,
  normalizeSupabaseStoragePath,
  SUPABASE_OBJECT_PREFIXES,
  IMAGE_BUCKET,
  VIDEO_BUCKET,
  PUBLIC_BUCKET,
} from "../storage";

describe("storage utils", () => {
  describe("parseSupabaseStorageObject", () => {
    test("returns null for empty string", () => {
      expect(parseSupabaseStorageObject("")).toBeNull();
    });

    test("returns null for whitespace only string", () => {
      expect(parseSupabaseStorageObject("   ")).toBeNull();
    });

    test("returns null for invalid URL", () => {
      expect(parseSupabaseStorageObject("not-a-valid-url")).toBeNull();
    });
  });

  describe("parseSupabaseStoragePath", () => {
    test("parses bucket/path format", () => {
      const path = "images/some/path/file.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).not.toBeNull();
      expect(result?.bucket).toBe("images");
      expect(result?.path).toBe("some/path/file.jpg");
    });

    test("returns null for empty string", () => {
      expect(parseSupabaseStoragePath("")).toBeNull();
    });

    test("returns null for whitespace only", () => {
      expect(parseSupabaseStoragePath("   ")).toBeNull();
    });

    test("infers bucket from files-public prefix", () => {
      const path = "files-public/some/file.txt";
      const result = parseSupabaseStoragePath(path);
      expect(result).not.toBeNull();
      expect(result?.bucket).toBe(PUBLIC_BUCKET);
      expect(result?.path).toBe("some/file.txt");
    });

    test("infers bucket from avatar prefix", () => {
      const path = "avatar/user123.png";
      const result = parseSupabaseStoragePath(path);
      expect(result).not.toBeNull();
      expect(result?.bucket).toBe(IMAGE_BUCKET);
      expect(result?.path).toBe("avatar/user123.png");
    });

    test("infers bucket from group prefix", () => {
      const path = "group/team.png";
      const result = parseSupabaseStoragePath(path);
      expect(result).not.toBeNull();
      expect(result?.bucket).toBe(IMAGE_BUCKET);
    });

    test("infers bucket from trips prefix", () => {
      const path = "trips/adventure.jpg";
      const result = parseSupabaseStoragePath(path);
      expect(result).not.toBeNull();
      expect(result?.bucket).toBe(IMAGE_BUCKET);
    });

    test("handles single segment as PUBLIC_BUCKET", () => {
      const path = "singlefile.txt";
      const result = parseSupabaseStoragePath(path);
      expect(result).not.toBeNull();
      expect(result?.bucket).toBe(PUBLIC_BUCKET);
    });
  });

  describe("normalizeSupabaseStoragePath", () => {
    test("normalizes valid storage path with bucket and path", () => {
      const path = "images/some/path/file.png";
      const result = normalizeSupabaseStoragePath(path);
      expect(result).not.toBeNull();
      expect(result?.bucket).toBe("images");
      expect(result?.path).toBe("some/path/file.png");
      expect(result?.storagePath).toBe("images/some/path/file.png");
    });

    test("returns null for invalid path", () => {
      expect(normalizeSupabaseStoragePath("")).toBeNull();
    });
  });

  describe("exports", () => {
    test("SUPABASE_OBJECT_PREFIXES contains expected values", () => {
      expect(SUPABASE_OBJECT_PREFIXES.has("public")).toBe(true);
      expect(SUPABASE_OBJECT_PREFIXES.has("sign")).toBe(true);
      expect(SUPABASE_OBJECT_PREFIXES.has("authenticated")).toBe(true);
    });

    test("IMAGE_BUCKET, VIDEO_BUCKET, PUBLIC_BUCKET are defined", () => {
      expect(IMAGE_BUCKET).toBeDefined();
      expect(VIDEO_BUCKET).toBeDefined();
      expect(PUBLIC_BUCKET).toBeDefined();
    });
  });
});
