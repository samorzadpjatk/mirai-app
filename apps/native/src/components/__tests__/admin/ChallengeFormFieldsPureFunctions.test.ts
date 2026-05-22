import { describe, it, expect } from "@jest/globals";
import {
  formatLocationText,
  getAutoApproveSwitchValue,
  getAutoApproveThumbColor,
} from "~/components/admin/challenges/ChallengeFormFields";

describe("formatLocationText", () => {
  it("should return selection text when location is provided", () => {
    const location = { latitude: 52.2297, longitude: 21.0122 };
    const result = formatLocationText(location);
    expect(result).toContain("Selected:");
    expect(result).toContain("52.22970");
    expect(result).toContain("21.01220");
  });

  it("should return placeholder when location is null", () => {
    expect(formatLocationText(null)).toBe("Tap to select location on map");
  });
});

describe("getAutoApproveSwitchValue", () => {
  it("should return true when forced", () => {
    expect(getAutoApproveSwitchValue(true, false, false)).toBe(true);
    expect(getAutoApproveSwitchValue(true, false, true)).toBe(true);
  });

  it("should return false when disabled", () => {
    expect(getAutoApproveSwitchValue(false, true, true)).toBe(false);
    expect(getAutoApproveSwitchValue(false, true, false)).toBe(false);
  });

  it("should return autoApprove value when neither forced nor disabled", () => {
    expect(getAutoApproveSwitchValue(false, false, true)).toBe(true);
    expect(getAutoApproveSwitchValue(false, false, false)).toBe(false);
  });
});

describe("getAutoApproveThumbColor", () => {
  it("should return primary color when forced", () => {
    expect(getAutoApproveThumbColor(true, false, false, "#00ced1", "#9ca3af")).toBe("#00ced1");
  });

  it("should return primary color when autoApprove is true and not disabled", () => {
    expect(getAutoApproveThumbColor(false, false, true, "#00ced1", "#9ca3af")).toBe("#00ced1");
  });

  it("should return text secondary when disabled", () => {
    expect(getAutoApproveThumbColor(false, true, true, "#00ced1", "#9ca3af")).toBe("#9ca3af");
    expect(getAutoApproveThumbColor(false, true, false, "#00ced1", "#9ca3af")).toBe("#9ca3af");
  });

  it("should return text secondary when autoApprove is false and not forced", () => {
    expect(getAutoApproveThumbColor(false, false, false, "#00ced1", "#9ca3af")).toBe("#9ca3af");
  });
});
