import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { useFileDownload, deleteCachedDownload } from "../../files/useFileDownload";

interface DownloadResult {
  uri: string;
  type: string;
  size: number;
}

const mockDownloadFileAsync = jest.fn<() => Promise<DownloadResult>>().mockResolvedValue({
  uri: "file:///cache/downloads/test-file.jpg",
  type: "image/jpeg",
  size: 1024,
});

const mockDirectoryExists = jest.fn<() => boolean>().mockReturnValue(true);
const mockDirectoryCreate = jest.fn<() => void>();
const mockFileExists = jest.fn<() => boolean>().mockReturnValue(false);
const mockFileDelete = jest.fn<() => Promise<void>>();

const createMockFile = () => ({
  get exists() {
    return mockFileExists();
  },
  delete: mockFileDelete,
  type: "image/jpeg",
  size: 1024,
  uri: "file:///cache/downloads/test-file.jpg",
});

jest.mock("expo-file-system", () => {
  const { jest } = require("@jest/globals");
  function MockFile() {
    return createMockFile();
  }
  Object.defineProperty(MockFile, "downloadFileAsync", {
    get() { return mockDownloadFileAsync; },
    configurable: true,
  });
  return {
    Directory: jest.fn().mockImplementation(() => ({
      exists: mockDirectoryExists,
      create: mockDirectoryCreate,
    })),
    File: MockFile,
    Paths: {
      cache: "/cache",
    },
  };
});

jest.mock("expo-crypto", () => {
  const { jest } = require("@jest/globals");
  return {
    CryptoDigestAlgorithm: {
      SHA256: "SHA256",
    },
    digestStringAsync: jest.fn().mockResolvedValue("abc123hash"),
  };
});

interface DownloadUrlResult {
  signedUrl: string;
}

const mockCreateDownloadUrl = jest.fn<(...args: unknown[]) => Promise<DownloadUrlResult>>();

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    storage: {
      createDownloadUrl: {
        call: (...args: unknown[]) => mockCreateDownloadUrl(...args),
      },
    },
  },
}));

describe("useFileDownload", () => {
  beforeEach(() => {
    mockDownloadFileAsync.mockClear();
    mockDownloadFileAsync.mockResolvedValue({
      uri: "file:///cache/downloads/test-file.jpg",
      type: "image/jpeg",
      size: 1024,
    });
    mockDirectoryExists.mockClear();
    mockDirectoryExists.mockReturnValue(true);
    mockFileExists.mockClear();
    mockFileExists.mockReturnValue(false);
    mockFileDelete.mockClear();
    mockDirectoryCreate.mockClear();
    mockCreateDownloadUrl.mockClear();
  });

  it("should initialize with idle status", () => {
    const { result } = renderHook(() => useFileDownload());

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.file).toBeNull();
  });

  it("should reset state when reset is called", () => {
    const { result } = renderHook(() => useFileDownload());

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.file).toBeNull();
  });

  it("should abort download when abort is called", () => {
    const { result } = renderHook(() => useFileDownload());

    act(() => {
      result.current.abort();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("should set loading status when download starts", () => {
    mockFileExists.mockReturnValue(false);
    mockCreateDownloadUrl.mockResolvedValue({
      signedUrl: "https://example.com/signed-file.jpg",
    });

    const { result } = renderHook(() => useFileDownload());

    act(() => {
      result.current
        .download({
          storagePath: "test/file.jpg",
          expiresInSeconds: 3600,
        })
        .catch(() => {
          /* noop */
        });
    });

    expect(result.current.status).toBe("loading");
  });

  it("should return cached file when available", async () => {
    mockFileExists.mockReturnValue(true);

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.download({
        storagePath: "test/file.jpg",
      });
    });

    expect(result.current.status).toBe("success");
    expect(result.current.file).not.toBeNull();
  });

  it("should handle download errors", async () => {
    mockFileExists.mockReturnValue(false);
    mockCreateDownloadUrl.mockRejectedValue(new Error("Download failed"));

    const { result } = renderHook(() => useFileDownload());

    await expect(
      result.current.download({
        storagePath: "test/file.jpg",
      }),
    ).rejects.toThrow("Download failed");
  });

  it("should use publicUrl when provided", async () => {
    mockFileExists.mockReturnValue(false);
    mockCreateDownloadUrl.mockResolvedValue({
      signedUrl: "https://example.com/signed-file.jpg",
    });
    mockDownloadFileAsync.mockResolvedValue({
      uri: "file:///cache/downloads/test-file.jpg",
      type: "image/jpeg",
      size: 1024,
    });

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.download({
        storagePath: "test/file.jpg",
        publicUrl: "https://example.com/public-file.jpg",
      });
    });

    expect(result.current.status).toBe("success");
    expect(mockCreateDownloadUrl).not.toHaveBeenCalled();
  });

  it("should skip cache when skipCache is true", async () => {
    mockFileExists.mockReturnValue(true);
    mockCreateDownloadUrl.mockResolvedValue({
      signedUrl: "https://example.com/signed-file.jpg",
    });
    mockDownloadFileAsync.mockResolvedValue({
      uri: "file:///cache/downloads/test-file.jpg",
      type: "image/jpeg",
      size: 1024,
    });

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.download({
        storagePath: "test/file.jpg",
        skipCache: true,
      });
    });

    expect(result.current.status).toBe("success");
    expect(mockFileDelete).toHaveBeenCalled();
  });

  it("should retry when destination already exists", async () => {
    mockFileExists.mockReturnValue(false);
    mockCreateDownloadUrl.mockResolvedValue({
      signedUrl: "https://example.com/signed-file.jpg",
    });
    mockDownloadFileAsync
      .mockRejectedValueOnce(new Error("destination already exists"))
      .mockResolvedValueOnce({
        uri: "file:///cache/downloads/test-file.jpg",
        type: "image/jpeg",
        size: 1024,
      });

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.download({
        storagePath: "test/file.jpg",
      });
    });

    expect(result.current.status).toBe("success");
    expect(mockDownloadFileAsync).toHaveBeenCalledTimes(2);
  });
});

describe("deleteCachedDownload", () => {
  beforeEach(() => {
    mockFileExists.mockClear();
    mockFileDelete.mockClear();
  });

  it("should delete cached file if exists", async () => {
    mockFileExists.mockReturnValue(true);

    await deleteCachedDownload("test/file.jpg");

    expect(mockFileDelete).toHaveBeenCalled();
  });

  it("should not throw if file does not exist", async () => {
    mockFileExists.mockReturnValue(false);

    await expect(deleteCachedDownload("test/file.jpg")).resolves.not.toThrow();
    expect(mockFileDelete).not.toHaveBeenCalled();
  });
});

import {
  toDownloadResult,
  isDestinationAlreadyExistsError,
  isAbortError,
  getDownloadErrorMessage,
} from "../../files/useFileDownload";

describe("toDownloadResult", () => {
  it("should map file properties to download result", () => {
    const mockFile = {
      uri: "file:///test/image.jpg",
      type: "image/jpeg",
      size: 2048,
    } as unknown as File;

    const result = toDownloadResult(mockFile, "image.jpg");

    expect(result).toEqual({
      uri: "file:///test/image.jpg",
      contentType: "image/jpeg",
      fileName: "image.jpg",
      totalBytes: 2048,
    });
  });
});

describe("isDestinationAlreadyExistsError", () => {
  it("should return true for destination already exists error", () => {
    expect(isDestinationAlreadyExistsError(new Error("destination already exists"))).toBe(true);
    expect(isDestinationAlreadyExistsError(new Error("Destination Already Exists"))).toBe(true);
  });

  it("should return false for other errors", () => {
    expect(isDestinationAlreadyExistsError(new Error("network error"))).toBe(false);
  });

  it("should return false for non-Error values", () => {
    expect(isDestinationAlreadyExistsError("string")).toBe(false);
    expect(isDestinationAlreadyExistsError(null)).toBe(false);
  });
});

describe("isAbortError", () => {
  it("should return true for AbortError", () => {
    const error = new Error("aborted");
    (error as { name: string }).name = "AbortError";
    expect(isAbortError(error)).toBe(true);
  });

  it("should return false for non-AbortError", () => {
    expect(isAbortError(new Error("network error"))).toBe(false);
  });

  it("should return false for non-Error values", () => {
    expect(isAbortError("string")).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});

describe("getDownloadErrorMessage", () => {
  it("should return message from Error", () => {
    expect(getDownloadErrorMessage(new Error("test"))).toBe("test");
  });

  it("should stringify non-Error values", () => {
    expect(getDownloadErrorMessage("string")).toBe("string");
    expect(getDownloadErrorMessage(123)).toBe("123");
    expect(getDownloadErrorMessage(null)).toBe("null");
  });
});
