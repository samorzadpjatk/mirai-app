import { describe, it, expect } from "@jest/globals";
import {
  calculateBackgroundDisplayState,
  buildBackgroundStatusLabel,
  calculateBackgroundControlDisabled,
  getBackgroundIconName,
  getLocationIconName,
  getThemeIconName,
  getBackgroundIconColor,
} from "~/components/map/mapActionButtonsUtils";

describe("calculateBackgroundDisplayState", () => {
  it("should return true when both sharing and background are enabled", () => {
    expect(calculateBackgroundDisplayState(true, true)).toBe(true);
  });

  it("should return false when sharing is disabled", () => {
    expect(calculateBackgroundDisplayState(false, true)).toBe(false);
  });

  it("should return false when background is disabled", () => {
    expect(calculateBackgroundDisplayState(true, false)).toBe(false);
  });
});

describe("buildBackgroundStatusLabel", () => {
  it("should return 'On' when displayed on", () => {
    expect(buildBackgroundStatusLabel(true)).toBe("On");
  });

  it("should return 'Off' when displayed off", () => {
    expect(buildBackgroundStatusLabel(false)).toBe("Off");
  });
});

describe("calculateBackgroundControlDisabled", () => {
  it("should return true when sharing is disabled", () => {
    expect(calculateBackgroundControlDisabled(false, false, false)).toBe(true);
  });

  it("should return true when loading", () => {
    expect(calculateBackgroundControlDisabled(true, true, false)).toBe(true);
  });

  it("should return true when updating background location", () => {
    expect(calculateBackgroundControlDisabled(true, false, true)).toBe(true);
  });

  it("should return false when all enabled and not loading", () => {
    expect(calculateBackgroundControlDisabled(true, false, false)).toBe(false);
  });
});

describe("getBackgroundIconName", () => {
  it("should return navigate when on", () => {
    expect(getBackgroundIconName(true)).toBe("navigate");
  });

  it("should return navigate-outline when off", () => {
    expect(getBackgroundIconName(false)).toBe("navigate-outline");
  });
});

describe("getLocationIconName", () => {
  it("should return location when enabled", () => {
    expect(getLocationIconName(true)).toBe("location");
  });

  it("should return locate when disabled", () => {
    expect(getLocationIconName(false)).toBe("locate");
  });
});

describe("getThemeIconName", () => {
  it("should return sunny for dark theme", () => {
    expect(getThemeIconName("dark")).toBe("sunny");
  });

  it("should return moon for light theme", () => {
    expect(getThemeIconName("light")).toBe("moon");
  });
});

describe("getBackgroundIconColor", () => {
  it("should return textMuted when disabled", () => {
    const result = getBackgroundIconColor(true, true);
    expect(result).toBeDefined();
  });

  it("should return primary when enabled and displayed on", () => {
    const result = getBackgroundIconColor(false, true);
    expect(result).toBeDefined();
  });

  it("should return white when enabled and displayed off", () => {
    const result = getBackgroundIconColor(false, false);
    expect(result).toBeDefined();
  });
});
