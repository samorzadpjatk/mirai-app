/// <reference lib="dom" />

// Set up environment variables at the very top
// Note: These values must be consistent with other test files due to module caching
process.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.PUBLIC_GRAPHQL_API_URL = "http://localhost:3000/graphql";
process.env.PUBLIC_GRAPHQL_WS_URL = "ws://localhost:3000/graphql";

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import type { useWebFileUpload as useWebFileUploadType } from "../useWebFileUpload";

// Mock dependencies - these are hoisted by Bun
const mockMutate = mock(() =>
  Promise.resolve({
    token: "mock-token",
    bucket: "mock-bucket",
    objectPath: "mock/path",
    storagePath: "mock/storage/path",
  }),
);

mock.module("@mirai-app/frameworks/graphql/client", () => ({
  useGraphQL: () => ({
    storage: {
      createUploadUrl: {
        mutate: mockMutate,
      },
      createDownloadUrl: {
        query: () =>
          Promise.resolve({ signedUrl: "https://example.com/download" }),
      },
    },
  }),
  // Include getGraphQLClient for compatibility with other tests
  getGraphQLClient: () => ({
    client: {
      user: {
        getMy: {
          query: () => Promise.resolve(null),
        },
      },
    },
    cleanup: () => Promise.resolve(),
  }),
}));

// Store for mock auth state
let mockAuthState = {
  user: null,
  session: { access_token: "mock-access-token" },
  isLoading: false,
  isAuthenticated: false,
};

mock.module("@mirai-app/frameworks/auth/client", () => ({
  authStore: {
    getState: () => mockAuthState,
    setState: (updater: any) => {
      if (typeof updater === "function") {
        mockAuthState = updater(mockAuthState);
      } else {
        mockAuthState = { ...mockAuthState, ...updater };
      }
    },
    subscribe: () => () => {},
  },
}));

// Store reference to the hook (loaded dynamically)
let useWebFileUpload: typeof useWebFileUploadType;

describe("[UNIT] useWebFileUpload", () => {
  // Load the hook module inside describe but outside tests
  // This runs after mocks are set up but before tests run
  beforeEach(async () => {
    mockMutate.mockClear();
    // Load hook fresh for each test to ensure clean state
    if (!useWebFileUpload) {
      const mod = await import("../useWebFileUpload");
      useWebFileUpload = mod.useWebFileUpload;
    }
  });

  describe("[UNIT] initial state", () => {
    test("starts with idle status", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(result.current.status).toBe("idle");
    });

    test("starts with zero progress", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(result.current.progress.loadedBytes).toBe(0);
      expect(result.current.progress.totalBytes).toBeNull();
      expect(result.current.progress.percent).toBeNull();
    });

    test("starts with null error", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(result.current.error).toBeNull();
    });

    test("starts with null result", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(result.current.result).toBeNull();
    });

    test("starts with null selectedFile", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(result.current.selectedFile).toBeNull();
    });

    test("starts with null previewUrl", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(result.current.previewUrl).toBeNull();
    });
  });

  describe("[UNIT] selectFile", () => {
    test("selects a valid file", () => {
      const { result } = renderHook(() => useWebFileUpload());
      const mockFile = new File(["test content"], "test.jpg", {
        type: "image/jpeg",
      });

      act(() => {
        result.current.selectFile(mockFile);
      });

      expect(result.current.selectedFile).toBe(mockFile);
      expect(result.current.error).toBeNull();
    });

    test("clears selected file when null is passed", () => {
      const { result } = renderHook(() => useWebFileUpload());
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      act(() => {
        result.current.selectFile(mockFile);
      });

      act(() => {
        result.current.selectFile(null);
      });

      expect(result.current.selectedFile).toBeNull();
    });

    test("clears error when selecting file", () => {
      const { result } = renderHook(() => useWebFileUpload());
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      act(() => {
        result.current.selectFile(mockFile);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("[UNIT] clearSelection", () => {
    test("clears selected file", () => {
      const { result } = renderHook(() => useWebFileUpload());
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      act(() => {
        result.current.selectFile(mockFile);
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedFile).toBeNull();
    });

    test("clears error", () => {
      const { result } = renderHook(() => useWebFileUpload());
      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe("[UNIT] reset", () => {
    test("resets status to idle", () => {
      const { result } = renderHook(() => useWebFileUpload());
      act(() => {
        result.current.reset();
      });
      expect(result.current.status).toBe("idle");
    });

    test("resets progress to zero", () => {
      const { result } = renderHook(() => useWebFileUpload());
      act(() => {
        result.current.reset();
      });
      expect(result.current.progress.loadedBytes).toBe(0);
      expect(result.current.progress.totalBytes).toBeNull();
      expect(result.current.progress.percent).toBeNull();
    });

    test("clears error", () => {
      const { result } = renderHook(() => useWebFileUpload());
      act(() => {
        result.current.reset();
      });
      expect(result.current.error).toBeNull();
    });

    test("clears result", () => {
      const { result } = renderHook(() => useWebFileUpload());
      act(() => {
        result.current.reset();
      });
      expect(result.current.result).toBeNull();
    });
  });

  describe("[UNIT] file validation", () => {
    test("validates file type", () => {
      const { result } = renderHook(() =>
        useWebFileUpload({ allowedMimeTypes: ["image/jpeg", "image/png"] }),
      );

      const invalidFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });

      act(() => {
        result.current.selectFile(invalidFile);
      });

      expect(result.current.selectedFile).toBeNull();
      expect(result.current.error).not.toBeNull();
    });

    test("accepts valid file", () => {
      const { result } = renderHook(() =>
        useWebFileUpload({
          allowedMimeTypes: ["image/jpeg"],
          maxSizeMb: 10,
        }),
      );

      const validFile = new File(["test content"], "valid.jpg", {
        type: "image/jpeg",
      });

      act(() => {
        result.current.selectFile(validFile);
      });

      expect(result.current.selectedFile).toBe(validFile);
      expect(result.current.error).toBeNull();
    });
  });

  describe("[UNIT] upload function", () => {
    test("throws error when no file selected", async () => {
      const { result } = renderHook(() => useWebFileUpload());

      await expect(
        result.current.upload({ storagePath: "test/path" }),
      ).rejects.toThrow();
    });

    test("sets status when file selected", () => {
      const { result } = renderHook(() => useWebFileUpload());
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

      act(() => {
        result.current.selectFile(mockFile);
      });

      expect(result.current.selectedFile).not.toBeNull();
    });
  });

  describe("[UNIT] verifyFileAccessible", () => {
    test("exposes verifyFileAccessible function", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(typeof result.current.verifyFileAccessible).toBe("function");
    });
  });

  describe("[UNIT] onFileInputChange", () => {
    test("exposes onFileInputChange function", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(typeof result.current.onFileInputChange).toBe("function");
    });
  });

  describe("[UNIT] hook return shape", () => {
    test("returns all expected properties", () => {
      const { result } = renderHook(() => useWebFileUpload());

      expect(result.current).toHaveProperty("status");
      expect(result.current).toHaveProperty("progress");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("result");
      expect(result.current).toHaveProperty("selectedFile");
      expect(result.current).toHaveProperty("previewUrl");
      expect(result.current).toHaveProperty("onFileInputChange");
      expect(result.current).toHaveProperty("selectFile");
      expect(result.current).toHaveProperty("clearSelection");
      expect(result.current).toHaveProperty("upload");
      expect(result.current).toHaveProperty("verifyFileAccessible");
      expect(result.current).toHaveProperty("reset");
    });

    test("progress has correct shape", () => {
      const { result } = renderHook(() => useWebFileUpload());

      expect(result.current.progress).toHaveProperty("loadedBytes");
      expect(result.current.progress).toHaveProperty("totalBytes");
      expect(result.current.progress).toHaveProperty("percent");
    });
  });
});
