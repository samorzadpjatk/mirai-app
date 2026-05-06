import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useExpoUpdates } from "../useExpoUpdates";

// Mock expo-updates
const mockCheckForUpdateAsync = jest.fn();
const mockFetchUpdateAsync = jest.fn();
const mockReloadAsync = jest.fn();

jest.mock("expo-updates", () => ({
  checkForUpdateAsync: jest.fn(() => mockCheckForUpdateAsync()),
  fetchUpdateAsync: jest.fn(() => mockFetchUpdateAsync()),
  reloadAsync: jest.fn(() => mockReloadAsync()),
  isEnabled: true,
}));

describe("useExpoUpdates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as unknown as { __DEV__: boolean }).__DEV__ = false;
  });

  it("should initialize with default state", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    const { result } = renderHook(() => useExpoUpdates());

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isUpdateAvailable).toBe(false);
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadProgress).toBe(0);
    expect(result.current.showUpdatePopup).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should skip update check in development mode", async () => {
    (global as unknown as { __DEV__: boolean }).__DEV__ = true;

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

  it("should set downloading state during update", () => {
    mockFetchUpdateAsync.mockImplementation(() => new Promise((_resolve) => { /* noop */ }));

    const { result } = renderHook(() => useExpoUpdates());

    void act(async () => {
      await result.current.startUpdate();
    });

    expect(result.current.isDownloading).toBe(true);
  });

  it("should set checking state during check", () => {
    mockCheckForUpdateAsync.mockImplementation(() => new Promise((_resolve) => { /* noop */ }));

    const { result } = renderHook(() => useExpoUpdates());

    void act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.isChecking).toBe(true);
  });

  it("should clear error on successful check", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    const { result } = renderHook(() => useExpoUpdates());

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.error).toBeNull();
  });

  it("should clear error on successful download start", async () => {
    mockFetchUpdateAsync.mockResolvedValue(undefined);
    mockReloadAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpoUpdates());

    await act(async () => {
      await result.current.startUpdate();
    });

    expect(result.current.error).toBeNull();
  });

  it("should auto-check for updates on mount in production", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    renderHook(() => useExpoUpdates());

    await waitFor(() => {
      expect(mockCheckForUpdateAsync).toHaveBeenCalled();
    });
  });

  it("should not auto-check for updates in development", async () => {
    (global as unknown as { __DEV__: boolean }).__DEV__ = true;
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    renderHook(() => useExpoUpdates());

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockCheckForUpdateAsync).not.toHaveBeenCalled();
  });

  it("should return all expected functions", () => {
    const { result } = renderHook(() => useExpoUpdates());

    expect(typeof result.current.checkForUpdates).toBe("function");
    expect(typeof result.current.startUpdate).toBe("function");
    expect(typeof result.current.skipUpdate).toBe("function");
  });
});
