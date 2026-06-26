import { colors as colorsImport } from "./colors";
import { shadows as shadowsImport } from "./shadows";
import { borderRadius as borderRadiusImport, spacing as spacingImport } from "./spacing";
import { typography as typographyImport } from "./typography";

export { colors } from "./colors";
export { commonStyles } from "./commonStyles";
export { shadows } from "./shadows";
export { borderRadius, spacing } from "./spacing";
export { typography } from "./typography";

// Re-export everything as theme for convenience
export const theme = {
  colors: colorsImport,
  spacing: spacingImport,
  borderRadius: borderRadiusImport,
  typography: typographyImport,
  shadows: shadowsImport,
};
