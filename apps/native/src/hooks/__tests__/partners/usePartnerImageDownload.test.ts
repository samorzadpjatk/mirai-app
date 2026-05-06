import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";

// Mock useFileDownload hook
const mockDownload = jest.fn();

jest.mock("~/hooks/files/useFileDownload", () => ({
  useFileDownload: jest.fn(() => ({
    download: mockDownload,
    status: "idle",
    error: null,
  })),
}));

import { usePartnerImageDownload } from "../../partners/usePartnerImageDownload";

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

    expect(mockDownload).toHaveBeenCalledWith({
      storagePath: "partners/logo.jpg",
      expiresInSeconds: 60 * 60,
    });
  });

  it("should indicate loading state during download", () => {
    mockDownload.mockImplementation(() => new Promise((_resolve) => { /* noop */ }));

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
      (props) => usePartnerImageDownload(props),
      { initialProps: "partners/logo1.jpg" }
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
