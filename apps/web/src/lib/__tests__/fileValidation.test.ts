import { describe, test, expect } from "bun:test";
import {
  formatBytes,
  validateFileType,
  validateFileSize,
  validateImageFile,
  DEFAULT_MAX_FILE_SIZE_MB,
  DEFAULT_IMAGE_MIME_TYPES,
} from "../fileValidation";

describe("[UNIT] formatBytes", () => {
  describe("edge cases", () => {
    test("returns '0 B' for zero bytes", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    test("returns '0 B' for negative values", () => {
      expect(formatBytes(-1)).toBe("0 B");
      expect(formatBytes(-1024)).toBe("0 B");
    });

    test("returns '0 B' for NaN", () => {
      expect(formatBytes(NaN)).toBe("0 B");
    });

    test("returns '0 B' for Infinity", () => {
      expect(formatBytes(Infinity)).toBe("0 B");
      expect(formatBytes(-Infinity)).toBe("0 B");
    });

    test("returns fractional bytes for values less than 1", () => {
      expect(formatBytes(0.5)).toBe("0.5 B");
    });
  });

  describe("unit conversion", () => {
    test("returns bytes for values less than 1024", () => {
      expect(formatBytes(1)).toBe("1 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1023)).toBe("1023 B");
    });

    test("converts to KB correctly", () => {
      expect(formatBytes(1024)).toBe("1.0 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(10240)).toBe("10.0 KB");
    });

    test("converts to MB correctly", () => {
      expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
      expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
      expect(formatBytes(10 * 1024 * 1024)).toBe("10.0 MB");
    });

    test("converts to GB correctly", () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
    });

    test("converts to TB correctly", () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1.0 TB");
    });

    test("handles maximum TB boundary", () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024 * 1024)).toBe("1024.0 TB");
    });
  });

  describe("decimal formatting", () => {
    test("uses one decimal place", () => {
      expect(formatBytes(1500)).toBe("1.5 KB");
      expect(formatBytes(1600)).toBe("1.6 KB");
    });

    test("handles fractional results", () => {
      expect(formatBytes(1024 + 512)).toBe("1.5 KB");
      expect(formatBytes(1024 * 1024 + 512 * 1024)).toBe("1.5 MB");
    });
  });
});

describe("validateFileType", () => {
  const createMockFile = (type: string): File =>
    new File([""], "test.txt", { type });

  describe("with allowed types", () => {
    test("returns null for allowed MIME type", () => {
      const file = createMockFile("image/jpeg");
      const allowed = ["image/jpeg", "image/png"];
      expect(validateFileType(file, allowed)).toBeNull();
    });

    test("returns null for another allowed type", () => {
      const file = createMockFile("image/png");
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      expect(validateFileType(file, allowed)).toBeNull();
    });

    test("returns error for disallowed type", () => {
      const file = createMockFile("application/pdf");
      const allowed = ["image/jpeg", "image/png"];
      expect(validateFileType(file, allowed)).toBe(
        "Unsupported file type (application/pdf).",
      );
    });

    test("handles unknown/empty type", () => {
      const file = createMockFile("");
      const allowed = ["image/jpeg"];
      expect(validateFileType(file, allowed)).toBe(
        "Unsupported file type (unknown).",
      );
    });
  });

  describe("with empty allowed list", () => {
    test("returns null when no types are specified", () => {
      const file = createMockFile("application/pdf");
      expect(validateFileType(file, [])).toBeNull();
    });
  });

  describe("error message formatting", () => {
    test("includes the actual file type in error", () => {
      const file = createMockFile("video/mp4");
      const result = validateFileType(file, ["image/jpeg"]);
      expect(result).toContain("video/mp4");
    });

    test("handles 'unknown' for missing type", () => {
      const file = createMockFile("");
      const result = validateFileType(file, ["image/jpeg"]);
      expect(result).toContain("unknown");
    });
  });
});

describe("validateFileSize", () => {
  const MB_IN_BYTES = 1024 * 1024;
  const createMockFile = (sizeBytes: number): File =>
    new File([new ArrayBuffer(sizeBytes)], "test.txt");

  describe("within limit", () => {
    test("returns null when file is within size limit", () => {
      const file = createMockFile(1 * MB_IN_BYTES);
      expect(validateFileSize(file, 10)).toBeNull();
    });

    test("returns null for exact size limit", () => {
      const file = createMockFile(10 * MB_IN_BYTES);
      expect(validateFileSize(file, 10)).toBeNull();
    });

    test("returns null for small files", () => {
      const file = createMockFile(100);
      expect(validateFileSize(file, 1)).toBeNull();
    });
  });

  describe("exceeding limit", () => {
    test("returns error when file exceeds limit", () => {
      const file = createMockFile(11 * MB_IN_BYTES);
      const result = validateFileSize(file, 10);
      expect(result).toContain("File is too large");
      expect(result).toContain("11.0 MB");
      expect(result).toContain("10 MB");
    });

    test("returns error for significantly oversized files", () => {
      const file = createMockFile(100 * MB_IN_BYTES);
      const result = validateFileSize(file, 5);
      expect(result).toContain("100.0 MB");
      expect(result).toContain("5 MB");
    });
  });

  describe("edge cases", () => {
    test("handles zero or negative maxSizeMb by treating as 1 MB", () => {
      const file = createMockFile(2 * MB_IN_BYTES);
      expect(validateFileSize(file, 0)).toContain("too large");
      expect(validateFileSize(file, -1)).toContain("too large");
    });
  });
});

describe("validateImageFile", () => {
  const MB_IN_BYTES = 1024 * 1024;
  const createMockImageFile = (type: string, sizeBytes: number): File =>
    new File([new ArrayBuffer(sizeBytes)], "image.jpg", { type });

  describe("combining type and size validation", () => {
    test("returns null for valid image within limits", () => {
      const file = createMockImageFile("image/jpeg", 1 * MB_IN_BYTES);
      expect(validateImageFile(file)).toBeNull();
    });

    test("returns type error for invalid type even if size is valid", () => {
      const file = createMockImageFile("application/pdf", 1 * MB_IN_BYTES);
      const result = validateImageFile(file);
      expect(result).toContain("Unsupported file type");
    });

    test("returns size error for valid type but oversized file", () => {
      const file = createMockImageFile("image/jpeg", 20 * MB_IN_BYTES);
      const result = validateImageFile(file);
      expect(result).toContain("too large");
    });

    test("returns type error when both type and size are invalid", () => {
      const file = createMockImageFile("application/pdf", 20 * MB_IN_BYTES);
      const result = validateImageFile(file);
      expect(result).toContain("Unsupported file type");
    });
  });

  describe("custom options", () => {
    test("uses custom max size when provided", () => {
      const file = createMockImageFile("image/jpeg", 15 * MB_IN_BYTES);
      expect(validateImageFile(file, { maxSizeMb: 20 })).toBeNull();
      expect(validateImageFile(file, { maxSizeMb: 10 })).toContain("too large");
    });

    test("uses custom allowed types when provided", () => {
      const file = createMockImageFile("image/svg+xml", 1 * MB_IN_BYTES);
      expect(
        validateImageFile(file, { allowedMimeTypes: ["image/svg+xml"] }),
      ).toBeNull();
      expect(validateImageFile(file)).toContain("Unsupported file type");
    });
  });

  describe("default options", () => {
    test("uses DEFAULT_MAX_FILE_SIZE_MB (10) when not specified", () => {
      const file = createMockImageFile("image/jpeg", 11 * MB_IN_BYTES);
      expect(validateImageFile(file)).toContain("too large");
    });

    test("uses DEFAULT_IMAGE_MIME_TYPES when not specified", () => {
      const webpFile = createMockImageFile("image/webp", 1 * MB_IN_BYTES);
      expect(validateImageFile(webpFile)).toBeNull();

      const gifFile = createMockImageFile("image/gif", 1 * MB_IN_BYTES);
      expect(validateImageFile(gifFile)).toBeNull();
    });
  });
});

describe("constants", () => {
  test("DEFAULT_MAX_FILE_SIZE_MB is 10", () => {
    expect(DEFAULT_MAX_FILE_SIZE_MB).toBe(10);
  });

  test("DEFAULT_IMAGE_MIME_TYPES contains expected types", () => {
    expect(DEFAULT_IMAGE_MIME_TYPES).toEqual([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
  });

  test("DEFAULT_IMAGE_MIME_TYPES is readonly", () => {
    // Type-level check: the array should be typed as readonly
    const _typeCheck: readonly string[] = DEFAULT_IMAGE_MIME_TYPES;
    expect(_typeCheck).toBeDefined();
  });
});
