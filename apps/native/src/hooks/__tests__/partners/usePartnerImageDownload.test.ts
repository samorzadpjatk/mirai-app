import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";

// Mock useFileDownload hook
const mockDownload = jest.fn<() => Promise<{ uri: string }>>();

jest.mock("~/hooks/files/useFileDownload", () => ({
  useFileDownload: jest.fn(() => ({
    download: mockDownload,
    status: "idle",
    error: null,
  })),
}));

import {
  calculatePartnerImageLoadingState,
  getPlaceholderPath,
  isComponentUnmountedErrorMessage,
  resolveImageUrlFromDownloadResult,
  usePartnerImageDownload,
} from "../../partners/usePartnerImageDownload";

describe("usePartnerImageDownload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null imageUrl when no logoPath provided", async () => {
    const { result } = renderHook(() => usePartnerImageDownload(null));

    await waitFor(() => {
      expect(result.current.imageUrl).toBeNull();
    });
  });

  it("should download and return image URL when logoPath provided", async () => {
    mockDownload.mockResolvedValue({
      uri: "file:///cache/partner-logo.jpg",
    });

    const { result } = renderHook(() => usePartnerImageDownload("partners/logo.jpg"));

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("file:///cache/partner-logo.jpg");
    });

    expect(mockDownload).toHaveBeenCalled();
  });

  it("should indicate loading state during download", () => {
    mockDownload.mockImplementation(
      () =>
        new Promise((_resolve) => {
          /* noop */
        }),
    );

    const { result } = renderHook(() => usePartnerImageDownload("partners/logo.jpg"));

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle undefined logoPath", async () => {
    const { result } = renderHook(() => usePartnerImageDownload(undefined));

    await waitFor(() => {
      expect(result.current.imageUrl).toBeNull();
    });
  });

  it("should re-download when logoPath changes", async () => {
    mockDownload.mockResolvedValue({ uri: "file:///cache/logo.jpg" });

    const { result, rerender } = renderHook(
      (props: string | null) => usePartnerImageDownload(props),
      { initialProps: "partners/logo1.jpg" },
    );

    await waitFor(() => {
      expect(result.current.imageUrl).toBe("file:///cache/logo.jpg");
    });

    mockDownload.mockResolvedValue({ uri: "file:///cache/logo2.jpg" });

    rerender("partners/logo2.jpg");

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledTimes(2);
    });
  });
});

describe("getPlaceholderPath", () => {
  it("should return placeholder path", () => {
    expect(getPlaceholderPath()).toBe("image/placeholder/partner-logo.png");
  });
});

describe("isComponentUnmountedErrorMessage", () => {
  it("should return true for unmounted message", () => {
    expect(isComponentUnmountedErrorMessage("component unmounted")).toBe(true);
  });

  it("should return false for other messages", () => {
    expect(isComponentUnmountedErrorMessage("network error")).toBe(false);
  });
});

describe("resolveImageUrlFromDownloadResult", () => {
  it("should return uri when present", () => {
    expect(resolveImageUrlFromDownloadResult({ uri: "file:///test.jpg" })).toBe("file:///test.jpg");
  });

  it("should return null when uri is missing", () => {
    expect(resolveImageUrlFromDownloadResult({})).toBeNull();
    expect(resolveImageUrlFromDownloadResult(null)).toBeNull();
    expect(resolveImageUrlFromDownloadResult(undefined)).toBeNull();
  });
});

describe("calculatePartnerImageLoadingState", () => {
  it("should return true when isLoading is true", () => {
    expect(calculatePartnerImageLoadingState(true, "idle")).toBe(true);
  });

  it("should return true when download status is loading", () => {
    expect(calculatePartnerImageLoadingState(false, "loading")).toBe(true);
  });

  it("should return false when neither is loading", () => {
    expect(calculatePartnerImageLoadingState(false, "idle")).toBe(false);
  });
});
