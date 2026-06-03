import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useExpoUpdates } from "../useExpoUpdates";

// Mock expo-updates with factory that doesn't reference outer scope
const mockIsEnabled = { value: false };

jest.mock("expo-updates", () => {
  const { jest: jestMock } = require("@jest/globals");
  return {
    checkForUpdateAsync: jestMock.fn(),
    fetchUpdateAsync: jestMock.fn(),
    reloadAsync: jestMock.fn(),
    get isEnabled() {
      return mockIsEnabled.value;
    },
  };
});

// Get typed references to mocked functions using requireMock
interface MockedExpoUpdates {
  checkForUpdateAsync: jest.Mock<() => Promise<{ isAvailable: boolean }>>;
  fetchUpdateAsync: jest.Mock<() => Promise<void>>;
  reloadAsync: jest.Mock<() => Promise<void>>;
  isEnabled: boolean;
}

const mockedUpdates = jest.requireMock("expo-updates") as MockedExpoUpdates;
const mockCheckForUpdateAsync = mockedUpdates.checkForUpdateAsync;
const mockFetchUpdateAsync = mockedUpdates.fetchUpdateAsync;
const mockReloadAsync = mockedUpdates.reloadAsync;

describe("useExpoUpdates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckForUpdateAsync.mockReset().mockResolvedValue({ isAvailable: false });
    mockFetchUpdateAsync.mockReset().mockResolvedValue(undefined);
    mockReloadAsync.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "__DEV__", {
      value: false,
      writable: true,
      configurable: true,
    });
    mockIsEnabled.value = false;
  });

  it("should initialize with default state", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    const { result } = renderHook(() => useExpoUpdates());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.isUpdateAvailable).toBe(false);
    expect(result.current.isChecking).toBe(false);
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadProgress).toBe(0);
    expect(result.current.showUpdatePopup).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should skip update check in development mode", async () => {
    Object.defineProperty(globalThis, "__DEV__", {
      value: true,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useExpoUpdates());

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(mockCheckForUpdateAsync).not.toHaveBeenCalled();
    expect(result.current.isChecking).toBe(false);
  });

  it("should check for updates in production", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    const { result } = renderHook(() => useExpoUpdates());

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(mockCheckForUpdateAsync).toHaveBeenCalled();
    expect(result.current.isChecking).toBe(false);
  });

  it("should show update popup when update is available", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: true });

    const { result } = renderHook(() => useExpoUpdates());

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.isUpdateAvailable).toBe(true);
    expect(result.current.showUpdatePopup).toBe(true);
  });

  it("should handle check for updates error", async () => {
    mockCheckForUpdateAsync.mockRejectedValue(new Error("Network error"));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(jest.fn());

    const { result } = renderHook(() => useExpoUpdates());

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.error).toBe("Failed to check for updates");
    expect(result.current.isChecking).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it("should download and reload on startUpdate", async () => {
    mockFetchUpdateAsync.mockResolvedValue(undefined);
    mockReloadAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpoUpdates());

    await act(async () => {
      await result.current.startUpdate();
    });

    expect(mockFetchUpdateAsync).toHaveBeenCalled();
    expect(mockReloadAsync).toHaveBeenCalled();
  });

  it("should handle download error", async () => {
    mockFetchUpdateAsync.mockRejectedValue(new Error("Download failed"));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(jest.fn());

    const { result } = renderHook(() => useExpoUpdates());

    await act(async () => {
      await result.current.startUpdate();
    });

    expect(result.current.error).toBe("Failed to download update");
    expect(result.current.isDownloading).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it("should skip update and reset state", () => {
    const { result } = renderHook(() => useExpoUpdates());

    act(() => {
      result.current.skipUpdate();
    });

    expect(result.current.showUpdatePopup).toBe(false);
    expect(result.current.isUpdateAvailable).toBe(false);
    expect(result.current.downloadProgress).toBe(0);
  });

  it("should set downloading state during update", async () => {
    // Create a controllable promise
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchUpdateAsync.mockImplementation(() => pendingPromise as Promise<void>);

    const { result } = renderHook(() => useExpoUpdates());

    // Wait for initial mount to complete
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    // Start update
    act(() => {
      result.current.startUpdate();
    });

    // Check state immediately while promise is pending
    await waitFor(() => {
      expect(result.current.isDownloading).toBe(true);
    });

    // Clean up: resolve the promise to avoid leaving React in acting state
    resolvePromise!(undefined);
  });

  it("should set checking state during check", async () => {
    // Create a controllable promise
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockCheckForUpdateAsync.mockImplementation(
      () => pendingPromise as Promise<{ isAvailable: boolean }>,
    );

    const { result } = renderHook(() => useExpoUpdates());

    // Wait for initial mount to complete
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    // Start check
    act(() => {
      result.current.checkForUpdates();
    });

    // Check state immediately while promise is pending
    await waitFor(() => {
      expect(result.current.isChecking).toBe(true);
    });

    // Clean up: resolve the promise
    resolvePromise!({ isAvailable: false });
  });

  it("should clear error on successful check", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    const { result } = renderHook(() => useExpoUpdates());

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.error).toBeNull();
  });

  it("should clear error on successful download start", async () => {
    mockFetchUpdateAsync.mockResolvedValue(undefined);
    mockReloadAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpoUpdates());

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    await act(async () => {
      await result.current.startUpdate();
    });

    expect(result.current.error).toBeNull();
  });

  it("should auto-check for updates on mount in production", async () => {
    mockIsEnabled.value = true;
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    const { result } = renderHook(() => useExpoUpdates());

    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(mockCheckForUpdateAsync).toHaveBeenCalled();
  });

  it("should not auto-check for updates in development", async () => {
    mockIsEnabled.value = true;
    Object.defineProperty(globalThis, "__DEV__", {
      value: true,
      writable: true,
      configurable: true,
    });
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    const { result } = renderHook(() => useExpoUpdates());

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    expect(mockCheckForUpdateAsync).not.toHaveBeenCalled();
  });

  it("should return all expected functions", async () => {
    const { result } = renderHook(() => useExpoUpdates());

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(typeof result.current.checkForUpdates).toBe("function");
    expect(typeof result.current.startUpdate).toBe("function");
    expect(typeof result.current.skipUpdate).toBe("function");
  });
});
