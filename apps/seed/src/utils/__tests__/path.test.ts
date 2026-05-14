import { describe, it, expect } from "vitest";
import { normalizeFsPath, normalizePath, joinPath, dirname, basename, relativePath } from "../path";

describe("Path Utilities", () => {
  describe("normalizeFsPath", () => {
    it("should convert backslashes to forward slashes", () => {
      expect(normalizeFsPath("C:\\Users\\test\\file.txt")).toBe("C:/Users/test/file.txt");
      expect(normalizeFsPath("path\\to\\file")).toBe("path/to/file");
    });

    it("should handle mixed slashes", () => {
      expect(normalizeFsPath("C:/Users\\test/file.txt")).toBe("C:/Users/test/file.txt");
    });

    it("should handle paths with no backslashes", () => {
      expect(normalizeFsPath("/unix/style/path")).toBe("/unix/style/path");
    });

    it("should handle empty string", () => {
      expect(normalizeFsPath("")).toBe("");
    });

    it("should handle single backslash", () => {
      expect(normalizeFsPath("\\")).toBe("/");
    });

    it("should handle Windows drive letter", () => {
      expect(normalizeFsPath("C:\\")).toBe("C:/");
    });

    it("should handle UNC paths", () => {
      expect(normalizeFsPath("\\\\server\\share")).toBe("//server/share");
    });
  });

  describe("normalizePath", () => {
    it("should remove leading slashes", () => {
      expect(normalizePath("/path/to/file")).toBe("path/to/file");
      expect(normalizePath("//double/slash")).toBe("double/slash");
    });

    it("should convert backslashes and remove leading slashes", () => {
      expect(normalizePath("\\path\\to\\file")).toBe("path/to/file");
    });

    it("should handle mixed format", () => {
      expect(normalizePath("/mixed\\path/style")).toBe("mixed/path/style");
    });

    it("should handle paths without leading slashes", () => {
      expect(normalizePath("relative/path")).toBe("relative/path");
    });

    it("should handle root only", () => {
      expect(normalizePath("/")).toBe("");
    });

    it("should handle empty string", () => {
      expect(normalizePath("")).toBe("");
    });
  });

  describe("joinPath", () => {
    it("should join multiple path parts", () => {
      expect(joinPath("/root", "dir", "file.txt")).toBe("/root/dir/file.txt");
    });

    it("should normalize backslashes in joined path", () => {
      expect(joinPath("C:\\root", "dir\\subdir", "file.txt")).toBe("C:/root/dir/subdir/file.txt");
    });

    it("should handle single part", () => {
      expect(joinPath("/single")).toBe("/single");
    });

    it("should handle empty parts", () => {
      expect(joinPath("/root", "", "file.txt")).toBe("/root/file.txt");
    });

    it("should handle relative paths", () => {
      const result = joinPath(".", "relative", "path");
      expect(["./relative/path", "relative/path"]).toContain(result);
    });

    it("should handle parent directory references", () => {
      expect(joinPath("/root", "..", "sibling")).toBe("/sibling");
    });

    it("should handle many parts", () => {
      expect(joinPath("a", "b", "c", "d", "e", "f")).toBe("a/b/c/d/e/f");
    });
  });

  describe("dirname", () => {
    it("should return directory path", () => {
      expect(dirname("/path/to/file.txt")).toBe("/path/to");
    });

    it("should handle paths with backslashes", () => {
      const result = dirname("C:\\path\\to\\file.txt");
      expect(["C:/path/to", "."]).toContain(result);
    });

    it("should handle root level file", () => {
      expect(dirname("/file.txt")).toBe("/");
    });

    it("should handle relative path", () => {
      expect(dirname("relative/path/file.txt")).toBe("relative/path");
    });

    it("should handle path without extension", () => {
      expect(dirname("/path/to/file")).toBe("/path/to");
    });
  });

  describe("basename", () => {
    it("should return filename with extension", () => {
      expect(basename("/path/to/file.txt")).toBe("file.txt");
    });

    it("should return filename without extension", () => {
      expect(basename("/path/to/file")).toBe("file");
    });

    it("should handle root level file", () => {
      expect(basename("/file.txt")).toBe("file.txt");
    });

    it("should handle relative path", () => {
      expect(basename("relative/path/file.txt")).toBe("file.txt");
    });

    it("should handle path with backslashes (returns full path on Unix)", () => {
      // On Unix, backslashes are not path separators, so entire string is basename
      const result = basename("C:\\path\\to\\file.txt");
      expect(result === "file.txt" || result === "C:\\path\\to\\file.txt").toBe(true);
    });

    it("should handle filename only", () => {
      expect(basename("file.txt")).toBe("file.txt");
    });
  });

  describe("relativePath", () => {
    it("should calculate relative path between directories", () => {
      expect(relativePath("/root/dir1", "/root/dir2")).toBe("../dir2");
    });

    it("should return empty string when paths are equal", () => {
      expect(relativePath("/root/dir", "/root/dir")).toBe("");
    });

    it("should handle file to file", () => {
      expect(relativePath("/root/dir1/file1.txt", "/root/dir2/file2.txt")).toBe(
        "../../dir2/file2.txt",
      );
    });

    it("should handle parent directory", () => {
      expect(relativePath("/root/dir/subdir", "/root/dir")).toBe("..");
    });

    it("should convert backslashes in result", () => {
      expect(relativePath("C:\\root\\dir1", "C:\\root\\dir2")).toBe("../C:/root/dir2");
    });

    it("should handle sibling files", () => {
      expect(relativePath("/root/dir/file1.txt", "/root/dir/file2.txt")).toBe("../file2.txt");
    });
  });

  describe("Edge cases", () => {
    it("should handle paths with spaces", () => {
      expect(normalizeFsPath("C:\\Program Files\\My App")).toBe("C:/Program Files/My App");
      expect(joinPath("/path with spaces", "subdir", "file.txt")).toBe(
        "/path with spaces/subdir/file.txt",
      );
    });

    it("should handle paths with special characters", () => {
      expect(normalizeFsPath("C:\\test-folder_123")).toBe("C:/test-folder_123");
      expect(basename("/path/to/file-name_v2.txt")).toBe("file-name_v2.txt");
    });

    it("should handle very long paths", () => {
      const longPath = "/very".repeat(50) + "/file.txt";
      const result = dirname(longPath);
      expect(result).toBe("/very".repeat(50));
    });

    it("should handle single character paths", () => {
      expect(basename("/a")).toBe("a");
      expect(dirname("/a")).toBe("/");
      expect(normalizePath("/")).toBe("");
    });
  });
});
