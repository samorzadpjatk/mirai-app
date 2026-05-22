import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import {
  useFileUpload,
  toErrorObject,
  shouldRetryUpload,
  buildTusUploadOptions,
} from "../../files/useFileUpload";

// Mock tus-js-client
const mockUploadStart = jest.fn<() => void>();
const mockUploadAbort = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockFindPreviousUploads = jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]);

let mockUploadCallbacks: Record<string, unknown> = {};
let mockShouldAutoSucceed = false;

jest.mock("tus-js-client", () => ({
  Upload: jest.fn().mockImplementation((_fileBlob, options) => {
    mockUploadCallbacks = options;
    return {
      start: () => {
        mockUploadStart();
        if (mockShouldAutoSucceed && options.onSuccess) {
          setTimeout(() => options.onSuccess(), 10);
        }
      },
      abort: mockUploadAbort,
      findPreviousUploads: mockFindPreviousUploads,
    };
  }),
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

// Mock oRPC client - using interface for complex return type
interface UploadTicket {
  resumableUrl: string;
  bucket: string;
  objectPath: string;
  token: string;
  storagePath: string;
}

const mockCreateUploadUrl = jest.fn<(...args: unknown[]) => Promise<UploadTicket>>();

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    storage: {
      createUploadUrl: {
        call: (...args: unknown[]) => mockCreateUploadUrl(...args),
      },
    },
  },
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

import { setupMockFetch } from "../../../test-utils/mockFetch";

const mockFetch = setupMockFetch();

describe("useFileUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldAutoSucceed = false;
    mockUploadAbort.mockResolvedValue(undefined);
    mockFindPreviousUploads.mockResolvedValue([]);
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
      }),
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
      }),
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

    uploadPromise.catch(() => {
      /* noop */
    });
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
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
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

    uploadPromise.catch(() => {
      /* noop */
    });
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

    uploadPromise.catch(() => {
      /* noop */
    });
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
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
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
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.progress).toBeDefined();
    });
  });

  it("should handle upload success callback", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    mockShouldAutoSucceed = true;

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
      expect(result.current.result).not.toBeNull();
    });
  });

  it("should handle upload error callback without retry", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(mockUploadCallbacks.onError).toBeDefined();
    });

    act(() => {
      mockUploadCallbacks.onError(new Error("network timeout"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.error).not.toBeNull();
    });
  });

  it("should handle upload progress callback", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(mockUploadCallbacks.onProgress).toBeDefined();
    });

    act(() => {
      mockUploadCallbacks.onProgress(500, 1000);
    });

    await waitFor(() => {
      expect(result.current.progress.percent).toBe(0.5);
    });
  });

  it("should handle previous uploads cleanup", async () => {
    mockFindPreviousUploads.mockResolvedValue([
      { urlStorageKey: "previous-1" },
      { urlStorageKey: "previous-2" },
    ]);

    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(mockRemoveUpload).toHaveBeenCalledTimes(2);
    });
  });

  it("should handle findPreviousUploads error", async () => {
    mockFindPreviousUploads.mockRejectedValue(new Error("Storage error"));
    mockUploadAbort.mockResolvedValue(undefined);

    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });

  it("should handle abort failure after findPreviousUploads error", async () => {
    mockFindPreviousUploads.mockRejectedValue(new Error("Storage error"));
    mockUploadAbort.mockRejectedValue(new Error("Abort failed"));

    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });

  it("should retry upload on retryable error", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(mockUploadCallbacks.onError).toBeDefined();
    });

    mockShouldAutoSucceed = true;

    act(() => {
      mockUploadCallbacks.onError(new Error("Server returned 400"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
  });

  it("should handle retry refresh ticket error", async () => {
    mockCreateUploadUrl
      .mockResolvedValueOnce({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })
      .mockRejectedValueOnce(new Error("Failed to refresh"));

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(mockUploadCallbacks.onError).toBeDefined();
    });

    act(() => {
      mockUploadCallbacks.onError(new Error("Server returned 400"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.error?.message).toBe("Failed to refresh");
    });
  });

  it("should set mounted ref on first upload call", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    result.current
      .upload({
        storagePath: "test/file.jpg",
        fileUri: "file:///test/file.jpg",
        contentType: "image/jpeg",
      })
      .catch(() => undefined);

    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });
  });

  it("should handle second upload on same hook instance", async () => {
    mockCreateUploadUrl.mockResolvedValue({
      resumableUrl: "https://example.com/upload",
      bucket: "test-bucket",
      objectPath: "test/file.jpg",
      token: "upload-token",
      storagePath: "test/file.jpg",
    });

    const { result } = renderHook(() => useFileUpload());

    act(() => {
      result.current
        .upload({
          storagePath: "test/file.jpg",
          fileUri: "file:///test/file.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });

    mockShouldAutoSucceed = true;

    act(() => {
      mockUploadCallbacks.onSuccess();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    mockShouldAutoSucceed = false;

    act(() => {
      result.current
        .upload({
          storagePath: "test/file2.jpg",
          fileUri: "file:///test/file2.jpg",
          contentType: "image/jpeg",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });
  });
});

import {
  shouldRetryErrorMessage,
  calculateUploadProgress,
} from "../../files/useFileUpload";

describe("shouldRetryErrorMessage", () => {
  it("should retry on 400 error", () => {
    expect(shouldRetryErrorMessage("Server returned 400")).toBe(true);
  });

  it("should retry on 403 error", () => {
    expect(shouldRetryErrorMessage("Server returned 403")).toBe(true);
  });

  it("should retry on unable to resume upload", () => {
    expect(shouldRetryErrorMessage("unable to resume upload")).toBe(true);
  });

  it("should retry on missing endpoint", () => {
    expect(shouldRetryErrorMessage("without an endpoint")).toBe(true);
  });

  it("should not retry on unrelated errors", () => {
    expect(shouldRetryErrorMessage("network timeout")).toBe(false);
    expect(shouldRetryErrorMessage("connection refused")).toBe(false);
    expect(shouldRetryErrorMessage("")).toBe(false);
  });

  it("should match error codes with leading space", () => {
    expect(shouldRetryErrorMessage("Server returned 400")).toBe(true);
    expect(shouldRetryErrorMessage("Server returned 403")).toBe(true);
  });

  it("should not match bare error codes without space", () => {
    expect(shouldRetryErrorMessage("400")).toBe(false);
    expect(shouldRetryErrorMessage("403")).toBe(false);
  });
});

describe("calculateUploadProgress", () => {
  it("should calculate percent when bytesTotal is known", () => {
    const result = calculateUploadProgress(500, 1000);
    expect(result).toEqual({
      bytesUploaded: 500,
      bytesTotal: 1000,
      percent: 0.5,
    });
  });

  it("should return null percent when bytesTotal is null", () => {
    const result = calculateUploadProgress(500, null);
    expect(result).toEqual({
      bytesUploaded: 500,
      bytesTotal: null,
      percent: null,
    });
  });

  it("should handle zero bytes uploaded", () => {
    const result = calculateUploadProgress(0, 1000);
    expect(result).toEqual({
      bytesUploaded: 0,
      bytesTotal: 1000,
      percent: 0,
    });
  });

  it("should handle completed upload", () => {
    const result = calculateUploadProgress(1000, 1000);
    expect(result).toEqual({
      bytesUploaded: 1000,
      bytesTotal: 1000,
      percent: 1,
    });
  });
});

describe("toErrorObject", () => {
  it("should return the same Error instance when input is an Error", () => {
    const error = new Error("original");
    expect(toErrorObject(error, "fallback")).toBe(error);
  });

  it("should create a new Error with fallback message for non-Error input", () => {
    const result = toErrorObject("string error", "fallback");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("fallback");
  });

  it("should create a new Error for null input", () => {
    const result = toErrorObject(null, "fallback");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("fallback");
  });

  it("should create a new Error for undefined input", () => {
    const result = toErrorObject(undefined, "fallback");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("fallback");
  });

  it("should create a new Error for object input", () => {
    const result = toErrorObject({ message: "obj" }, "fallback");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("fallback");
  });
});

describe("shouldRetryUpload", () => {
  const retryPredicate = (message: string) => message.includes("retry");

  it("should return true when retry conditions are met", () => {
    expect(shouldRetryUpload(0, 2, false, "retry this", retryPredicate)).toBe(true);
  });

  it("should return false when already retrying", () => {
    expect(shouldRetryUpload(0, 2, true, "retry this", retryPredicate)).toBe(false);
  });

  it("should return false when max attempts reached", () => {
    expect(shouldRetryUpload(1, 2, false, "retry this", retryPredicate)).toBe(false);
    expect(shouldRetryUpload(2, 2, false, "retry this", retryPredicate)).toBe(false);
  });

  it("should return false when predicate returns false", () => {
    expect(shouldRetryUpload(0, 2, false, "network error", retryPredicate)).toBe(false);
  });
});

describe("buildTusUploadOptions", () => {
  it("should build options with all fields", () => {
    const ticket = {
      resumableUrl: "https://example.com/upload",
      token: "test-token",
      bucket: "test-bucket",
      objectPath: "path/to/file.jpg",
    };
    const blob = new Blob(["test"]);
    const options = buildTusUploadOptions(ticket, blob, 1024, "access-token", "image/jpeg");

    expect(options.endpoint).toBe("https://example.com/upload");
    expect(options.uploadSize).toBe(1024);
    expect(options.headers).toEqual({
      Authorization: "Bearer access-token",
      "x-signature": "test-token",
    });
    expect(options.uploadDataDuringCreation).toBe(true);
    expect(options.removeFingerprintOnSuccess).toBe(true);
    expect(options.chunkSize).toBe(6 * 1024 * 1024);
    expect(options.metadata).toEqual({
      bucketName: "test-bucket",
      objectName: "path/to/file.jpg",
      contentType: "image/jpeg",
    });
    expect(options.retryDelays).toEqual([0, 1000, 3000, 5000]);
  });

  it("should handle null bytesTotal", () => {
    const ticket = {
      resumableUrl: "https://example.com/upload",
      token: "test-token",
      bucket: "test-bucket",
      objectPath: "path/to/file.jpg",
    };
    const blob = new Blob(["test"]);
    const options = buildTusUploadOptions(ticket, blob, null, "access-token", "image/jpeg");
    expect(options.uploadSize).toBeUndefined();
  });
});
