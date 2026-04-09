/// <reference lib="dom" />

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useWebFileUpload } from "../useWebFileUpload";

// Mock dependencies
const mockMutate = mock(() =>
  Promise.resolve({
    token: "mock-token",
    bucket: "mock-bucket",
    objectPath: "mock/path",
    storagePath: "mock/storage/path",
  }),
);

mock.module("@repo/frameworks/trpc/client", () => ({
  useTRPCClient: () => ({
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
}));

mock.module("@repo/frameworks/auth/client", () => ({
  authStore: {
    getState: () => ({
      session: { access_token: "mock-access-token" },
    }),
  },
}));

// Mock env
mock.module("../lib/env", () => ({
  env: {
    supabaseUrl: "http://localhost:54321",
    supabaseAnonKey: "mock-anon-key",
  },
}));

describe("[UNIT] useWebFileUpload", () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  describe("initial state", () => {
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

  describe("selectFile", () => {
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

  describe("clearSelection", () => {
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

  describe("reset", () => {
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

  describe("file validation", () => {
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

  describe("upload function", () => {
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

  describe("verifyFileAccessible", () => {
    test("exposes verifyFileAccessible function", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(typeof result.current.verifyFileAccessible).toBe("function");
    });
  });

  describe("onFileInputChange", () => {
    test("exposes onFileInputChange function", () => {
      const { result } = renderHook(() => useWebFileUpload());
      expect(typeof result.current.onFileInputChange).toBe("function");
    });
  });

  describe("hook return shape", () => {
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
