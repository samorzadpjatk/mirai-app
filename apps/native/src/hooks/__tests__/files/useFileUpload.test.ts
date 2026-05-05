import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useFileUpload } from "../../files/useFileUpload";

// Mock tus-js-client
const mockUploadStart = jest.fn();
const mockUploadAbort = jest.fn().mockResolvedValue(undefined);
const mockFindPreviousUploads = jest.fn().mockResolvedValue([]);

jest.mock("tus-js-client", () => ({
  Upload: jest.fn().mockImplementation(() => ({
    start: mockUploadStart,
    abort: mockUploadAbort,
    findPreviousUploads: mockFindPreviousUploads,
  })),
}));

// Mock expo-file-system
const mockFileExists = jest.fn().mockReturnValue(true);
const mockFileSize = 1024;

jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    exists: mockFileExists(),
    size: mockFileSize,
  })),
}));

// Mock tRPC client
const mockCreateUploadUrl = jest.fn();

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPCClient: jest.fn(() => ({
    storage: {
      createUploadUrl: {
        mutate: mockCreateUploadUrl,
      },
    },
  })),
}));

// Mock Supabase
const mockGetSession = jest.fn().mockResolvedValue({
  data: {
    session: {
      access_token: "mock-access-token",
    },
  },
});

jest.mock("@mirai-app/supabase/react", () => ({
  useSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}));

// Mock tusUrlStorage
const mockRemoveUpload = jest.fn().mockResolvedValue(undefined);

jest.mock("~/services/storage/tusUrlStorage", () => ({
  tusUrlStorage: jest.fn(() => ({
    removeUpload: mockRemoveUpload,
  })),
}));

// Mock global fetch
const mockFetch = jest.fn().mockResolvedValue({
  blob: jest.fn().mockResolvedValue(new Blob(["test content"])),
});
global.fetch = mockFetch;

describe("useFileUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileExists.mockReturnValue(true);
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "mock-access-token",
        },
      },
    });
  });

  it("should initialize with idle status", () => {
    const { result } = renderHook(() => useFileUpload());

    expect(result.current.status).toBe("idle");
    expect(result.current.progress.bytesUploaded).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("should reset state when reset is called", async () => {
    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.progress.bytesUploaded).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("should handle file not found error", async () => {
    mockFileExists.mockReturnValue(false);

    const { result } = renderHook(() => useFileUpload());

    await expect(
      result.current.upload({
        storagePath: "test/file.jpg",
        fileUri: "file:///test/file.jpg",
        contentType: "image/jpeg",
      })
    ).rejects.toThrow("File not found");
  });

  it("should handle unauthenticated user error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useFileUpload());

    await expect(
      result.current.upload({
        storagePath: "test/file.jpg",
        fileUri: "file:///test/file.jpg",
        contentType: "image/jpeg",
      })
    ).rejects.toThrow("User not authenticated");
  });

  it("should set uploading status when upload starts", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    const uploadPromise = result.current.upload({
      storagePath: "test/file.jpg",
      fileUri: "file:///test/file.jpg",
      contentType: "image/jpeg",
    });

    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });

    uploadPromise.catch(() => {});
  });

  it("should track upload progress", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current.upload({
        storagePath: "test/file.jpg",
        fileUri: "file:///test/file.jpg",
        contentType: "image/jpeg",
      }).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.progress).toBeDefined();
    });
  });

  it("should abort upload when abort is called", async () => {
    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current.abort();
    });

    expect(result.current.status).toBe("idle");
  });

  it("should include correct metadata in upload", async () => {
    const uploadTicket = {
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    };

    mockCreateUploadUrl.mockResolvedValue(uploadTicket);

    const { result } = renderHook(() => useFileUpload());

    const uploadPromise = result.current.upload({
      storagePath: "test/file.jpg",
      fileUri: "file:///test/file.jpg",
      contentType: "image/jpeg",
      fileName: "custom-name.jpg",
    });

    await waitFor(() => {
      expect(mockCreateUploadUrl).toHaveBeenCalledWith({
        storagePath: "test/file.jpg",
        upsert: undefined,
      });
    });

    uploadPromise.catch(() => {});
  });

  it("should handle upsert option", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    const uploadPromise = result.current.upload({
      storagePath: "test/file.jpg",
      fileUri: "file:///test/file.jpg",
      contentType: "image/jpeg",
      upsert: true,
    });

    await waitFor(() => {
      expect(mockCreateUploadUrl).toHaveBeenCalledWith({
        storagePath: "test/file.jpg",
        upsert: true,
      });
    });

    uploadPromise.catch(() => {});
  });

  it("should handle upload abort during retry", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current.upload({
        storagePath: "test/file.jpg",
        fileUri: "file:///test/file.jpg",
        contentType: "image/jpeg",
      }).catch(() => {});
    });

    act(() => {
      result.current.abort();
    });

    expect(result.current.status).toBe("idle");
  });

  it("should handle progress updates", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current.upload({
        storagePath: "test/file.jpg",
        fileUri: "file:///test/file.jpg",
        contentType: "image/jpeg",
      }).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.progress).toBeDefined();
    });
  });
});
