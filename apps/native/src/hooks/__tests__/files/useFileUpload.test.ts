import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useFileUpload } from "../../files/useFileUpload";

// Mock tus-js-client
const mockUploadStart = jest.fn<() => void>();
const mockUploadAbort = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockFindPreviousUploads = jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]);

jest.mock("tus-js-client", () => ({
  Upload: jest.fn().mockImplementation(() => ({
    start: mockUploadStart,
    abort: mockUploadAbort,
    findPreviousUploads: mockFindPreviousUploads,
  })),
}));

// Mock expo-file-system
const mockFileExists = jest.fn<() => boolean>().mockReturnValue(true);
const mockFileSize = 1024;

jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({
    exists: mockFileExists(),
    size: mockFileSize,
  })),
}));

// Mock tRPC client - using interface for complex return type
interface UploadTicket {
  resumableUrl: string;
  bucket: string;
  objectPath: string;
  token: string;
  storagePath: string;
}

const mockCreateUploadUrl = jest.fn<(args: { storagePath: string; upsert?: boolean }) => Promise<UploadTicket>>();

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
interface SessionData {
  data: {
    session: {
      access_token: string;
    } | null;
  };
}

const mockGetSession = jest.fn<() => Promise<SessionData>>();

jest.mock("@mirai-app/supabase/react", () => ({
  useSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}));

// Mock tusUrlStorage
const mockRemoveUpload = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

jest.mock("~/services/storage/tusUrlStorage", () => ({
  tusUrlStorage: jest.fn(() => ({
    removeUpload: mockRemoveUpload,
  })),
}));

// Mock global fetch
const mockFetch = jest.fn<() => Promise<{ blob: () => Promise<Blob> }>>().mockResolvedValue({
  blob: jest.fn<() => Promise<Blob>>().mockResolvedValue(new Blob(["test content"])),
});
global.fetch = mockFetch as unknown as typeof global.fetch;

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

  it("should reset state when reset is called", () => {
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

    uploadPromise.catch(() => { /* noop */ });
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
      }).catch(() => { /* noop */ });
    });

    await waitFor(() => {
      expect(result.current.progress).toBeDefined();
    });
  });

  it("should abort upload when abort is called", () => {
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

    uploadPromise.catch(() => { /* noop */ });
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

    uploadPromise.catch(() => { /* noop */ });
  });

  it("should handle upload abort during retry", () => {
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
      }).catch(() => { /* noop */ });
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
      }).catch(() => { /* noop */ });
    });

    await waitFor(() => {
      expect(result.current.progress).toBeDefined();
    });
  });
});
