import { beforeEach, describe, expect, it, vi } from "vitest";
import { dirExists, fileExists, listFilesRecursive, readFile, readTextFile } from "../fs";

// Mock Bun global

const isBunRuntime = typeof Bun !== "undefined";

describe.skipIf(isBunRuntime)("File System Utilities", () => {
  let mockBunFile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBunFile = vi.fn();
    Object.assign(globalThis, { Bun: { file: mockBunFile, Glob: vi.fn() } });
  });

  describe("fileExists", () => {
    it("should return true when file exists", async () => {
      const mockFile: { exists: () => Promise<boolean> } = {
        exists: vi.fn().mockResolvedValue(true),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: boolean = await fileExists("/path/to/file.txt");

      expect(result).toBe(true);
      expect(mockBunFile).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should return false when file does not exist", async () => {
      const mockFile: { exists: () => Promise<boolean> } = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: boolean = await fileExists("/path/to/missing.txt");

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
      const mockFile: { stat: () => Promise<{ isDirectory: () => boolean }> } = {
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: boolean = await dirExists("/path/to/dir");

      expect(result).toBe(true);
    });

    it("should return false when path is not a directory", async () => {
      const mockFile: { stat: () => Promise<{ isDirectory: () => boolean }> } = {
        stat: vi.fn().mockResolvedValue({ isDirectory: () => false }),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: boolean = await dirExists("/path/to/file.txt");

      expect(result).toBe(false);
    });

    it("should throw when stat fails", async () => {
      const mockFile: { stat: () => Promise<never> } = {
        stat: vi.fn().mockRejectedValue(new Error("ENOENT")),
      };
      mockBunFile.mockReturnValue(mockFile);

      await expect(dirExists("/missing/path")).rejects.toThrow("ENOENT");
    });
  });

  describe("readFile", () => {
    it("should return BunFile instance", () => {
      const mockFile: { text: () => Promise<string> } = { text: vi.fn() };
      mockBunFile.mockReturnValue(mockFile);

      const result: { text: () => Promise<string> } = readFile("/path/to/file.txt");

      expect(result).toBe(mockFile);
      expect(mockBunFile).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should handle different file types", () => {
      const mockFiles: {
        text: { text: () => Promise<string> };
        json: { json: () => Promise<unknown> };
        stream: { stream: () => ReadableStream };
      } = {
        text: { text: vi.fn() },
        json: { json: vi.fn() },
        stream: { stream: vi.fn() },
      };

      mockBunFile
        .mockReturnValueOnce(mockFiles.text)
        .mockReturnValueOnce(mockFiles.json)
        .mockReturnValueOnce(mockFiles.stream);

      const textFile: { text: () => Promise<string> } = readFile("file.txt");
      const jsonFile: { json: () => Promise<unknown> } = readFile("file.json");
      const streamFile: { stream: () => ReadableStream } = readFile("file.bin");

      expect(textFile).toBe(mockFiles.text);
      expect(jsonFile).toBe(mockFiles.json);
      expect(streamFile).toBe(mockFiles.stream);
    });
  });

  describe("readTextFile", () => {
    it("should return file content as text", async () => {
      const mockFile: { text: () => Promise<string> } = {
        text: vi.fn().mockResolvedValue("file content"),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: string = await readTextFile("/path/to/file.txt");

      expect(result).toBe("file content");
    });

    it("should handle empty files", async () => {
      const mockFile: { text: () => Promise<string> } = {
        text: vi.fn().mockResolvedValue(""),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: string = await readTextFile("/empty/file.txt");

      expect(result).toBe("");
    });

    it("should handle multiline content", async () => {
      const multilineContent = "line1\nline2\nline3";
      const mockFile: { text: () => Promise<string> } = {
        text: vi.fn().mockResolvedValue(multilineContent),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: string = await readTextFile("/multiline/file.txt");

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
      Object.assign(globalThis, { Bun: { file: mockBunFile, Glob: mockGlob } });
    });

    it("should throw when directory does not exist", async () => {
      const mockFile: { stat: () => Promise<never> } = {
        stat: vi.fn().mockRejectedValue(new Error("ENOENT")),
      };
      mockBunFile.mockReturnValue(mockFile);

      await expect(listFilesRecursive("/nonexistent/dir")).rejects.toThrow("ENOENT");
    });

    it("should return empty array when path is not a directory", async () => {
      const mockFile: { stat: () => Promise<{ isDirectory: () => boolean }> } = {
        stat: vi.fn().mockResolvedValue({ isDirectory: () => false }),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: string[] = await listFilesRecursive("/path/to/file.txt");

      expect(result).toEqual([]);
    });

    it("should list all files recursively", async () => {
      const mockFile: { stat: () => Promise<{ isDirectory: () => boolean }> } = {
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      };
      mockBunFile.mockReturnValue(mockFile);

      const mockScan = vi
        .fn()
        .mockReturnValue(["file1.txt", "subdir/file2.txt", "subdir/nested/file3.txt"]);
      const mockGlobInstance: { scan: typeof mockScan } = { scan: mockScan };
      mockGlob.mockImplementation(function () {
        return mockGlobInstance;
      });

      const result: string[] = await listFilesRecursive("/empty/dir");

      expect(result).toEqual([
        "/empty/dir/file1.txt",
        "/empty/dir/subdir/file2.txt",
        "/empty/dir/subdir/nested/file3.txt",
      ]);
    });

    it("should handle glob pattern correctly", async () => {
      const mockFile: { stat: () => Promise<{ isDirectory: () => boolean }> } = {
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      };
      mockBunFile.mockReturnValue(mockFile);

      const mockScan = vi.fn().mockReturnValue([]);
      const mockGlobInstance: { scan: typeof mockScan } = { scan: mockScan };
      mockGlob.mockImplementation(function () {
        return mockGlobInstance;
      });

      await listFilesRecursive("/test/dir");

      expect(mockGlob).toHaveBeenCalledWith("**/*");
    });

    it("should handle special characters in paths", async () => {
      const mockFile: { stat: () => Promise<{ isDirectory: () => boolean }> } = {
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      };
      mockBunFile.mockReturnValue(mockFile);

      const mockScan = vi.fn().mockReturnValue(["file with spaces.txt", "file-with-dashes.txt"]);
      const mockGlobInstance: { scan: typeof mockScan } = { scan: mockScan };
      mockGlob.mockImplementation(function () {
        return mockGlobInstance;
      });

      const result: string[] = await listFilesRecursive("/path with spaces");

      expect(result).toEqual([
        "/path with spaces/file with spaces.txt",
        "/path with spaces/file-with-dashes.txt",
      ]);
    });
  });

  describe("Edge cases", () => {
    it("should handle very long file paths", async () => {
      const longPath = "/very/long/path/".repeat(20) + "file.txt";
      const mockFile: { exists: () => Promise<boolean> } = {
        exists: vi.fn().mockResolvedValue(true),
      };
      mockBunFile.mockReturnValue(mockFile);

      const result: boolean = await fileExists(longPath);

      expect(result).toBe(true);
      expect(mockBunFile).toHaveBeenCalledWith(longPath);
    });

    it("should handle paths with dots", async () => {
      const mockFile: { exists: () => Promise<boolean> } = {
        exists: vi.fn().mockResolvedValue(true),
      };
      mockBunFile.mockReturnValue(mockFile);

      await fileExists("./.././relative/path.txt");

      expect(mockBunFile).toHaveBeenCalledWith("./.././relative/path.txt");
    });

    it("should handle Windows-style paths (normalized)", async () => {
      const mockFile: { exists: () => Promise<boolean> } = {
        exists: vi.fn().mockResolvedValue(true),
      };
      mockBunFile.mockReturnValue(mockFile);

      await fileExists("C:\\Users\\test\\file.txt");

      expect(mockBunFile).toHaveBeenCalledWith("C:\\Users\\test\\file.txt");
    });
  });
});
