import { describe, it, expect } from "@jest/globals";
import {
  toLensPreset,
  buildLensPresetOptions,
} from "../camera/PhotoCaptureModal";

describe("toLensPreset", () => {
  it("should map ultrawide to 0.5x", () => {
    expect(toLensPreset("ultrawide")).toBe("0.5x");
    expect(toLensPreset("ULTRAWIDE")).toBe("0.5x");
  });

  it("should map telephoto to 2x", () => {
    expect(toLensPreset("telephoto")).toBe("2x");
    expect(toLensPreset("TELEPHOTO")).toBe("2x");
  });

  it("should map wideangle to 1x", () => {
    expect(toLensPreset("wideangle")).toBe("1x");
    expect(toLensPreset("dualwide")).toBe("1x");
    expect(toLensPreset("triple")).toBe("1x");
    expect(toLensPreset("dual")).toBe("1x");
    expect(toLensPreset("truedepth")).toBe("1x");
    expect(toLensPreset("front")).toBe("1x");
    expect(toLensPreset("wide")).toBe("1x");
  });

  it("should return null for unknown lens", () => {
    expect(toLensPreset("unknown")).toBeNull();
    expect(toLensPreset("macro")).toBeNull();
  });
});

describe("buildLensPresetOptions", () => {
  it("should build options in preferred order", () => {
    const lenses = ["wide", "ultrawide", "telephoto"];
    const result = buildLensPresetOptions(lenses);
    expect(result).toEqual([
      { label: "0.5x", lens: "ultrawide" },
      { label: "1x", lens: "wide" },
      { label: "2x", lens: "telephoto" },
    ]);
  });

  it("should filter out unknown lenses", () => {
    const lenses = ["wide", "unknown", "macro"];
    const result = buildLensPresetOptions(lenses);
    expect(result).toEqual([{ label: "1x", lens: "wide" }]);
  });

  it("should deduplicate by preset", () => {
    const lenses = ["wide", "dualwide", "front"];
    const result = buildLensPresetOptions(lenses);
    expect(result).toEqual([{ label: "1x", lens: "wide" }]);
  });

  it("should return empty array for no valid lenses", () => {
    expect(buildLensPresetOptions([])).toEqual([]);
    expect(buildLensPresetOptions(["unknown"])).toEqual([]);
  });
});
