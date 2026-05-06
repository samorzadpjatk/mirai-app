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

jest.mock("expo-file-system", () => {
  const { jest } = require("@jest/globals");
  return {
    Directory: jest.fn().mockImplementation(() => ({
      exists: mockDirectoryExists,
      create: mockDirectoryCreate,
    })),
    File: Object.assign(
      jest.fn().mockImplementation(() => ({
        get exists() { return mockFileExists(); },
        delete: mockFileDelete,
        type: "image/jpeg",
        size: 1024,
        uri: "file:///cache/downloads/test-file.jpg",
      })),
      { downloadFileAsync: mockDownloadFileAsync }
    ),
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
    digestStringAsync: jest.fn<() => Promise<string>>().mockResolvedValue("abc123hash"),
  };
});

interface DownloadUrlResult {
  signedUrl: string;
}

const mockCreateDownloadUrl = jest.fn<() => Promise<DownloadUrlResult>>();

jest.mock("@mirai-app/trpc/client", () => {
  const { jest } = require("@jest/globals");
  return {
    useTRPCClient: jest.fn(() => ({
      storage: {
        createDownloadUrl: {
          query: (...args: unknown[]) => mockCreateDownloadUrl(...args),
        },
      },
    })),
  };
});

describe("useFileDownload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDirectoryExists.mockReturnValue(true);
    mockFileExists.mockReturnValue(false);
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
      result.current.download({
        storagePath: "test/file.jpg",
        expiresInSeconds: 3600,
      }).catch(() => { /* noop */ });
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
      })
    ).rejects.toThrow("Download failed");
  });
});

describe("deleteCachedDownload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
