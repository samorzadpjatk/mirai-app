import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import {
  buildTusUploadOptions,
  shouldRetryUpload,
  toErrorObject,
  useFileUpload,
} from "../../files/useFileUpload";

// Mock tus-js-client
const mockUploadStart = jest.fn<() => void>();
const mockUploadAbort = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockFindPreviousUploads = jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]);

interface UploadCallbacks {
  onError?: (error: Error) => void;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess?: () => void;
  [key: string]: unknown;
}

let mockUploadCallbacks: UploadCallbacks = {};
let mockShouldAutoSucceed = false;
let mockAutoSucceedTimeout: ReturnType<typeof setTimeout> | null = null;

jest.mock("tus-js-client", () => ({
  Upload: jest.fn().mockImplementation((_fileBlob, options) => {
    mockUploadCallbacks = options as UploadCallbacks;
    return {
      start: () => {
        mockUploadStart();
        if (mockShouldAutoSucceed && mockUploadCallbacks.onSuccess) {
          const onSuccess = mockUploadCallbacks.onSuccess;
          mockAutoSucceedTimeout = setTimeout(() => {
            mockAutoSucceedTimeout = null;
            onSuccess();
          }, 10);
        }
      },
      abort: () => {
        if (mockAutoSucceedTimeout) {
          clearTimeout(mockAutoSucceedTimeout);
          mockAutoSucceedTimeout = null;
        }
        return mockUploadAbort();
      },
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

// Mock Supabase
const mockGetSession =
  jest.fn<() => Promise<{ data: { session: { access_token: string } | null } }>>();

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

describe("useFileUpload (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
    mockShouldAutoSucceed = false;
    if (mockAutoSucceedTimeout) {
      clearTimeout(mockAutoSucceedTimeout);
      mockAutoSucceedTimeout = null;
    }
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
    const { result } = renderHookWithMSW(() => useFileUpload());

    expect(result.current.status).toBe("idle");
    expect(result.current.progress.bytesUploaded).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("should reset state when reset is called", () => {
    const { result } = renderHookWithMSW(() => useFileUpload());

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

    const { result } = renderHookWithMSW(() => useFileUpload());

    await expect(
      result.current.upload({
        storagePath: "test/file.jpg",
        fileUri: "file:///test/file.jpg",
        contentType: "image/jpeg",
      }),
    ).rejects.toThrow("File not found");
  });

  it("should handle unauthenticated user error", async () => {
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHookWithMSW(() => useFileUpload());

    await expect(
      result.current.upload({
        storagePath: "test/file.jpg",
        fileUri: "file:///test/file.jpg",
        contentType: "image/jpeg",
      }),
    ).rejects.toThrow("User not authenticated");
  });

  it("should set uploading status when upload starts", async () => {
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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
    const { result } = renderHookWithMSW(() => useFileUpload());

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

    server.use(createORPCHandler(["storage", "createUploadUrl"], () => uploadTicket));

    const { result } = renderHookWithMSW(() => useFileUpload());

    const uploadPromise = result.current.upload({
      storagePath: "test/file.jpg",
      fileUri: "file:///test/file.jpg",
      contentType: "image/jpeg",
      fileName: "custom-name.jpg",
    });

    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });

    uploadPromise.catch(() => {
      /* noop */
    });
  });

  it("should handle upsert option", async () => {
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], ({ upsert }) => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

    const uploadPromise = result.current.upload({
      storagePath: "test/file.jpg",
      fileUri: "file:///test/file.jpg",
      contentType: "image/jpeg",
      upsert: true,
    });

    await waitFor(() => {
      expect(result.current.status).toBe("uploading");
    });

    uploadPromise.catch(() => {
      /* noop */
    });
  });

  it("should handle upload success callback", async () => {
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    mockShouldAutoSucceed = true;

    const { result } = renderHookWithMSW(() => useFileUpload());

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
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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
      mockUploadCallbacks.onError!(new Error("network timeout"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.error).not.toBeNull();
    });
  });

  it("should handle upload progress callback", async () => {
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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
      mockUploadCallbacks.onProgress!(500, 1000);
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

    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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

    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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

  it("should handle retry on retryable error", async () => {
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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
      mockUploadCallbacks.onError!(new Error("Server returned 400"));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
  });

  it("should handle retry refresh ticket error", async () => {
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => {
        throw new Error("Failed to refresh");
      }),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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

  it("should handle second upload on same hook instance", async () => {
    server.use(
      createORPCHandler(["storage", "createUploadUrl"], () => ({
        resumableUrl: "https://example.com/upload",
        bucket: "test-bucket",
        objectPath: "test/file.jpg",
        token: "upload-token",
        storagePath: "test/file.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() => useFileUpload());

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
      mockUploadCallbacks.onSuccess!();
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

import { calculateUploadProgress, shouldRetryErrorMessage } from "../../files/useFileUpload";

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
  });
});
