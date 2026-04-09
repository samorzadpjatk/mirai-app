import { describe, expect, test } from "bun:test";
import {
  normalizeStoragePath,
  normalizeBucketName,
  createStoragePath,
  parseStoragePath,
  STANDARD_BUCKETS,
} from "../standard";

describe("[UNIT] normalizeStoragePath", () => {
  test("removes leading slashes", () => {
    expect(normalizeStoragePath("/path/to/file")).toBe("path/to/file");
    expect(normalizeStoragePath("///path/to/file")).toBe("path/to/file");
  });

  test("removes trailing slashes", () => {
    expect(normalizeStoragePath("path/to/file/")).toBe("path/to/file");
    expect(normalizeStoragePath("path/to/file///")).toBe("path/to/file");
  });

  test("removes both leading and trailing slashes", () => {
    expect(normalizeStoragePath("/path/to/file/")).toBe("path/to/file");
    expect(normalizeStoragePath("///path/to/file///")).toBe("path/to/file");
  });

  test("converts Windows backslashes to forward slashes", () => {
    expect(normalizeStoragePath("path\\to\\file")).toBe("path/to/file");
    expect(normalizeStoragePath("path\\to\\file\\")).toBe("path/to/file");
  });

  test("filters out empty segments", () => {
    expect(normalizeStoragePath("path//to///file")).toBe("path/to/file");
    expect(normalizeStoragePath("path///to////file")).toBe("path/to/file");
  });

  test("decodes URI components", () => {
    expect(normalizeStoragePath("path%20with%20spaces/file")).toBe(
      "path with spaces/file",
    );
    expect(normalizeStoragePath("file%3Aname")).toBe("file:name");
  });

  test("handles mixed formats", () => {
    expect(normalizeStoragePath("\\//path\\//to///file//")).toBe(
      "path/to/file",
    );
  });

  test("handles simple paths without special characters", () => {
    expect(normalizeStoragePath("path/to/file")).toBe("path/to/file");
    expect(normalizeStoragePath("singlefile")).toBe("singlefile");
  });

  test("returns empty string for paths with only slashes", () => {
    expect(normalizeStoragePath("///")).toBe("");
    expect(normalizeStoragePath("/")).toBe("");
  });

  test("returns empty string for empty input", () => {
    expect(normalizeStoragePath("")).toBe("");
  });
});

describe("[UNIT] normalizeBucketName", () => {
  test("returns exact match for standard bucket names", () => {
    expect(normalizeBucketName("images")).toBe("images");
    expect(normalizeBucketName("videos")).toBe("videos");
    expect(normalizeBucketName("files-public")).toBe("files-public");
  });

  test("handles case-insensitive bucket names", () => {
    expect(normalizeBucketName("IMAGES")).toBe("images");
    expect(normalizeBucketName("VIDEOS")).toBe("videos");
    expect(normalizeBucketName("FILES-PUBLIC")).toBe("files-public");
  });

  test("handles null and undefined", () => {
    expect(normalizeBucketName(null)).toBeNull();
    expect(normalizeBucketName(undefined)).toBeNull();
  });

  test("returns null for unknown bucket names", () => {
    expect(normalizeBucketName("unknown-bucket")).toBeNull();
    expect(normalizeBucketName("")).toBeNull();
    expect(normalizeBucketName("random")).toBeNull();
  });

  test("resolves common aliases to standard buckets", () => {
    expect(normalizeBucketName("image")).toBe("images");
    expect(normalizeBucketName("video")).toBe("videos");
    expect(normalizeBucketName("public")).toBe("files-public");
    expect(normalizeBucketName("file-public")).toBe("files-public");
  });

  test("resolves aliases case-insensitively", () => {
    expect(normalizeBucketName("IMAGE")).toBe("images");
    expect(normalizeBucketName("VIDEO")).toBe("videos");
    expect(normalizeBucketName("PUBLIC")).toBe("files-public");
  });
});

describe("[UNIT] createStoragePath", () => {
  test("creates path with bucket and object path", () => {
    expect(createStoragePath("images", "path/to/file")).toBe(
      "images/path/to/file",
    );
  });

  test("normalizes the object path before combining", () => {
    expect(createStoragePath("images", "/path/to/file/")).toBe(
      "images/path/to/file",
    );
    expect(createStoragePath("videos", "\\path\\to\\file\\")).toBe(
      "videos/path/to/file",
    );
  });

  test("handles empty object path", () => {
    expect(createStoragePath("images", "")).toBe("images/");
  });
});

describe("[UNIT] parseStoragePath", () => {
  test("parses valid storage path into bucket and path", () => {
    const result = parseStoragePath("images/path/to/file");
    expect(result).toEqual({ bucket: "images", path: "path/to/file" });
  });

  test("returns null for path without bucket", () => {
    expect(parseStoragePath("images")).toBeNull();
  });

  test("returns null for invalid bucket names", () => {
    expect(parseStoragePath("invalid-bucket/path")).toBeNull();
  });

  test("returns null for empty path", () => {
    expect(parseStoragePath("")).toBeNull();
  });

  test("normalizes path before parsing", () => {
    const result = parseStoragePath("/images/path/to/file/");
    expect(result).toEqual({ bucket: "images", path: "path/to/file" });
  });

  test("handles Windows paths", () => {
    const result = parseStoragePath("images\\path\\to\\file");
    expect(result).toEqual({ bucket: "images", path: "path/to/file" });
  });

  test("parses paths with aliased bucket names", () => {
    const result = parseStoragePath("image/path/to/file");
    expect(result).toEqual({ bucket: "images", path: "path/to/file" });
  });
});

describe("[UNIT] STANDARD_BUCKETS", () => {
  test("contains expected bucket names", () => {
    expect(STANDARD_BUCKETS.IMAGES).toBe("images");
    expect(STANDARD_BUCKETS.VIDEOS).toBe("videos");
    expect(STANDARD_BUCKETS.PUBLIC).toBe("files-public");
  });
});
