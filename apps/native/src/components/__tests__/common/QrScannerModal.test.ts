import { describe, expect, it } from "@jest/globals";
import { formatScanErrorMessage, shouldDisableScanning } from "../../common/QrScannerModal";

describe("shouldDisableScanning", () => {
  it("should return true when scanOncePerSession and hasScannedThisSession", () => {
    expect(shouldDisableScanning(true, true)).toBe(true);
  });

  it("should return false when scanOncePerSession but not scanned", () => {
    expect(shouldDisableScanning(true, false)).toBe(false);
  });

  it("should return false when not scanOncePerSession", () => {
    expect(shouldDisableScanning(false, true)).toBe(false);
    expect(shouldDisableScanning(false, false)).toBe(false);
  });
});

describe("formatScanErrorMessage", () => {
  it("should extract message from Error", () => {
    expect(formatScanErrorMessage(new Error("Invalid format"))).toBe("Invalid format");
  });

  it("should return default for non-Error", () => {
    expect(formatScanErrorMessage("string")).toBe("Invalid QR code");
    expect(formatScanErrorMessage(null)).toBe("Invalid QR code");
    expect(formatScanErrorMessage(123)).toBe("Invalid QR code");
  });
});
