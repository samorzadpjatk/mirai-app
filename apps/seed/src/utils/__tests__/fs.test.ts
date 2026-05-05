import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fileExists,
  dirExists,
  readFile,
  readTextFile,
  listFilesRecursive,
} from "../fs";

// Mock Bun global
declare global {
  interface Bun {
    file: ReturnType<typeof vi.fn>;
    Glob: ReturnType<typeof vi.fn>;
  }
}

describe("File System Utilities", () => {
  let mockBunFile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBunFile = vi.fn();
    (globalThis as unknown as { Bun: { file: typeof mockBunFile } }).Bun = {
      file: mockBunFile,
      Glob: vi.fn(),
    };
  });

  describe("fileExists", () => {
    it("should return true when file exists", async () => {
      mockBunFile.mockReturnValue({
        exists: vi.fn().mockResolvedValue(true),
      });

      const result = await fileExists("/path/to/file.txt");

      expect(result).toBe(true);
      expect(mockBunFile).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should return false when file does not exist", async () => {
      mockBunFile.mockReturnValue({
        exists: vi.fn().mockResolvedValue(false),
      });

      const result = await fileExists("/path/to/missing.txt");

      expect(result).toBe(false);
    });

    it("should handle relative paths", async () => {
      mockBunFile.mockReturnValue({
        exists: vi.fn().mockResolvedValue(true),
      });

      await fileExists("./relative/path.txt");

      expect(mockBunFile).toHaveBeenCalledWith("./relative/path.txt");
    });

    it("should handle paths with spaces", async () => {
      mockBunFile.mockReturnValue({
        exists: vi.fn().mockResolvedValue(true),
      });

      await fileExists("/path/to/file with spaces.txt");

      expect(mockBunFile).toHaveBeenCalledWith("/path/to/file with spaces.txt");
    });
  });

  describe("dirExists", () => {
    it("should return true when path is a directory", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      });

      const result = await dirExists("/path/to/dir");

      expect(result).toBe(true);
    });

    it("should return false when path is not a directory", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockResolvedValue({ isDirectory: () => false }),
      });

      const result = await dirExists("/path/to/file.txt");

      expect(result).toBe(false);
    });

    it("should throw when stat fails", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockRejectedValue(new Error("ENOENT")),
      });

      await expect(dirExists("/missing/path")).rejects.toThrow("ENOENT");
    });
  });

  describe("readFile", () => {
    it("should return BunFile instance", () => {
      const mockFile = { text: vi.fn() };
      mockBunFile.mockReturnValue(mockFile);

      const result = readFile("/path/to/file.txt");

      expect(result).toBe(mockFile);
      expect(mockBunFile).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should handle different file types", () => {
      const mockFiles = {
        text: { text: vi.fn() },
        json: { json: vi.fn() },
        stream: { stream: vi.fn() },
      };

      mockBunFile
        .mockReturnValueOnce(mockFiles.text)
        .mockReturnValueOnce(mockFiles.json)
        .mockReturnValueOnce(mockFiles.stream);

      const textFile = readFile("file.txt");
      const jsonFile = readFile("file.json");
      const streamFile = readFile("file.bin");

      expect(textFile).toBe(mockFiles.text);
      expect(jsonFile).toBe(mockFiles.json);
      expect(streamFile).toBe(mockFiles.stream);
    });
  });

  describe("readTextFile", () => {
    it("should return file content as text", async () => {
      mockBunFile.mockReturnValue({
        text: vi.fn().mockResolvedValue("file content"),
      });

      const result = await readTextFile("/path/to/file.txt");

      expect(result).toBe("file content");
    });

    it("should handle empty files", async () => {
      mockBunFile.mockReturnValue({
        text: vi.fn().mockResolvedValue(""),
      });

      const result = await readTextFile("/empty/file.txt");

      expect(result).toBe("");
    });

    it("should handle multiline content", async () => {
      const multilineContent = "line1\nline2\nline3";
      mockBunFile.mockReturnValue({
        text: vi.fn().mockResolvedValue(multilineContent),
      });

      const result = await readTextFile("/multiline/file.txt");

      expect(result).toBe(multilineContent);
    });

    it("should handle unicode content", async () => {
      const unicodeContent = "Hello 世界 🌍";
      mockBunFile.mockReturnValue({
        text: vi.fn().mockResolvedValue(unicodeContent),
      });

      const result = await readTextFile("/unicode/file.txt");

      expect(result).toBe(unicodeContent);
    });
  });

  describe("listFilesRecursive", () => {
    let mockGlob: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockGlob = vi.fn();
      (globalThis as unknown as { Bun: { Glob: typeof mockGlob; file: typeof mockBunFile } }).Bun = {
        file: mockBunFile,
        Glob: mockGlob,
      };
    });

    it("should throw when directory does not exist", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockRejectedValue(new Error("ENOENT")),
      });

      await expect(listFilesRecursive("/nonexistent/dir")).rejects.toThrow("ENOENT");
    });

    it("should return empty array when path is not a directory", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockResolvedValue({ isDirectory: () => false }),
      });

      const result = await listFilesRecursive("/path/to/file.txt");

      expect(result).toEqual([]);
    });

    it("should list all files recursively", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      });

      const mockScan = vi.fn().mockReturnValue([
        "file1.txt",
        "subdir/file2.txt",
        "subdir/nested/file3.txt",
      ]);
      mockGlob.mockReturnValue({ scan: mockScan });

      const result = await listFilesRecursive("/root/dir");

      expect(result).toEqual([
        "/root/dir/file1.txt",
        "/root/dir/subdir/file2.txt",
        "/root/dir/subdir/nested/file3.txt",
      ]);
    });

    it("should handle empty directories", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      });

      const mockScan = vi.fn().mockReturnValue([]);
      mockGlob.mockReturnValue({ scan: mockScan });

      const result = await listFilesRecursive("/empty/dir");

      expect(result).toEqual([]);
    });

    it("should handle glob pattern correctly", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      });

      mockGlob.mockReturnValue({ scan: vi.fn().mockReturnValue([]) });

      await listFilesRecursive("/test/dir");

      expect(mockGlob).toHaveBeenCalledWith("**/*");
    });

    it("should handle special characters in paths", async () => {
      mockBunFile.mockReturnValue({
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      });

      const mockScan = vi.fn().mockReturnValue(["file with spaces.txt", "file-with-dashes.txt"]);
      mockGlob.mockReturnValue({ scan: mockScan });

      const result = await listFilesRecursive("/path with spaces");

      expect(result).toEqual([
        "/path with spaces/file with spaces.txt",
        "/path with spaces/file-with-dashes.txt",
      ]);
    });
  });

  describe("Edge cases", () => {
    it("should handle very long file paths", async () => {
      const longPath = "/very/long/path/".repeat(20) + "file.txt";
      mockBunFile.mockReturnValue({
        exists: vi.fn().mockResolvedValue(true),
      });

      const result = await fileExists(longPath);

      expect(result).toBe(true);
      expect(mockBunFile).toHaveBeenCalledWith(longPath);
    });

    it("should handle paths with dots", async () => {
      mockBunFile.mockReturnValue({
        exists: vi.fn().mockResolvedValue(true),
      });

      await fileExists("./.././relative/path.txt");

      expect(mockBunFile).toHaveBeenCalledWith("./.././relative/path.txt");
    });

    it("should handle Windows-style paths (normalized)", async () => {
      mockBunFile.mockReturnValue({
        exists: vi.fn().mockResolvedValue(true),
      });

      await fileExists("C:\\Users\\test\\file.txt");

      expect(mockBunFile).toHaveBeenCalledWith("C:\\Users\\test\\file.txt");
    });
  });
});