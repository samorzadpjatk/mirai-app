import { colors } from "../colors";
import { commonStyles } from "../commonStyles";
import {
  borderRadius as exportedBorderRadius,
  colors as exportedColors,
  commonStyles as exportedCommonStyles,
  shadows as exportedShadows,
  spacing as exportedSpacing,
  typography as exportedTypography,
  theme,
} from "../index";
import { textStyles, viewStyles } from "../judgement";
import { shadows } from "../shadows";
import { borderRadius, spacing } from "../spacing";
import { typography } from "../typography";

describe("colors", () => {
  it("should match snapshot", () => {
    expect(colors).toMatchSnapshot();
  });
});

describe("spacing", () => {
  it("should match snapshot", () => {
    expect(spacing).toMatchSnapshot();
  });

  it("should export spacing object", () => {
    expect(spacing).toBeDefined();
  });

  it("should export borderRadius object", () => {
    expect(borderRadius).toBeDefined();
  });

  it("should have correct borderRadius values", () => {
    expect(borderRadius.sm).toBe(8);
    expect(borderRadius.md).toBe(12);
    expect(borderRadius.lg).toBe(16);
    expect(borderRadius.xl).toBe(20);
    expect(borderRadius.full).toBe(9999);
  });
});

describe("typography", () => {
  it("should match snapshot", () => {
    expect(typography).toMatchSnapshot();
  });
});

describe("shadows", () => {
  it("should match snapshot", () => {
    expect(shadows).toMatchSnapshot();
  });
});

describe("commonStyles", () => {
  it("should match snapshot", () => {
    expect(commonStyles).toMatchSnapshot();
  });
});

describe("index exports", () => {
  it("should export colors", () => {
    expect(exportedColors).toBeDefined();
    expect(exportedColors).toBe(colors);
  });

  it("should export spacing", () => {
    expect(exportedSpacing).toBeDefined();
    expect(exportedSpacing).toBe(spacing);
  });

  it("should export borderRadius", () => {
    expect(exportedBorderRadius).toBeDefined();
    expect(exportedBorderRadius).toBe(borderRadius);
  });

  it("should export typography", () => {
    expect(exportedTypography).toBeDefined();
    expect(exportedTypography).toBe(typography);
  });

  it("should export shadows", () => {
    expect(exportedShadows).toBeDefined();
    expect(exportedShadows).toBe(shadows);
  });

  it("should export commonStyles", () => {
    expect(exportedCommonStyles).toBeDefined();
    expect(exportedCommonStyles).toBe(commonStyles);
  });

  it("should export theme object with all style modules", () => {
    expect(theme).toBeDefined();
    expect(typeof theme).toBe("object");
    expect(theme.colors).toBe(colors);
    expect(theme.spacing).toBe(spacing);
    expect(theme.borderRadius).toBe(borderRadius);
    expect(theme.typography).toBe(typography);
    expect(theme.shadows).toBe(shadows);
  });
});

describe("judgement styles", () => {
  describe("viewStyles", () => {
    it("should match snapshot", () => {
      expect(viewStyles).toMatchSnapshot();
    });
  });

  describe("textStyles", () => {
    it("should match snapshot", () => {
      expect(textStyles).toMatchSnapshot();
    });
  });
});
