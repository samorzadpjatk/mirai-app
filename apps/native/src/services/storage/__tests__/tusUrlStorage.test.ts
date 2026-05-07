import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { PreviousUpload } from "tus-js-client";
import type { Mock } from "jest-mock";

// Extended interface to properly type the url property
interface PreviousUploadWithUrl extends PreviousUpload {
  url: string;
}

const mockGetItemAsync = jest.fn() as Mock<(key: string) => Promise<string | null>>;
const mockSetItemAsync = jest.fn() as Mock<(key: string, value: string) => Promise<void>>;

jest.mock("expo-secure-store", () => ({
  getItemAsync: (...args: [string]) => mockGetItemAsync(...args),
  setItemAsync: (...args: [string, string]) => mockSetItemAsync(...args),
}));

import { tusUrlStorage } from "~/services/storage/tusUrlStorage";

describe("TUS URL Storage", () => {
  let storage: ReturnType<typeof tusUrlStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = tusUrlStorage();
  });

  describe("findAllUploads", () => {
    it("should return empty array when no uploads stored", async () => {
      mockGetItemAsync.mockResolvedValue(null);

      const result = await storage.findAllUploads();

      expect(result).toEqual([]);
    });

    it("should return all uploads from storage", async () => {
      const storedData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
          key2: createMockUpload("key2", "url2"),
        },
        fingerprint2: {
          key3: createMockUpload("key3", "url3"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedData));

      const result = await storage.findAllUploads();

      expect(result).toHaveLength(3);
      expect((result as PreviousUploadWithUrl[]).map((u) => u.url)).toContain("url1");
      expect((result as PreviousUploadWithUrl[]).map((u) => u.url)).toContain("url2");
      expect((result as PreviousUploadWithUrl[]).map((u) => u.url)).toContain("url3");
    });

    it("should handle parse errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockGetItemAsync.mockResolvedValue("invalid-json");

      const result = await storage.findAllUploads();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to read tus upload storage",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("should handle JSON.parse returning null", async () => {
      mockGetItemAsync.mockResolvedValue("null");

      const result = await storage.findAllUploads();

      expect(result).toEqual([]);
    });

    it("should handle storage read errors", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockGetItemAsync.mockRejectedValue(new Error("Storage error"));

      const result = await storage.findAllUploads();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to read tus upload storage",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("findUploadsByFingerprint", () => {
    it("should return empty array when fingerprint not found", async () => {
      mockGetItemAsync.mockResolvedValue(JSON.stringify({}));

      const result = await storage.findUploadsByFingerprint("unknown");

      expect(result).toEqual([]);
    });

    it("should return uploads for specific fingerprint", async () => {
      const storedData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
          key2: createMockUpload("key2", "url2"),
        },
        fingerprint2: {
          key3: createMockUpload("key3", "url3"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(storedData));

      const result = await storage.findUploadsByFingerprint("fingerprint1");

      expect(result).toHaveLength(2);
      expect((result as PreviousUploadWithUrl[]).map((u) => u.url)).toContain("url1");
      expect((result as PreviousUploadWithUrl[]).map((u) => u.url)).toContain("url2");
    });

    it("should handle parse errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockGetItemAsync.mockResolvedValue("invalid-json");

      const result = await storage.findUploadsByFingerprint("fingerprint1");

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe("addUpload", () => {
    it("should add new upload to empty storage", async () => {
      mockGetItemAsync.mockResolvedValue(null);
      mockSetItemAsync.mockResolvedValue(undefined);

      const upload = createMockUpload("", "url1");
      const key = await storage.addUpload("fingerprint1", upload);

      expect(key).toBeTruthy();
      expect(mockSetItemAsync).toHaveBeenCalled();
      type StorageData = Record<string, Record<string, PreviousUpload>>;
      const storedData = JSON.parse(mockSetItemAsync.mock.calls[0]![1]) as StorageData;
      expect(storedData.fingerprint1).toBeDefined();
      expect(Object.keys(storedData.fingerprint1)).toHaveLength(1);
    });

    it("should add upload to existing fingerprint", async () => {
      const existingData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(existingData));
      mockSetItemAsync.mockResolvedValue(undefined);

      const upload = createMockUpload("", "url2");
      await storage.addUpload("fingerprint1", upload);

      type StorageData = Record<string, Record<string, PreviousUpload>>;
      const storedData = JSON.parse(mockSetItemAsync.mock.calls[0]![1]) as StorageData;
      expect(Object.keys(storedData.fingerprint1)).toHaveLength(2);
    });

    it("should add upload to new fingerprint when others exist", async () => {
      const existingData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(existingData));
      mockSetItemAsync.mockResolvedValue(undefined);

      const upload = createMockUpload("", "url2");
      await storage.addUpload("fingerprint2", upload);

      type StorageData = Record<string, Record<string, PreviousUpload>>;
      const storedData = JSON.parse(mockSetItemAsync.mock.calls[0]![1]) as StorageData;
      expect(storedData.fingerprint1).toBeDefined();
      expect(storedData.fingerprint2).toBeDefined();
    });

    it("should use existing urlStorageKey if provided", async () => {
      mockGetItemAsync.mockResolvedValue(null);
      mockSetItemAsync.mockResolvedValue(undefined);

      const upload = createMockUpload("existing-key", "url1");
      const key = await storage.addUpload("fingerprint1", upload);

      expect(key).toBe("existing-key");
    });

    it("should generate new urlStorageKey if not provided", async () => {
      mockGetItemAsync.mockResolvedValue(null);
      mockSetItemAsync.mockResolvedValue(undefined);

      const upload = createMockUpload("", "url1");
      const key = await storage.addUpload("fingerprint1", upload);

      expect(key).toBeTruthy();
      expect(key).not.toBe("");
    });

    it("should handle storage write errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockGetItemAsync.mockResolvedValue(null);
      mockSetItemAsync.mockRejectedValue(new Error("Write error"));

      const upload = createMockUpload("", "url1");

      // Should not throw, but should log a warning
      const result = await storage.addUpload("fingerprint1", upload);
      expect(result).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to persist tus upload storage",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("removeUpload", () => {
    it("should remove upload by key", async () => {
      const existingData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
          key2: createMockUpload("key2", "url2"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(existingData));
      mockSetItemAsync.mockResolvedValue(undefined);

      await storage.removeUpload("key1");

      type StorageData = Record<string, Record<string, PreviousUpload>>;
      const storedData = JSON.parse(mockSetItemAsync.mock.calls[0]![1]) as StorageData;
      expect(storedData.fingerprint1.key1).toBeUndefined();
      expect(storedData.fingerprint1.key2).toBeDefined();
    });

    it("should remove fingerprint when last upload deleted", async () => {
      const existingData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(existingData));
      mockSetItemAsync.mockResolvedValue(undefined);

      await storage.removeUpload("key1");

      type StorageData = Record<string, Record<string, PreviousUpload>>;
      const storedData = JSON.parse(mockSetItemAsync.mock.calls[0]![1]) as StorageData;
      expect(storedData.fingerprint1).toBeUndefined();
    });

    it("should not write when key not found", async () => {
      const existingData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(existingData));

      await storage.removeUpload("non-existent-key");

      expect(mockSetItemAsync).not.toHaveBeenCalled();
    });

    it("should handle empty storage", async () => {
      mockGetItemAsync.mockResolvedValue(null);

      await storage.removeUpload("key1");

      expect(mockSetItemAsync).not.toHaveBeenCalled();
    });

    it("should handle storage write errors", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const existingData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(existingData));
      mockSetItemAsync.mockRejectedValue(new Error("Write error"));

      await storage.removeUpload("key1");

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to persist tus upload storage",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("should only remove first matching key", async () => {
      const existingData = {
        fingerprint1: {
          key1: createMockUpload("key1", "url1"),
        },
        fingerprint2: {
          key1: createMockUpload("key1", "url2"),
        },
      };
      mockGetItemAsync.mockResolvedValue(JSON.stringify(existingData));
      mockSetItemAsync.mockResolvedValue(undefined);

      await storage.removeUpload("key1");

      type StorageData = Record<string, Record<string, PreviousUpload>>;
      const storedData = JSON.parse(mockSetItemAsync.mock.calls[0]![1]) as StorageData;
      expect(storedData.fingerprint1).toBeUndefined();
      expect(storedData.fingerprint2.key1).toBeDefined();
    });
  });
});

function createMockUpload(
  urlStorageKey: string,
  url: string
): PreviousUpload {
  return {
    urlStorageKey,
    url,
    size: 1000,
    offset: 0,
    metadata: {},
    creationTime: Date.now(),
  };
}
