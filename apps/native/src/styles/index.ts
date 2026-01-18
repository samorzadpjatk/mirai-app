import { colors as colorsImport } from "./colors";
import { spacing as spacingImport, borderRadius as borderRadiusImport } from "./spacing";
import { typography as typographyImport } from "./typography";
import { shadows as shadowsImport } from "./shadows";

export { colors } from "./colors";
export { spacing, borderRadius } from "./spacing";
export { typography } from "./typography";
export { shadows } from "./shadows";
export { commonStyles } from "./commonStyles";

// Re-export everything as theme for convenience
export const theme = {
  colors: colorsImport,
  spacing: spacingImport,
  borderRadius: borderRadiusImport,
  typography: typographyImport,
  shadows: shadowsImport,
};
