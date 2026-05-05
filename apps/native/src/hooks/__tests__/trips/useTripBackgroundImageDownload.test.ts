import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useTripBackgroundImageDownload } from "../../trips/useTripBackgroundImageDownload";

const mockDownload = jest.fn();
const mockUseFileDownload = jest.fn();

jest.mock("~/hooks/files/useFileDownload", () => ({
  useFileDownload: () => mockUseFileDownload(),
}));

describe("useTripBackgroundImageDownload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("should return initial state with loading when path provided", () => {
    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "idle",
      error: null,
    });

    const { result } = renderHook(() => useTripBackgroundImageDownload("trips/backgrounds/trip-1.jpg"));

    expect(result.current.imageUrl).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe("idle");
  });

  it("should return initial state when backgroundImagePath is null", () => {
    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "idle",
      error: null,
    });

    const { result } = renderHook(() => useTripBackgroundImageDownload(null));

    expect(result.current.imageUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should download image when backgroundImagePath is provided", async () => {
    mockDownload.mockResolvedValue({
      uri: "file:///mock/path/image.jpg",
      contentType: "image/jpeg",
      fileName: "image.jpg",
      totalBytes: 1024,
    });

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "success",
      error: null,
    });

    const { result } = renderHook(() =>
      useTripBackgroundImageDownload("trips/backgrounds/trip-1.jpg")
    );

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith({
        storagePath: "trips/backgrounds/trip-1.jpg",
        expiresInSeconds: 60 * 60,
      });
    });

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("file:///mock/path/image.jpg");
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should indicate loading during download", async () => {
    mockDownload.mockImplementation(() => new Promise(() => {}));

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "loading",
      error: null,
    });

    const { result } = renderHook(() =>
      useTripBackgroundImageDownload("trips/backgrounds/trip-1.jpg")
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });
  });

  it("should handle download error", async () => {
    const error = new Error("Download failed");
    mockDownload.mockRejectedValue(error);

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "error",
      error,
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = renderHook(() =>
      useTripBackgroundImageDownload("trips/backgrounds/trip-1.jpg")
    );

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });

    consoleSpy.mockRestore();
  });

  it("should pass correct expiration time to download", async () => {
    mockDownload.mockResolvedValue({
      uri: "file:///mock/path/image.jpg",
      contentType: "image/jpeg",
      fileName: "image.jpg",
      totalBytes: 1024,
    });

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "success",
      error: null,
    });

    renderHook(() => useTripBackgroundImageDownload("trips/backgrounds/trip-1.jpg"));

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresInSeconds: 60 * 60,
        })
      );
    });
  });

  it("should update imageUrl when backgroundImagePath changes", async () => {
    mockDownload.mockResolvedValue({
      uri: "file:///mock/path/image1.jpg",
      contentType: "image/jpeg",
      fileName: "image1.jpg",
      totalBytes: 1024,
    });

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "success",
      error: null,
    });

    const { result, rerender } = renderHook(
      ({ path }) => useTripBackgroundImageDownload(path),
      {
        initialProps: { path: "trips/backgrounds/trip-1.jpg" },
      }
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("file:///mock/path/image1.jpg");
    });

    mockDownload.mockResolvedValue({
      uri: "file:///mock/path/image2.jpg",
      contentType: "image/jpeg",
      fileName: "image2.jpg",
      totalBytes: 2048,
    });

    rerender({ path: "trips/backgrounds/trip-2.jpg" });

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith({
        storagePath: "trips/backgrounds/trip-2.jpg",
        expiresInSeconds: 60 * 60,
      });
    });
  });



  it("should handle component unmount gracefully", async () => {
    const abortError = new Error("component unmounted");
    mockDownload.mockRejectedValue(abortError);

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "idle",
      error: null,
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { unmount } = renderHook(() =>
      useTripBackgroundImageDownload("trips/backgrounds/trip-1.jpg")
    );

    unmount();

    expect(() => unmount()).not.toThrow();

    consoleSpy.mockRestore();
  });

  it("should reflect download status from useFileDownload", async () => {
    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "loading",
      error: null,
    });

    const { result } = renderHook(() =>
      useTripBackgroundImageDownload("trips/backgrounds/trip-1.jpg")
    );

    expect(result.current.status).toBe("loading");
  });

  it("should return null when both image and placeholder fail", async () => {
    mockDownload.mockRejectedValue(new Error("All downloads failed"));

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "error",
      error: new Error("All downloads failed"),
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

    const { result } = renderHook(() =>
      useTripBackgroundImageDownload("trips/backgrounds/trip-1.jpg")
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBeNull();
    });

    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

});
