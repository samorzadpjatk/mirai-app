var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tamagui.config.ts
var tamagui_config_exports = {};
__export(tamagui_config_exports, {
  config: () => config,
  default: () => tamagui_config_default
});
module.exports = __toCommonJS(tamagui_config_exports);

// ../../node_modules/.bun/@tamagui+use-presence@1.144.4+71be497c31fe28c5/node_modules/@tamagui/use-presence/dist/esm/PresenceContext.mjs
var React = __toESM(require("react"), 1);
var import_jsx_runtime = require("react/jsx-runtime");
var PresenceContext = React.createContext(null);
var ResetPresence = /* @__PURE__ */ __name((props) => {
  const parent = React.useContext(PresenceContext);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PresenceContext.Provider, {
    value: props.disable ? parent : null,
    children: props.children
  });
}, "ResetPresence");

// ../../node_modules/.bun/@tamagui+use-presence@1.144.4+71be497c31fe28c5/node_modules/@tamagui/use-presence/dist/esm/usePresence.mjs
var React2 = __toESM(require("react"), 1);
function usePresence() {
  const context = React2.useContext(PresenceContext);
  if (!context) return [true, null, context];
  const {
    id,
    isPresent: isPresent2,
    onExitComplete,
    register
  } = context;
  return React2.useEffect(() => register(id), []), !isPresent2 && onExitComplete ? [false, () => onExitComplete?.(id), context] : [true, void 0, context];
}
__name(usePresence, "usePresence");

// ../../node_modules/.bun/tamagui@1.144.4+71be497c31fe28c5/node_modules/tamagui/dist/esm/createTamagui.mjs
var import_core = require("@tamagui/core");
var createTamagui = process.env.NODE_ENV !== "development" ? import_core.createTamagui : (conf) => {
  const sizeTokenKeys = ["$true"], hasKeys = /* @__PURE__ */ __name((expectedKeys, obj) => expectedKeys.every((k) => typeof obj[k] < "u"), "hasKeys"), tamaguiConfig = (0, import_core.createTamagui)(conf);
  for (const name of ["size", "space"]) {
    const tokenSet = tamaguiConfig.tokensParsed[name];
    if (!tokenSet) throw new Error(`Expected tokens for "${name}" in ${Object.keys(tamaguiConfig.tokensParsed).join(", ")}`);
    if (!hasKeys(sizeTokenKeys, tokenSet)) throw new Error(`
createTamagui() missing expected tokens.${name}:

Received: ${Object.keys(tokenSet).join(", ")}

Expected: ${sizeTokenKeys.join(", ")}

Tamagui expects a "true" key that is the same value as your default size. This is so 
it can size things up or down from the defaults without assuming which keys you use.

Please define a "true" or "$true" key on your size and space tokens like so (example):

size: {
  sm: 2,
  md: 10,
  true: 10, // this means "md" is your default size
  lg: 20,
}

`);
  }
  const expected = Object.keys(tamaguiConfig.tokensParsed.size);
  for (const name of ["radius", "zIndex"]) {
    const tokenSet = tamaguiConfig.tokensParsed[name], received = Object.keys(tokenSet);
    if (!received.some((rk) => expected.includes(rk))) throw new Error(`
createTamagui() invalid tokens.${name}:

Received: ${received.join(", ")}

Expected a subset of: ${expected.join(", ")}

`);
  }
  return tamaguiConfig;
};

// ../../node_modules/.bun/tamagui@1.144.4+71be497c31fe28c5/node_modules/tamagui/dist/esm/index.mjs
var import_core2 = require("@tamagui/core");

// src/theme/colors.ts
var primaryColors = {
  // Main primary
  primary: "#00ced1",
  accentMagenta: "#E533FF",
  // Primary opacity variants
  primaryOpacity10: "rgba(0, 206, 209, 0.1)",
  primaryOpacity12: "rgba(0, 206, 209, 0.12)",
  primaryOpacity20: "rgba(0, 206, 209, 0.2)",
  primaryOpacity30: "rgba(0, 206, 209, 0.3)",
  primaryOpacity80: "rgba(0, 206, 209, 0.8)",
  // Magenta opacity variants
  magentaOpacity10: "rgba(229, 51, 255, 0.1)",
  magentaOpacity20: "rgba(229, 51, 255, 0.2)",
  magentaOpacity30: "rgba(229, 51, 255, 0.3)",
  magentaOpacity80: "rgba(229, 51, 255, 0.8)"
};
var backgroundColors = {
  backgroundLight: "#f1f1f4",
  backgroundDark: "#17181c",
  backgroundDarkAlt: "#102222",
  cardDark: "#1b2828",
  surfaceDark: "#272935",
  // Background opacity variants
  backgroundDarkOpacity50: "rgba(23, 24, 28, 0.5)",
  backgroundDarkOpacity80: "rgba(23, 24, 28, 0.8)",
  backgroundDarkOpacity45: "rgba(15, 23, 42, 0.45)",
  backgroundDarkOpacity55: "rgba(10, 11, 13, 0.55)",
  // Card opacity variants
  cardDarkOpacity40: "rgba(27, 40, 40, 0.4)",
  cardDarkOpacity45: "rgba(39, 41, 53, 0.45)",
  cardDarkOpacity70: "rgba(27, 40, 40, 0.7)"
};
var borderColors = {
  borderDark: "#395556",
  borderWhite5: "rgba(255, 255, 255, 0.05)",
  borderWhite10: "rgba(255, 255, 255, 0.1)",
  borderWhite18: "rgba(255, 255, 255, 0.18)",
  borderZinc700: "rgba(48, 54, 61, 1)"
};
var textColors = {
  white: "#ffffff",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textTertiary: "#64748b",
  textMuted: "#475569"
};
var whiteOpacity = {
  whiteOpacity90: "rgba(255, 255, 255, 0.9)",
  whiteOpacity70: "rgba(255, 255, 255, 0.7)",
  whiteOpacity40: "rgba(255, 255, 255, 0.4)",
  whiteOpacity20: "rgba(255, 255, 255, 0.2)",
  whiteOpacity18: "rgba(255, 255, 255, 0.18)",
  whiteOpacity15: "rgba(255, 255, 255, 0.15)",
  whiteOpacity12: "rgba(255, 255, 255, 0.12)",
  whiteOpacity10: "rgba(255, 255, 255, 0.1)",
  whiteOpacity8: "rgba(255, 255, 255, 0.08)",
  whiteOpacity6: "rgba(255, 255, 255, 0.06)",
  whiteOpacity5: "rgba(255, 255, 255, 0.05)",
  whiteOpacity4: "rgba(255, 255, 255, 0.04)"
};
var blackOpacity = {
  blackOpacity40: "rgba(0, 0, 0, 0.4)",
  blackOpacity38: "rgba(0, 0, 0, 0.38)",
  blackOpacity12: "rgba(0, 0, 0, 0.12)"
};
var grayColors = {
  gray50: "#f9fafb",
  gray100: "#f1f1f4",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827"
};
var slateColors = {
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate800: "#1e293b"
};
var slateOpacity = {
  slateOpacity35: "rgba(148, 163, 184, 0.35)"
};
var redColors = {
  red300: "#fecaca",
  red400: "#f87171",
  red700: "#b91c1c",
  red900: "#7f1d1d",
  danger: "#ef4444"
};
var redOpacity = {
  red900Opacity30: "rgba(127, 29, 29, 0.3)",
  redOpacity500: "rgba(220, 38, 38, 0.55)",
  redOpacity500Background: "rgba(220, 38, 38, 0.14)"
};
var dangerOpacity = {
  dangerOpacity12: "rgba(239, 68, 68, 0.12)",
  dangerOpacity15: "rgba(239, 68, 68, 0.15)",
  dangerOpacity35: "rgba(239, 68, 68, 0.35)",
  dangerOpacity45: "rgba(239, 68, 68, 0.45)",
  dangerOpacity50: "rgba(239, 68, 68, 0.5)",
  dangerOpacity85: "rgba(239, 68, 68, 0.85)"
};
var greenColors = {
  success: "#22c55e",
  green400: "#4ade80",
  green700: "#16a34a"
};
var successOpacity = {
  successOpacity08: "rgba(16, 185, 129, 0.08)",
  successOpacity12: "rgba(16, 185, 129, 0.12)",
  successOpacity20: "rgba(16, 185, 129, 0.2)",
  successOpacity35: "rgba(34, 197, 94, 0.35)",
  successOpacity45: "rgba(16, 185, 129, 0.5)",
  successOpacity50: "rgba(16, 185, 129, 0.5)",
  successOpacity90: "rgba(34, 197, 94, 0.9)"
};
var emeraldColors = {
  emerald400: "#4ade80",
  emerald500: "#22c55e",
  emerald700: "#16a34a"
};
var orangeColors = {
  warning: "#f59e0b",
  orange400: "#fb923c",
  orange500: "#f97316",
  orange700: "#c2410c",
  yellow400: "#facc15"
};
var blueColors = {
  blue100: "#dbeafe",
  blue400: "#60a5fa",
  blue500: "#3b82f6",
  blue700: "#1d4ed8"
};
var skyColors = {
  sky400: "#38bdf8",
  sky500: "#0ea5e9",
  sky700: "#0284c7"
};
var skyOpacity = {
  skyOpacity10: "rgba(14, 165, 233, 0.1)",
  skyOpacity14: "rgba(14, 165, 233, 0.14)",
  skyOpacity35: "rgba(14, 165, 233, 0.35)"
};
var zincColors = {
  zinc100: "#f4f4f5",
  zinc700: "#52525b",
  zinc800: "#27272a",
  zinc900: "#18181b"
};
var statusColors = {
  statusHidden: "#64748b",
  statusVisible: "#0ea5e9",
  statusActive: "#22c55e",
  statusVotingPhase: "#f59e0b",
  statusCompleted: "#10b981"
};
var semanticColors = {
  transparent: "transparent",
  currentColor: "currentColor",
  inherit: "inherit"
};
var colorTokens = {
  ...primaryColors,
  ...backgroundColors,
  ...borderColors,
  ...textColors,
  ...whiteOpacity,
  ...blackOpacity,
  ...grayColors,
  ...slateColors,
  ...slateOpacity,
  ...redColors,
  ...redOpacity,
  ...dangerOpacity,
  ...greenColors,
  ...successOpacity,
  ...emeraldColors,
  ...orangeColors,
  ...blueColors,
  ...skyColors,
  ...skyOpacity,
  ...zincColors,
  ...statusColors,
  ...semanticColors
};

// src/theme/tokens.ts
var space = {
  // Base scale (4px increments)
  $0: 0,
  $0_5: 2,
  $1: 4,
  // xs
  $2: 8,
  // sm
  $3: 12,
  // md
  $4: 16,
  // lg
  $5: 20,
  // xl
  $6: 24,
  // xxl
  $7: 28,
  $8: 32,
  // xxxl
  $9: 40,
  $10: 48,
  $11: 64,
  $12: 80,
  // Named aliases for semantic use
  $xs: 4,
  $sm: 8,
  $md: 12,
  $lg: 16,
  $xl: 20,
  $xxl: 24,
  $xxxl: 32,
  $huge: 48,
  // Negative values (for margins)
  $n1: -4,
  $n2: -8,
  $n3: -12,
  $n4: -16,
  $n5: -20,
  $n6: -24,
  $n7: -28,
  $n8: -32,
  $n9: -40,
  $n10: -48,
  $n11: -64,
  $n12: -80
};
var size = {
  // Same scale as space for consistency
  $0: 0,
  $0_5: 2,
  $1: 4,
  $2: 8,
  $3: 12,
  $4: 16,
  $5: 20,
  $6: 24,
  $7: 28,
  $8: 32,
  $9: 40,
  $10: 48,
  $11: 64,
  $12: 80,
  // Semantic sizes
  $xs: 4,
  $sm: 8,
  $md: 12,
  $lg: 16,
  $xl: 20,
  $xxl: 24,
  $xxxl: 32,
  $huge: 48,
  // Component sizes
  $buttonSm: 32,
  $buttonMd: 40,
  $buttonLg: 48,
  $inputHeight: 48,
  $avatarSm: 32,
  $avatarMd: 48,
  $avatarLg: 64,
  $iconSm: 16,
  $iconMd: 24,
  $iconLg: 32
};
var radius = {
  $0: 0,
  $1: 4,
  $2: 8,
  // sm
  $3: 12,
  // md
  $4: 16,
  // lg
  $5: 20,
  // xl
  $6: 24,
  $7: 28,
  $8: 32,
  $true: 8,
  // Default
  $full: 9999,
  // Semantic aliases
  $sm: 8,
  $md: 12,
  $lg: 16,
  $xl: 20
};
var zIndex = {
  $0: 0,
  $1: 10,
  $2: 20,
  $3: 30,
  $4: 40,
  $5: 50,
  // Semantic z-index values
  $base: 0,
  $dropdown: 100,
  $sticky: 200,
  $fixed: 300,
  $modal: 400,
  $popover: 500,
  $tooltip: 600,
  $toast: 700
};
var lineHeight = {
  $1: 16,
  $2: 20,
  $3: 24,
  $4: 28,
  $5: 32,
  $6: 40,
  $7: 48,
  $8: 64,
  $9: 80,
  $10: 96,
  // Relative line heights
  $tight: 1.2,
  $normal: 1.5,
  $relaxed: 1.75
};
var letterSpacing = {
  $tighter: -0.05,
  $tight: -0.025,
  $normal: 0,
  $wide: 0.025,
  $wider: 0.05,
  $widest: 0.1
};
var tokens = {
  space,
  size,
  radius,
  zIndex,
  lineHeight,
  letterSpacing
};

// src/theme/fonts.ts
var headingFont = (0, import_core2.createFont)({
  family: "Space Grotesk, -apple-system, system-ui, sans-serif",
  size: {
    1: 10,
    // xs
    2: 12,
    // sm
    3: 14,
    // base
    4: 16,
    // lg
    5: 18,
    // xl
    6: 20,
    // xxl
    7: 24,
    // xxxl
    8: 28,
    9: 32,
    10: 36,
    // huge
    11: 40,
    12: 48,
    13: 56,
    14: 64,
    // Semantic aliases
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 36,
    // Display sizes
    $xs: 10,
    $sm: 12,
    $base: 14,
    $lg: 16,
    $xl: 18,
    $xxl: 20,
    $xxxl: 24,
    $huge: 36
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 52,
    11: 60,
    12: 68,
    13: 76,
    14: 84,
    // Named line heights
    $tight: 1.2,
    $normal: 1.5,
    $relaxed: 1.75
  },
  weight: {
    1: "300",
    2: "400",
    3: "500",
    4: "600",
    5: "700",
    6: "700",
    7: "700",
    8: "700",
    9: "700",
    10: "700",
    11: "700",
    12: "700",
    13: "700",
    14: "700",
    // Semantic weights
    $light: "300",
    $normal: "400",
    $medium: "500",
    $semibold: "600",
    $bold: "700"
  },
  letterSpacing: {
    1: -0.02,
    2: -0.01,
    3: 0,
    4: 0,
    5: 0.01,
    6: 0.02,
    7: 0.02,
    8: 0.02,
    9: 0.02,
    10: 0.02,
    11: 0.02,
    12: 0.02,
    13: 0.02,
    14: 0.02,
    // Named letter spacing
    $tighter: -0.05,
    $tight: -0.025,
    $normal: 0,
    $wide: 0.025,
    $wider: 0.05,
    $widest: 0.1
  },
  face: {
    300: { normal: "SpaceGrotesk-Light", italic: "SpaceGrotesk-Light" },
    400: { normal: "SpaceGrotesk-Regular", italic: "SpaceGrotesk-Regular" },
    500: { normal: "SpaceGrotesk-Medium", italic: "SpaceGrotesk-Medium" },
    600: { normal: "SpaceGrotesk-SemiBold", italic: "SpaceGrotesk-SemiBold" },
    700: { normal: "SpaceGrotesk-Bold", italic: "SpaceGrotesk-Bold" }
  }
});
var bodyFont = (0, import_core2.createFont)({
  family: "Inter, -apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  size: {
    1: 10,
    // xs
    2: 12,
    // sm
    3: 14,
    // base
    4: 16,
    // lg
    5: 18,
    // xl
    6: 20,
    // xxl
    7: 24,
    // xxxl
    8: 28,
    9: 32,
    10: 36,
    // huge
    11: 40,
    12: 48,
    13: 56,
    14: 64,
    // Semantic aliases
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 36,
    // Display sizes
    $xs: 10,
    $sm: 12,
    $base: 14,
    $lg: 16,
    $xl: 18,
    $xxl: 20,
    $xxxl: 24,
    $huge: 36
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 52,
    11: 60,
    12: 68,
    13: 76,
    14: 84,
    // Named line heights
    $tight: 1.2,
    $normal: 1.5,
    $relaxed: 1.75
  },
  weight: {
    1: "300",
    2: "400",
    3: "500",
    4: "600",
    5: "700",
    6: "700",
    7: "700",
    8: "700",
    9: "700",
    10: "700",
    11: "700",
    12: "700",
    13: "700",
    14: "700",
    // Semantic weights
    $light: "300",
    $normal: "400",
    $medium: "500",
    $semibold: "600",
    $bold: "700"
  },
  letterSpacing: {
    1: -0.01,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0.01,
    7: 0.01,
    8: 0.01,
    9: 0.01,
    10: 0.01,
    11: 0.01,
    12: 0.01,
    13: 0.01,
    14: 0.01,
    // Named letter spacing
    $tighter: -0.05,
    $tight: -0.025,
    $normal: 0,
    $wide: 0.025,
    $wider: 0.05,
    $widest: 0.1
  },
  face: {
    300: { normal: "Inter-Light", italic: "Inter-LightItalic" },
    400: { normal: "Inter-Regular", italic: "Inter-Italic" },
    500: { normal: "Inter-Medium", italic: "Inter-MediumItalic" },
    600: { normal: "Inter-SemiBold", italic: "Inter-SemiBoldItalic" },
    700: { normal: "Inter-Bold", italic: "Inter-BoldItalic" }
  }
});
var monoFont = (0, import_core2.createFont)({
  family: "JetBrains Mono, Fira Code, SF Mono, Monaco, Inconsolata, monospace",
  size: {
    1: 10,
    2: 12,
    3: 14,
    4: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 28,
    9: 32,
    10: 36,
    11: 40,
    12: 48,
    13: 56,
    14: 64
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 44,
    9: 48,
    10: 52,
    11: 60,
    12: 68,
    13: 76,
    14: 84
  },
  weight: {
    1: "400",
    2: "400",
    3: "400",
    4: "500",
    5: "600",
    6: "700",
    7: "700",
    8: "700",
    9: "700",
    10: "700",
    11: "700",
    12: "700",
    13: "700",
    14: "700"
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0
  }
});
var fonts = {
  heading: headingFont,
  body: bodyFont,
  mono: monoFont
};

// src/theme/themes.ts
var lightTheme = {
  // Background tokens
  background: colorTokens.backgroundLight,
  backgroundHover: colorTokens.gray100,
  backgroundPress: colorTokens.gray200,
  backgroundFocus: colorTokens.gray100,
  backgroundStrong: colorTokens.gray50,
  backgroundTransparent: colorTokens.whiteOpacity90,
  // Card/surface backgrounds
  surface: colorTokens.white,
  surfaceHover: colorTokens.gray50,
  surfacePress: colorTokens.gray100,
  // Card variant backgrounds
  card: colorTokens.white,
  cardHover: colorTokens.gray50,
  cardPress: colorTokens.gray100,
  // Foreground/Text tokens
  color: colorTokens.gray900,
  colorHover: colorTokens.gray800,
  colorPress: colorTokens.gray900,
  colorFocus: colorTokens.gray800,
  // Text hierarchy
  colorStrong: colorTokens.gray900,
  colorMuted: colorTokens.textSecondary,
  colorTertiary: colorTokens.textTertiary,
  // Border tokens
  borderColor: colorTokens.gray200,
  borderColorHover: colorTokens.gray300,
  borderColorPress: colorTokens.gray300,
  borderColorFocus: colorTokens.primary,
  // Primary brand
  primary: colorTokens.primary,
  primaryHover: colorTokens.primaryOpacity80,
  primaryPress: colorTokens.primaryOpacity30,
  primaryFocus: colorTokens.primary,
  // Secondary/Accent
  accent: colorTokens.accentMagenta,
  accentHover: colorTokens.magentaOpacity80,
  accentPress: colorTokens.magentaOpacity30,
  // Status colors
  success: colorTokens.success,
  successHover: colorTokens.emerald400,
  successPress: colorTokens.successOpacity20,
  warning: colorTokens.warning,
  warningHover: colorTokens.orange400,
  warningPress: colorTokens.orange400,
  danger: colorTokens.danger,
  dangerHover: colorTokens.red400,
  dangerPress: colorTokens.dangerOpacity15,
  dangerFocus: colorTokens.red700,
  info: colorTokens.sky500,
  infoHover: colorTokens.sky400,
  infoPress: colorTokens.skyOpacity10,
  // Shadow
  shadowColor: colorTokens.blackOpacity12,
  shadowColorHover: colorTokens.blackOpacity38,
  // Placeholder
  placeholderColor: colorTokens.textTertiary,
  // Overlay
  overlay: colorTokens.blackOpacity38,
  // Utility
  transparent: colorTokens.transparent
};
var darkTheme = {
  // Background tokens
  background: colorTokens.backgroundDark,
  backgroundHover: colorTokens.cardDark,
  backgroundPress: colorTokens.surfaceDark,
  backgroundFocus: colorTokens.cardDark,
  backgroundStrong: colorTokens.backgroundDarkAlt,
  backgroundTransparent: colorTokens.backgroundDarkOpacity80,
  // Card/surface backgrounds
  surface: colorTokens.cardDark,
  surfaceHover: colorTokens.surfaceDark,
  surfacePress: colorTokens.backgroundDarkAlt,
  // Card variant backgrounds
  card: colorTokens.cardDark,
  cardHover: colorTokens.cardDarkOpacity70,
  cardPress: colorTokens.surfaceDark,
  // Foreground/Text tokens
  color: colorTokens.textPrimary,
  colorHover: colorTokens.whiteOpacity90,
  colorPress: colorTokens.textPrimary,
  colorFocus: colorTokens.whiteOpacity90,
  // Text hierarchy
  colorStrong: colorTokens.white,
  colorMuted: colorTokens.textSecondary,
  colorTertiary: colorTokens.textTertiary,
  // Border tokens
  borderColor: colorTokens.borderDark,
  borderColorHover: colorTokens.zinc700,
  borderColorPress: colorTokens.borderWhite10,
  borderColorFocus: colorTokens.primary,
  // Primary brand
  primary: colorTokens.primary,
  primaryHover: colorTokens.primaryOpacity80,
  primaryPress: colorTokens.primaryOpacity30,
  primaryFocus: colorTokens.primary,
  // Secondary/Accent
  accent: colorTokens.accentMagenta,
  accentHover: colorTokens.magentaOpacity80,
  accentPress: colorTokens.magentaOpacity30,
  // Status colors
  success: colorTokens.success,
  successHover: colorTokens.emerald400,
  successPress: colorTokens.successOpacity20,
  warning: colorTokens.warning,
  warningHover: colorTokens.orange400,
  warningPress: colorTokens.orange400,
  danger: colorTokens.danger,
  dangerHover: colorTokens.red400,
  dangerPress: colorTokens.dangerOpacity15,
  dangerFocus: colorTokens.red900,
  info: colorTokens.sky500,
  infoHover: colorTokens.sky400,
  infoPress: colorTokens.skyOpacity14,
  // Shadow
  shadowColor: colorTokens.blackOpacity40,
  shadowColorHover: colorTokens.blackOpacity40,
  // Placeholder
  placeholderColor: colorTokens.textTertiary,
  // Overlay
  overlay: colorTokens.backgroundDarkOpacity80,
  // Utility
  transparent: colorTokens.transparent
};
var themes = {
  light: lightTheme,
  dark: darkTheme
};
var themeVariants = {
  // High contrast variants (accessibility)
  "light-hc": {
    ...lightTheme,
    color: "#000000",
    colorMuted: "#333333",
    borderColor: "#000000",
    background: "#ffffff"
  },
  "dark-hc": {
    ...darkTheme,
    color: "#ffffff",
    colorMuted: "#cccccc",
    borderColor: "#ffffff",
    background: "#000000"
  },
  // Brand emphasis variant
  "light-brand": {
    ...lightTheme,
    primary: colorTokens.primary,
    background: colorTokens.primaryOpacity10
  },
  "dark-brand": {
    ...darkTheme,
    primary: colorTokens.primary,
    background: colorTokens.primaryOpacity20
  }
};
var allThemes = {
  ...themes,
  ...themeVariants
};

// ../../node_modules/.bun/@tamagui+animations-motion@1.144.4+e1c714ba709dbee1/node_modules/@tamagui/animations-motion/dist/esm/createAnimations.mjs
var import_core3 = require("@tamagui/core");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/utils/use-constant.mjs
var import_react = require("react");
function useConstant(init) {
  const ref = (0, import_react.useRef)(null);
  if (ref.current === null) {
    ref.current = init();
  }
  return ref.current;
}
__name(useConstant, "useConstant");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/array.mjs
function addUniqueItem(arr, item) {
  if (arr.indexOf(item) === -1)
    arr.push(item);
}
__name(addUniqueItem, "addUniqueItem");
function removeItem(arr, item) {
  const index = arr.indexOf(item);
  if (index > -1)
    arr.splice(index, 1);
}
__name(removeItem, "removeItem");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/clamp.mjs
var clamp = /* @__PURE__ */ __name((min, max, v) => {
  if (v > max)
    return max;
  if (v < min)
    return min;
  return v;
}, "clamp");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/format-error-message.mjs
function formatErrorMessage(message, errorCode) {
  return errorCode ? `${message}. For more information and steps for solving, visit https://motion.dev/troubleshooting/${errorCode}` : message;
}
__name(formatErrorMessage, "formatErrorMessage");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/errors.mjs
var warning = /* @__PURE__ */ __name(() => {
}, "warning");
var invariant = /* @__PURE__ */ __name(() => {
}, "invariant");
if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  warning = /* @__PURE__ */ __name((check, message, errorCode) => {
    if (!check && typeof console !== "undefined") {
      console.warn(formatErrorMessage(message, errorCode));
    }
  }, "warning");
  invariant = /* @__PURE__ */ __name((check, message, errorCode) => {
    if (!check) {
      throw new Error(formatErrorMessage(message, errorCode));
    }
  }, "invariant");
}

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/global-config.mjs
var MotionGlobalConfig = {};

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/is-numerical-string.mjs
var isNumericalString = /* @__PURE__ */ __name((v) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(v), "isNumericalString");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/is-object.mjs
function isObject(value) {
  return typeof value === "object" && value !== null;
}
__name(isObject, "isObject");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/is-zero-value-string.mjs
var isZeroValueString = /* @__PURE__ */ __name((v) => /^0[^.\s]+$/u.test(v), "isZeroValueString");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/memo.mjs
// @__NO_SIDE_EFFECTS__
function memo(callback) {
  let result;
  return () => {
    if (result === void 0)
      result = callback();
    return result;
  };
}
__name(memo, "memo");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/noop.mjs
var noop = /* @__PURE__ */ __name(/* @__NO_SIDE_EFFECTS__ */ (any) => any, "noop");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/pipe.mjs
var combineFunctions = /* @__PURE__ */ __name((a, b) => (v) => b(a(v)), "combineFunctions");
var pipe = /* @__PURE__ */ __name((...transformers) => transformers.reduce(combineFunctions), "pipe");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/progress.mjs
var progress = /* @__PURE__ */ __name(/* @__NO_SIDE_EFFECTS__ */ (from, to, value) => {
  const toFromDifference = to - from;
  return toFromDifference === 0 ? 1 : (value - from) / toFromDifference;
}, "progress");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/subscription-manager.mjs
var SubscriptionManager = class {
  static {
    __name(this, "SubscriptionManager");
  }
  constructor() {
    this.subscriptions = [];
  }
  add(handler) {
    addUniqueItem(this.subscriptions, handler);
    return () => removeItem(this.subscriptions, handler);
  }
  notify(a, b, c) {
    const numSubscriptions = this.subscriptions.length;
    if (!numSubscriptions)
      return;
    if (numSubscriptions === 1) {
      this.subscriptions[0](a, b, c);
    } else {
      for (let i = 0; i < numSubscriptions; i++) {
        const handler = this.subscriptions[i];
        handler && handler(a, b, c);
      }
    }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
};

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/time-conversion.mjs
var secondsToMilliseconds = /* @__PURE__ */ __name(/* @__NO_SIDE_EFFECTS__ */ (seconds) => seconds * 1e3, "secondsToMilliseconds");
var millisecondsToSeconds = /* @__PURE__ */ __name(/* @__NO_SIDE_EFFECTS__ */ (milliseconds) => milliseconds / 1e3, "millisecondsToSeconds");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/velocity-per-second.mjs
function velocityPerSecond(velocity, frameDuration) {
  return frameDuration ? velocity * (1e3 / frameDuration) : 0;
}
__name(velocityPerSecond, "velocityPerSecond");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/warn-once.mjs
var warned = /* @__PURE__ */ new Set();
function warnOnce(condition, message, errorCode) {
  if (condition || warned.has(message))
    return;
  console.warn(formatErrorMessage(message, errorCode));
  warned.add(message);
}
__name(warnOnce, "warnOnce");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/wrap.mjs
var wrap = /* @__PURE__ */ __name((min, max, v) => {
  const rangeSize = max - min;
  return ((v - min) % rangeSize + rangeSize) % rangeSize + min;
}, "wrap");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/cubic-bezier.mjs
var calcBezier = /* @__PURE__ */ __name((t, a1, a2) => (((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t + 3 * a1) * t, "calcBezier");
var subdivisionPrecision = 1e-7;
var subdivisionMaxIterations = 12;
function binarySubdivide(x, lowerBound, upperBound, mX1, mX2) {
  let currentX;
  let currentT;
  let i = 0;
  do {
    currentT = lowerBound + (upperBound - lowerBound) / 2;
    currentX = calcBezier(currentT, mX1, mX2) - x;
    if (currentX > 0) {
      upperBound = currentT;
    } else {
      lowerBound = currentT;
    }
  } while (Math.abs(currentX) > subdivisionPrecision && ++i < subdivisionMaxIterations);
  return currentT;
}
__name(binarySubdivide, "binarySubdivide");
function cubicBezier(mX1, mY1, mX2, mY2) {
  if (mX1 === mY1 && mX2 === mY2)
    return noop;
  const getTForX = /* @__PURE__ */ __name((aX) => binarySubdivide(aX, 0, 1, mX1, mX2), "getTForX");
  return (t) => t === 0 || t === 1 ? t : calcBezier(getTForX(t), mY1, mY2);
}
__name(cubicBezier, "cubicBezier");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/modifiers/mirror.mjs
var mirrorEasing = /* @__PURE__ */ __name((easing) => (p) => p <= 0.5 ? easing(2 * p) / 2 : (2 - easing(2 * (1 - p))) / 2, "mirrorEasing");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/modifiers/reverse.mjs
var reverseEasing = /* @__PURE__ */ __name((easing) => (p) => 1 - easing(1 - p), "reverseEasing");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/back.mjs
var backOut = /* @__PURE__ */ cubicBezier(0.33, 1.53, 0.69, 0.99);
var backIn = /* @__PURE__ */ reverseEasing(backOut);
var backInOut = /* @__PURE__ */ mirrorEasing(backIn);

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/anticipate.mjs
var anticipate = /* @__PURE__ */ __name((p) => p >= 1 ? 1 : (p *= 2) < 1 ? 0.5 * backIn(p) : 0.5 * (2 - Math.pow(2, -10 * (p - 1))), "anticipate");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/circ.mjs
var circIn = /* @__PURE__ */ __name((p) => 1 - Math.sin(Math.acos(p)), "circIn");
var circOut = reverseEasing(circIn);
var circInOut = mirrorEasing(circIn);

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/ease.mjs
var easeIn = /* @__PURE__ */ cubicBezier(0.42, 0, 1, 1);
var easeOut = /* @__PURE__ */ cubicBezier(0, 0, 0.58, 1);
var easeInOut = /* @__PURE__ */ cubicBezier(0.42, 0, 0.58, 1);

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/utils/is-easing-array.mjs
var isEasingArray = /* @__PURE__ */ __name((ease2) => {
  return Array.isArray(ease2) && typeof ease2[0] !== "number";
}, "isEasingArray");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/utils/get-easing-for-segment.mjs
function getEasingForSegment(easing, i) {
  return isEasingArray(easing) ? easing[wrap(0, easing.length, i)] : easing;
}
__name(getEasingForSegment, "getEasingForSegment");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/utils/is-bezier-definition.mjs
var isBezierDefinition = /* @__PURE__ */ __name((easing) => Array.isArray(easing) && typeof easing[0] === "number", "isBezierDefinition");

// ../../node_modules/.bun/motion-utils@12.36.0/node_modules/motion-utils/dist/es/easing/utils/map.mjs
var easingLookup = {
  linear: noop,
  easeIn,
  easeInOut,
  easeOut,
  circIn,
  circInOut,
  circOut,
  backIn,
  backInOut,
  backOut,
  anticipate
};
var isValidEasing = /* @__PURE__ */ __name((easing) => {
  return typeof easing === "string";
}, "isValidEasing");
var easingDefinitionToFunction = /* @__PURE__ */ __name((definition) => {
  if (isBezierDefinition(definition)) {
    invariant(definition.length === 4, `Cubic bezier arrays must contain four numerical values.`, "cubic-bezier-length");
    const [x1, y1, x2, y2] = definition;
    return cubicBezier(x1, y1, x2, y2);
  } else if (isValidEasing(definition)) {
    invariant(easingLookup[definition] !== void 0, `Invalid easing type '${definition}'`, "invalid-easing-type");
    return easingLookup[definition];
  }
  return definition;
}, "easingDefinitionToFunction");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/frameloop/order.mjs
var stepsOrder = [
  "setup",
  // Compute
  "read",
  // Read
  "resolveKeyframes",
  // Write/Read/Write/Read
  "preUpdate",
  // Compute
  "update",
  // Compute
  "preRender",
  // Compute
  "render",
  // Write
  "postRender"
  // Compute
];

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/stats/buffer.mjs
var statsBuffer = {
  value: null,
  addProjectionMetrics: null
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/frameloop/render-step.mjs
function createRenderStep(runNextFrame, stepName) {
  let thisFrame = /* @__PURE__ */ new Set();
  let nextFrame = /* @__PURE__ */ new Set();
  let isProcessing = false;
  let flushNextFrame = false;
  const toKeepAlive = /* @__PURE__ */ new WeakSet();
  let latestFrameData = {
    delta: 0,
    timestamp: 0,
    isProcessing: false
  };
  let numCalls = 0;
  function triggerCallback(callback) {
    if (toKeepAlive.has(callback)) {
      step.schedule(callback);
      runNextFrame();
    }
    numCalls++;
    callback(latestFrameData);
  }
  __name(triggerCallback, "triggerCallback");
  const step = {
    /**
     * Schedule a process to run on the next frame.
     */
    schedule: /* @__PURE__ */ __name((callback, keepAlive = false, immediate = false) => {
      const addToCurrentFrame = immediate && isProcessing;
      const queue = addToCurrentFrame ? thisFrame : nextFrame;
      if (keepAlive)
        toKeepAlive.add(callback);
      queue.add(callback);
      return callback;
    }, "schedule"),
    /**
     * Cancel the provided callback from running on the next frame.
     */
    cancel: /* @__PURE__ */ __name((callback) => {
      nextFrame.delete(callback);
      toKeepAlive.delete(callback);
    }, "cancel"),
    /**
     * Execute all schedule callbacks.
     */
    process: /* @__PURE__ */ __name((frameData2) => {
      latestFrameData = frameData2;
      if (isProcessing) {
        flushNextFrame = true;
        return;
      }
      isProcessing = true;
      const prevFrame = thisFrame;
      thisFrame = nextFrame;
      nextFrame = prevFrame;
      thisFrame.forEach(triggerCallback);
      if (stepName && statsBuffer.value) {
        statsBuffer.value.frameloop[stepName].push(numCalls);
      }
      numCalls = 0;
      thisFrame.clear();
      isProcessing = false;
      if (flushNextFrame) {
        flushNextFrame = false;
        step.process(frameData2);
      }
    }, "process")
  };
  return step;
}
__name(createRenderStep, "createRenderStep");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/frameloop/batcher.mjs
var maxElapsed = 40;
function createRenderBatcher(scheduleNextBatch, allowKeepAlive) {
  let runNextFrame = false;
  let useDefaultElapsed = true;
  const state = {
    delta: 0,
    timestamp: 0,
    isProcessing: false
  };
  const flagRunNextFrame = /* @__PURE__ */ __name(() => runNextFrame = true, "flagRunNextFrame");
  const steps = stepsOrder.reduce((acc, key) => {
    acc[key] = createRenderStep(flagRunNextFrame, allowKeepAlive ? key : void 0);
    return acc;
  }, {});
  const { setup, read, resolveKeyframes, preUpdate, update, preRender, render, postRender } = steps;
  const processBatch = /* @__PURE__ */ __name(() => {
    const useManualTiming = MotionGlobalConfig.useManualTiming;
    const timestamp = useManualTiming ? state.timestamp : performance.now();
    runNextFrame = false;
    if (!useManualTiming) {
      state.delta = useDefaultElapsed ? 1e3 / 60 : Math.max(Math.min(timestamp - state.timestamp, maxElapsed), 1);
    }
    state.timestamp = timestamp;
    state.isProcessing = true;
    setup.process(state);
    read.process(state);
    resolveKeyframes.process(state);
    preUpdate.process(state);
    update.process(state);
    preRender.process(state);
    render.process(state);
    postRender.process(state);
    state.isProcessing = false;
    if (runNextFrame && allowKeepAlive) {
      useDefaultElapsed = false;
      scheduleNextBatch(processBatch);
    }
  }, "processBatch");
  const wake = /* @__PURE__ */ __name(() => {
    runNextFrame = true;
    useDefaultElapsed = true;
    if (!state.isProcessing) {
      scheduleNextBatch(processBatch);
    }
  }, "wake");
  const schedule = stepsOrder.reduce((acc, key) => {
    const step = steps[key];
    acc[key] = (process2, keepAlive = false, immediate = false) => {
      if (!runNextFrame)
        wake();
      return step.schedule(process2, keepAlive, immediate);
    };
    return acc;
  }, {});
  const cancel = /* @__PURE__ */ __name((process2) => {
    for (let i = 0; i < stepsOrder.length; i++) {
      steps[stepsOrder[i]].cancel(process2);
    }
  }, "cancel");
  return { schedule, cancel, state, steps };
}
__name(createRenderBatcher, "createRenderBatcher");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/frameloop/frame.mjs
var { schedule: frame, cancel: cancelFrame, state: frameData, steps: frameSteps } = /* @__PURE__ */ createRenderBatcher(typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : noop, true);

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/frameloop/sync-time.mjs
var now;
function clearTime() {
  now = void 0;
}
__name(clearTime, "clearTime");
var time = {
  now: /* @__PURE__ */ __name(() => {
    if (now === void 0) {
      time.set(frameData.isProcessing || MotionGlobalConfig.useManualTiming ? frameData.timestamp : performance.now());
    }
    return now;
  }, "now"),
  set: /* @__PURE__ */ __name((newTime) => {
    now = newTime;
    queueMicrotask(clearTime);
  }, "set")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/stats/animation-count.mjs
var activeAnimations = {
  layout: 0,
  mainThread: 0,
  waapi: 0
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/is-css-variable.mjs
var checkStringStartsWith = /* @__PURE__ */ __name((token) => (key) => typeof key === "string" && key.startsWith(token), "checkStringStartsWith");
var isCSSVariableName = /* @__PURE__ */ checkStringStartsWith("--");
var startsAsVariableToken = /* @__PURE__ */ checkStringStartsWith("var(--");
var isCSSVariableToken = /* @__PURE__ */ __name((value) => {
  const startsWithToken = startsAsVariableToken(value);
  if (!startsWithToken)
    return false;
  return singleCssVariableRegex.test(value.split("/*")[0].trim());
}, "isCSSVariableToken");
var singleCssVariableRegex = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
function containsCSSVariable(value) {
  if (typeof value !== "string")
    return false;
  return value.split("/*")[0].includes("var(--");
}
__name(containsCSSVariable, "containsCSSVariable");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/numbers/index.mjs
var number = {
  test: /* @__PURE__ */ __name((v) => typeof v === "number", "test"),
  parse: parseFloat,
  transform: /* @__PURE__ */ __name((v) => v, "transform")
};
var alpha = {
  ...number,
  transform: /* @__PURE__ */ __name((v) => clamp(0, 1, v), "transform")
};
var scale = {
  ...number,
  default: 1
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/utils/sanitize.mjs
var sanitize = /* @__PURE__ */ __name((v) => Math.round(v * 1e5) / 1e5, "sanitize");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/utils/float-regex.mjs
var floatRegex = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/utils/is-nullish.mjs
function isNullish(v) {
  return v == null;
}
__name(isNullish, "isNullish");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/utils/single-color-regex.mjs
var singleColorRegex = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu;

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/color/utils.mjs
var isColorString = /* @__PURE__ */ __name((type, testProp) => (v) => {
  return Boolean(typeof v === "string" && singleColorRegex.test(v) && v.startsWith(type) || testProp && !isNullish(v) && Object.prototype.hasOwnProperty.call(v, testProp));
}, "isColorString");
var splitColor = /* @__PURE__ */ __name((aName, bName, cName) => (v) => {
  if (typeof v !== "string")
    return v;
  const [a, b, c, alpha2] = v.match(floatRegex);
  return {
    [aName]: parseFloat(a),
    [bName]: parseFloat(b),
    [cName]: parseFloat(c),
    alpha: alpha2 !== void 0 ? parseFloat(alpha2) : 1
  };
}, "splitColor");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/color/rgba.mjs
var clampRgbUnit = /* @__PURE__ */ __name((v) => clamp(0, 255, v), "clampRgbUnit");
var rgbUnit = {
  ...number,
  transform: /* @__PURE__ */ __name((v) => Math.round(clampRgbUnit(v)), "transform")
};
var rgba = {
  test: /* @__PURE__ */ isColorString("rgb", "red"),
  parse: /* @__PURE__ */ splitColor("red", "green", "blue"),
  transform: /* @__PURE__ */ __name(({ red, green, blue, alpha: alpha$1 = 1 }) => "rgba(" + rgbUnit.transform(red) + ", " + rgbUnit.transform(green) + ", " + rgbUnit.transform(blue) + ", " + sanitize(alpha.transform(alpha$1)) + ")", "transform")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/color/hex.mjs
function parseHex(v) {
  let r = "";
  let g = "";
  let b = "";
  let a = "";
  if (v.length > 5) {
    r = v.substring(1, 3);
    g = v.substring(3, 5);
    b = v.substring(5, 7);
    a = v.substring(7, 9);
  } else {
    r = v.substring(1, 2);
    g = v.substring(2, 3);
    b = v.substring(3, 4);
    a = v.substring(4, 5);
    r += r;
    g += g;
    b += b;
    a += a;
  }
  return {
    red: parseInt(r, 16),
    green: parseInt(g, 16),
    blue: parseInt(b, 16),
    alpha: a ? parseInt(a, 16) / 255 : 1
  };
}
__name(parseHex, "parseHex");
var hex = {
  test: /* @__PURE__ */ isColorString("#"),
  parse: parseHex,
  transform: rgba.transform
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/numbers/units.mjs
var createUnitType = /* @__PURE__ */ __name(/* @__NO_SIDE_EFFECTS__ */ (unit) => ({
  test: /* @__PURE__ */ __name((v) => typeof v === "string" && v.endsWith(unit) && v.split(" ").length === 1, "test"),
  parse: parseFloat,
  transform: /* @__PURE__ */ __name((v) => `${v}${unit}`, "transform")
}), "createUnitType");
var degrees = /* @__PURE__ */ createUnitType("deg");
var percent = /* @__PURE__ */ createUnitType("%");
var px = /* @__PURE__ */ createUnitType("px");
var vh = /* @__PURE__ */ createUnitType("vh");
var vw = /* @__PURE__ */ createUnitType("vw");
var progressPercentage = /* @__PURE__ */ (() => ({
  ...percent,
  parse: /* @__PURE__ */ __name((v) => percent.parse(v) / 100, "parse"),
  transform: /* @__PURE__ */ __name((v) => percent.transform(v * 100), "transform")
}))();

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/color/hsla.mjs
var hsla = {
  test: /* @__PURE__ */ isColorString("hsl", "hue"),
  parse: /* @__PURE__ */ splitColor("hue", "saturation", "lightness"),
  transform: /* @__PURE__ */ __name(({ hue, saturation, lightness, alpha: alpha$1 = 1 }) => {
    return "hsla(" + Math.round(hue) + ", " + percent.transform(sanitize(saturation)) + ", " + percent.transform(sanitize(lightness)) + ", " + sanitize(alpha.transform(alpha$1)) + ")";
  }, "transform")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/color/index.mjs
var color = {
  test: /* @__PURE__ */ __name((v) => rgba.test(v) || hex.test(v) || hsla.test(v), "test"),
  parse: /* @__PURE__ */ __name((v) => {
    if (rgba.test(v)) {
      return rgba.parse(v);
    } else if (hsla.test(v)) {
      return hsla.parse(v);
    } else {
      return hex.parse(v);
    }
  }, "parse"),
  transform: /* @__PURE__ */ __name((v) => {
    return typeof v === "string" ? v : v.hasOwnProperty("red") ? rgba.transform(v) : hsla.transform(v);
  }, "transform"),
  getAnimatableNone: /* @__PURE__ */ __name((v) => {
    const parsed = color.parse(v);
    parsed.alpha = 0;
    return color.transform(parsed);
  }, "getAnimatableNone")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/utils/color-regex.mjs
var colorRegex = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/complex/index.mjs
function test(v) {
  return isNaN(v) && typeof v === "string" && (v.match(floatRegex)?.length || 0) + (v.match(colorRegex)?.length || 0) > 0;
}
__name(test, "test");
var NUMBER_TOKEN = "number";
var COLOR_TOKEN = "color";
var VAR_TOKEN = "var";
var VAR_FUNCTION_TOKEN = "var(";
var SPLIT_TOKEN = "${}";
var complexRegex = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function analyseComplexValue(value) {
  const originalValue = value.toString();
  const values = [];
  const indexes = {
    color: [],
    number: [],
    var: []
  };
  const types = [];
  let i = 0;
  const tokenised = originalValue.replace(complexRegex, (parsedValue) => {
    if (color.test(parsedValue)) {
      indexes.color.push(i);
      types.push(COLOR_TOKEN);
      values.push(color.parse(parsedValue));
    } else if (parsedValue.startsWith(VAR_FUNCTION_TOKEN)) {
      indexes.var.push(i);
      types.push(VAR_TOKEN);
      values.push(parsedValue);
    } else {
      indexes.number.push(i);
      types.push(NUMBER_TOKEN);
      values.push(parseFloat(parsedValue));
    }
    ++i;
    return SPLIT_TOKEN;
  });
  const split = tokenised.split(SPLIT_TOKEN);
  return { values, split, indexes, types };
}
__name(analyseComplexValue, "analyseComplexValue");
function parseComplexValue(v) {
  return analyseComplexValue(v).values;
}
__name(parseComplexValue, "parseComplexValue");
function buildTransformer({ split, types }) {
  const numSections = split.length;
  return (v) => {
    let output = "";
    for (let i = 0; i < numSections; i++) {
      output += split[i];
      if (v[i] !== void 0) {
        const type = types[i];
        if (type === NUMBER_TOKEN) {
          output += sanitize(v[i]);
        } else if (type === COLOR_TOKEN) {
          output += color.transform(v[i]);
        } else {
          output += v[i];
        }
      }
    }
    return output;
  };
}
__name(buildTransformer, "buildTransformer");
function createTransformer(source) {
  return buildTransformer(analyseComplexValue(source));
}
__name(createTransformer, "createTransformer");
var convertNumbersToZero = /* @__PURE__ */ __name((v) => typeof v === "number" ? 0 : color.test(v) ? color.getAnimatableNone(v) : v, "convertNumbersToZero");
var convertToZero = /* @__PURE__ */ __name((value, splitBefore) => {
  if (typeof value === "number") {
    return splitBefore?.trim().endsWith("/") ? value : 0;
  }
  return convertNumbersToZero(value);
}, "convertToZero");
function getAnimatableNone(v) {
  const info = analyseComplexValue(v);
  const transformer = buildTransformer(info);
  return transformer(info.values.map((value, i) => convertToZero(value, info.split[i])));
}
__name(getAnimatableNone, "getAnimatableNone");
var complex = {
  test,
  parse: parseComplexValue,
  createTransformer,
  getAnimatableNone
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/color/hsla-to-rgba.mjs
function hueToRgb(p, q, t) {
  if (t < 0)
    t += 1;
  if (t > 1)
    t -= 1;
  if (t < 1 / 6)
    return p + (q - p) * 6 * t;
  if (t < 1 / 2)
    return q;
  if (t < 2 / 3)
    return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
__name(hueToRgb, "hueToRgb");
function hslaToRgba({ hue, saturation, lightness, alpha: alpha2 }) {
  hue /= 360;
  saturation /= 100;
  lightness /= 100;
  let red = 0;
  let green = 0;
  let blue = 0;
  if (!saturation) {
    red = green = blue = lightness;
  } else {
    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    red = hueToRgb(p, q, hue + 1 / 3);
    green = hueToRgb(p, q, hue);
    blue = hueToRgb(p, q, hue - 1 / 3);
  }
  return {
    red: Math.round(red * 255),
    green: Math.round(green * 255),
    blue: Math.round(blue * 255),
    alpha: alpha2
  };
}
__name(hslaToRgba, "hslaToRgba");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/mix/immediate.mjs
function mixImmediate(a, b) {
  return (p) => p > 0 ? b : a;
}
__name(mixImmediate, "mixImmediate");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/mix/number.mjs
var mixNumber = /* @__PURE__ */ __name((from, to, progress2) => {
  return from + (to - from) * progress2;
}, "mixNumber");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/mix/color.mjs
var mixLinearColor = /* @__PURE__ */ __name((from, to, v) => {
  const fromExpo = from * from;
  const expo = v * (to * to - fromExpo) + fromExpo;
  return expo < 0 ? 0 : Math.sqrt(expo);
}, "mixLinearColor");
var colorTypes = [hex, rgba, hsla];
var getColorType = /* @__PURE__ */ __name((v) => colorTypes.find((type) => type.test(v)), "getColorType");
function asRGBA(color2) {
  const type = getColorType(color2);
  warning(Boolean(type), `'${color2}' is not an animatable color. Use the equivalent color code instead.`, "color-not-animatable");
  if (!Boolean(type))
    return false;
  let model = type.parse(color2);
  if (type === hsla) {
    model = hslaToRgba(model);
  }
  return model;
}
__name(asRGBA, "asRGBA");
var mixColor = /* @__PURE__ */ __name((from, to) => {
  const fromRGBA = asRGBA(from);
  const toRGBA = asRGBA(to);
  if (!fromRGBA || !toRGBA) {
    return mixImmediate(from, to);
  }
  const blended = { ...fromRGBA };
  return (v) => {
    blended.red = mixLinearColor(fromRGBA.red, toRGBA.red, v);
    blended.green = mixLinearColor(fromRGBA.green, toRGBA.green, v);
    blended.blue = mixLinearColor(fromRGBA.blue, toRGBA.blue, v);
    blended.alpha = mixNumber(fromRGBA.alpha, toRGBA.alpha, v);
    return rgba.transform(blended);
  };
}, "mixColor");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/mix/visibility.mjs
var invisibleValues = /* @__PURE__ */ new Set(["none", "hidden"]);
function mixVisibility(origin, target) {
  if (invisibleValues.has(origin)) {
    return (p) => p <= 0 ? origin : target;
  } else {
    return (p) => p >= 1 ? target : origin;
  }
}
__name(mixVisibility, "mixVisibility");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/mix/complex.mjs
function mixNumber2(a, b) {
  return (p) => mixNumber(a, b, p);
}
__name(mixNumber2, "mixNumber");
function getMixer(a) {
  if (typeof a === "number") {
    return mixNumber2;
  } else if (typeof a === "string") {
    return isCSSVariableToken(a) ? mixImmediate : color.test(a) ? mixColor : mixComplex;
  } else if (Array.isArray(a)) {
    return mixArray;
  } else if (typeof a === "object") {
    return color.test(a) ? mixColor : mixObject;
  }
  return mixImmediate;
}
__name(getMixer, "getMixer");
function mixArray(a, b) {
  const output = [...a];
  const numValues = output.length;
  const blendValue = a.map((v, i) => getMixer(v)(v, b[i]));
  return (p) => {
    for (let i = 0; i < numValues; i++) {
      output[i] = blendValue[i](p);
    }
    return output;
  };
}
__name(mixArray, "mixArray");
function mixObject(a, b) {
  const output = { ...a, ...b };
  const blendValue = {};
  for (const key in output) {
    if (a[key] !== void 0 && b[key] !== void 0) {
      blendValue[key] = getMixer(a[key])(a[key], b[key]);
    }
  }
  return (v) => {
    for (const key in blendValue) {
      output[key] = blendValue[key](v);
    }
    return output;
  };
}
__name(mixObject, "mixObject");
function matchOrder(origin, target) {
  const orderedOrigin = [];
  const pointers = { color: 0, var: 0, number: 0 };
  for (let i = 0; i < target.values.length; i++) {
    const type = target.types[i];
    const originIndex = origin.indexes[type][pointers[type]];
    const originValue = origin.values[originIndex] ?? 0;
    orderedOrigin[i] = originValue;
    pointers[type]++;
  }
  return orderedOrigin;
}
__name(matchOrder, "matchOrder");
var mixComplex = /* @__PURE__ */ __name((origin, target) => {
  const template = complex.createTransformer(target);
  const originStats = analyseComplexValue(origin);
  const targetStats = analyseComplexValue(target);
  const canInterpolate = originStats.indexes.var.length === targetStats.indexes.var.length && originStats.indexes.color.length === targetStats.indexes.color.length && originStats.indexes.number.length >= targetStats.indexes.number.length;
  if (canInterpolate) {
    if (invisibleValues.has(origin) && !targetStats.values.length || invisibleValues.has(target) && !originStats.values.length) {
      return mixVisibility(origin, target);
    }
    return pipe(mixArray(matchOrder(originStats, targetStats), targetStats.values), template);
  } else {
    warning(true, `Complex values '${origin}' and '${target}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`, "complex-values-different");
    return mixImmediate(origin, target);
  }
}, "mixComplex");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/mix/index.mjs
function mix(from, to, p) {
  if (typeof from === "number" && typeof to === "number" && typeof p === "number") {
    return mixNumber(from, to, p);
  }
  const mixer = getMixer(from);
  return mixer(from, to);
}
__name(mix, "mix");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/drivers/frame.mjs
var frameloopDriver = /* @__PURE__ */ __name((update) => {
  const passTimestamp = /* @__PURE__ */ __name(({ timestamp }) => update(timestamp), "passTimestamp");
  return {
    start: /* @__PURE__ */ __name((keepAlive = true) => frame.update(passTimestamp, keepAlive), "start"),
    stop: /* @__PURE__ */ __name(() => cancelFrame(passTimestamp), "stop"),
    /**
     * If we're processing this frame we can use the
     * framelocked timestamp to keep things in sync.
     */
    now: /* @__PURE__ */ __name(() => frameData.isProcessing ? frameData.timestamp : time.now(), "now")
  };
}, "frameloopDriver");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/utils/linear.mjs
var generateLinearEasing = /* @__PURE__ */ __name((easing, duration, resolution = 10) => {
  let points = "";
  const numPoints = Math.max(Math.round(duration / resolution), 2);
  for (let i = 0; i < numPoints; i++) {
    points += Math.round(easing(i / (numPoints - 1)) * 1e4) / 1e4 + ", ";
  }
  return `linear(${points.substring(0, points.length - 2)})`;
}, "generateLinearEasing");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/generators/utils/calc-duration.mjs
var maxGeneratorDuration = 2e4;
function calcGeneratorDuration(generator) {
  let duration = 0;
  const timeStep = 50;
  let state = generator.next(duration);
  while (!state.done && duration < maxGeneratorDuration) {
    duration += timeStep;
    state = generator.next(duration);
  }
  return duration >= maxGeneratorDuration ? Infinity : duration;
}
__name(calcGeneratorDuration, "calcGeneratorDuration");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/generators/utils/create-generator-easing.mjs
function createGeneratorEasing(options, scale2 = 100, createGenerator) {
  const generator = createGenerator({ ...options, keyframes: [0, scale2] });
  const duration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);
  return {
    type: "keyframes",
    ease: /* @__PURE__ */ __name((progress2) => {
      return generator.next(duration * progress2).value / scale2;
    }, "ease"),
    duration: millisecondsToSeconds(duration)
  };
}
__name(createGeneratorEasing, "createGeneratorEasing");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/generators/spring.mjs
var springDefaults = {
  // Default spring physics
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
  // Default duration/bounce-based options
  duration: 800,
  // in ms
  bounce: 0.3,
  visualDuration: 0.3,
  // in seconds
  // Rest thresholds
  restSpeed: {
    granular: 0.01,
    default: 2
  },
  restDelta: {
    granular: 5e-3,
    default: 0.5
  },
  // Limits
  minDuration: 0.01,
  // in seconds
  maxDuration: 10,
  // in seconds
  minDamping: 0.05,
  maxDamping: 1
};
function calcAngularFreq(undampedFreq, dampingRatio) {
  return undampedFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
}
__name(calcAngularFreq, "calcAngularFreq");
var rootIterations = 12;
function approximateRoot(envelope, derivative, initialGuess) {
  let result = initialGuess;
  for (let i = 1; i < rootIterations; i++) {
    result = result - envelope(result) / derivative(result);
  }
  return result;
}
__name(approximateRoot, "approximateRoot");
var safeMin = 1e-3;
function findSpring({ duration = springDefaults.duration, bounce = springDefaults.bounce, velocity = springDefaults.velocity, mass = springDefaults.mass }) {
  let envelope;
  let derivative;
  warning(duration <= secondsToMilliseconds(springDefaults.maxDuration), "Spring duration must be 10 seconds or less", "spring-duration-limit");
  let dampingRatio = 1 - bounce;
  dampingRatio = clamp(springDefaults.minDamping, springDefaults.maxDamping, dampingRatio);
  duration = clamp(springDefaults.minDuration, springDefaults.maxDuration, millisecondsToSeconds(duration));
  if (dampingRatio < 1) {
    envelope = /* @__PURE__ */ __name((undampedFreq2) => {
      const exponentialDecay = undampedFreq2 * dampingRatio;
      const delta = exponentialDecay * duration;
      const a = exponentialDecay - velocity;
      const b = calcAngularFreq(undampedFreq2, dampingRatio);
      const c = Math.exp(-delta);
      return safeMin - a / b * c;
    }, "envelope");
    derivative = /* @__PURE__ */ __name((undampedFreq2) => {
      const exponentialDecay = undampedFreq2 * dampingRatio;
      const delta = exponentialDecay * duration;
      const d = delta * velocity + velocity;
      const e = Math.pow(dampingRatio, 2) * Math.pow(undampedFreq2, 2) * duration;
      const f = Math.exp(-delta);
      const g = calcAngularFreq(Math.pow(undampedFreq2, 2), dampingRatio);
      const factor = -envelope(undampedFreq2) + safeMin > 0 ? -1 : 1;
      return factor * ((d - e) * f) / g;
    }, "derivative");
  } else {
    envelope = /* @__PURE__ */ __name((undampedFreq2) => {
      const a = Math.exp(-undampedFreq2 * duration);
      const b = (undampedFreq2 - velocity) * duration + 1;
      return -safeMin + a * b;
    }, "envelope");
    derivative = /* @__PURE__ */ __name((undampedFreq2) => {
      const a = Math.exp(-undampedFreq2 * duration);
      const b = (velocity - undampedFreq2) * (duration * duration);
      return a * b;
    }, "derivative");
  }
  const initialGuess = 5 / duration;
  const undampedFreq = approximateRoot(envelope, derivative, initialGuess);
  duration = secondsToMilliseconds(duration);
  if (isNaN(undampedFreq)) {
    return {
      stiffness: springDefaults.stiffness,
      damping: springDefaults.damping,
      duration
    };
  } else {
    const stiffness = Math.pow(undampedFreq, 2) * mass;
    return {
      stiffness,
      damping: dampingRatio * 2 * Math.sqrt(mass * stiffness),
      duration
    };
  }
}
__name(findSpring, "findSpring");
var durationKeys = ["duration", "bounce"];
var physicsKeys = ["stiffness", "damping", "mass"];
function isSpringType(options, keys) {
  return keys.some((key) => options[key] !== void 0);
}
__name(isSpringType, "isSpringType");
function getSpringOptions(options) {
  let springOptions = {
    velocity: springDefaults.velocity,
    stiffness: springDefaults.stiffness,
    damping: springDefaults.damping,
    mass: springDefaults.mass,
    isResolvedFromDuration: false,
    ...options
  };
  if (!isSpringType(options, physicsKeys) && isSpringType(options, durationKeys)) {
    springOptions.velocity = 0;
    if (options.visualDuration) {
      const visualDuration = options.visualDuration;
      const root = 2 * Math.PI / (visualDuration * 1.2);
      const stiffness = root * root;
      const damping = 2 * clamp(0.05, 1, 1 - (options.bounce || 0)) * Math.sqrt(stiffness);
      springOptions = {
        ...springOptions,
        mass: springDefaults.mass,
        stiffness,
        damping
      };
    } else {
      const derived = findSpring({ ...options, velocity: 0 });
      springOptions = {
        ...springOptions,
        ...derived,
        mass: springDefaults.mass
      };
      springOptions.isResolvedFromDuration = true;
    }
  }
  return springOptions;
}
__name(getSpringOptions, "getSpringOptions");
function spring(optionsOrVisualDuration = springDefaults.visualDuration, bounce = springDefaults.bounce) {
  const options = typeof optionsOrVisualDuration !== "object" ? {
    visualDuration: optionsOrVisualDuration,
    keyframes: [0, 1],
    bounce
  } : optionsOrVisualDuration;
  let { restSpeed, restDelta } = options;
  const origin = options.keyframes[0];
  const target = options.keyframes[options.keyframes.length - 1];
  const state = { done: false, value: origin };
  const { stiffness, damping, mass, duration, velocity, isResolvedFromDuration } = getSpringOptions({
    ...options,
    velocity: -millisecondsToSeconds(options.velocity || 0)
  });
  const initialVelocity = velocity || 0;
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  const initialDelta = target - origin;
  const undampedAngularFreq = millisecondsToSeconds(Math.sqrt(stiffness / mass));
  const isGranularScale = Math.abs(initialDelta) < 5;
  restSpeed || (restSpeed = isGranularScale ? springDefaults.restSpeed.granular : springDefaults.restSpeed.default);
  restDelta || (restDelta = isGranularScale ? springDefaults.restDelta.granular : springDefaults.restDelta.default);
  let resolveSpring;
  let resolveVelocity;
  let angularFreq;
  let A;
  let sinCoeff;
  let cosCoeff;
  if (dampingRatio < 1) {
    angularFreq = calcAngularFreq(undampedAngularFreq, dampingRatio);
    A = (initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) / angularFreq;
    resolveSpring = /* @__PURE__ */ __name((t) => {
      const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
      return target - envelope * (A * Math.sin(angularFreq * t) + initialDelta * Math.cos(angularFreq * t));
    }, "resolveSpring");
    sinCoeff = dampingRatio * undampedAngularFreq * A + initialDelta * angularFreq;
    cosCoeff = dampingRatio * undampedAngularFreq * initialDelta - A * angularFreq;
    resolveVelocity = /* @__PURE__ */ __name((t) => {
      const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
      return envelope * (sinCoeff * Math.sin(angularFreq * t) + cosCoeff * Math.cos(angularFreq * t));
    }, "resolveVelocity");
  } else if (dampingRatio === 1) {
    resolveSpring = /* @__PURE__ */ __name((t) => target - Math.exp(-undampedAngularFreq * t) * (initialDelta + (initialVelocity + undampedAngularFreq * initialDelta) * t), "resolveSpring");
    const C = initialVelocity + undampedAngularFreq * initialDelta;
    resolveVelocity = /* @__PURE__ */ __name((t) => Math.exp(-undampedAngularFreq * t) * (undampedAngularFreq * C * t - initialVelocity), "resolveVelocity");
  } else {
    const dampedAngularFreq = undampedAngularFreq * Math.sqrt(dampingRatio * dampingRatio - 1);
    resolveSpring = /* @__PURE__ */ __name((t) => {
      const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
      const freqForT = Math.min(dampedAngularFreq * t, 300);
      return target - envelope * ((initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) * Math.sinh(freqForT) + dampedAngularFreq * initialDelta * Math.cosh(freqForT)) / dampedAngularFreq;
    }, "resolveSpring");
    const P = (initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) / dampedAngularFreq;
    const sinhCoeff = dampingRatio * undampedAngularFreq * P - initialDelta * dampedAngularFreq;
    const coshCoeff = dampingRatio * undampedAngularFreq * initialDelta - P * dampedAngularFreq;
    resolveVelocity = /* @__PURE__ */ __name((t) => {
      const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
      const freqForT = Math.min(dampedAngularFreq * t, 300);
      return envelope * (sinhCoeff * Math.sinh(freqForT) + coshCoeff * Math.cosh(freqForT));
    }, "resolveVelocity");
  }
  const generator = {
    calculatedDuration: isResolvedFromDuration ? duration || null : null,
    velocity: /* @__PURE__ */ __name((t) => secondsToMilliseconds(resolveVelocity(t)), "velocity"),
    next: /* @__PURE__ */ __name((t) => {
      if (!isResolvedFromDuration && dampingRatio < 1) {
        const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
        const sin = Math.sin(angularFreq * t);
        const cos = Math.cos(angularFreq * t);
        const current2 = target - envelope * (A * sin + initialDelta * cos);
        const currentVelocity = secondsToMilliseconds(envelope * (sinCoeff * sin + cosCoeff * cos));
        state.done = Math.abs(currentVelocity) <= restSpeed && Math.abs(target - current2) <= restDelta;
        state.value = state.done ? target : current2;
        return state;
      }
      const current = resolveSpring(t);
      if (!isResolvedFromDuration) {
        const currentVelocity = secondsToMilliseconds(resolveVelocity(t));
        state.done = Math.abs(currentVelocity) <= restSpeed && Math.abs(target - current) <= restDelta;
      } else {
        state.done = t >= duration;
      }
      state.value = state.done ? target : current;
      return state;
    }, "next"),
    toString: /* @__PURE__ */ __name(() => {
      const calculatedDuration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);
      const easing = generateLinearEasing((progress2) => generator.next(calculatedDuration * progress2).value, calculatedDuration, 30);
      return calculatedDuration + "ms " + easing;
    }, "toString"),
    toTransition: /* @__PURE__ */ __name(() => {
    }, "toTransition")
  };
  return generator;
}
__name(spring, "spring");
spring.applyToOptions = (options) => {
  const generatorOptions = createGeneratorEasing(options, 100, spring);
  options.ease = generatorOptions.ease;
  options.duration = secondsToMilliseconds(generatorOptions.duration);
  options.type = "keyframes";
  return options;
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/generators/utils/velocity.mjs
var velocitySampleDuration = 5;
function getGeneratorVelocity(resolveValue, t, current) {
  const prevT = Math.max(t - velocitySampleDuration, 0);
  return velocityPerSecond(current - resolveValue(prevT), t - prevT);
}
__name(getGeneratorVelocity, "getGeneratorVelocity");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/generators/inertia.mjs
function inertia({ keyframes: keyframes2, velocity = 0, power = 0.8, timeConstant = 325, bounceDamping = 10, bounceStiffness = 500, modifyTarget, min, max, restDelta = 0.5, restSpeed }) {
  const origin = keyframes2[0];
  const state = {
    done: false,
    value: origin
  };
  const isOutOfBounds = /* @__PURE__ */ __name((v) => min !== void 0 && v < min || max !== void 0 && v > max, "isOutOfBounds");
  const nearestBoundary = /* @__PURE__ */ __name((v) => {
    if (min === void 0)
      return max;
    if (max === void 0)
      return min;
    return Math.abs(min - v) < Math.abs(max - v) ? min : max;
  }, "nearestBoundary");
  let amplitude = power * velocity;
  const ideal = origin + amplitude;
  const target = modifyTarget === void 0 ? ideal : modifyTarget(ideal);
  if (target !== ideal)
    amplitude = target - origin;
  const calcDelta = /* @__PURE__ */ __name((t) => -amplitude * Math.exp(-t / timeConstant), "calcDelta");
  const calcLatest = /* @__PURE__ */ __name((t) => target + calcDelta(t), "calcLatest");
  const applyFriction = /* @__PURE__ */ __name((t) => {
    const delta = calcDelta(t);
    const latest = calcLatest(t);
    state.done = Math.abs(delta) <= restDelta;
    state.value = state.done ? target : latest;
  }, "applyFriction");
  let timeReachedBoundary;
  let spring$1;
  const checkCatchBoundary = /* @__PURE__ */ __name((t) => {
    if (!isOutOfBounds(state.value))
      return;
    timeReachedBoundary = t;
    spring$1 = spring({
      keyframes: [state.value, nearestBoundary(state.value)],
      velocity: getGeneratorVelocity(calcLatest, t, state.value),
      // TODO: This should be passing * 1000
      damping: bounceDamping,
      stiffness: bounceStiffness,
      restDelta,
      restSpeed
    });
  }, "checkCatchBoundary");
  checkCatchBoundary(0);
  return {
    calculatedDuration: null,
    next: /* @__PURE__ */ __name((t) => {
      let hasUpdatedFrame = false;
      if (!spring$1 && timeReachedBoundary === void 0) {
        hasUpdatedFrame = true;
        applyFriction(t);
        checkCatchBoundary(t);
      }
      if (timeReachedBoundary !== void 0 && t >= timeReachedBoundary) {
        return spring$1.next(t - timeReachedBoundary);
      } else {
        !hasUpdatedFrame && applyFriction(t);
        return state;
      }
    }, "next")
  };
}
__name(inertia, "inertia");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/interpolate.mjs
function createMixers(output, ease2, customMixer) {
  const mixers = [];
  const mixerFactory = customMixer || MotionGlobalConfig.mix || mix;
  const numMixers = output.length - 1;
  for (let i = 0; i < numMixers; i++) {
    let mixer = mixerFactory(output[i], output[i + 1]);
    if (ease2) {
      const easingFunction = Array.isArray(ease2) ? ease2[i] || noop : ease2;
      mixer = pipe(easingFunction, mixer);
    }
    mixers.push(mixer);
  }
  return mixers;
}
__name(createMixers, "createMixers");
function interpolate(input, output, { clamp: isClamp = true, ease: ease2, mixer } = {}) {
  const inputLength = input.length;
  invariant(inputLength === output.length, "Both input and output ranges must be the same length", "range-length");
  if (inputLength === 1)
    return () => output[0];
  if (inputLength === 2 && output[0] === output[1])
    return () => output[1];
  const isZeroDeltaRange = input[0] === input[1];
  if (input[0] > input[inputLength - 1]) {
    input = [...input].reverse();
    output = [...output].reverse();
  }
  const mixers = createMixers(output, ease2, mixer);
  const numMixers = mixers.length;
  const interpolator = /* @__PURE__ */ __name((v) => {
    if (isZeroDeltaRange && v < input[0])
      return output[0];
    let i = 0;
    if (numMixers > 1) {
      for (; i < input.length - 2; i++) {
        if (v < input[i + 1])
          break;
      }
    }
    const progressInRange = progress(input[i], input[i + 1], v);
    return mixers[i](progressInRange);
  }, "interpolator");
  return isClamp ? (v) => interpolator(clamp(input[0], input[inputLength - 1], v)) : interpolator;
}
__name(interpolate, "interpolate");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/offsets/fill.mjs
function fillOffset(offset, remaining) {
  const min = offset[offset.length - 1];
  for (let i = 1; i <= remaining; i++) {
    const offsetProgress = progress(0, remaining, i);
    offset.push(mixNumber(min, 1, offsetProgress));
  }
}
__name(fillOffset, "fillOffset");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/offsets/default.mjs
function defaultOffset(arr) {
  const offset = [0];
  fillOffset(offset, arr.length - 1);
  return offset;
}
__name(defaultOffset, "defaultOffset");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/offsets/time.mjs
function convertOffsetToTimes(offset, duration) {
  return offset.map((o) => o * duration);
}
__name(convertOffsetToTimes, "convertOffsetToTimes");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/generators/keyframes.mjs
function defaultEasing(values, easing) {
  return values.map(() => easing || easeInOut).splice(0, values.length - 1);
}
__name(defaultEasing, "defaultEasing");
function keyframes({ duration = 300, keyframes: keyframeValues, times, ease: ease2 = "easeInOut" }) {
  const easingFunctions = isEasingArray(ease2) ? ease2.map(easingDefinitionToFunction) : easingDefinitionToFunction(ease2);
  const state = {
    done: false,
    value: keyframeValues[0]
  };
  const absoluteTimes = convertOffsetToTimes(
    // Only use the provided offsets if they're the correct length
    // TODO Maybe we should warn here if there's a length mismatch
    times && times.length === keyframeValues.length ? times : defaultOffset(keyframeValues),
    duration
  );
  const mapTimeToKeyframe = interpolate(absoluteTimes, keyframeValues, {
    ease: Array.isArray(easingFunctions) ? easingFunctions : defaultEasing(keyframeValues, easingFunctions)
  });
  return {
    calculatedDuration: duration,
    next: /* @__PURE__ */ __name((t) => {
      state.value = mapTimeToKeyframe(t);
      state.done = t >= duration;
      return state;
    }, "next")
  };
}
__name(keyframes, "keyframes");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/get-final.mjs
var isNotNull = /* @__PURE__ */ __name((value) => value !== null, "isNotNull");
function getFinalKeyframe(keyframes2, { repeat, repeatType = "loop" }, finalKeyframe, speed = 1) {
  const resolvedKeyframes = keyframes2.filter(isNotNull);
  const useFirstKeyframe = speed < 0 || repeat && repeatType !== "loop" && repeat % 2 === 1;
  const index = useFirstKeyframe ? 0 : resolvedKeyframes.length - 1;
  return !index || finalKeyframe === void 0 ? resolvedKeyframes[index] : finalKeyframe;
}
__name(getFinalKeyframe, "getFinalKeyframe");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/replace-transition-type.mjs
var transitionTypeMap = {
  decay: inertia,
  inertia,
  tween: keyframes,
  keyframes,
  spring
};
function replaceTransitionType(transition) {
  if (typeof transition.type === "string") {
    transition.type = transitionTypeMap[transition.type];
  }
}
__name(replaceTransitionType, "replaceTransitionType");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/WithPromise.mjs
var WithPromise = class {
  static {
    __name(this, "WithPromise");
  }
  constructor() {
    this.updateFinished();
  }
  get finished() {
    return this._finished;
  }
  updateFinished() {
    this._finished = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  notifyFinished() {
    this.resolve();
  }
  /**
   * Allows the animation to be awaited.
   *
   * @deprecated Use `finished` instead.
   */
  then(onResolve, onReject) {
    return this.finished.then(onResolve, onReject);
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/JSAnimation.mjs
var percentToProgress = /* @__PURE__ */ __name((percent2) => percent2 / 100, "percentToProgress");
var JSAnimation = class extends WithPromise {
  static {
    __name(this, "JSAnimation");
  }
  constructor(options) {
    super();
    this.state = "idle";
    this.startTime = null;
    this.isStopped = false;
    this.currentTime = 0;
    this.holdTime = null;
    this.playbackSpeed = 1;
    this.delayState = {
      done: false,
      value: void 0
    };
    this.stop = () => {
      const { motionValue: motionValue2 } = this.options;
      if (motionValue2 && motionValue2.updatedAt !== time.now()) {
        this.tick(time.now());
      }
      this.isStopped = true;
      if (this.state === "idle")
        return;
      this.teardown();
      this.options.onStop?.();
    };
    activeAnimations.mainThread++;
    this.options = options;
    this.initAnimation();
    this.play();
    if (options.autoplay === false)
      this.pause();
  }
  initAnimation() {
    const { options } = this;
    replaceTransitionType(options);
    const { type = keyframes, repeat = 0, repeatDelay = 0, repeatType, velocity = 0 } = options;
    let { keyframes: keyframes$1 } = options;
    const generatorFactory = type || keyframes;
    if (process.env.NODE_ENV !== "production" && generatorFactory !== keyframes) {
      invariant(keyframes$1.length <= 2, `Only two keyframes currently supported with spring and inertia animations. Trying to animate ${keyframes$1}`, "spring-two-frames");
    }
    if (generatorFactory !== keyframes && typeof keyframes$1[0] !== "number") {
      this.mixKeyframes = pipe(percentToProgress, mix(keyframes$1[0], keyframes$1[1]));
      keyframes$1 = [0, 100];
    }
    const generator = generatorFactory({ ...options, keyframes: keyframes$1 });
    if (repeatType === "mirror") {
      this.mirroredGenerator = generatorFactory({
        ...options,
        keyframes: [...keyframes$1].reverse(),
        velocity: -velocity
      });
    }
    if (generator.calculatedDuration === null) {
      generator.calculatedDuration = calcGeneratorDuration(generator);
    }
    const { calculatedDuration } = generator;
    this.calculatedDuration = calculatedDuration;
    this.resolvedDuration = calculatedDuration + repeatDelay;
    this.totalDuration = this.resolvedDuration * (repeat + 1) - repeatDelay;
    this.generator = generator;
  }
  updateTime(timestamp) {
    const animationTime = Math.round(timestamp - this.startTime) * this.playbackSpeed;
    if (this.holdTime !== null) {
      this.currentTime = this.holdTime;
    } else {
      this.currentTime = animationTime;
    }
  }
  tick(timestamp, sample = false) {
    const { generator, totalDuration, mixKeyframes, mirroredGenerator, resolvedDuration, calculatedDuration } = this;
    if (this.startTime === null)
      return generator.next(0);
    const { delay = 0, keyframes: keyframes2, repeat, repeatType, repeatDelay, type, onUpdate, finalKeyframe } = this.options;
    if (this.speed > 0) {
      this.startTime = Math.min(this.startTime, timestamp);
    } else if (this.speed < 0) {
      this.startTime = Math.min(timestamp - totalDuration / this.speed, this.startTime);
    }
    if (sample) {
      this.currentTime = timestamp;
    } else {
      this.updateTime(timestamp);
    }
    const timeWithoutDelay = this.currentTime - delay * (this.playbackSpeed >= 0 ? 1 : -1);
    const isInDelayPhase = this.playbackSpeed >= 0 ? timeWithoutDelay < 0 : timeWithoutDelay > totalDuration;
    this.currentTime = Math.max(timeWithoutDelay, 0);
    if (this.state === "finished" && this.holdTime === null) {
      this.currentTime = totalDuration;
    }
    let elapsed = this.currentTime;
    let frameGenerator = generator;
    if (repeat) {
      const progress2 = Math.min(this.currentTime, totalDuration) / resolvedDuration;
      let currentIteration = Math.floor(progress2);
      let iterationProgress = progress2 % 1;
      if (!iterationProgress && progress2 >= 1) {
        iterationProgress = 1;
      }
      iterationProgress === 1 && currentIteration--;
      currentIteration = Math.min(currentIteration, repeat + 1);
      const isOddIteration = Boolean(currentIteration % 2);
      if (isOddIteration) {
        if (repeatType === "reverse") {
          iterationProgress = 1 - iterationProgress;
          if (repeatDelay) {
            iterationProgress -= repeatDelay / resolvedDuration;
          }
        } else if (repeatType === "mirror") {
          frameGenerator = mirroredGenerator;
        }
      }
      elapsed = clamp(0, 1, iterationProgress) * resolvedDuration;
    }
    let state;
    if (isInDelayPhase) {
      this.delayState.value = keyframes2[0];
      state = this.delayState;
    } else {
      state = frameGenerator.next(elapsed);
    }
    if (mixKeyframes && !isInDelayPhase) {
      state.value = mixKeyframes(state.value);
    }
    let { done } = state;
    if (!isInDelayPhase && calculatedDuration !== null) {
      done = this.playbackSpeed >= 0 ? this.currentTime >= totalDuration : this.currentTime <= 0;
    }
    const isAnimationFinished = this.holdTime === null && (this.state === "finished" || this.state === "running" && done);
    if (isAnimationFinished && type !== inertia) {
      state.value = getFinalKeyframe(keyframes2, this.options, finalKeyframe, this.speed);
    }
    if (onUpdate) {
      onUpdate(state.value);
    }
    if (isAnimationFinished) {
      this.finish();
    }
    return state;
  }
  /**
   * Allows the returned animation to be awaited or promise-chained. Currently
   * resolves when the animation finishes at all but in a future update could/should
   * reject if its cancels.
   */
  then(resolve, reject) {
    return this.finished.then(resolve, reject);
  }
  get duration() {
    return millisecondsToSeconds(this.calculatedDuration);
  }
  get iterationDuration() {
    const { delay = 0 } = this.options || {};
    return this.duration + millisecondsToSeconds(delay);
  }
  get time() {
    return millisecondsToSeconds(this.currentTime);
  }
  set time(newTime) {
    newTime = secondsToMilliseconds(newTime);
    this.currentTime = newTime;
    if (this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0) {
      this.holdTime = newTime;
    } else if (this.driver) {
      this.startTime = this.driver.now() - newTime / this.playbackSpeed;
    }
    if (this.driver) {
      this.driver.start(false);
    } else {
      this.startTime = 0;
      this.state = "paused";
      this.holdTime = newTime;
      this.tick(newTime);
    }
  }
  /**
   * Returns the generator's velocity at the current time in units/second.
   * Uses the analytical derivative when available (springs), avoiding
   * the MotionValue's frame-dependent velocity estimation.
   */
  getGeneratorVelocity() {
    const t = this.currentTime;
    if (t <= 0)
      return this.options.velocity || 0;
    if (this.generator.velocity) {
      return this.generator.velocity(t);
    }
    const current = this.generator.next(t).value;
    return getGeneratorVelocity((s) => this.generator.next(s).value, t, current);
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(newSpeed) {
    const hasChanged = this.playbackSpeed !== newSpeed;
    if (hasChanged && this.driver) {
      this.updateTime(time.now());
    }
    this.playbackSpeed = newSpeed;
    if (hasChanged && this.driver) {
      this.time = millisecondsToSeconds(this.currentTime);
    }
  }
  play() {
    if (this.isStopped)
      return;
    const { driver = frameloopDriver, startTime } = this.options;
    if (!this.driver) {
      this.driver = driver((timestamp) => this.tick(timestamp));
    }
    this.options.onPlay?.();
    const now2 = this.driver.now();
    if (this.state === "finished") {
      this.updateFinished();
      this.startTime = now2;
    } else if (this.holdTime !== null) {
      this.startTime = now2 - this.holdTime;
    } else if (!this.startTime) {
      this.startTime = startTime ?? now2;
    }
    if (this.state === "finished" && this.speed < 0) {
      this.startTime += this.calculatedDuration;
    }
    this.holdTime = null;
    this.state = "running";
    this.driver.start();
  }
  pause() {
    this.state = "paused";
    this.updateTime(time.now());
    this.holdTime = this.currentTime;
  }
  complete() {
    if (this.state !== "running") {
      this.play();
    }
    this.state = "finished";
    this.holdTime = null;
  }
  finish() {
    this.notifyFinished();
    this.teardown();
    this.state = "finished";
    this.options.onComplete?.();
  }
  cancel() {
    this.holdTime = null;
    this.startTime = 0;
    this.tick(0);
    this.teardown();
    this.options.onCancel?.();
  }
  teardown() {
    this.state = "idle";
    this.stopDriver();
    this.startTime = this.holdTime = null;
    activeAnimations.mainThread--;
  }
  stopDriver() {
    if (!this.driver)
      return;
    this.driver.stop();
    this.driver = void 0;
  }
  sample(sampleTime) {
    this.startTime = 0;
    return this.tick(sampleTime, true);
  }
  attachTimeline(timeline) {
    if (this.options.allowFlatten) {
      this.options.type = "keyframes";
      this.options.ease = "linear";
      this.initAnimation();
    }
    this.driver?.stop();
    return timeline.observe(this);
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/utils/fill-wildcards.mjs
function fillWildcards(keyframes2) {
  for (let i = 1; i < keyframes2.length; i++) {
    keyframes2[i] ?? (keyframes2[i] = keyframes2[i - 1]);
  }
}
__name(fillWildcards, "fillWildcards");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/dom/parse-transform.mjs
var radToDeg = /* @__PURE__ */ __name((rad) => rad * 180 / Math.PI, "radToDeg");
var rotate = /* @__PURE__ */ __name((v) => {
  const angle = radToDeg(Math.atan2(v[1], v[0]));
  return rebaseAngle(angle);
}, "rotate");
var matrix2dParsers = {
  x: 4,
  y: 5,
  translateX: 4,
  translateY: 5,
  scaleX: 0,
  scaleY: 3,
  scale: /* @__PURE__ */ __name((v) => (Math.abs(v[0]) + Math.abs(v[3])) / 2, "scale"),
  rotate,
  rotateZ: rotate,
  skewX: /* @__PURE__ */ __name((v) => radToDeg(Math.atan(v[1])), "skewX"),
  skewY: /* @__PURE__ */ __name((v) => radToDeg(Math.atan(v[2])), "skewY"),
  skew: /* @__PURE__ */ __name((v) => (Math.abs(v[1]) + Math.abs(v[2])) / 2, "skew")
};
var rebaseAngle = /* @__PURE__ */ __name((angle) => {
  angle = angle % 360;
  if (angle < 0)
    angle += 360;
  return angle;
}, "rebaseAngle");
var rotateZ = rotate;
var scaleX = /* @__PURE__ */ __name((v) => Math.sqrt(v[0] * v[0] + v[1] * v[1]), "scaleX");
var scaleY = /* @__PURE__ */ __name((v) => Math.sqrt(v[4] * v[4] + v[5] * v[5]), "scaleY");
var matrix3dParsers = {
  x: 12,
  y: 13,
  z: 14,
  translateX: 12,
  translateY: 13,
  translateZ: 14,
  scaleX,
  scaleY,
  scale: /* @__PURE__ */ __name((v) => (scaleX(v) + scaleY(v)) / 2, "scale"),
  rotateX: /* @__PURE__ */ __name((v) => rebaseAngle(radToDeg(Math.atan2(v[6], v[5]))), "rotateX"),
  rotateY: /* @__PURE__ */ __name((v) => rebaseAngle(radToDeg(Math.atan2(-v[2], v[0]))), "rotateY"),
  rotateZ,
  rotate: rotateZ,
  skewX: /* @__PURE__ */ __name((v) => radToDeg(Math.atan(v[4])), "skewX"),
  skewY: /* @__PURE__ */ __name((v) => radToDeg(Math.atan(v[1])), "skewY"),
  skew: /* @__PURE__ */ __name((v) => (Math.abs(v[1]) + Math.abs(v[4])) / 2, "skew")
};
function defaultTransformValue(name) {
  return name.includes("scale") ? 1 : 0;
}
__name(defaultTransformValue, "defaultTransformValue");
function parseValueFromTransform(transform, name) {
  if (!transform || transform === "none") {
    return defaultTransformValue(name);
  }
  const matrix3dMatch = transform.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
  let parsers;
  let match;
  if (matrix3dMatch) {
    parsers = matrix3dParsers;
    match = matrix3dMatch;
  } else {
    const matrix2dMatch = transform.match(/^matrix\(([-\d.e\s,]+)\)$/u);
    parsers = matrix2dParsers;
    match = matrix2dMatch;
  }
  if (!match) {
    return defaultTransformValue(name);
  }
  const valueParser = parsers[name];
  const values = match[1].split(",").map(convertTransformToNumber);
  return typeof valueParser === "function" ? valueParser(values) : values[valueParser];
}
__name(parseValueFromTransform, "parseValueFromTransform");
var readTransformValue = /* @__PURE__ */ __name((instance, name) => {
  const { transform = "none" } = getComputedStyle(instance);
  return parseValueFromTransform(transform, name);
}, "readTransformValue");
function convertTransformToNumber(value) {
  return parseFloat(value.trim());
}
__name(convertTransformToNumber, "convertTransformToNumber");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/keys-transform.mjs
var transformPropOrder = [
  "transformPerspective",
  "x",
  "y",
  "z",
  "translateX",
  "translateY",
  "translateZ",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skew",
  "skewX",
  "skewY"
];
var transformProps = /* @__PURE__ */ (() => new Set(transformPropOrder))();

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/utils/unit-conversion.mjs
var isNumOrPxType = /* @__PURE__ */ __name((v) => v === number || v === px, "isNumOrPxType");
var transformKeys = /* @__PURE__ */ new Set(["x", "y", "z"]);
var nonTranslationalTransformKeys = transformPropOrder.filter((key) => !transformKeys.has(key));
function removeNonTranslationalTransform(visualElement) {
  const removedTransforms = [];
  nonTranslationalTransformKeys.forEach((key) => {
    const value = visualElement.getValue(key);
    if (value !== void 0) {
      removedTransforms.push([key, value.get()]);
      value.set(key.startsWith("scale") ? 1 : 0);
    }
  });
  return removedTransforms;
}
__name(removeNonTranslationalTransform, "removeNonTranslationalTransform");
var positionalValues = {
  // Dimensions
  width: /* @__PURE__ */ __name(({ x }, { paddingLeft = "0", paddingRight = "0", boxSizing }) => {
    const width = x.max - x.min;
    return boxSizing === "border-box" ? width : width - parseFloat(paddingLeft) - parseFloat(paddingRight);
  }, "width"),
  height: /* @__PURE__ */ __name(({ y }, { paddingTop = "0", paddingBottom = "0", boxSizing }) => {
    const height = y.max - y.min;
    return boxSizing === "border-box" ? height : height - parseFloat(paddingTop) - parseFloat(paddingBottom);
  }, "height"),
  top: /* @__PURE__ */ __name((_bbox, { top }) => parseFloat(top), "top"),
  left: /* @__PURE__ */ __name((_bbox, { left }) => parseFloat(left), "left"),
  bottom: /* @__PURE__ */ __name(({ y }, { top }) => parseFloat(top) + (y.max - y.min), "bottom"),
  right: /* @__PURE__ */ __name(({ x }, { left }) => parseFloat(left) + (x.max - x.min), "right"),
  // Transform
  x: /* @__PURE__ */ __name((_bbox, { transform }) => parseValueFromTransform(transform, "x"), "x"),
  y: /* @__PURE__ */ __name((_bbox, { transform }) => parseValueFromTransform(transform, "y"), "y")
};
positionalValues.translateX = positionalValues.x;
positionalValues.translateY = positionalValues.y;

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/KeyframesResolver.mjs
var toResolve = /* @__PURE__ */ new Set();
var isScheduled = false;
var anyNeedsMeasurement = false;
var isForced = false;
function measureAllKeyframes() {
  if (anyNeedsMeasurement) {
    const resolversToMeasure = Array.from(toResolve).filter((resolver) => resolver.needsMeasurement);
    const elementsToMeasure = new Set(resolversToMeasure.map((resolver) => resolver.element));
    const transformsToRestore = /* @__PURE__ */ new Map();
    elementsToMeasure.forEach((element) => {
      const removedTransforms = removeNonTranslationalTransform(element);
      if (!removedTransforms.length)
        return;
      transformsToRestore.set(element, removedTransforms);
      element.render();
    });
    resolversToMeasure.forEach((resolver) => resolver.measureInitialState());
    elementsToMeasure.forEach((element) => {
      element.render();
      const restore = transformsToRestore.get(element);
      if (restore) {
        restore.forEach(([key, value]) => {
          element.getValue(key)?.set(value);
        });
      }
    });
    resolversToMeasure.forEach((resolver) => resolver.measureEndState());
    resolversToMeasure.forEach((resolver) => {
      if (resolver.suspendedScrollY !== void 0) {
        window.scrollTo(0, resolver.suspendedScrollY);
      }
    });
  }
  anyNeedsMeasurement = false;
  isScheduled = false;
  toResolve.forEach((resolver) => resolver.complete(isForced));
  toResolve.clear();
}
__name(measureAllKeyframes, "measureAllKeyframes");
function readAllKeyframes() {
  toResolve.forEach((resolver) => {
    resolver.readKeyframes();
    if (resolver.needsMeasurement) {
      anyNeedsMeasurement = true;
    }
  });
}
__name(readAllKeyframes, "readAllKeyframes");
function flushKeyframeResolvers() {
  isForced = true;
  readAllKeyframes();
  measureAllKeyframes();
  isForced = false;
}
__name(flushKeyframeResolvers, "flushKeyframeResolvers");
var KeyframeResolver = class {
  static {
    __name(this, "KeyframeResolver");
  }
  constructor(unresolvedKeyframes, onComplete, name, motionValue2, element, isAsync = false) {
    this.state = "pending";
    this.isAsync = false;
    this.needsMeasurement = false;
    this.unresolvedKeyframes = [...unresolvedKeyframes];
    this.onComplete = onComplete;
    this.name = name;
    this.motionValue = motionValue2;
    this.element = element;
    this.isAsync = isAsync;
  }
  scheduleResolve() {
    this.state = "scheduled";
    if (this.isAsync) {
      toResolve.add(this);
      if (!isScheduled) {
        isScheduled = true;
        frame.read(readAllKeyframes);
        frame.resolveKeyframes(measureAllKeyframes);
      }
    } else {
      this.readKeyframes();
      this.complete();
    }
  }
  readKeyframes() {
    const { unresolvedKeyframes, name, element, motionValue: motionValue2 } = this;
    if (unresolvedKeyframes[0] === null) {
      const currentValue = motionValue2?.get();
      const finalKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
      if (currentValue !== void 0) {
        unresolvedKeyframes[0] = currentValue;
      } else if (element && name) {
        const valueAsRead = element.readValue(name, finalKeyframe);
        if (valueAsRead !== void 0 && valueAsRead !== null) {
          unresolvedKeyframes[0] = valueAsRead;
        }
      }
      if (unresolvedKeyframes[0] === void 0) {
        unresolvedKeyframes[0] = finalKeyframe;
      }
      if (motionValue2 && currentValue === void 0) {
        motionValue2.set(unresolvedKeyframes[0]);
      }
    }
    fillWildcards(unresolvedKeyframes);
  }
  setFinalKeyframe() {
  }
  measureInitialState() {
  }
  renderEndStyles() {
  }
  measureEndState() {
  }
  complete(isForcedComplete = false) {
    this.state = "complete";
    this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, isForcedComplete);
    toResolve.delete(this);
  }
  cancel() {
    if (this.state === "scheduled") {
      toResolve.delete(this);
      this.state = "pending";
    }
  }
  resume() {
    if (this.state === "pending")
      this.scheduleResolve();
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/dom/is-css-var.mjs
var isCSSVar = /* @__PURE__ */ __name((name) => name.startsWith("--"), "isCSSVar");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/dom/style-set.mjs
function setStyle(element, name, value) {
  isCSSVar(name) ? element.style.setProperty(name, value) : element.style[name] = value;
}
__name(setStyle, "setStyle");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/supports/flags.mjs
var supportsFlags = {};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/supports/memo.mjs
function memoSupports(callback, supportsFlag) {
  const memoized = memo(callback);
  return () => supportsFlags[supportsFlag] ?? memoized();
}
__name(memoSupports, "memoSupports");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/supports/scroll-timeline.mjs
var supportsScrollTimeline = /* @__PURE__ */ memoSupports(() => window.ScrollTimeline !== void 0, "scrollTimeline");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/supports/linear-easing.mjs
var supportsLinearEasing = /* @__PURE__ */ memoSupports(() => {
  try {
    document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
  } catch (e) {
    return false;
  }
  return true;
}, "linearEasing");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/easing/cubic-bezier.mjs
var cubicBezierAsString = /* @__PURE__ */ __name(([a, b, c, d]) => `cubic-bezier(${a}, ${b}, ${c}, ${d})`, "cubicBezierAsString");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/easing/supported.mjs
var supportedWaapiEasing = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  circIn: /* @__PURE__ */ cubicBezierAsString([0, 0.65, 0.55, 1]),
  circOut: /* @__PURE__ */ cubicBezierAsString([0.55, 0, 1, 0.45]),
  backIn: /* @__PURE__ */ cubicBezierAsString([0.31, 0.01, 0.66, -0.59]),
  backOut: /* @__PURE__ */ cubicBezierAsString([0.33, 1.53, 0.69, 0.99])
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/easing/map-easing.mjs
function mapEasingToNativeEasing(easing, duration) {
  if (!easing) {
    return void 0;
  } else if (typeof easing === "function") {
    return supportsLinearEasing() ? generateLinearEasing(easing, duration) : "ease-out";
  } else if (isBezierDefinition(easing)) {
    return cubicBezierAsString(easing);
  } else if (Array.isArray(easing)) {
    return easing.map((segmentEasing) => mapEasingToNativeEasing(segmentEasing, duration) || supportedWaapiEasing.easeOut);
  } else {
    return supportedWaapiEasing[easing];
  }
}
__name(mapEasingToNativeEasing, "mapEasingToNativeEasing");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/start-waapi-animation.mjs
function startWaapiAnimation(element, valueName, keyframes2, { delay = 0, duration = 300, repeat = 0, repeatType = "loop", ease: ease2 = "easeOut", times } = {}, pseudoElement = void 0) {
  const keyframeOptions = {
    [valueName]: keyframes2
  };
  if (times)
    keyframeOptions.offset = times;
  const easing = mapEasingToNativeEasing(ease2, duration);
  if (Array.isArray(easing))
    keyframeOptions.easing = easing;
  if (statsBuffer.value) {
    activeAnimations.waapi++;
  }
  const options = {
    delay,
    duration,
    easing: !Array.isArray(easing) ? easing : "linear",
    fill: "both",
    iterations: repeat + 1,
    direction: repeatType === "reverse" ? "alternate" : "normal"
  };
  if (pseudoElement)
    options.pseudoElement = pseudoElement;
  const animation = element.animate(keyframeOptions, options);
  if (statsBuffer.value) {
    animation.finished.finally(() => {
      activeAnimations.waapi--;
    });
  }
  return animation;
}
__name(startWaapiAnimation, "startWaapiAnimation");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/generators/utils/is-generator.mjs
function isGenerator(type) {
  return typeof type === "function" && "applyToOptions" in type;
}
__name(isGenerator, "isGenerator");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/utils/apply-generator.mjs
function applyGeneratorOptions({ type, ...options }) {
  if (isGenerator(type) && supportsLinearEasing()) {
    return type.applyToOptions(options);
  } else {
    options.duration ?? (options.duration = 300);
    options.ease ?? (options.ease = "easeOut");
  }
  return options;
}
__name(applyGeneratorOptions, "applyGeneratorOptions");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/NativeAnimation.mjs
var NativeAnimation = class extends WithPromise {
  static {
    __name(this, "NativeAnimation");
  }
  constructor(options) {
    super();
    this.finishedTime = null;
    this.isStopped = false;
    this.manualStartTime = null;
    if (!options)
      return;
    const { element, name, keyframes: keyframes2, pseudoElement, allowFlatten = false, finalKeyframe, onComplete } = options;
    this.isPseudoElement = Boolean(pseudoElement);
    this.allowFlatten = allowFlatten;
    this.options = options;
    invariant(typeof options.type !== "string", `Mini animate() doesn't support "type" as a string.`, "mini-spring");
    const transition = applyGeneratorOptions(options);
    this.animation = startWaapiAnimation(element, name, keyframes2, transition, pseudoElement);
    if (transition.autoplay === false) {
      this.animation.pause();
    }
    this.animation.onfinish = () => {
      this.finishedTime = this.time;
      if (!pseudoElement) {
        const keyframe = getFinalKeyframe(keyframes2, this.options, finalKeyframe, this.speed);
        if (this.updateMotionValue) {
          this.updateMotionValue(keyframe);
        }
        setStyle(element, name, keyframe);
        this.animation.cancel();
      }
      onComplete?.();
      this.notifyFinished();
    };
  }
  play() {
    if (this.isStopped)
      return;
    this.manualStartTime = null;
    this.animation.play();
    if (this.state === "finished") {
      this.updateFinished();
    }
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.finish?.();
  }
  cancel() {
    try {
      this.animation.cancel();
    } catch (e) {
    }
  }
  stop() {
    if (this.isStopped)
      return;
    this.isStopped = true;
    const { state } = this;
    if (state === "idle" || state === "finished") {
      return;
    }
    if (this.updateMotionValue) {
      this.updateMotionValue();
    } else {
      this.commitStyles();
    }
    if (!this.isPseudoElement)
      this.cancel();
  }
  /**
   * WAAPI doesn't natively have any interruption capabilities.
   *
   * In this method, we commit styles back to the DOM before cancelling
   * the animation.
   *
   * This is designed to be overridden by NativeAnimationExtended, which
   * will create a renderless JS animation and sample it twice to calculate
   * its current value, "previous" value, and therefore allow
   * Motion to also correctly calculate velocity for any subsequent animation
   * while deferring the commit until the next animation frame.
   */
  commitStyles() {
    const element = this.options?.element;
    if (!this.isPseudoElement && element?.isConnected) {
      this.animation.commitStyles?.();
    }
  }
  get duration() {
    const duration = this.animation.effect?.getComputedTiming?.().duration || 0;
    return millisecondsToSeconds(Number(duration));
  }
  get iterationDuration() {
    const { delay = 0 } = this.options || {};
    return this.duration + millisecondsToSeconds(delay);
  }
  get time() {
    return millisecondsToSeconds(Number(this.animation.currentTime) || 0);
  }
  set time(newTime) {
    const wasFinished = this.finishedTime !== null;
    this.manualStartTime = null;
    this.finishedTime = null;
    this.animation.currentTime = secondsToMilliseconds(newTime);
    if (wasFinished) {
      this.animation.pause();
    }
  }
  /**
   * The playback speed of the animation.
   * 1 = normal speed, 2 = double speed, 0.5 = half speed.
   */
  get speed() {
    return this.animation.playbackRate;
  }
  set speed(newSpeed) {
    if (newSpeed < 0)
      this.finishedTime = null;
    this.animation.playbackRate = newSpeed;
  }
  get state() {
    return this.finishedTime !== null ? "finished" : this.animation.playState;
  }
  get startTime() {
    return this.manualStartTime ?? Number(this.animation.startTime);
  }
  set startTime(newStartTime) {
    this.manualStartTime = this.animation.startTime = newStartTime;
  }
  /**
   * Attaches a timeline to the animation, for instance the `ScrollTimeline`.
   */
  attachTimeline({ timeline, rangeStart, rangeEnd, observe }) {
    if (this.allowFlatten) {
      this.animation.effect?.updateTiming({ easing: "linear" });
    }
    this.animation.onfinish = null;
    if (timeline && supportsScrollTimeline()) {
      this.animation.timeline = timeline;
      if (rangeStart)
        this.animation.rangeStart = rangeStart;
      if (rangeEnd)
        this.animation.rangeEnd = rangeEnd;
      return noop;
    } else {
      return observe(this);
    }
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/utils/unsupported-easing.mjs
var unsupportedEasingFunctions = {
  anticipate,
  backInOut,
  circInOut
};
function isUnsupportedEase(key) {
  return key in unsupportedEasingFunctions;
}
__name(isUnsupportedEase, "isUnsupportedEase");
function replaceStringEasing(transition) {
  if (typeof transition.ease === "string" && isUnsupportedEase(transition.ease)) {
    transition.ease = unsupportedEasingFunctions[transition.ease];
  }
}
__name(replaceStringEasing, "replaceStringEasing");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/NativeAnimationExtended.mjs
var sampleDelta = 10;
var NativeAnimationExtended = class extends NativeAnimation {
  static {
    __name(this, "NativeAnimationExtended");
  }
  constructor(options) {
    replaceStringEasing(options);
    replaceTransitionType(options);
    super(options);
    if (options.startTime !== void 0 && options.autoplay !== false) {
      this.startTime = options.startTime;
    }
    this.options = options;
  }
  /**
   * WAAPI doesn't natively have any interruption capabilities.
   *
   * Rather than read committed styles back out of the DOM, we can
   * create a renderless JS animation and sample it twice to calculate
   * its current value, "previous" value, and therefore allow
   * Motion to calculate velocity for any subsequent animation.
   */
  updateMotionValue(value) {
    const { motionValue: motionValue2, onUpdate, onComplete, element, ...options } = this.options;
    if (!motionValue2)
      return;
    if (value !== void 0) {
      motionValue2.set(value);
      return;
    }
    const sampleAnimation = new JSAnimation({
      ...options,
      autoplay: false
    });
    const sampleTime = Math.max(sampleDelta, time.now() - this.startTime);
    const delta = clamp(0, sampleDelta, sampleTime - sampleDelta);
    const current = sampleAnimation.sample(sampleTime).value;
    const { name } = this.options;
    if (element && name)
      setStyle(element, name, current);
    motionValue2.setWithVelocity(sampleAnimation.sample(Math.max(0, sampleTime - delta)).value, current, delta);
    sampleAnimation.stop();
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/is-animatable.mjs
var isAnimatable = /* @__PURE__ */ __name((value, name) => {
  if (name === "zIndex")
    return false;
  if (typeof value === "number" || Array.isArray(value))
    return true;
  if (typeof value === "string" && // It's animatable if we have a string
  (complex.test(value) || value === "0") && // And it contains numbers and/or colors
  !value.startsWith("url(")) {
    return true;
  }
  return false;
}, "isAnimatable");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/can-animate.mjs
function hasKeyframesChanged(keyframes2) {
  const current = keyframes2[0];
  if (keyframes2.length === 1)
    return true;
  for (let i = 0; i < keyframes2.length; i++) {
    if (keyframes2[i] !== current)
      return true;
  }
}
__name(hasKeyframesChanged, "hasKeyframesChanged");
function canAnimate(keyframes2, name, type, velocity) {
  const originKeyframe = keyframes2[0];
  if (originKeyframe === null) {
    return false;
  }
  if (name === "display" || name === "visibility")
    return true;
  const targetKeyframe = keyframes2[keyframes2.length - 1];
  const isOriginAnimatable = isAnimatable(originKeyframe, name);
  const isTargetAnimatable = isAnimatable(targetKeyframe, name);
  warning(isOriginAnimatable === isTargetAnimatable, `You are trying to animate ${name} from "${originKeyframe}" to "${targetKeyframe}". "${isOriginAnimatable ? targetKeyframe : originKeyframe}" is not an animatable value.`, "value-not-animatable");
  if (!isOriginAnimatable || !isTargetAnimatable) {
    return false;
  }
  return hasKeyframesChanged(keyframes2) || (type === "spring" || isGenerator(type)) && velocity;
}
__name(canAnimate, "canAnimate");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/make-animation-instant.mjs
function makeAnimationInstant(options) {
  options.duration = 0;
  options.type = "keyframes";
}
__name(makeAnimationInstant, "makeAnimationInstant");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/utils/accelerated-values.mjs
var acceleratedValues = /* @__PURE__ */ new Set([
  "opacity",
  "clipPath",
  "filter",
  "transform"
  // TODO: Can be accelerated but currently disabled until https://issues.chromium.org/issues/41491098 is resolved
  // or until we implement support for linear() easing.
  // "background-color"
]);

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/utils/is-browser-color.mjs
var browserColorFunctions = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
function hasBrowserOnlyColors(keyframes2) {
  for (let i = 0; i < keyframes2.length; i++) {
    if (typeof keyframes2[i] === "string" && browserColorFunctions.test(keyframes2[i])) {
      return true;
    }
  }
  return false;
}
__name(hasBrowserOnlyColors, "hasBrowserOnlyColors");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/waapi/supports/waapi.mjs
var colorProperties = /* @__PURE__ */ new Set([
  "color",
  "backgroundColor",
  "outlineColor",
  "fill",
  "stroke",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor"
]);
var supportsWaapi = /* @__PURE__ */ memo(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
function supportsBrowserAnimation(options) {
  const { motionValue: motionValue2, name, repeatDelay, repeatType, damping, type, keyframes: keyframes2 } = options;
  const subject = motionValue2?.owner?.current;
  if (!(subject instanceof HTMLElement)) {
    return false;
  }
  const { onUpdate, transformTemplate } = motionValue2.owner.getProps();
  return supportsWaapi() && name && /**
   * Force WAAPI for color properties with browser-only color formats
   * (oklch, oklab, lab, lch, etc.) that the JS animation path can't parse.
   */
  (acceleratedValues.has(name) || colorProperties.has(name) && hasBrowserOnlyColors(keyframes2)) && (name !== "transform" || !transformTemplate) && /**
   * If we're outputting values to onUpdate then we can't use WAAPI as there's
   * no way to read the value from WAAPI every frame.
   */
  !onUpdate && !repeatDelay && repeatType !== "mirror" && damping !== 0 && type !== "inertia";
}
__name(supportsBrowserAnimation, "supportsBrowserAnimation");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/AsyncMotionValueAnimation.mjs
var MAX_RESOLVE_DELAY = 40;
var AsyncMotionValueAnimation = class extends WithPromise {
  static {
    __name(this, "AsyncMotionValueAnimation");
  }
  constructor({ autoplay = true, delay = 0, type = "keyframes", repeat = 0, repeatDelay = 0, repeatType = "loop", keyframes: keyframes2, name, motionValue: motionValue2, element, ...options }) {
    super();
    this.stop = () => {
      if (this._animation) {
        this._animation.stop();
        this.stopTimeline?.();
      }
      this.keyframeResolver?.cancel();
    };
    this.createdAt = time.now();
    const optionsWithDefaults = {
      autoplay,
      delay,
      type,
      repeat,
      repeatDelay,
      repeatType,
      name,
      motionValue: motionValue2,
      element,
      ...options
    };
    const KeyframeResolver$1 = element?.KeyframeResolver || KeyframeResolver;
    this.keyframeResolver = new KeyframeResolver$1(keyframes2, (resolvedKeyframes, finalKeyframe, forced) => this.onKeyframesResolved(resolvedKeyframes, finalKeyframe, optionsWithDefaults, !forced), name, motionValue2, element);
    this.keyframeResolver?.scheduleResolve();
  }
  onKeyframesResolved(keyframes2, finalKeyframe, options, sync) {
    this.keyframeResolver = void 0;
    const { name, type, velocity, delay, isHandoff, onUpdate } = options;
    this.resolvedAt = time.now();
    let canAnimateValue = true;
    if (!canAnimate(keyframes2, name, type, velocity)) {
      canAnimateValue = false;
      if (MotionGlobalConfig.instantAnimations || !delay) {
        onUpdate?.(getFinalKeyframe(keyframes2, options, finalKeyframe));
      }
      keyframes2[0] = keyframes2[keyframes2.length - 1];
      makeAnimationInstant(options);
      options.repeat = 0;
    }
    const startTime = sync ? !this.resolvedAt ? this.createdAt : this.resolvedAt - this.createdAt > MAX_RESOLVE_DELAY ? this.resolvedAt : this.createdAt : void 0;
    const resolvedOptions = {
      startTime,
      finalKeyframe,
      ...options,
      keyframes: keyframes2
    };
    const useWaapi = canAnimateValue && !isHandoff && supportsBrowserAnimation(resolvedOptions);
    const element = resolvedOptions.motionValue?.owner?.current;
    let animation;
    if (useWaapi) {
      try {
        animation = new NativeAnimationExtended({
          ...resolvedOptions,
          element
        });
      } catch {
        animation = new JSAnimation(resolvedOptions);
      }
    } else {
      animation = new JSAnimation(resolvedOptions);
    }
    animation.finished.then(() => {
      this.notifyFinished();
    }).catch(noop);
    if (this.pendingTimeline) {
      this.stopTimeline = animation.attachTimeline(this.pendingTimeline);
      this.pendingTimeline = void 0;
    }
    this._animation = animation;
  }
  get finished() {
    if (!this._animation) {
      return this._finished;
    } else {
      return this.animation.finished;
    }
  }
  then(onResolve, _onReject) {
    return this.finished.finally(onResolve).then(() => {
    });
  }
  get animation() {
    if (!this._animation) {
      this.keyframeResolver?.resume();
      flushKeyframeResolvers();
    }
    return this._animation;
  }
  get duration() {
    return this.animation.duration;
  }
  get iterationDuration() {
    return this.animation.iterationDuration;
  }
  get time() {
    return this.animation.time;
  }
  set time(newTime) {
    this.animation.time = newTime;
  }
  get speed() {
    return this.animation.speed;
  }
  get state() {
    return this.animation.state;
  }
  set speed(newSpeed) {
    this.animation.speed = newSpeed;
  }
  get startTime() {
    return this.animation.startTime;
  }
  attachTimeline(timeline) {
    if (this._animation) {
      this.stopTimeline = this.animation.attachTimeline(timeline);
    } else {
      this.pendingTimeline = timeline;
    }
    return () => this.stop();
  }
  play() {
    this.animation.play();
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.complete();
  }
  cancel() {
    if (this._animation) {
      this.animation.cancel();
    }
    this.keyframeResolver?.cancel();
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/GroupAnimation.mjs
var GroupAnimation = class {
  static {
    __name(this, "GroupAnimation");
  }
  constructor(animations2) {
    this.stop = () => this.runAll("stop");
    this.animations = animations2.filter(Boolean);
  }
  get finished() {
    return Promise.all(this.animations.map((animation) => animation.finished));
  }
  /**
   * TODO: Filter out cancelled or stopped animations before returning
   */
  getAll(propName) {
    return this.animations[0][propName];
  }
  setAll(propName, newValue) {
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i][propName] = newValue;
    }
  }
  attachTimeline(timeline) {
    const subscriptions = this.animations.map((animation) => animation.attachTimeline(timeline));
    return () => {
      subscriptions.forEach((cancel, i) => {
        cancel && cancel();
        this.animations[i].stop();
      });
    };
  }
  get time() {
    return this.getAll("time");
  }
  set time(time2) {
    this.setAll("time", time2);
  }
  get speed() {
    return this.getAll("speed");
  }
  set speed(speed) {
    this.setAll("speed", speed);
  }
  get state() {
    return this.getAll("state");
  }
  get startTime() {
    return this.getAll("startTime");
  }
  get duration() {
    return getMax(this.animations, "duration");
  }
  get iterationDuration() {
    return getMax(this.animations, "iterationDuration");
  }
  runAll(methodName) {
    this.animations.forEach((controls) => controls[methodName]());
  }
  play() {
    this.runAll("play");
  }
  pause() {
    this.runAll("pause");
  }
  cancel() {
    this.runAll("cancel");
  }
  complete() {
    this.runAll("complete");
  }
};
function getMax(animations2, propName) {
  let max = 0;
  for (let i = 0; i < animations2.length; i++) {
    const value = animations2[i][propName];
    if (value !== null && value > max) {
      max = value;
    }
  }
  return max;
}
__name(getMax, "getMax");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/GroupAnimationWithThen.mjs
var GroupAnimationWithThen = class extends GroupAnimation {
  static {
    __name(this, "GroupAnimationWithThen");
  }
  then(onResolve, _onReject) {
    return this.finished.finally(onResolve).then(() => {
    });
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/css-variables-conversion.mjs
var splitCSSVariableRegex = (
  // eslint-disable-next-line redos-detector/no-unsafe-regex -- false positive, as it can match a lot of words
  /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u
);
function parseCSSVariable(current) {
  const match = splitCSSVariableRegex.exec(current);
  if (!match)
    return [,];
  const [, token1, token2, fallback] = match;
  return [`--${token1 ?? token2}`, fallback];
}
__name(parseCSSVariable, "parseCSSVariable");
var maxDepth = 4;
function getVariableValue2(current, element, depth = 1) {
  invariant(depth <= maxDepth, `Max CSS variable fallback depth detected in property "${current}". This may indicate a circular fallback dependency.`, "max-css-var-depth");
  const [token, fallback] = parseCSSVariable(current);
  if (!token)
    return;
  const resolved = window.getComputedStyle(element).getPropertyValue(token);
  if (resolved) {
    const trimmed = resolved.trim();
    return isNumericalString(trimmed) ? parseFloat(trimmed) : trimmed;
  }
  return isCSSVariableToken(fallback) ? getVariableValue2(fallback, element, depth + 1) : fallback;
}
__name(getVariableValue2, "getVariableValue");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/default-transitions.mjs
var underDampedSpring = {
  type: "spring",
  stiffness: 500,
  damping: 25,
  restSpeed: 10
};
var criticallyDampedSpring = /* @__PURE__ */ __name((target) => ({
  type: "spring",
  stiffness: 550,
  damping: target === 0 ? 2 * Math.sqrt(550) : 30,
  restSpeed: 10
}), "criticallyDampedSpring");
var keyframesTransition = {
  type: "keyframes",
  duration: 0.8
};
var ease = {
  type: "keyframes",
  ease: [0.25, 0.1, 0.35, 1],
  duration: 0.3
};
var getDefaultTransition = /* @__PURE__ */ __name((valueKey, { keyframes: keyframes2 }) => {
  if (keyframes2.length > 2) {
    return keyframesTransition;
  } else if (transformProps.has(valueKey)) {
    return valueKey.startsWith("scale") ? criticallyDampedSpring(keyframes2[1]) : underDampedSpring;
  }
  return ease;
}, "getDefaultTransition");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/resolve-transition.mjs
function resolveTransition(transition, parentTransition) {
  if (transition?.inherit && parentTransition) {
    const { inherit: _, ...rest } = transition;
    return { ...parentTransition, ...rest };
  }
  return transition;
}
__name(resolveTransition, "resolveTransition");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/get-value-transition.mjs
function getValueTransition(transition, key) {
  const valueTransition = transition?.[key] ?? transition?.["default"] ?? transition;
  if (valueTransition !== transition) {
    return resolveTransition(valueTransition, transition);
  }
  return valueTransition;
}
__name(getValueTransition, "getValueTransition");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/utils/is-transition-defined.mjs
var orchestrationKeys = /* @__PURE__ */ new Set([
  "when",
  "delay",
  "delayChildren",
  "staggerChildren",
  "staggerDirection",
  "repeat",
  "repeatType",
  "repeatDelay",
  "from",
  "elapsed"
]);
function isTransitionDefined(transition) {
  for (const key in transition) {
    if (!orchestrationKeys.has(key))
      return true;
  }
  return false;
}
__name(isTransitionDefined, "isTransitionDefined");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/interfaces/motion-value.mjs
var animateMotionValue = /* @__PURE__ */ __name((name, value, target, transition = {}, element, isHandoff) => (onComplete) => {
  const valueTransition = getValueTransition(transition, name) || {};
  const delay = valueTransition.delay || transition.delay || 0;
  let { elapsed = 0 } = transition;
  elapsed = elapsed - secondsToMilliseconds(delay);
  const options = {
    keyframes: Array.isArray(target) ? target : [null, target],
    ease: "easeOut",
    velocity: value.getVelocity(),
    ...valueTransition,
    delay: -elapsed,
    onUpdate: /* @__PURE__ */ __name((v) => {
      value.set(v);
      valueTransition.onUpdate && valueTransition.onUpdate(v);
    }, "onUpdate"),
    onComplete: /* @__PURE__ */ __name(() => {
      onComplete();
      valueTransition.onComplete && valueTransition.onComplete();
    }, "onComplete"),
    name,
    motionValue: value,
    element: isHandoff ? void 0 : element
  };
  if (!isTransitionDefined(valueTransition)) {
    Object.assign(options, getDefaultTransition(name, options));
  }
  options.duration && (options.duration = secondsToMilliseconds(options.duration));
  options.repeatDelay && (options.repeatDelay = secondsToMilliseconds(options.repeatDelay));
  if (options.from !== void 0) {
    options.keyframes[0] = options.from;
  }
  let shouldSkip = false;
  if (options.type === false || options.duration === 0 && !options.repeatDelay) {
    makeAnimationInstant(options);
    if (options.delay === 0) {
      shouldSkip = true;
    }
  }
  if (MotionGlobalConfig.instantAnimations || MotionGlobalConfig.skipAnimations || element?.shouldSkipAnimations) {
    shouldSkip = true;
    makeAnimationInstant(options);
    options.delay = 0;
  }
  options.allowFlatten = !valueTransition.type && !valueTransition.ease;
  if (shouldSkip && !isHandoff && value.get() !== void 0) {
    const finalKeyframe = getFinalKeyframe(options.keyframes, valueTransition);
    if (finalKeyframe !== void 0) {
      frame.update(() => {
        options.onUpdate(finalKeyframe);
        options.onComplete();
      });
      return;
    }
  }
  return valueTransition.isSync ? new JSAnimation(options) : new AsyncMotionValueAnimation(options);
}, "animateMotionValue");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/resolve-variants.mjs
function getValueState(visualElement) {
  const state = [{}, {}];
  visualElement?.values.forEach((value, key) => {
    state[0][key] = value.get();
    state[1][key] = value.getVelocity();
  });
  return state;
}
__name(getValueState, "getValueState");
function resolveVariantFromProps(props, definition, custom, visualElement) {
  if (typeof definition === "function") {
    const [current, velocity] = getValueState(visualElement);
    definition = definition(custom !== void 0 ? custom : props.custom, current, velocity);
  }
  if (typeof definition === "string") {
    definition = props.variants && props.variants[definition];
  }
  if (typeof definition === "function") {
    const [current, velocity] = getValueState(visualElement);
    definition = definition(custom !== void 0 ? custom : props.custom, current, velocity);
  }
  return definition;
}
__name(resolveVariantFromProps, "resolveVariantFromProps");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/resolve-dynamic-variants.mjs
function resolveVariant(visualElement, definition, custom) {
  const props = visualElement.getProps();
  return resolveVariantFromProps(props, definition, custom !== void 0 ? custom : props.custom, visualElement);
}
__name(resolveVariant, "resolveVariant");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/keys-position.mjs
var positionalKeys = /* @__PURE__ */ new Set([
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  ...transformPropOrder
]);

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/index.mjs
var MAX_VELOCITY_DELTA = 30;
var isFloat = /* @__PURE__ */ __name((value) => {
  return !isNaN(parseFloat(value));
}, "isFloat");
var collectMotionValues = {
  current: void 0
};
var MotionValue = class {
  static {
    __name(this, "MotionValue");
  }
  /**
   * @param init - The initiating value
   * @param config - Optional configuration options
   *
   * -  `transformer`: A function to transform incoming values with.
   */
  constructor(init, options = {}) {
    this.canTrackVelocity = null;
    this.events = {};
    this.updateAndNotify = (v) => {
      const currentTime = time.now();
      if (this.updatedAt !== currentTime) {
        this.setPrevFrameValue();
      }
      this.prev = this.current;
      this.setCurrent(v);
      if (this.current !== this.prev) {
        this.events.change?.notify(this.current);
        if (this.dependents) {
          for (const dependent of this.dependents) {
            dependent.dirty();
          }
        }
      }
    };
    this.hasAnimated = false;
    this.setCurrent(init);
    this.owner = options.owner;
  }
  setCurrent(current) {
    this.current = current;
    this.updatedAt = time.now();
    if (this.canTrackVelocity === null && current !== void 0) {
      this.canTrackVelocity = isFloat(this.current);
    }
  }
  setPrevFrameValue(prevFrameValue = this.current) {
    this.prevFrameValue = prevFrameValue;
    this.prevUpdatedAt = this.updatedAt;
  }
  /**
   * Adds a function that will be notified when the `MotionValue` is updated.
   *
   * It returns a function that, when called, will cancel the subscription.
   *
   * When calling `onChange` inside a React component, it should be wrapped with the
   * `useEffect` hook. As it returns an unsubscribe function, this should be returned
   * from the `useEffect` function to ensure you don't add duplicate subscribers..
   *
   * ```jsx
   * export const MyComponent = () => {
   *   const x = useMotionValue(0)
   *   const y = useMotionValue(0)
   *   const opacity = useMotionValue(1)
   *
   *   useEffect(() => {
   *     function updateOpacity() {
   *       const maxXY = Math.max(x.get(), y.get())
   *       const newOpacity = transform(maxXY, [0, 100], [1, 0])
   *       opacity.set(newOpacity)
   *     }
   *
   *     const unsubscribeX = x.on("change", updateOpacity)
   *     const unsubscribeY = y.on("change", updateOpacity)
   *
   *     return () => {
   *       unsubscribeX()
   *       unsubscribeY()
   *     }
   *   }, [])
   *
   *   return <motion.div style={{ x }} />
   * }
   * ```
   *
   * @param subscriber - A function that receives the latest value.
   * @returns A function that, when called, will cancel this subscription.
   *
   * @deprecated
   */
  onChange(subscription) {
    if (process.env.NODE_ENV !== "production") {
      warnOnce(false, `value.onChange(callback) is deprecated. Switch to value.on("change", callback).`);
    }
    return this.on("change", subscription);
  }
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = new SubscriptionManager();
    }
    const unsubscribe = this.events[eventName].add(callback);
    if (eventName === "change") {
      return () => {
        unsubscribe();
        frame.read(() => {
          if (!this.events.change.getSize()) {
            this.stop();
          }
        });
      };
    }
    return unsubscribe;
  }
  clearListeners() {
    for (const eventManagers in this.events) {
      this.events[eventManagers].clear();
    }
  }
  /**
   * Attaches a passive effect to the `MotionValue`.
   */
  attach(passiveEffect, stopPassiveEffect) {
    this.passiveEffect = passiveEffect;
    this.stopPassiveEffect = stopPassiveEffect;
  }
  /**
   * Sets the state of the `MotionValue`.
   *
   * @remarks
   *
   * ```jsx
   * const x = useMotionValue(0)
   * x.set(10)
   * ```
   *
   * @param latest - Latest value to set.
   * @param render - Whether to notify render subscribers. Defaults to `true`
   *
   * @public
   */
  set(v) {
    if (!this.passiveEffect) {
      this.updateAndNotify(v);
    } else {
      this.passiveEffect(v, this.updateAndNotify);
    }
  }
  setWithVelocity(prev, current, delta) {
    this.set(current);
    this.prev = void 0;
    this.prevFrameValue = prev;
    this.prevUpdatedAt = this.updatedAt - delta;
  }
  /**
   * Set the state of the `MotionValue`, stopping any active animations,
   * effects, and resets velocity to `0`.
   */
  jump(v, endAnimation = true) {
    this.updateAndNotify(v);
    this.prev = v;
    this.prevUpdatedAt = this.prevFrameValue = void 0;
    endAnimation && this.stop();
    if (this.stopPassiveEffect)
      this.stopPassiveEffect();
  }
  dirty() {
    this.events.change?.notify(this.current);
  }
  addDependent(dependent) {
    if (!this.dependents) {
      this.dependents = /* @__PURE__ */ new Set();
    }
    this.dependents.add(dependent);
  }
  removeDependent(dependent) {
    if (this.dependents) {
      this.dependents.delete(dependent);
    }
  }
  /**
   * Returns the latest state of `MotionValue`
   *
   * @returns - The latest state of `MotionValue`
   *
   * @public
   */
  get() {
    if (collectMotionValues.current) {
      collectMotionValues.current.push(this);
    }
    return this.current;
  }
  /**
   * @public
   */
  getPrevious() {
    return this.prev;
  }
  /**
   * Returns the latest velocity of `MotionValue`
   *
   * @returns - The latest velocity of `MotionValue`. Returns `0` if the state is non-numerical.
   *
   * @public
   */
  getVelocity() {
    const currentTime = time.now();
    if (!this.canTrackVelocity || this.prevFrameValue === void 0 || currentTime - this.updatedAt > MAX_VELOCITY_DELTA) {
      return 0;
    }
    const delta = Math.min(this.updatedAt - this.prevUpdatedAt, MAX_VELOCITY_DELTA);
    return velocityPerSecond(parseFloat(this.current) - parseFloat(this.prevFrameValue), delta);
  }
  /**
   * Registers a new animation to control this `MotionValue`. Only one
   * animation can drive a `MotionValue` at one time.
   *
   * ```jsx
   * value.start()
   * ```
   *
   * @param animation - A function that starts the provided animation
   */
  start(startAnimation) {
    this.stop();
    return new Promise((resolve) => {
      this.hasAnimated = true;
      this.animation = startAnimation(resolve);
      if (this.events.animationStart) {
        this.events.animationStart.notify();
      }
    }).then(() => {
      if (this.events.animationComplete) {
        this.events.animationComplete.notify();
      }
      this.clearAnimation();
    });
  }
  /**
   * Stop the currently active animation.
   *
   * @public
   */
  stop() {
    if (this.animation) {
      this.animation.stop();
      if (this.events.animationCancel) {
        this.events.animationCancel.notify();
      }
    }
    this.clearAnimation();
  }
  /**
   * Returns `true` if this value is currently animating.
   *
   * @public
   */
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    delete this.animation;
  }
  /**
   * Destroy and clean up subscribers to this `MotionValue`.
   *
   * The `MotionValue` hooks like `useMotionValue` and `useTransform` automatically
   * handle the lifecycle of the returned `MotionValue`, so this method is only necessary if you've manually
   * created a `MotionValue` via the `motionValue` function.
   *
   * @public
   */
  destroy() {
    this.dependents?.clear();
    this.events.destroy?.notify();
    this.clearListeners();
    this.stop();
    if (this.stopPassiveEffect) {
      this.stopPassiveEffect();
    }
  }
};
function motionValue(init, options) {
  return new MotionValue(init, options);
}
__name(motionValue, "motionValue");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/is-keyframes-target.mjs
var isKeyframesTarget = /* @__PURE__ */ __name((v) => {
  return Array.isArray(v);
}, "isKeyframesTarget");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/setters.mjs
function setMotionValue(visualElement, key, value) {
  if (visualElement.hasValue(key)) {
    visualElement.getValue(key).set(value);
  } else {
    visualElement.addValue(key, motionValue(value));
  }
}
__name(setMotionValue, "setMotionValue");
function resolveFinalValueInKeyframes(v) {
  return isKeyframesTarget(v) ? v[v.length - 1] || 0 : v;
}
__name(resolveFinalValueInKeyframes, "resolveFinalValueInKeyframes");
function setTarget(visualElement, definition) {
  const resolved = resolveVariant(visualElement, definition);
  let { transitionEnd = {}, transition = {}, ...target } = resolved || {};
  target = { ...target, ...transitionEnd };
  for (const key in target) {
    const value = resolveFinalValueInKeyframes(target[key]);
    setMotionValue(visualElement, key, value);
  }
}
__name(setTarget, "setTarget");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/utils/is-motion-value.mjs
var isMotionValue = /* @__PURE__ */ __name((value) => Boolean(value && value.getVelocity), "isMotionValue");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/will-change/is.mjs
function isWillChangeMotionValue(value) {
  return Boolean(isMotionValue(value) && value.add);
}
__name(isWillChangeMotionValue, "isWillChangeMotionValue");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/will-change/add-will-change.mjs
function addValueToWillChange(visualElement, key) {
  const willChange = visualElement.getValue("willChange");
  if (isWillChangeMotionValue(willChange)) {
    return willChange.add(key);
  } else if (!willChange && MotionGlobalConfig.WillChange) {
    const newWillChange = new MotionGlobalConfig.WillChange("auto");
    visualElement.addValue("willChange", newWillChange);
    newWillChange.add(key);
  }
}
__name(addValueToWillChange, "addValueToWillChange");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/dom/utils/camel-to-dash.mjs
function camelToDash(str) {
  return str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}
__name(camelToDash, "camelToDash");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/optimized-appear/data-id.mjs
var optimizedAppearDataId = "framerAppearId";
var optimizedAppearDataAttribute = "data-" + camelToDash(optimizedAppearDataId);

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/optimized-appear/get-appear-id.mjs
function getOptimisedAppearId(visualElement) {
  return visualElement.props[optimizedAppearDataAttribute];
}
__name(getOptimisedAppearId, "getOptimisedAppearId");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/interfaces/visual-element-target.mjs
function shouldBlockAnimation({ protectedKeys, needsAnimating }, key) {
  const shouldBlock = protectedKeys.hasOwnProperty(key) && needsAnimating[key] !== true;
  needsAnimating[key] = false;
  return shouldBlock;
}
__name(shouldBlockAnimation, "shouldBlockAnimation");
function animateTarget(visualElement, targetAndTransition, { delay = 0, transitionOverride, type } = {}) {
  let { transition, transitionEnd, ...target } = targetAndTransition;
  const defaultTransition = visualElement.getDefaultTransition();
  transition = transition ? resolveTransition(transition, defaultTransition) : defaultTransition;
  const reduceMotion = transition?.reduceMotion;
  if (transitionOverride)
    transition = transitionOverride;
  const animations2 = [];
  const animationTypeState = type && visualElement.animationState && visualElement.animationState.getState()[type];
  for (const key in target) {
    const value = visualElement.getValue(key, visualElement.latestValues[key] ?? null);
    const valueTarget = target[key];
    if (valueTarget === void 0 || animationTypeState && shouldBlockAnimation(animationTypeState, key)) {
      continue;
    }
    const valueTransition = {
      delay,
      ...getValueTransition(transition || {}, key)
    };
    const currentValue = value.get();
    if (currentValue !== void 0 && !value.isAnimating() && !Array.isArray(valueTarget) && valueTarget === currentValue && !valueTransition.velocity) {
      frame.update(() => value.set(valueTarget));
      continue;
    }
    let isHandoff = false;
    if (window.MotionHandoffAnimation) {
      const appearId = getOptimisedAppearId(visualElement);
      if (appearId) {
        const startTime = window.MotionHandoffAnimation(appearId, key, frame);
        if (startTime !== null) {
          valueTransition.startTime = startTime;
          isHandoff = true;
        }
      }
    }
    addValueToWillChange(visualElement, key);
    const shouldReduceMotion = reduceMotion ?? visualElement.shouldReduceMotion;
    value.start(animateMotionValue(key, value, valueTarget, shouldReduceMotion && positionalKeys.has(key) ? { type: false } : valueTransition, visualElement, isHandoff));
    const animation = value.animation;
    if (animation) {
      animations2.push(animation);
    }
  }
  if (transitionEnd) {
    const applyTransitionEnd = /* @__PURE__ */ __name(() => frame.update(() => {
      transitionEnd && setTarget(visualElement, transitionEnd);
    }), "applyTransitionEnd");
    if (animations2.length) {
      Promise.all(animations2).then(applyTransitionEnd);
    } else {
      applyTransitionEnd();
    }
  }
  return animations2;
}
__name(animateTarget, "animateTarget");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/auto.mjs
var auto = {
  test: /* @__PURE__ */ __name((v) => v === "auto", "test"),
  parse: /* @__PURE__ */ __name((v) => v, "parse")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/test.mjs
var testValueType = /* @__PURE__ */ __name((v) => (type) => type.test(v), "testValueType");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/dimensions.mjs
var dimensionValueTypes = [number, px, percent, degrees, vw, vh, auto];
var findDimensionValueType = /* @__PURE__ */ __name((v) => dimensionValueTypes.find(testValueType(v)), "findDimensionValueType");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/utils/is-none.mjs
function isNone(value) {
  if (typeof value === "number") {
    return value === 0;
  } else if (value !== null) {
    return value === "none" || value === "0" || isZeroValueString(value);
  } else {
    return true;
  }
}
__name(isNone, "isNone");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/complex/filter.mjs
var maxDefaults = /* @__PURE__ */ new Set(["brightness", "contrast", "saturate", "opacity"]);
function applyDefaultFilter(v) {
  const [name, value] = v.slice(0, -1).split("(");
  if (name === "drop-shadow")
    return v;
  const [number2] = value.match(floatRegex) || [];
  if (!number2)
    return v;
  const unit = value.replace(number2, "");
  let defaultValue = maxDefaults.has(name) ? 1 : 0;
  if (number2 !== value)
    defaultValue *= 100;
  return name + "(" + defaultValue + unit + ")";
}
__name(applyDefaultFilter, "applyDefaultFilter");
var functionRegex = /\b([a-z-]*)\(.*?\)/gu;
var filter = {
  ...complex,
  getAnimatableNone: /* @__PURE__ */ __name((v) => {
    const functions = v.match(functionRegex);
    return functions ? functions.map(applyDefaultFilter).join(" ") : v;
  }, "getAnimatableNone")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/complex/mask.mjs
var mask = {
  ...complex,
  getAnimatableNone: /* @__PURE__ */ __name((v) => {
    const parsed = complex.parse(v);
    const transformer = complex.createTransformer(v);
    return transformer(parsed.map((v2) => typeof v2 === "number" ? 0 : typeof v2 === "object" ? { ...v2, alpha: 1 } : v2));
  }, "getAnimatableNone")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/int.mjs
var int = {
  ...number,
  transform: Math.round
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/maps/transform.mjs
var transformValueTypes = {
  rotate: degrees,
  rotateX: degrees,
  rotateY: degrees,
  rotateZ: degrees,
  scale,
  scaleX: scale,
  scaleY: scale,
  scaleZ: scale,
  skew: degrees,
  skewX: degrees,
  skewY: degrees,
  distance: px,
  translateX: px,
  translateY: px,
  translateZ: px,
  x: px,
  y: px,
  z: px,
  perspective: px,
  transformPerspective: px,
  opacity: alpha,
  originX: progressPercentage,
  originY: progressPercentage,
  originZ: px
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/maps/number.mjs
var numberValueTypes = {
  // Border props
  borderWidth: px,
  borderTopWidth: px,
  borderRightWidth: px,
  borderBottomWidth: px,
  borderLeftWidth: px,
  borderRadius: px,
  borderTopLeftRadius: px,
  borderTopRightRadius: px,
  borderBottomRightRadius: px,
  borderBottomLeftRadius: px,
  // Positioning props
  width: px,
  maxWidth: px,
  height: px,
  maxHeight: px,
  top: px,
  right: px,
  bottom: px,
  left: px,
  inset: px,
  insetBlock: px,
  insetBlockStart: px,
  insetBlockEnd: px,
  insetInline: px,
  insetInlineStart: px,
  insetInlineEnd: px,
  // Spacing props
  padding: px,
  paddingTop: px,
  paddingRight: px,
  paddingBottom: px,
  paddingLeft: px,
  paddingBlock: px,
  paddingBlockStart: px,
  paddingBlockEnd: px,
  paddingInline: px,
  paddingInlineStart: px,
  paddingInlineEnd: px,
  margin: px,
  marginTop: px,
  marginRight: px,
  marginBottom: px,
  marginLeft: px,
  marginBlock: px,
  marginBlockStart: px,
  marginBlockEnd: px,
  marginInline: px,
  marginInlineStart: px,
  marginInlineEnd: px,
  // Typography
  fontSize: px,
  // Misc
  backgroundPositionX: px,
  backgroundPositionY: px,
  ...transformValueTypes,
  zIndex: int,
  // SVG
  fillOpacity: alpha,
  strokeOpacity: alpha,
  numOctaves: int
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/maps/defaults.mjs
var defaultValueTypes = {
  ...numberValueTypes,
  // Color props
  color,
  backgroundColor: color,
  outlineColor: color,
  fill: color,
  stroke: color,
  // Border props
  borderColor: color,
  borderTopColor: color,
  borderRightColor: color,
  borderBottomColor: color,
  borderLeftColor: color,
  filter,
  WebkitFilter: filter,
  mask,
  WebkitMask: mask
};
var getDefaultValueType = /* @__PURE__ */ __name((key) => defaultValueTypes[key], "getDefaultValueType");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/utils/animatable-none.mjs
var customTypes = /* @__PURE__ */ new Set([filter, mask]);
function getAnimatableNone2(key, value) {
  let defaultValueType = getDefaultValueType(key);
  if (!customTypes.has(defaultValueType))
    defaultValueType = complex;
  return defaultValueType.getAnimatableNone ? defaultValueType.getAnimatableNone(value) : void 0;
}
__name(getAnimatableNone2, "getAnimatableNone");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/utils/make-none-animatable.mjs
var invalidTemplates = /* @__PURE__ */ new Set(["auto", "none", "0"]);
function makeNoneKeyframesAnimatable(unresolvedKeyframes, noneKeyframeIndexes, name) {
  let i = 0;
  let animatableTemplate = void 0;
  while (i < unresolvedKeyframes.length && !animatableTemplate) {
    const keyframe = unresolvedKeyframes[i];
    if (typeof keyframe === "string" && !invalidTemplates.has(keyframe) && analyseComplexValue(keyframe).values.length) {
      animatableTemplate = unresolvedKeyframes[i];
    }
    i++;
  }
  if (animatableTemplate && name) {
    for (const noneIndex of noneKeyframeIndexes) {
      unresolvedKeyframes[noneIndex] = getAnimatableNone2(name, animatableTemplate);
    }
  }
}
__name(makeNoneKeyframesAnimatable, "makeNoneKeyframesAnimatable");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/keyframes/DOMKeyframesResolver.mjs
var DOMKeyframesResolver = class extends KeyframeResolver {
  static {
    __name(this, "DOMKeyframesResolver");
  }
  constructor(unresolvedKeyframes, onComplete, name, motionValue2, element) {
    super(unresolvedKeyframes, onComplete, name, motionValue2, element, true);
  }
  readKeyframes() {
    const { unresolvedKeyframes, element, name } = this;
    if (!element || !element.current)
      return;
    super.readKeyframes();
    for (let i = 0; i < unresolvedKeyframes.length; i++) {
      let keyframe = unresolvedKeyframes[i];
      if (typeof keyframe === "string") {
        keyframe = keyframe.trim();
        if (isCSSVariableToken(keyframe)) {
          const resolved = getVariableValue2(keyframe, element.current);
          if (resolved !== void 0) {
            unresolvedKeyframes[i] = resolved;
          }
          if (i === unresolvedKeyframes.length - 1) {
            this.finalKeyframe = keyframe;
          }
        }
      }
    }
    this.resolveNoneKeyframes();
    if (!positionalKeys.has(name) || unresolvedKeyframes.length !== 2) {
      return;
    }
    const [origin, target] = unresolvedKeyframes;
    const originType = findDimensionValueType(origin);
    const targetType = findDimensionValueType(target);
    const originHasVar = containsCSSVariable(origin);
    const targetHasVar = containsCSSVariable(target);
    if (originHasVar !== targetHasVar && positionalValues[name]) {
      this.needsMeasurement = true;
      return;
    }
    if (originType === targetType)
      return;
    if (isNumOrPxType(originType) && isNumOrPxType(targetType)) {
      for (let i = 0; i < unresolvedKeyframes.length; i++) {
        const value = unresolvedKeyframes[i];
        if (typeof value === "string") {
          unresolvedKeyframes[i] = parseFloat(value);
        }
      }
    } else if (positionalValues[name]) {
      this.needsMeasurement = true;
    }
  }
  resolveNoneKeyframes() {
    const { unresolvedKeyframes, name } = this;
    const noneKeyframeIndexes = [];
    for (let i = 0; i < unresolvedKeyframes.length; i++) {
      if (unresolvedKeyframes[i] === null || isNone(unresolvedKeyframes[i])) {
        noneKeyframeIndexes.push(i);
      }
    }
    if (noneKeyframeIndexes.length) {
      makeNoneKeyframesAnimatable(unresolvedKeyframes, noneKeyframeIndexes, name);
    }
  }
  measureInitialState() {
    const { element, unresolvedKeyframes, name } = this;
    if (!element || !element.current)
      return;
    if (name === "height") {
      this.suspendedScrollY = window.pageYOffset;
    }
    this.measuredOrigin = positionalValues[name](element.measureViewportBox(), window.getComputedStyle(element.current));
    unresolvedKeyframes[0] = this.measuredOrigin;
    const measureKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
    if (measureKeyframe !== void 0) {
      element.getValue(name, measureKeyframe).jump(measureKeyframe, false);
    }
  }
  measureEndState() {
    const { element, name, unresolvedKeyframes } = this;
    if (!element || !element.current)
      return;
    const value = element.getValue(name);
    value && value.jump(this.measuredOrigin, false);
    const finalKeyframeIndex = unresolvedKeyframes.length - 1;
    const finalKeyframe = unresolvedKeyframes[finalKeyframeIndex];
    unresolvedKeyframes[finalKeyframeIndex] = positionalValues[name](element.measureViewportBox(), window.getComputedStyle(element.current));
    if (finalKeyframe !== null && this.finalKeyframe === void 0) {
      this.finalKeyframe = finalKeyframe;
    }
    if (this.removedTransforms?.length) {
      this.removedTransforms.forEach(([unsetTransformName, unsetTransformValue]) => {
        element.getValue(unsetTransformName).set(unsetTransformValue);
      });
    }
    this.resolveNoneKeyframes();
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/resolve-elements.mjs
function resolveElements(elementOrSelector, scope, selectorCache) {
  if (elementOrSelector == null) {
    return [];
  }
  if (elementOrSelector instanceof EventTarget) {
    return [elementOrSelector];
  } else if (typeof elementOrSelector === "string") {
    let root = document;
    if (scope) {
      root = scope.current;
    }
    const elements = selectorCache?.[elementOrSelector] ?? root.querySelectorAll(elementOrSelector);
    return elements ? Array.from(elements) : [];
  }
  return Array.from(elementOrSelector).filter((element) => element != null);
}
__name(resolveElements, "resolveElements");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/utils/get-as-type.mjs
var getValueAsType = /* @__PURE__ */ __name((value, type) => {
  return type && typeof value === "number" ? type.transform(value) : value;
}, "getValueAsType");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/frameloop/microtask.mjs
var { schedule: microtask, cancel: cancelMicrotask } = /* @__PURE__ */ createRenderBatcher(queueMicrotask, false);

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/is-svg-element.mjs
function isSVGElement(element) {
  return isObject(element) && "ownerSVGElement" in element;
}
__name(isSVGElement, "isSVGElement");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/utils/is-svg-svg-element.mjs
function isSVGSVGElement(element) {
  return isSVGElement(element) && element.tagName === "svg";
}
__name(isSVGSVGElement, "isSVGSVGElement");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/value/types/utils/find.mjs
var valueTypes = [...dimensionValueTypes, color, complex];
var findValueType = /* @__PURE__ */ __name((v) => valueTypes.find(testValueType(v)), "findValueType");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/projection/geometry/models.mjs
var createAxis = /* @__PURE__ */ __name(() => ({ min: 0, max: 0 }), "createAxis");
var createBox = /* @__PURE__ */ __name(() => ({
  x: createAxis(),
  y: createAxis()
}), "createBox");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/store.mjs
var visualElementStore = /* @__PURE__ */ new WeakMap();

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/is-animation-controls.mjs
function isAnimationControls(v) {
  return v !== null && typeof v === "object" && typeof v.start === "function";
}
__name(isAnimationControls, "isAnimationControls");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/is-variant-label.mjs
function isVariantLabel(v) {
  return typeof v === "string" || Array.isArray(v);
}
__name(isVariantLabel, "isVariantLabel");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/variant-props.mjs
var variantPriorityOrder = [
  "animate",
  "whileInView",
  "whileFocus",
  "whileHover",
  "whileTap",
  "whileDrag",
  "exit"
];
var variantProps = ["initial", ...variantPriorityOrder];

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/is-controlling-variants.mjs
function isControllingVariants(props) {
  return isAnimationControls(props.animate) || variantProps.some((name) => isVariantLabel(props[name]));
}
__name(isControllingVariants, "isControllingVariants");
function isVariantNode(props) {
  return Boolean(isControllingVariants(props) || props.variants);
}
__name(isVariantNode, "isVariantNode");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/motion-values.mjs
function updateMotionValuesFromProps(element, next, prev) {
  for (const key in next) {
    const nextValue = next[key];
    const prevValue = prev[key];
    if (isMotionValue(nextValue)) {
      element.addValue(key, nextValue);
    } else if (isMotionValue(prevValue)) {
      element.addValue(key, motionValue(nextValue, { owner: element }));
    } else if (prevValue !== nextValue) {
      if (element.hasValue(key)) {
        const existingValue = element.getValue(key);
        if (existingValue.liveStyle === true) {
          existingValue.jump(nextValue);
        } else if (!existingValue.hasAnimated) {
          existingValue.set(nextValue);
        }
      } else {
        const latestValue = element.getStaticValue(key);
        element.addValue(key, motionValue(latestValue !== void 0 ? latestValue : nextValue, { owner: element }));
      }
    }
  }
  for (const key in prev) {
    if (next[key] === void 0)
      element.removeValue(key);
  }
  return next;
}
__name(updateMotionValuesFromProps, "updateMotionValuesFromProps");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/reduced-motion/state.mjs
var prefersReducedMotion = { current: null };
var hasReducedMotionListener = { current: false };

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/reduced-motion/index.mjs
var isBrowser = typeof window !== "undefined";
function initPrefersReducedMotion() {
  hasReducedMotionListener.current = true;
  if (!isBrowser)
    return;
  if (window.matchMedia) {
    const motionMediaQuery = window.matchMedia("(prefers-reduced-motion)");
    const setReducedMotionPreferences = /* @__PURE__ */ __name(() => prefersReducedMotion.current = motionMediaQuery.matches, "setReducedMotionPreferences");
    motionMediaQuery.addEventListener("change", setReducedMotionPreferences);
    setReducedMotionPreferences();
  } else {
    prefersReducedMotion.current = false;
  }
}
__name(initPrefersReducedMotion, "initPrefersReducedMotion");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/VisualElement.mjs
var propEventHandlers = [
  "AnimationStart",
  "AnimationComplete",
  "Update",
  "BeforeLayoutMeasure",
  "LayoutMeasure",
  "LayoutAnimationStart",
  "LayoutAnimationComplete"
];
var featureDefinitions = {};
var VisualElement = class {
  static {
    __name(this, "VisualElement");
  }
  /**
   * This method takes React props and returns found MotionValues. For example, HTML
   * MotionValues will be found within the style prop, whereas for Three.js within attribute arrays.
   *
   * This isn't an abstract method as it needs calling in the constructor, but it is
   * intended to be one.
   */
  scrapeMotionValuesFromProps(_props, _prevProps, _visualElement) {
    return {};
  }
  constructor({ parent, props, presenceContext, reducedMotionConfig, skipAnimations, blockInitialAnimation, visualState }, options = {}) {
    this.current = null;
    this.children = /* @__PURE__ */ new Set();
    this.isVariantNode = false;
    this.isControllingVariants = false;
    this.shouldReduceMotion = null;
    this.shouldSkipAnimations = false;
    this.values = /* @__PURE__ */ new Map();
    this.KeyframeResolver = KeyframeResolver;
    this.features = {};
    this.valueSubscriptions = /* @__PURE__ */ new Map();
    this.prevMotionValues = {};
    this.hasBeenMounted = false;
    this.events = {};
    this.propEventSubscriptions = {};
    this.notifyUpdate = () => this.notify("Update", this.latestValues);
    this.render = () => {
      if (!this.current)
        return;
      this.triggerBuild();
      this.renderInstance(this.current, this.renderState, this.props.style, this.projection);
    };
    this.renderScheduledAt = 0;
    this.scheduleRender = () => {
      const now2 = time.now();
      if (this.renderScheduledAt < now2) {
        this.renderScheduledAt = now2;
        frame.render(this.render, false, true);
      }
    };
    const { latestValues, renderState } = visualState;
    this.latestValues = latestValues;
    this.baseTarget = { ...latestValues };
    this.initialValues = props.initial ? { ...latestValues } : {};
    this.renderState = renderState;
    this.parent = parent;
    this.props = props;
    this.presenceContext = presenceContext;
    this.depth = parent ? parent.depth + 1 : 0;
    this.reducedMotionConfig = reducedMotionConfig;
    this.skipAnimationsConfig = skipAnimations;
    this.options = options;
    this.blockInitialAnimation = Boolean(blockInitialAnimation);
    this.isControllingVariants = isControllingVariants(props);
    this.isVariantNode = isVariantNode(props);
    if (this.isVariantNode) {
      this.variantChildren = /* @__PURE__ */ new Set();
    }
    this.manuallyAnimateOnMount = Boolean(parent && parent.current);
    const { willChange, ...initialMotionValues } = this.scrapeMotionValuesFromProps(props, {}, this);
    for (const key in initialMotionValues) {
      const value = initialMotionValues[key];
      if (latestValues[key] !== void 0 && isMotionValue(value)) {
        value.set(latestValues[key]);
      }
    }
  }
  mount(instance) {
    if (this.hasBeenMounted) {
      for (const key in this.initialValues) {
        this.values.get(key)?.jump(this.initialValues[key]);
        this.latestValues[key] = this.initialValues[key];
      }
    }
    this.current = instance;
    visualElementStore.set(instance, this);
    if (this.projection && !this.projection.instance) {
      this.projection.mount(instance);
    }
    if (this.parent && this.isVariantNode && !this.isControllingVariants) {
      this.removeFromVariantTree = this.parent.addVariantChild(this);
    }
    this.values.forEach((value, key) => this.bindToMotionValue(key, value));
    if (this.reducedMotionConfig === "never") {
      this.shouldReduceMotion = false;
    } else if (this.reducedMotionConfig === "always") {
      this.shouldReduceMotion = true;
    } else {
      if (!hasReducedMotionListener.current) {
        initPrefersReducedMotion();
      }
      this.shouldReduceMotion = prefersReducedMotion.current;
    }
    if (process.env.NODE_ENV !== "production") {
      warnOnce(this.shouldReduceMotion !== true, "You have Reduced Motion enabled on your device. Animations may not appear as expected.", "reduced-motion-disabled");
    }
    this.shouldSkipAnimations = this.skipAnimationsConfig ?? false;
    this.parent?.addChild(this);
    this.update(this.props, this.presenceContext);
    this.hasBeenMounted = true;
  }
  unmount() {
    this.projection && this.projection.unmount();
    cancelFrame(this.notifyUpdate);
    cancelFrame(this.render);
    this.valueSubscriptions.forEach((remove) => remove());
    this.valueSubscriptions.clear();
    this.removeFromVariantTree && this.removeFromVariantTree();
    this.parent?.removeChild(this);
    for (const key in this.events) {
      this.events[key].clear();
    }
    for (const key in this.features) {
      const feature = this.features[key];
      if (feature) {
        feature.unmount();
        feature.isMounted = false;
      }
    }
    this.current = null;
  }
  addChild(child) {
    this.children.add(child);
    this.enteringChildren ?? (this.enteringChildren = /* @__PURE__ */ new Set());
    this.enteringChildren.add(child);
  }
  removeChild(child) {
    this.children.delete(child);
    this.enteringChildren && this.enteringChildren.delete(child);
  }
  bindToMotionValue(key, value) {
    if (this.valueSubscriptions.has(key)) {
      this.valueSubscriptions.get(key)();
    }
    if (value.accelerate && acceleratedValues.has(key) && this.current instanceof HTMLElement) {
      const { factory, keyframes: keyframes2, times, ease: ease2, duration } = value.accelerate;
      const animation = new NativeAnimation({
        element: this.current,
        name: key,
        keyframes: keyframes2,
        times,
        ease: ease2,
        duration: secondsToMilliseconds(duration)
      });
      const cleanup = factory(animation);
      this.valueSubscriptions.set(key, () => {
        cleanup();
        animation.cancel();
      });
      return;
    }
    const valueIsTransform = transformProps.has(key);
    if (valueIsTransform && this.onBindTransform) {
      this.onBindTransform();
    }
    const removeOnChange = value.on("change", (latestValue) => {
      this.latestValues[key] = latestValue;
      this.props.onUpdate && frame.preRender(this.notifyUpdate);
      if (valueIsTransform && this.projection) {
        this.projection.isTransformDirty = true;
      }
      this.scheduleRender();
    });
    let removeSyncCheck;
    if (typeof window !== "undefined" && window.MotionCheckAppearSync) {
      removeSyncCheck = window.MotionCheckAppearSync(this, key, value);
    }
    this.valueSubscriptions.set(key, () => {
      removeOnChange();
      if (removeSyncCheck)
        removeSyncCheck();
      if (value.owner)
        value.stop();
    });
  }
  sortNodePosition(other) {
    if (!this.current || !this.sortInstanceNodePosition || this.type !== other.type) {
      return 0;
    }
    return this.sortInstanceNodePosition(this.current, other.current);
  }
  updateFeatures() {
    let key = "animation";
    for (key in featureDefinitions) {
      const featureDefinition = featureDefinitions[key];
      if (!featureDefinition)
        continue;
      const { isEnabled, Feature: FeatureConstructor } = featureDefinition;
      if (!this.features[key] && FeatureConstructor && isEnabled(this.props)) {
        this.features[key] = new FeatureConstructor(this);
      }
      if (this.features[key]) {
        const feature = this.features[key];
        if (feature.isMounted) {
          feature.update();
        } else {
          feature.mount();
          feature.isMounted = true;
        }
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  /**
   * Measure the current viewport box with or without transforms.
   * Only measures axis-aligned boxes, rotate and skew must be manually
   * removed with a re-render to work.
   */
  measureViewportBox() {
    return this.current ? this.measureInstanceViewportBox(this.current, this.props) : createBox();
  }
  getStaticValue(key) {
    return this.latestValues[key];
  }
  setStaticValue(key, value) {
    this.latestValues[key] = value;
  }
  /**
   * Update the provided props. Ensure any newly-added motion values are
   * added to our map, old ones removed, and listeners updated.
   */
  update(props, presenceContext) {
    if (props.transformTemplate || this.props.transformTemplate) {
      this.scheduleRender();
    }
    this.prevProps = this.props;
    this.props = props;
    this.prevPresenceContext = this.presenceContext;
    this.presenceContext = presenceContext;
    for (let i = 0; i < propEventHandlers.length; i++) {
      const key = propEventHandlers[i];
      if (this.propEventSubscriptions[key]) {
        this.propEventSubscriptions[key]();
        delete this.propEventSubscriptions[key];
      }
      const listenerName = "on" + key;
      const listener = props[listenerName];
      if (listener) {
        this.propEventSubscriptions[key] = this.on(key, listener);
      }
    }
    this.prevMotionValues = updateMotionValuesFromProps(this, this.scrapeMotionValuesFromProps(props, this.prevProps || {}, this), this.prevMotionValues);
    if (this.handleChildMotionValue) {
      this.handleChildMotionValue();
    }
  }
  getProps() {
    return this.props;
  }
  /**
   * Returns the variant definition with a given name.
   */
  getVariant(name) {
    return this.props.variants ? this.props.variants[name] : void 0;
  }
  /**
   * Returns the defined default transition on this component.
   */
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
  }
  /**
   * Add a child visual element to our set of children.
   */
  addVariantChild(child) {
    const closestVariantNode = this.getClosestVariantNode();
    if (closestVariantNode) {
      closestVariantNode.variantChildren && closestVariantNode.variantChildren.add(child);
      return () => closestVariantNode.variantChildren.delete(child);
    }
  }
  /**
   * Add a motion value and bind it to this visual element.
   */
  addValue(key, value) {
    const existingValue = this.values.get(key);
    if (value !== existingValue) {
      if (existingValue)
        this.removeValue(key);
      this.bindToMotionValue(key, value);
      this.values.set(key, value);
      this.latestValues[key] = value.get();
    }
  }
  /**
   * Remove a motion value and unbind any active subscriptions.
   */
  removeValue(key) {
    this.values.delete(key);
    const unsubscribe = this.valueSubscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.valueSubscriptions.delete(key);
    }
    delete this.latestValues[key];
    this.removeValueFromRenderState(key, this.renderState);
  }
  /**
   * Check whether we have a motion value for this key
   */
  hasValue(key) {
    return this.values.has(key);
  }
  getValue(key, defaultValue) {
    if (this.props.values && this.props.values[key]) {
      return this.props.values[key];
    }
    let value = this.values.get(key);
    if (value === void 0 && defaultValue !== void 0) {
      value = motionValue(defaultValue === null ? void 0 : defaultValue, { owner: this });
      this.addValue(key, value);
    }
    return value;
  }
  /**
   * If we're trying to animate to a previously unencountered value,
   * we need to check for it in our state and as a last resort read it
   * directly from the instance (which might have performance implications).
   */
  readValue(key, target) {
    let value = this.latestValues[key] !== void 0 || !this.current ? this.latestValues[key] : this.getBaseTargetFromProps(this.props, key) ?? this.readValueFromInstance(this.current, key, this.options);
    if (value !== void 0 && value !== null) {
      if (typeof value === "string" && (isNumericalString(value) || isZeroValueString(value))) {
        value = parseFloat(value);
      } else if (!findValueType(value) && complex.test(target)) {
        value = getAnimatableNone2(key, target);
      }
      this.setBaseTarget(key, isMotionValue(value) ? value.get() : value);
    }
    return isMotionValue(value) ? value.get() : value;
  }
  /**
   * Set the base target to later animate back to. This is currently
   * only hydrated on creation and when we first read a value.
   */
  setBaseTarget(key, value) {
    this.baseTarget[key] = value;
  }
  /**
   * Find the base target for a value thats been removed from all animation
   * props.
   */
  getBaseTarget(key) {
    const { initial } = this.props;
    let valueFromInitial;
    if (typeof initial === "string" || typeof initial === "object") {
      const variant = resolveVariantFromProps(this.props, initial, this.presenceContext?.custom);
      if (variant) {
        valueFromInitial = variant[key];
      }
    }
    if (initial && valueFromInitial !== void 0) {
      return valueFromInitial;
    }
    const target = this.getBaseTargetFromProps(this.props, key);
    if (target !== void 0 && !isMotionValue(target))
      return target;
    return this.initialValues[key] !== void 0 && valueFromInitial === void 0 ? void 0 : this.baseTarget[key];
  }
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = new SubscriptionManager();
    }
    return this.events[eventName].add(callback);
  }
  notify(eventName, ...args) {
    if (this.events[eventName]) {
      this.events[eventName].notify(...args);
    }
  }
  scheduleRenderMicrotask() {
    microtask.render(this.render);
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/dom/DOMVisualElement.mjs
var DOMVisualElement = class extends VisualElement {
  static {
    __name(this, "DOMVisualElement");
  }
  constructor() {
    super(...arguments);
    this.KeyframeResolver = DOMKeyframesResolver;
  }
  sortInstanceNodePosition(a, b) {
    return a.compareDocumentPosition(b) & 2 ? 1 : -1;
  }
  getBaseTargetFromProps(props, key) {
    const style = props.style;
    return style ? style[key] : void 0;
  }
  removeValueFromRenderState(key, { vars, style }) {
    delete vars[key];
    delete style[key];
  }
  handleChildMotionValue() {
    if (this.childSubscription) {
      this.childSubscription();
      delete this.childSubscription;
    }
    const { children } = this.props;
    if (isMotionValue(children)) {
      this.childSubscription = children.on("change", (latest) => {
        if (this.current) {
          this.current.textContent = `${latest}`;
        }
      });
    }
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/projection/geometry/conversion.mjs
function convertBoundingBoxToBox({ top, left, right, bottom }) {
  return {
    x: { min: left, max: right },
    y: { min: top, max: bottom }
  };
}
__name(convertBoundingBoxToBox, "convertBoundingBoxToBox");
function transformBoxPoints(point, transformPoint) {
  if (!transformPoint)
    return point;
  const topLeft = transformPoint({ x: point.left, y: point.top });
  const bottomRight = transformPoint({ x: point.right, y: point.bottom });
  return {
    top: topLeft.y,
    left: topLeft.x,
    bottom: bottomRight.y,
    right: bottomRight.x
  };
}
__name(transformBoxPoints, "transformBoxPoints");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/projection/utils/measure.mjs
function measureViewportBox(instance, transformPoint) {
  return convertBoundingBoxToBox(transformBoxPoints(instance.getBoundingClientRect(), transformPoint));
}
__name(measureViewportBox, "measureViewportBox");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/html/utils/build-transform.mjs
var translateAlias = {
  x: "translateX",
  y: "translateY",
  z: "translateZ",
  transformPerspective: "perspective"
};
var numTransforms = transformPropOrder.length;
function buildTransform(latestValues, transform, transformTemplate) {
  let transformString = "";
  let transformIsDefault = true;
  for (let i = 0; i < numTransforms; i++) {
    const key = transformPropOrder[i];
    const value = latestValues[key];
    if (value === void 0)
      continue;
    let valueIsDefault = true;
    if (typeof value === "number") {
      valueIsDefault = value === (key.startsWith("scale") ? 1 : 0);
    } else {
      const parsed = parseFloat(value);
      valueIsDefault = key.startsWith("scale") ? parsed === 1 : parsed === 0;
    }
    if (!valueIsDefault || transformTemplate) {
      const valueAsType = getValueAsType(value, numberValueTypes[key]);
      if (!valueIsDefault) {
        transformIsDefault = false;
        const transformName = translateAlias[key] || key;
        transformString += `${transformName}(${valueAsType}) `;
      }
      if (transformTemplate) {
        transform[key] = valueAsType;
      }
    }
  }
  transformString = transformString.trim();
  if (transformTemplate) {
    transformString = transformTemplate(transform, transformIsDefault ? "" : transformString);
  } else if (transformIsDefault) {
    transformString = "none";
  }
  return transformString;
}
__name(buildTransform, "buildTransform");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/html/utils/build-styles.mjs
function buildHTMLStyles(state, latestValues, transformTemplate) {
  const { style, vars, transformOrigin } = state;
  let hasTransform = false;
  let hasTransformOrigin = false;
  for (const key in latestValues) {
    const value = latestValues[key];
    if (transformProps.has(key)) {
      hasTransform = true;
      continue;
    } else if (isCSSVariableName(key)) {
      vars[key] = value;
      continue;
    } else {
      const valueAsType = getValueAsType(value, numberValueTypes[key]);
      if (key.startsWith("origin")) {
        hasTransformOrigin = true;
        transformOrigin[key] = valueAsType;
      } else {
        style[key] = valueAsType;
      }
    }
  }
  if (!latestValues.transform) {
    if (hasTransform || transformTemplate) {
      style.transform = buildTransform(latestValues, state.transform, transformTemplate);
    } else if (style.transform) {
      style.transform = "none";
    }
  }
  if (hasTransformOrigin) {
    const { originX = "50%", originY = "50%", originZ = 0 } = transformOrigin;
    style.transformOrigin = `${originX} ${originY} ${originZ}`;
  }
}
__name(buildHTMLStyles, "buildHTMLStyles");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/html/utils/render.mjs
function renderHTML(element, { style, vars }, styleProp, projection) {
  const elementStyle = element.style;
  let key;
  for (key in style) {
    elementStyle[key] = style[key];
  }
  projection?.applyProjectionStyles(elementStyle, styleProp);
  for (key in vars) {
    elementStyle.setProperty(key, vars[key]);
  }
}
__name(renderHTML, "renderHTML");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/projection/styles/scale-border-radius.mjs
function pixelsToPercent(pixels, axis) {
  if (axis.max === axis.min)
    return 0;
  return pixels / (axis.max - axis.min) * 100;
}
__name(pixelsToPercent, "pixelsToPercent");
var correctBorderRadius = {
  correct: /* @__PURE__ */ __name((latest, node) => {
    if (!node.target)
      return latest;
    if (typeof latest === "string") {
      if (px.test(latest)) {
        latest = parseFloat(latest);
      } else {
        return latest;
      }
    }
    const x = pixelsToPercent(latest, node.target.x);
    const y = pixelsToPercent(latest, node.target.y);
    return `${x}% ${y}%`;
  }, "correct")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/projection/styles/scale-box-shadow.mjs
var correctBoxShadow = {
  correct: /* @__PURE__ */ __name((latest, { treeScale, projectionDelta }) => {
    const original = latest;
    const shadow = complex.parse(latest);
    if (shadow.length > 5)
      return original;
    const template = complex.createTransformer(latest);
    const offset = typeof shadow[0] !== "number" ? 1 : 0;
    const xScale = projectionDelta.x.scale * treeScale.x;
    const yScale = projectionDelta.y.scale * treeScale.y;
    shadow[0 + offset] /= xScale;
    shadow[1 + offset] /= yScale;
    const averageScale = mixNumber(xScale, yScale, 0.5);
    if (typeof shadow[2 + offset] === "number")
      shadow[2 + offset] /= averageScale;
    if (typeof shadow[3 + offset] === "number")
      shadow[3 + offset] /= averageScale;
    return template(shadow);
  }, "correct")
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/projection/styles/scale-correction.mjs
var scaleCorrectors = {
  borderRadius: {
    ...correctBorderRadius,
    applyTo: [
      "borderTopLeftRadius",
      "borderTopRightRadius",
      "borderBottomLeftRadius",
      "borderBottomRightRadius"
    ]
  },
  borderTopLeftRadius: correctBorderRadius,
  borderTopRightRadius: correctBorderRadius,
  borderBottomLeftRadius: correctBorderRadius,
  borderBottomRightRadius: correctBorderRadius,
  boxShadow: correctBoxShadow
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/utils/is-forced-motion-value.mjs
function isForcedMotionValue(key, { layout, layoutId }) {
  return transformProps.has(key) || key.startsWith("origin") || (layout || layoutId !== void 0) && (!!scaleCorrectors[key] || key === "opacity");
}
__name(isForcedMotionValue, "isForcedMotionValue");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/html/utils/scrape-motion-values.mjs
function scrapeMotionValuesFromProps(props, prevProps, visualElement) {
  const style = props.style;
  const prevStyle = prevProps?.style;
  const newValues = {};
  if (!style)
    return newValues;
  for (const key in style) {
    if (isMotionValue(style[key]) || prevStyle && isMotionValue(prevStyle[key]) || isForcedMotionValue(key, props) || visualElement?.getValue(key)?.liveStyle !== void 0) {
      newValues[key] = style[key];
    }
  }
  return newValues;
}
__name(scrapeMotionValuesFromProps, "scrapeMotionValuesFromProps");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/html/HTMLVisualElement.mjs
function getComputedStyle2(element) {
  return window.getComputedStyle(element);
}
__name(getComputedStyle2, "getComputedStyle");
var HTMLVisualElement = class extends DOMVisualElement {
  static {
    __name(this, "HTMLVisualElement");
  }
  constructor() {
    super(...arguments);
    this.type = "html";
    this.renderInstance = renderHTML;
  }
  readValueFromInstance(instance, key) {
    if (transformProps.has(key)) {
      return this.projection?.isProjecting ? defaultTransformValue(key) : readTransformValue(instance, key);
    } else {
      const computedStyle = getComputedStyle2(instance);
      const value = (isCSSVariableName(key) ? computedStyle.getPropertyValue(key) : computedStyle[key]) || 0;
      return typeof value === "string" ? value.trim() : value;
    }
  }
  measureInstanceViewportBox(instance, { transformPagePoint }) {
    return measureViewportBox(instance, transformPagePoint);
  }
  build(renderState, latestValues, props) {
    buildHTMLStyles(renderState, latestValues, props.transformTemplate);
  }
  scrapeMotionValuesFromProps(props, prevProps, visualElement) {
    return scrapeMotionValuesFromProps(props, prevProps, visualElement);
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/object/ObjectVisualElement.mjs
function isObjectKey(key, object) {
  return key in object;
}
__name(isObjectKey, "isObjectKey");
var ObjectVisualElement = class extends VisualElement {
  static {
    __name(this, "ObjectVisualElement");
  }
  constructor() {
    super(...arguments);
    this.type = "object";
  }
  readValueFromInstance(instance, key) {
    if (isObjectKey(key, instance)) {
      const value = instance[key];
      if (typeof value === "string" || typeof value === "number") {
        return value;
      }
    }
    return void 0;
  }
  getBaseTargetFromProps() {
    return void 0;
  }
  removeValueFromRenderState(key, renderState) {
    delete renderState.output[key];
  }
  measureInstanceViewportBox() {
    return createBox();
  }
  build(renderState, latestValues) {
    Object.assign(renderState.output, latestValues);
  }
  renderInstance(instance, { output }) {
    Object.assign(instance, output);
  }
  sortInstanceNodePosition() {
    return 0;
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/svg/utils/path.mjs
var dashKeys = {
  offset: "stroke-dashoffset",
  array: "stroke-dasharray"
};
var camelKeys = {
  offset: "strokeDashoffset",
  array: "strokeDasharray"
};
function buildSVGPath(attrs, length, spacing = 1, offset = 0, useDashCase = true) {
  attrs.pathLength = 1;
  const keys = useDashCase ? dashKeys : camelKeys;
  attrs[keys.offset] = `${-offset}`;
  attrs[keys.array] = `${length} ${spacing}`;
}
__name(buildSVGPath, "buildSVGPath");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/svg/utils/build-attrs.mjs
var cssMotionPathProperties = [
  "offsetDistance",
  "offsetPath",
  "offsetRotate",
  "offsetAnchor"
];
function buildSVGAttrs(state, {
  attrX,
  attrY,
  attrScale,
  pathLength,
  pathSpacing = 1,
  pathOffset = 0,
  // This is object creation, which we try to avoid per-frame.
  ...latest
}, isSVGTag2, transformTemplate, styleProp) {
  buildHTMLStyles(state, latest, transformTemplate);
  if (isSVGTag2) {
    if (state.style.viewBox) {
      state.attrs.viewBox = state.style.viewBox;
    }
    return;
  }
  state.attrs = state.style;
  state.style = {};
  const { attrs, style } = state;
  if (attrs.transform) {
    style.transform = attrs.transform;
    delete attrs.transform;
  }
  if (style.transform || attrs.transformOrigin) {
    style.transformOrigin = attrs.transformOrigin ?? "50% 50%";
    delete attrs.transformOrigin;
  }
  if (style.transform) {
    style.transformBox = styleProp?.transformBox ?? "fill-box";
    delete attrs.transformBox;
  }
  for (const key of cssMotionPathProperties) {
    if (attrs[key] !== void 0) {
      style[key] = attrs[key];
      delete attrs[key];
    }
  }
  if (attrX !== void 0)
    attrs.x = attrX;
  if (attrY !== void 0)
    attrs.y = attrY;
  if (attrScale !== void 0)
    attrs.scale = attrScale;
  if (pathLength !== void 0) {
    buildSVGPath(attrs, pathLength, pathSpacing, pathOffset, false);
  }
}
__name(buildSVGAttrs, "buildSVGAttrs");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/svg/utils/camel-case-attrs.mjs
var camelCaseAttributes = /* @__PURE__ */ new Set([
  "baseFrequency",
  "diffuseConstant",
  "kernelMatrix",
  "kernelUnitLength",
  "keySplines",
  "keyTimes",
  "limitingConeAngle",
  "markerHeight",
  "markerWidth",
  "numOctaves",
  "targetX",
  "targetY",
  "surfaceScale",
  "specularConstant",
  "specularExponent",
  "stdDeviation",
  "tableValues",
  "viewBox",
  "gradientTransform",
  "pathLength",
  "startOffset",
  "textLength",
  "lengthAdjust"
]);

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/svg/utils/is-svg-tag.mjs
var isSVGTag = /* @__PURE__ */ __name((tag) => typeof tag === "string" && tag.toLowerCase() === "svg", "isSVGTag");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/svg/utils/render.mjs
function renderSVG(element, renderState, _styleProp, projection) {
  renderHTML(element, renderState, void 0, projection);
  for (const key in renderState.attrs) {
    element.setAttribute(!camelCaseAttributes.has(key) ? camelToDash(key) : key, renderState.attrs[key]);
  }
}
__name(renderSVG, "renderSVG");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/svg/utils/scrape-motion-values.mjs
function scrapeMotionValuesFromProps2(props, prevProps, visualElement) {
  const newValues = scrapeMotionValuesFromProps(props, prevProps, visualElement);
  for (const key in props) {
    if (isMotionValue(props[key]) || isMotionValue(prevProps[key])) {
      const targetKey = transformPropOrder.indexOf(key) !== -1 ? "attr" + key.charAt(0).toUpperCase() + key.substring(1) : key;
      newValues[targetKey] = props[key];
    }
  }
  return newValues;
}
__name(scrapeMotionValuesFromProps2, "scrapeMotionValuesFromProps");

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/render/svg/SVGVisualElement.mjs
var SVGVisualElement = class extends DOMVisualElement {
  static {
    __name(this, "SVGVisualElement");
  }
  constructor() {
    super(...arguments);
    this.type = "svg";
    this.isSVGTag = false;
    this.measureInstanceViewportBox = createBox;
  }
  getBaseTargetFromProps(props, key) {
    return props[key];
  }
  readValueFromInstance(instance, key) {
    if (transformProps.has(key)) {
      const defaultType = getDefaultValueType(key);
      return defaultType ? defaultType.default || 0 : 0;
    }
    key = !camelCaseAttributes.has(key) ? camelToDash(key) : key;
    return instance.getAttribute(key);
  }
  scrapeMotionValuesFromProps(props, prevProps, visualElement) {
    return scrapeMotionValuesFromProps2(props, prevProps, visualElement);
  }
  build(renderState, latestValues, props) {
    buildSVGAttrs(renderState, latestValues, this.isSVGTag, props.transformTemplate, props.style);
  }
  renderInstance(instance, renderState, styleProp, projection) {
    renderSVG(instance, renderState, styleProp, projection);
  }
  mount(instance) {
    this.isSVGTag = isSVGTag(instance.tagName);
    super.mount(instance);
  }
};

// ../../node_modules/.bun/motion-dom@12.38.0/node_modules/motion-dom/dist/es/animation/animate/single-value.mjs
function animateSingleValue(value, keyframes2, options) {
  const motionValue$1 = isMotionValue(value) ? value : motionValue(value);
  motionValue$1.start(animateMotionValue("", motionValue$1, keyframes2, options));
  return motionValue$1.animation;
}
__name(animateSingleValue, "animateSingleValue");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/context/MotionConfigContext.mjs
var import_react2 = require("react");
var MotionConfigContext = (0, import_react2.createContext)({
  transformPagePoint: /* @__PURE__ */ __name((p) => p, "transformPagePoint"),
  isStatic: false,
  reducedMotion: "never"
});

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/utils/use-unmount-effect.mjs
var import_react3 = require("react");
function useUnmountEffect(callback) {
  return (0, import_react3.useEffect)(() => () => callback(), []);
}
__name(useUnmountEffect, "useUnmountEffect");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/utils/use-motion-value-event.mjs
var import_react4 = require("react");
function useMotionValueEvent(value, event, callback) {
  (0, import_react4.useInsertionEffect)(() => value.on(event, callback), [value, event, callback]);
}
__name(useMotionValueEvent, "useMotionValueEvent");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/value/use-motion-value.mjs
var import_react5 = require("react");
function useMotionValue(initial) {
  const value = useConstant(() => motionValue(initial));
  const { isStatic } = (0, import_react5.useContext)(MotionConfigContext);
  if (isStatic) {
    const [, setLatest] = (0, import_react5.useState)(initial);
    (0, import_react5.useEffect)(() => value.on("change", setLatest), []);
  }
  return value;
}
__name(useMotionValue, "useMotionValue");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs
var import_react6 = require("react");
function useReducedMotion() {
  !hasReducedMotionListener.current && initPrefersReducedMotion();
  const [shouldReduceMotion] = (0, import_react6.useState)(prefersReducedMotion.current);
  if (process.env.NODE_ENV !== "production") {
    warnOnce(shouldReduceMotion !== true, "You have Reduced Motion enabled on your device. Animations may not appear as expected.", "reduced-motion-disabled");
  }
  return shouldReduceMotion;
}
__name(useReducedMotion, "useReducedMotion");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion-config.mjs
var import_react7 = require("react");
function useReducedMotionConfig() {
  const reducedMotionPreference = useReducedMotion();
  const { reducedMotion } = (0, import_react7.useContext)(MotionConfigContext);
  if (reducedMotion === "never") {
    return false;
  } else if (reducedMotion === "always") {
    return true;
  } else {
    return reducedMotionPreference;
  }
}
__name(useReducedMotionConfig, "useReducedMotionConfig");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/hooks/use-animate.mjs
var import_react8 = require("react");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/utils/is-dom-keyframes.mjs
function isDOMKeyframes(keyframes2) {
  return typeof keyframes2 === "object" && !Array.isArray(keyframes2);
}
__name(isDOMKeyframes, "isDOMKeyframes");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/animate/resolve-subjects.mjs
function resolveSubjects(subject, keyframes2, scope, selectorCache) {
  if (subject == null) {
    return [];
  }
  if (typeof subject === "string" && isDOMKeyframes(keyframes2)) {
    return resolveElements(subject, scope, selectorCache);
  } else if (subject instanceof NodeList) {
    return Array.from(subject);
  } else if (Array.isArray(subject)) {
    return subject.filter((s) => s != null);
  } else {
    return [subject];
  }
}
__name(resolveSubjects, "resolveSubjects");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/sequence/utils/calc-repeat-duration.mjs
function calculateRepeatDuration(duration, repeat, _repeatDelay) {
  return duration * (repeat + 1);
}
__name(calculateRepeatDuration, "calculateRepeatDuration");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/sequence/utils/calc-time.mjs
function calcNextTime(current, next, prev, labels) {
  if (typeof next === "number") {
    return next;
  } else if (next.startsWith("-") || next.startsWith("+")) {
    return Math.max(0, current + parseFloat(next));
  } else if (next === "<") {
    return prev;
  } else if (next.startsWith("<")) {
    return Math.max(0, prev + parseFloat(next.slice(1)));
  } else {
    return labels.get(next) ?? current;
  }
}
__name(calcNextTime, "calcNextTime");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/sequence/utils/edit.mjs
function eraseKeyframes(sequence, startTime, endTime) {
  for (let i = 0; i < sequence.length; i++) {
    const keyframe = sequence[i];
    if (keyframe.at > startTime && keyframe.at < endTime) {
      removeItem(sequence, keyframe);
      i--;
    }
  }
}
__name(eraseKeyframes, "eraseKeyframes");
function addKeyframes(sequence, keyframes2, easing, offset, startTime, endTime) {
  eraseKeyframes(sequence, startTime, endTime);
  for (let i = 0; i < keyframes2.length; i++) {
    sequence.push({
      value: keyframes2[i],
      at: mixNumber(startTime, endTime, offset[i]),
      easing: getEasingForSegment(easing, i)
    });
  }
}
__name(addKeyframes, "addKeyframes");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/sequence/utils/normalize-times.mjs
function normalizeTimes(times, repeat) {
  for (let i = 0; i < times.length; i++) {
    times[i] = times[i] / (repeat + 1);
  }
}
__name(normalizeTimes, "normalizeTimes");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/sequence/utils/sort.mjs
function compareByTime(a, b) {
  if (a.at === b.at) {
    if (a.value === null)
      return 1;
    if (b.value === null)
      return -1;
    return 0;
  } else {
    return a.at - b.at;
  }
}
__name(compareByTime, "compareByTime");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/sequence/create.mjs
var defaultSegmentEasing = "easeInOut";
var MAX_REPEAT = 20;
function createAnimationsFromSequence(sequence, { defaultTransition = {}, ...sequenceTransition } = {}, scope, generators) {
  const defaultDuration = defaultTransition.duration || 0.3;
  const animationDefinitions = /* @__PURE__ */ new Map();
  const sequences = /* @__PURE__ */ new Map();
  const elementCache = {};
  const timeLabels = /* @__PURE__ */ new Map();
  let prevTime = 0;
  let currentTime = 0;
  let totalDuration = 0;
  for (let i = 0; i < sequence.length; i++) {
    const segment = sequence[i];
    if (typeof segment === "string") {
      timeLabels.set(segment, currentTime);
      continue;
    } else if (!Array.isArray(segment)) {
      timeLabels.set(segment.name, calcNextTime(currentTime, segment.at, prevTime, timeLabels));
      continue;
    }
    let [subject, keyframes2, transition = {}] = segment;
    if (transition.at !== void 0) {
      currentTime = calcNextTime(currentTime, transition.at, prevTime, timeLabels);
    }
    let maxDuration = 0;
    const resolveValueSequence = /* @__PURE__ */ __name((valueKeyframes, valueTransition, valueSequence, elementIndex = 0, numSubjects = 0) => {
      const valueKeyframesAsList = keyframesAsList(valueKeyframes);
      const { delay = 0, times = defaultOffset(valueKeyframesAsList), type = defaultTransition.type || "keyframes", repeat, repeatType, repeatDelay = 0, ...remainingTransition } = valueTransition;
      let { ease: ease2 = defaultTransition.ease || "easeOut", duration } = valueTransition;
      const calculatedDelay = typeof delay === "function" ? delay(elementIndex, numSubjects) : delay;
      const numKeyframes = valueKeyframesAsList.length;
      const createGenerator = isGenerator(type) ? type : generators?.[type || "keyframes"];
      if (numKeyframes <= 2 && createGenerator) {
        let absoluteDelta = 100;
        if (numKeyframes === 2 && isNumberKeyframesArray(valueKeyframesAsList)) {
          const delta = valueKeyframesAsList[1] - valueKeyframesAsList[0];
          absoluteDelta = Math.abs(delta);
        }
        const springTransition = {
          ...defaultTransition,
          ...remainingTransition
        };
        if (duration !== void 0) {
          springTransition.duration = secondsToMilliseconds(duration);
        }
        const springEasing = createGeneratorEasing(springTransition, absoluteDelta, createGenerator);
        ease2 = springEasing.ease;
        duration = springEasing.duration;
      }
      duration ?? (duration = defaultDuration);
      const startTime = currentTime + calculatedDelay;
      if (times.length === 1 && times[0] === 0) {
        times[1] = 1;
      }
      const remainder = times.length - valueKeyframesAsList.length;
      remainder > 0 && fillOffset(times, remainder);
      valueKeyframesAsList.length === 1 && valueKeyframesAsList.unshift(null);
      if (repeat) {
        invariant(repeat < MAX_REPEAT, "Repeat count too high, must be less than 20", "repeat-count-high");
        duration = calculateRepeatDuration(duration, repeat);
        const originalKeyframes = [...valueKeyframesAsList];
        const originalTimes = [...times];
        ease2 = Array.isArray(ease2) ? [...ease2] : [ease2];
        const originalEase = [...ease2];
        for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex++) {
          valueKeyframesAsList.push(...originalKeyframes);
          for (let keyframeIndex = 0; keyframeIndex < originalKeyframes.length; keyframeIndex++) {
            times.push(originalTimes[keyframeIndex] + (repeatIndex + 1));
            ease2.push(keyframeIndex === 0 ? "linear" : getEasingForSegment(originalEase, keyframeIndex - 1));
          }
        }
        normalizeTimes(times, repeat);
      }
      const targetTime = startTime + duration;
      addKeyframes(valueSequence, valueKeyframesAsList, ease2, times, startTime, targetTime);
      maxDuration = Math.max(calculatedDelay + duration, maxDuration);
      totalDuration = Math.max(targetTime, totalDuration);
    }, "resolveValueSequence");
    if (isMotionValue(subject)) {
      const subjectSequence = getSubjectSequence(subject, sequences);
      resolveValueSequence(keyframes2, transition, getValueSequence("default", subjectSequence));
    } else {
      const subjects = resolveSubjects(subject, keyframes2, scope, elementCache);
      const numSubjects = subjects.length;
      for (let subjectIndex = 0; subjectIndex < numSubjects; subjectIndex++) {
        keyframes2 = keyframes2;
        transition = transition;
        const thisSubject = subjects[subjectIndex];
        const subjectSequence = getSubjectSequence(thisSubject, sequences);
        for (const key in keyframes2) {
          resolveValueSequence(keyframes2[key], getValueTransition2(transition, key), getValueSequence(key, subjectSequence), subjectIndex, numSubjects);
        }
      }
    }
    prevTime = currentTime;
    currentTime += maxDuration;
  }
  sequences.forEach((valueSequences, element) => {
    for (const key in valueSequences) {
      const valueSequence = valueSequences[key];
      valueSequence.sort(compareByTime);
      const keyframes2 = [];
      const valueOffset = [];
      const valueEasing = [];
      for (let i = 0; i < valueSequence.length; i++) {
        const { at, value, easing } = valueSequence[i];
        keyframes2.push(value);
        valueOffset.push(progress(0, totalDuration, at));
        valueEasing.push(easing || "easeOut");
      }
      if (valueOffset[0] !== 0) {
        valueOffset.unshift(0);
        keyframes2.unshift(keyframes2[0]);
        valueEasing.unshift(defaultSegmentEasing);
      }
      if (valueOffset[valueOffset.length - 1] !== 1) {
        valueOffset.push(1);
        keyframes2.push(null);
      }
      if (!animationDefinitions.has(element)) {
        animationDefinitions.set(element, {
          keyframes: {},
          transition: {}
        });
      }
      const definition = animationDefinitions.get(element);
      definition.keyframes[key] = keyframes2;
      const { type: _type, ...remainingDefaultTransition } = defaultTransition;
      definition.transition[key] = {
        ...remainingDefaultTransition,
        duration: totalDuration,
        ease: valueEasing,
        times: valueOffset,
        ...sequenceTransition
      };
    }
  });
  return animationDefinitions;
}
__name(createAnimationsFromSequence, "createAnimationsFromSequence");
function getSubjectSequence(subject, sequences) {
  !sequences.has(subject) && sequences.set(subject, {});
  return sequences.get(subject);
}
__name(getSubjectSequence, "getSubjectSequence");
function getValueSequence(name, sequences) {
  if (!sequences[name])
    sequences[name] = [];
  return sequences[name];
}
__name(getValueSequence, "getValueSequence");
function keyframesAsList(keyframes2) {
  return Array.isArray(keyframes2) ? keyframes2 : [keyframes2];
}
__name(keyframesAsList, "keyframesAsList");
function getValueTransition2(transition, key) {
  return transition && transition[key] ? {
    ...transition,
    ...transition[key]
  } : { ...transition };
}
__name(getValueTransition2, "getValueTransition");
var isNumber = /* @__PURE__ */ __name((keyframe) => typeof keyframe === "number", "isNumber");
var isNumberKeyframesArray = /* @__PURE__ */ __name((keyframes2) => keyframes2.every(isNumber), "isNumberKeyframesArray");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/utils/create-visual-element.mjs
function createDOMVisualElement(element) {
  const options = {
    presenceContext: null,
    props: {},
    visualState: {
      renderState: {
        transform: {},
        transformOrigin: {},
        style: {},
        vars: {},
        attrs: {}
      },
      latestValues: {}
    }
  };
  const node = isSVGElement(element) && !isSVGSVGElement(element) ? new SVGVisualElement(options) : new HTMLVisualElement(options);
  node.mount(element);
  visualElementStore.set(element, node);
}
__name(createDOMVisualElement, "createDOMVisualElement");
function createObjectVisualElement(subject) {
  const options = {
    presenceContext: null,
    props: {},
    visualState: {
      renderState: {
        output: {}
      },
      latestValues: {}
    }
  };
  const node = new ObjectVisualElement(options);
  node.mount(subject);
  visualElementStore.set(subject, node);
}
__name(createObjectVisualElement, "createObjectVisualElement");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/animate/subject.mjs
function isSingleValue(subject, keyframes2) {
  return isMotionValue(subject) || typeof subject === "number" || typeof subject === "string" && !isDOMKeyframes(keyframes2);
}
__name(isSingleValue, "isSingleValue");
function animateSubject(subject, keyframes2, options, scope) {
  const animations2 = [];
  if (isSingleValue(subject, keyframes2)) {
    animations2.push(animateSingleValue(subject, isDOMKeyframes(keyframes2) ? keyframes2.default || keyframes2 : keyframes2, options ? options.default || options : options));
  } else {
    if (subject == null) {
      return animations2;
    }
    const subjects = resolveSubjects(subject, keyframes2, scope);
    const numSubjects = subjects.length;
    invariant(Boolean(numSubjects), "No valid elements provided.", "no-valid-elements");
    for (let i = 0; i < numSubjects; i++) {
      const thisSubject = subjects[i];
      const createVisualElement = thisSubject instanceof Element ? createDOMVisualElement : createObjectVisualElement;
      if (!visualElementStore.has(thisSubject)) {
        createVisualElement(thisSubject);
      }
      const visualElement = visualElementStore.get(thisSubject);
      const transition = { ...options };
      if ("delay" in transition && typeof transition.delay === "function") {
        transition.delay = transition.delay(i, numSubjects);
      }
      animations2.push(...animateTarget(visualElement, { ...keyframes2, transition }, {}));
    }
  }
  return animations2;
}
__name(animateSubject, "animateSubject");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/animate/sequence.mjs
function animateSequence(sequence, options, scope) {
  const animations2 = [];
  const processedSequence = sequence.map((segment) => {
    if (Array.isArray(segment) && typeof segment[0] === "function") {
      const callback = segment[0];
      const mv = motionValue(0);
      mv.on("change", callback);
      if (segment.length === 1) {
        return [mv, [0, 1]];
      } else if (segment.length === 2) {
        return [mv, [0, 1], segment[1]];
      } else {
        return [mv, segment[1], segment[2]];
      }
    }
    return segment;
  });
  const animationDefinitions = createAnimationsFromSequence(processedSequence, options, scope, { spring });
  animationDefinitions.forEach(({ keyframes: keyframes2, transition }, subject) => {
    animations2.push(...animateSubject(subject, keyframes2, transition));
  });
  return animations2;
}
__name(animateSequence, "animateSequence");

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/animate/index.mjs
function isSequence(value) {
  return Array.isArray(value) && value.some(Array.isArray);
}
__name(isSequence, "isSequence");
function createScopedAnimate(options = {}) {
  const { scope, reduceMotion } = options;
  function scopedAnimate(subjectOrSequence, optionsOrKeyframes, options2) {
    let animations2 = [];
    let animationOnComplete;
    if (isSequence(subjectOrSequence)) {
      const { onComplete, ...sequenceOptions } = optionsOrKeyframes || {};
      if (typeof onComplete === "function") {
        animationOnComplete = onComplete;
      }
      animations2 = animateSequence(subjectOrSequence, reduceMotion !== void 0 ? { reduceMotion, ...sequenceOptions } : sequenceOptions, scope);
    } else {
      const { onComplete, ...rest } = options2 || {};
      if (typeof onComplete === "function") {
        animationOnComplete = onComplete;
      }
      animations2 = animateSubject(subjectOrSequence, optionsOrKeyframes, reduceMotion !== void 0 ? { reduceMotion, ...rest } : rest, scope);
    }
    const animation = new GroupAnimationWithThen(animations2);
    if (animationOnComplete) {
      animation.finished.then(animationOnComplete);
    }
    if (scope) {
      scope.animations.push(animation);
      animation.finished.then(() => {
        removeItem(scope.animations, animation);
      });
    }
    return animation;
  }
  __name(scopedAnimate, "scopedAnimate");
  return scopedAnimate;
}
__name(createScopedAnimate, "createScopedAnimate");
var animate = createScopedAnimate();

// ../../node_modules/.bun/framer-motion@12.38.0+961e59d536a2b27a/node_modules/framer-motion/dist/es/animation/hooks/use-animate.mjs
function useAnimate() {
  const scope = useConstant(() => ({
    current: null,
    // Will be hydrated by React
    animations: []
  }));
  const reduceMotion = useReducedMotionConfig() ?? void 0;
  const animate2 = (0, import_react8.useMemo)(() => createScopedAnimate({ scope, reduceMotion }), [scope, reduceMotion]);
  useUnmountEffect(() => {
    scope.animations.forEach((animation) => animation.stop());
    scope.animations.length = 0;
  });
  return [scope, animate2];
}
__name(useAnimate, "useAnimate");

// ../../node_modules/.bun/@tamagui+animations-motion@1.144.4+e1c714ba709dbee1/node_modules/@tamagui/animations-motion/dist/esm/createAnimations.mjs
var import_react10 = __toESM(require("react"), 1);
var import_jsx_runtime2 = require("react/jsx-runtime");
var minTimeBetweenAnimations = 1e3 / 60;
var MotionValueStrategy = /* @__PURE__ */ new WeakMap();
function createAnimations(animationsProp) {
  const animations2 = {};
  for (const key in animationsProp) animations2[key] = {
    type: "spring",
    ...animationsProp[key]
  };
  return {
    // this is only used by Sheet basically for now to pass result of useAnimatedStyle to
    View: MotionView,
    Text: MotionText,
    isReactNative: false,
    supportsCSS: true,
    needsWebStyles: true,
    avoidReRenders: true,
    animations: animations2,
    usePresence,
    ResetPresence,
    useAnimations: /* @__PURE__ */ __name((animationProps) => {
      const {
        props,
        style,
        componentState,
        stateRef,
        useStyleEmitter,
        presence
      } = animationProps, animationKey = Array.isArray(props.animation) ? props.animation[0] : props.animation, disableAnimation = componentState.unmounted === true || !animationKey, isExiting = presence?.[0] === false, sendExitComplete = presence?.[1], isFirstRender = (0, import_react10.useRef)(true), [scope, animate2] = useAnimate(), lastDoAnimate = (0, import_react10.useRef)(null), controls = (0, import_react10.useRef)(null), styleKey = JSON.stringify(style), shouldDebug = (
        // process.env.NODE_ENV === 'development' &&
        props.debug && props.debug !== "profile"
      ), {
        dontAnimate = {},
        doAnimate,
        animationOptions
      } = (0, import_react10.useMemo)(() => getMotionAnimatedProps(props, style, disableAnimation), [isExiting, animationKey, styleKey]), debugId = process.env.NODE_ENV === "development" ? (0, import_react10.useId)() : "", lastAnimateAt = (0, import_react10.useRef)(0), disposed = (0, import_react10.useRef)(false), [firstRenderStyle] = (0, import_react10.useState)(style), lastDontAnimate = (0, import_react10.useRef)(firstRenderStyle);
      (0, import_react10.useLayoutEffect)(() => () => {
        disposed.current = true;
      }, []);
      const updateFirstAnimationStyle = /* @__PURE__ */ __name(() => stateRef.current.host instanceof HTMLElement ? lastDoAnimate.current ? false : (lastAnimateAt.current = Date.now(), lastDoAnimate.current = doAnimate || {}, animate2(scope.current, doAnimate || {}, {
        type: false
      }), shouldDebug && (console.groupCollapsed(`[motion] ${debugId} \u{1F30A} FIRST`), console.info(doAnimate), console.groupEnd()), true) : false, "updateFirstAnimationStyle"), flushAnimation = /* @__PURE__ */ __name(({
        doAnimate: doAnimate2 = {},
        animationOptions: animationOptions2 = {},
        dontAnimate: dontAnimate2
      }) => {
        try {
          const node = stateRef.current.host;
          if (shouldDebug && (console.groupCollapsed(`[motion] ${debugId} \u{1F30A} animate (${JSON.stringify(getDiff(lastDoAnimate.current, doAnimate2), null, 2)})`), console.info({
            props,
            componentState,
            doAnimate: doAnimate2,
            dontAnimate: dontAnimate2,
            animationOptions: animationOptions2,
            animationProps,
            lastDoAnimate: {
              ...lastDoAnimate.current
            },
            lastDontAnimate: {
              ...lastDontAnimate.current
            },
            isExiting,
            style,
            node
          }), console.groupCollapsed("trace >"), console.trace(), console.groupEnd(), console.groupEnd()), !(node instanceof HTMLElement)) return;
          const prevDont = lastDontAnimate.current;
          if (dontAnimate2 && prevDont) {
            removeRemovedStyles(prevDont, dontAnimate2, node);
            const changed = getDiff(prevDont, dontAnimate2);
            changed && Object.assign(node.style, changed);
          }
          if (doAnimate2) {
            if (updateFirstAnimationStyle()) return;
            if (prevDont) for (const key in prevDont) key in doAnimate2 && (node.style[key] = prevDont[key]);
            const lastAnimated = lastDoAnimate.current;
            lastAnimated && removeRemovedStyles(lastAnimated, doAnimate2, node);
            const diff = getDiff(lastDoAnimate.current, doAnimate2);
            diff && (controls.current = animate2(scope.current, diff, animationOptions2), lastAnimateAt.current = Date.now());
          }
          lastDontAnimate.current = dontAnimate2 || {}, lastDoAnimate.current = doAnimate2;
        } finally {
          isExiting && (controls.current ? controls.current.finished.then(() => {
            sendExitComplete?.();
          }) : sendExitComplete?.());
        }
      }, "flushAnimation");
      useStyleEmitter?.((nextStyle) => {
        const animationProps2 = getMotionAnimatedProps(props, nextStyle, disableAnimation);
        flushAnimation(animationProps2);
      });
      const animateKey = JSON.stringify(style);
      return (0, import_core3.useIsomorphicLayoutEffect)(() => {
        if (isFirstRender.current) {
          updateFirstAnimationStyle(), isFirstRender.current = false, lastDontAnimate.current = dontAnimate, lastDoAnimate.current = doAnimate || {};
          return;
        }
        flushAnimation({
          doAnimate,
          dontAnimate,
          animationOptions
        });
      }, [animateKey, isExiting]), shouldDebug && (console.groupCollapsed("[motion] \u{1F30A} render"), console.info({
        style,
        doAnimate,
        dontAnimate,
        animateKey,
        scope,
        animationOptions,
        isExiting,
        isFirstRender: isFirstRender.current,
        animationProps
      }), console.groupEnd()), {
        // we never change this, after first render on
        style: firstRenderStyle,
        ref: scope,
        tag: "div"
      };
    }, "useAnimations"),
    useAnimatedNumber(initial) {
      const motionValue2 = useMotionValue(initial);
      return import_react10.default.useMemo(() => ({
        getInstance() {
          return motionValue2;
        },
        getValue() {
          return motionValue2.get();
        },
        setValue(next, config2 = {
          type: "spring"
        }, onFinish) {
          if (config2.type === "direct") MotionValueStrategy.set(motionValue2, {
            type: "direct"
          }), motionValue2.set(next), onFinish?.();
          else {
            if (MotionValueStrategy.set(motionValue2, config2), onFinish) {
              const unsubscribe = motionValue2.on("change", (value) => {
                Math.abs(value - next) < 0.01 && (unsubscribe(), onFinish());
              });
            }
            motionValue2.set(next);
          }
        },
        stop() {
          motionValue2.stop();
        }
      }), [motionValue2]);
    },
    useAnimatedNumberReaction({
      value
    }, onValue) {
      const instance = value.getInstance();
      useMotionValueEvent(instance, "change", onValue);
    },
    useAnimatedNumberStyle(val, getStyleProp) {
      const motionValue2 = val.getInstance(), getStyleRef = (0, import_react10.useRef)(getStyleProp);
      return getStyleRef.current = getStyleProp, (0, import_react10.useMemo)(() => ({
        getStyle: /* @__PURE__ */ __name((cur) => getStyleRef.current(cur), "getStyle"),
        motionValue: motionValue2
      }), []);
    }
  };
  function getMotionAnimatedProps(props, style, disable) {
    if (disable) return {
      dontAnimate: style
    };
    const animationOptions = animationPropToAnimationConfig(props.animation);
    let dontAnimate, doAnimate;
    const animateOnly = props.animateOnly;
    for (const key in style) {
      const value = style[key];
      disableAnimationProps.has(key) || animateOnly && !animateOnly.includes(key) ? (dontAnimate ||= {}, dontAnimate[key] = value) : (doAnimate ||= {}, doAnimate[key] = value);
    }
    return {
      dontAnimate,
      doAnimate,
      animationOptions
    };
  }
  __name(getMotionAnimatedProps, "getMotionAnimatedProps");
  function animationPropToAnimationConfig(animationProp) {
    let defaultAnimationKey = "", specificAnimations = {};
    if (typeof animationProp == "string" ? defaultAnimationKey = animationProp : Array.isArray(animationProp) && (typeof animationProp[0] == "string" ? (defaultAnimationKey = animationProp[0], specificAnimations = animationProp[1]) : specificAnimations = animationProp), !defaultAnimationKey) return {};
    const defaultConfig = animations2[defaultAnimationKey];
    return {
      default: defaultConfig,
      ...Object.fromEntries(Object.entries(specificAnimations).flatMap(([propName, animationNameOrConfig]) => typeof animationNameOrConfig == "string" ? [[propName, animations2[animationNameOrConfig]]] : animationNameOrConfig && typeof animationNameOrConfig == "object" ? [[propName, {
        ...defaultConfig,
        ...animationNameOrConfig
      }]] : []))
    };
  }
  __name(animationPropToAnimationConfig, "animationPropToAnimationConfig");
}
__name(createAnimations, "createAnimations");
function removeRemovedStyles(prev, next, node) {
  for (const key in prev) key in next || (node.style[key] = "");
}
__name(removeRemovedStyles, "removeRemovedStyles");
var disableAnimationProps = /* @__PURE__ */ new Set(["alignContent", "alignItems", "aspectRatio", "backdropFilter", "boxSizing", "contain", "containerType", "display", "flexBasis", "flexDirection", "flexGrow", "flexShrink", "fontFamily", "justifyContent", "marginBottom", "marginLeft", "marginRight", "marginTop", "maxHeight", "maxWidth", "minHeight", "minWidth", "overflow", "overflowX", "overflowY", "pointerEvents", "position", "textWrap", "transformOrigin", "userSelect", "WebkitBackdropFilter", "zIndex"]);
var MotionView = createMotionView("div");
var MotionText = createMotionView("span");
function createMotionView(defaultTag) {
  const isText = defaultTag === "span", Component = (0, import_react10.forwardRef)((propsIn, ref) => {
    const {
      forwardedRef,
      animation,
      tag = defaultTag,
      style,
      ...propsRest
    } = propsIn, [scope, animate2] = useAnimate(), hostRef = (0, import_react10.useRef)(null), composedRefs = (0, import_core3.useComposedRefs)(forwardedRef, ref, hostRef, scope), stateRef = (0, import_react10.useRef)(null);
    stateRef.current || (stateRef.current = {
      get host() {
        return hostRef.current;
      }
    });
    const [_, state] = (0, import_core3.useThemeWithState)({}), styles = Array.isArray(style) ? style : [style], [animatedStyle, nonAnimatedStyles] = [styles.find((x) => x.getStyle), styles.filter((x) => !x.getStyle)];
    function getProps(props2) {
      const out = (0, import_core3.getSplitStyles)(props2, isText ? import_core3.Text.staticConfig : import_core3.View.staticConfig, state?.theme, state?.name, {
        unmounted: false
      }, {
        isAnimated: false,
        noClass: true,
        // noMergeStyle: true,
        resolveValues: "auto"
      });
      return out ? (out.viewProps.style && ((0, import_core3.fixStyles)(out.viewProps.style), (0, import_core3.styleToCSS)(out.viewProps.style)), out.viewProps) : {};
    }
    __name(getProps, "getProps");
    const props = getProps({
      ...propsRest,
      style: nonAnimatedStyles
    }), Element2 = tag || "div", transformedProps = import_core3.hooks.usePropsTransform?.(tag, props, stateRef, false);
    return (0, import_react10.useEffect)(() => {
      if (animatedStyle) return animatedStyle.motionValue.on("change", (value) => {
        const nextStyle = animatedStyle.getStyle(value), animationConfig2 = MotionValueStrategy.get(animatedStyle.motionValue), node = hostRef.current, webStyle = getProps({
          style: nextStyle
        }).style;
        if (webStyle && node instanceof HTMLElement) {
          const motionAnimationConfig = animationConfig2?.type === "timing" ? {
            type: "tween",
            duration: (animationConfig2?.duration || 0) / 1e3
          } : animationConfig2?.type === "direct" ? {
            type: "tween",
            duration: 0
          } : {
            type: "spring",
            ...animationConfig2
          };
          animate2(node, webStyle, motionAnimationConfig);
        }
      });
    }, [animatedStyle]), /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Element2, {
      ...transformedProps,
      ref: composedRefs
    });
  });
  return Component.acceptTagProp = true, Component;
}
__name(createMotionView, "createMotionView");
function getDiff(previous, next) {
  if (!previous) return next;
  let diff = null;
  for (const key in next) next[key] !== previous[key] && (diff ||= {}, diff[key] = next[key]);
  return diff;
}
__name(getDiff, "getDiff");

// ../../node_modules/.bun/@tamagui+animations-moti@1.144.4+3ffa5dafa4909e2a/node_modules/@tamagui/animations-moti/dist/esm/createAnimations.mjs
var import_core4 = require("@tamagui/core");

// ../../node_modules/.bun/moti@0.30.0+3ffa5dafa4909e2a/node_modules/moti/build/core/use-motify.js
var import_react11 = require("react");
var import_react_native_reanimated = require("react-native-reanimated");

// ../../node_modules/.bun/moti@0.30.0+3ffa5dafa4909e2a/node_modules/moti/build/core/constants/package-name.js
var PackageName = "moti";

// ../../node_modules/.bun/moti@0.30.0+3ffa5dafa4909e2a/node_modules/moti/build/core/use-motify.js
var debug = /* @__PURE__ */ __name((...args) => {
  "worklet";
  if (!global.shouldDebugMoti) {
    return;
  }
  if (args) {
  }
  console.log("[moti]", ...args);
}, "debug");
var isColor = /* @__PURE__ */ __name((styleKey) => {
  "worklet";
  const keys = {
    backgroundColor: true,
    borderBottomColor: true,
    borderLeftColor: true,
    borderRightColor: true,
    borderTopColor: true,
    color: true,
    shadowColor: true,
    borderColor: true,
    borderEndColor: true,
    borderStartColor: true
  };
  return Boolean(keys[styleKey]);
}, "isColor");
var isTransform = /* @__PURE__ */ __name((styleKey) => {
  "worklet";
  const transforms = {
    perspective: true,
    rotate: true,
    rotateX: true,
    rotateY: true,
    rotateZ: true,
    scale: true,
    scaleX: true,
    scaleY: true,
    translateX: true,
    translateY: true,
    skewX: true,
    skewY: true
  };
  return Boolean(transforms[styleKey]);
}, "isTransform");
function animationDelay(_key, transition, defaultDelay) {
  "worklet";
  const key = _key;
  let delayMs = defaultDelay;
  if (transition?.[key]?.delay != null) {
    delayMs = transition?.[key]?.delay;
  } else if (transition?.delay != null) {
    delayMs = transition.delay;
  }
  return {
    delayMs
  };
}
__name(animationDelay, "animationDelay");
var withSpringConfigKeys = [
  "stiffness",
  "overshootClamping",
  "restDisplacementThreshold",
  "restSpeedThreshold",
  "velocity",
  "reduceMotion",
  "mass",
  "damping",
  "duration",
  "dampingRatio"
];
function animationConfig(styleProp, transition) {
  "worklet";
  const key = styleProp;
  let repeatCount = 0;
  let repeatReverse = true;
  let animationType = "spring";
  if (isColor(key) || key === "opacity")
    animationType = "timing";
  const styleSpecificTransition = transition?.[key];
  if (styleSpecificTransition?.type) {
    animationType = styleSpecificTransition.type;
  } else if (transition?.type) {
    animationType = transition.type;
  }
  const loop = styleSpecificTransition?.loop ?? transition?.loop;
  if (loop != null) {
    repeatCount = loop ? -1 : 0;
  }
  if (styleSpecificTransition?.repeat != null) {
    repeatCount = styleSpecificTransition?.repeat;
  } else if (transition?.repeat != null) {
    repeatCount = transition.repeat;
  }
  if (styleSpecificTransition?.repeatReverse != null) {
    repeatReverse = styleSpecificTransition.repeatReverse;
  } else if (transition?.repeatReverse != null) {
    repeatReverse = transition.repeatReverse;
  }
  let config2 = {};
  let reduceMotion = import_react_native_reanimated.ReduceMotion.System;
  let animation = /* @__PURE__ */ __name((...props) => props, "animation");
  if (animationType === "timing") {
    const duration = transition?.[key]?.duration ?? transition?.duration;
    const easing = transition?.[key]?.easing ?? transition?.easing;
    const timingReduceMotion = transition?.[key]?.reduceMotion ?? transition?.reduceMotion;
    if (easing) {
      config2["easing"] = easing;
    }
    if (duration != null) {
      config2["duration"] = duration;
    }
    if (reduceMotion) {
      reduceMotion = timingReduceMotion ?? reduceMotion;
      config2["reduceMotion"] = reduceMotion;
    }
    animation = import_react_native_reanimated.withTiming;
  } else if (animationType === "spring") {
    animation = import_react_native_reanimated.withSpring;
    config2 = {};
    for (const configKey of withSpringConfigKeys) {
      const styleSpecificConfig = transition?.[key]?.[configKey];
      const transitionConfigForKey = transition?.[configKey];
      if (configKey === "reduceMotion") {
        reduceMotion = transitionConfigForKey || styleSpecificConfig;
      }
      if (styleSpecificConfig != null) {
        config2[configKey] = styleSpecificConfig;
      } else if (transitionConfigForKey != null) {
        config2[configKey] = transitionConfigForKey;
      }
    }
  } else if (animationType === "decay") {
    animation = import_react_native_reanimated.withDecay;
    config2 = {};
    const configKeys = [
      "clamp",
      "velocity",
      "deceleration",
      "velocityFactor",
      "reduceMotion",
      "velocityFactor"
    ];
    for (const configKey of configKeys) {
      const styleSpecificConfig = transition?.[key]?.[configKey];
      const transitionConfigForKey = transition?.[configKey];
      if (configKey === "reduceMotion") {
        reduceMotion = transitionConfigForKey || styleSpecificConfig;
      }
      if (styleSpecificConfig != null) {
        config2[configKey] = styleSpecificConfig;
      } else if (transitionConfigForKey != null) {
        config2[configKey] = transitionConfigForKey;
      }
    }
  } else if (animationType === "no-animation") {
    animation = /* @__PURE__ */ __name((value) => value, "animation");
    config2 = {};
    repeatCount = 0;
  }
  return {
    animation,
    config: config2,
    reduceMotion,
    repeatReverse,
    repeatCount,
    shouldRepeat: !!repeatCount
  };
}
__name(animationConfig, "animationConfig");
var getSequenceArray = /* @__PURE__ */ __name((sequenceKey, sequenceArray, delayMs, config2, animation, callback) => {
  "worklet";
  const sequence = [];
  for (const step of sequenceArray) {
    const shouldPush = typeof step === "object" ? step && step?.value != null && step?.value !== false : step != null && step !== false;
    let stepOnDidAnimate;
    if (shouldPush) {
      let stepDelay = delayMs;
      let stepValue = step;
      let stepReduceMotion = import_react_native_reanimated.ReduceMotion.System;
      let stepConfig = Object.assign({}, config2);
      let stepAnimation = animation;
      if (typeof step === "object") {
        const stepTransition = Object.assign({}, step);
        delete stepTransition.delay;
        delete stepTransition.value;
        const { config: inlineStepConfig, animation: animation2, reduceMotion } = animationConfig(sequenceKey, stepTransition);
        stepConfig = Object.assign({}, stepConfig, inlineStepConfig);
        stepAnimation = animation2;
        stepReduceMotion = reduceMotion;
        if (step.delay != null) {
          stepDelay = step.delay;
        }
        stepValue = step.value;
        stepOnDidAnimate = step.onDidAnimate;
      }
      const sequenceValue = stepAnimation(stepValue, stepConfig, (completed = false, maybeValue) => {
        "worklet";
        callback(completed, maybeValue, {
          attemptedSequenceValue: stepValue
        });
        if (stepOnDidAnimate) {
          (0, import_react_native_reanimated.runOnJS)(stepOnDidAnimate)(completed, maybeValue, {
            attemptedSequenceItemValue: stepValue,
            attemptedSequenceArray: maybeValue
          });
        }
      });
      if (stepDelay != null) {
        sequence.push((0, import_react_native_reanimated.withDelay)(stepDelay, sequenceValue, stepReduceMotion));
      } else {
        sequence.push(sequenceValue);
      }
    }
  }
  return sequence;
}, "getSequenceArray");
function useMotify({ animate: animateProp, from: fromProp = false, transition: transitionProp, exitTransition: exitTransitionProp, delay: defaultDelay, state, stylePriority = "animate", onDidAnimate, exit: exitProp, animateInitialState = false, usePresenceValue, presenceContext }) {
  const isMounted = (0, import_react_native_reanimated.useSharedValue)(false);
  const [isPresent2, safeToUnmount] = usePresenceValue ?? [];
  const disableInitialAnimation = presenceContext?.initial === false && !animateInitialState;
  const { custom, reanimatedSafeToUnmount, reanimatedOnDidAnimate } = (0, import_react11.useMemo)(() => ({
    custom: /* @__PURE__ */ __name(() => {
      "worklet";
      return presenceContext?.custom;
    }, "custom"),
    reanimatedSafeToUnmount: /* @__PURE__ */ __name(() => {
      safeToUnmount?.();
    }, "reanimatedSafeToUnmount"),
    reanimatedOnDidAnimate: /* @__PURE__ */ __name((...args) => {
      onDidAnimate?.(...args);
    }, "reanimatedOnDidAnimate")
  }), [onDidAnimate, presenceContext, safeToUnmount]);
  const hasExitStyle = Boolean(typeof exitProp === "function" || typeof exitProp === "object" && exitProp && Object.keys(exitProp).length > 0);
  const style = (0, import_react_native_reanimated.useAnimatedStyle)(() => {
    const final = {
      // initializing here fixes reanimated object.__defineProperty bug(?)
      transform: []
    };
    const variantStyle = state?.__state?.value || {};
    let animateStyle;
    if (animateProp && "value" in animateProp) {
      animateStyle = animateProp.value || {};
    } else {
      animateStyle = animateProp || {};
    }
    debug("style", animateStyle);
    const initialStyle = fromProp || {};
    let exitStyle = exitProp || {};
    if (typeof exitStyle === "function") {
      exitStyle = exitStyle(custom());
    }
    const isExiting = !isPresent2 && hasExitStyle;
    let mergedStyles = {};
    if (stylePriority === "state") {
      mergedStyles = Object.assign({}, animateStyle, variantStyle);
    } else {
      mergedStyles = Object.assign({}, variantStyle, animateStyle);
    }
    if (!isMounted.value && !disableInitialAnimation && Object.keys(initialStyle).length) {
      mergedStyles = initialStyle;
    } else {
      mergedStyles = Object.assign({}, initialStyle, mergedStyles);
    }
    if (isExiting && exitStyle) {
      mergedStyles = Object.assign({}, exitStyle);
    }
    const exitingStyleProps = {};
    const disabledExitStyles = /* @__PURE__ */ new Set([
      "position",
      "zIndex",
      "borderTopStyle",
      "borderBottomStyle",
      "borderLeftStyle",
      "borderRightStyle",
      "borderStyle",
      "pointerEvents",
      "outline"
    ]);
    Object.keys(exitStyle || {}).forEach((key) => {
      if (!disabledExitStyles.has(key)) {
        exitingStyleProps[key] = true;
      }
    });
    let transition;
    if (transitionProp && "value" in transitionProp) {
      transition = transitionProp.value;
    } else {
      transition = transitionProp;
    }
    if (variantStyle.transition) {
      transition = Object.assign({}, transition, variantStyle.transition);
    }
    if (isExiting && exitTransitionProp) {
      let exitTransition;
      if (exitTransitionProp && "value" in exitTransitionProp) {
        exitTransition = exitTransitionProp.value;
      } else if (typeof exitTransitionProp == "function") {
        exitTransition = exitTransitionProp(custom());
      } else {
        exitTransition = exitTransitionProp;
      }
      transition = Object.assign({}, transition, exitTransition);
    }
    Object.keys(mergedStyles).forEach((key) => {
      let value = mergedStyles[key];
      let inlineOnDidAnimate;
      if (typeof value === "object" && value && "onDidAnimate" in value) {
        inlineOnDidAnimate = value.onDidAnimate;
        value = value.value;
      }
      const { animation, config: config2, reduceMotion, shouldRepeat, repeatCount, repeatReverse } = animationConfig(key, transition);
      const callback = /* @__PURE__ */ __name((completed = false, recentValue, info) => {
        if (onDidAnimate) {
          (0, import_react_native_reanimated.runOnJS)(reanimatedOnDidAnimate)(key, completed, recentValue, {
            attemptedValue: value,
            attemptedSequenceItemValue: info?.attemptedSequenceValue
          });
        }
        if (inlineOnDidAnimate) {
          (0, import_react_native_reanimated.runOnJS)(inlineOnDidAnimate)(completed, recentValue, {
            attemptedValue: value
          });
        }
        if (isExiting) {
          exitingStyleProps[key] = false;
          const areStylesExiting = Object.values(exitingStyleProps).some(Boolean);
          if (!areStylesExiting) {
            (0, import_react_native_reanimated.runOnJS)(reanimatedSafeToUnmount)();
          }
        }
      }, "callback");
      let { delayMs } = animationDelay(key, transition, defaultDelay);
      if (value == null || value === false) {
        return;
      }
      if (key === "transform") {
        if (!Array.isArray(value)) {
          console.error(`[${PackageName}]: Invalid transform value. Needs to be an array.`);
        } else {
          value.forEach((transformObject) => {
            final["transform"] = final["transform"] || [];
            const transformKey = Object.keys(transformObject)[0];
            const transformValue = transformObject[transformKey];
            const transform = {};
            if (Array.isArray(transformValue)) {
              const sequence = getSequenceArray(transformKey, transformValue, delayMs, config2, animation, callback);
              if (sequence.length) {
                let finalValue = (0, import_react_native_reanimated.withSequence)(sequence[0], ...sequence.slice(1));
                if (shouldRepeat) {
                  finalValue = (0, import_react_native_reanimated.withRepeat)(finalValue, repeatCount, repeatReverse, callback, reduceMotion);
                }
                transform[transformKey] = finalValue;
              }
            } else {
              if (transition?.[transformKey]?.delay != null) {
                delayMs = transition?.[transformKey]?.delay;
              }
              let configKey = transformKey;
              if (transition && "transform" in transition && !(configKey in transition)) {
                configKey = "transform";
              }
              const { animation: animation2, config: config3, shouldRepeat: shouldRepeat2, repeatCount: repeatCount2, repeatReverse: repeatReverse2 } = animationConfig(configKey, transition);
              let finalValue = animation2(transformValue, config3, callback);
              if (shouldRepeat2) {
                finalValue = (0, import_react_native_reanimated.withRepeat)(finalValue, repeatCount2, repeatReverse2, void 0, reduceMotion);
              }
              if (delayMs != null) {
                transform[transformKey] = (0, import_react_native_reanimated.withDelay)(delayMs, finalValue, reduceMotion);
              } else {
                transform[transformKey] = finalValue;
              }
            }
            if (Object.keys(transform).length && Array.isArray(final["transform"])) {
              final["transform"].push(transform);
            }
          });
        }
      } else if (Array.isArray(value)) {
        const sequence = getSequenceArray(key, value, delayMs, config2, animation, callback);
        let finalValue = (0, import_react_native_reanimated.withSequence)(...sequence);
        if (shouldRepeat) {
          finalValue = (0, import_react_native_reanimated.withRepeat)(finalValue, repeatCount, repeatReverse, void 0, reduceMotion);
        }
        if (isTransform(key)) {
          final["transform"] = final["transform"] || [];
          if (sequence.length) {
            const transform = {};
            transform[key] = finalValue;
            final["transform"].push(transform);
          }
        } else {
          if (sequence.length) {
            final[key] = finalValue;
          }
        }
      } else if (isTransform(key)) {
        final["transform"] = final["transform"] || [];
        if (transition?.[key]?.delay != null) {
          delayMs = transition?.[key]?.delay;
        }
        const transform = {};
        let finalValue = animation(value, config2, callback);
        if (shouldRepeat) {
          finalValue = (0, import_react_native_reanimated.withRepeat)(finalValue, repeatCount, repeatReverse, void 0, reduceMotion);
        }
        if (delayMs != null) {
          transform[key] = (0, import_react_native_reanimated.withDelay)(delayMs, finalValue, reduceMotion);
        } else {
          transform[key] = finalValue;
        }
        final["transform"].push(transform);
      } else if (typeof value === "object") {
        final[key] = {};
        for (const innerStyleKey in value || {}) {
          let finalValue = animation(value, config2, callback);
          if (shouldRepeat) {
            finalValue = (0, import_react_native_reanimated.withRepeat)(finalValue, repeatCount, repeatReverse, void 0, reduceMotion);
          }
          if (delayMs != null) {
            final[key][innerStyleKey] = (0, import_react_native_reanimated.withDelay)(delayMs, finalValue, reduceMotion);
          } else {
            final[key][innerStyleKey] = finalValue;
          }
        }
      } else {
        let finalValue = animation(value, config2, callback);
        if (shouldRepeat) {
          finalValue = (0, import_react_native_reanimated.withRepeat)(finalValue, repeatCount, repeatReverse, void 0, reduceMotion);
        }
        if (delayMs != null && typeof delayMs === "number") {
          final[key] = (0, import_react_native_reanimated.withDelay)(delayMs, finalValue, reduceMotion);
        } else {
          final[key] = finalValue;
        }
      }
    });
    if (!final.transform?.length) {
      delete final.transform;
    }
    return final;
  }, [
    animateProp,
    custom,
    defaultDelay,
    disableInitialAnimation,
    exitProp,
    exitTransitionProp,
    fromProp,
    hasExitStyle,
    isMounted,
    isPresent2,
    onDidAnimate,
    reanimatedOnDidAnimate,
    reanimatedSafeToUnmount,
    state,
    stylePriority,
    transitionProp
  ]);
  (0, import_react11.useEffect)(/* @__PURE__ */ __name(function allowUnMountIfMissingExit() {
    if (fromProp && isMounted.value === false) {
      isMounted.value = true;
    }
    if (!isPresent2 && !hasExitStyle) {
      reanimatedSafeToUnmount();
    }
  }, "allowUnMountIfMissingExit"), [hasExitStyle, isPresent2, reanimatedSafeToUnmount]);
  return {
    style
  };
}
__name(useMotify, "useMotify");

// ../../node_modules/.bun/@tamagui+animations-moti@1.144.4+3ffa5dafa4909e2a/node_modules/@tamagui/animations-moti/dist/esm/createAnimations.mjs
var import_react12 = __toESM(require("react"), 1);
var import_react_native_reanimated2 = __toESM(require("react-native-reanimated"), 1);
var import_jsx_runtime3 = require("react/jsx-runtime");
var safeESModule = /* @__PURE__ */ __name((a) => {
  const b = a;
  return (b.__esModule || b[Symbol.toStringTag] === "Module" ? b.default : b) || a;
}, "safeESModule");
var Animated = safeESModule(import_react_native_reanimated2.default);
function createTamaguiAnimatedComponent(defaultTag = "div") {
  const isText = defaultTag === "span", Component = Animated.createAnimatedComponent((0, import_react12.forwardRef)((propsIn, ref) => {
    const {
      forwardedRef,
      animation,
      tag = defaultTag,
      ...propsRest
    } = propsIn, hostRef = (0, import_react12.useRef)(null), composedRefs = (0, import_core4.useComposedRefs)(forwardedRef, ref, hostRef), stateRef = (0, import_react12.useRef)(null);
    stateRef.current || (stateRef.current = {
      get host() {
        return hostRef.current;
      }
    });
    const [_, state] = (0, import_core4.useThemeWithState)({}), props = (0, import_core4.getSplitStyles)(propsRest, isText ? import_core4.Text.staticConfig : import_core4.View.staticConfig, state?.theme, state?.name, {
      unmounted: false
    }, {
      isAnimated: false,
      noClass: true
    })?.viewProps || {}, Element2 = tag, transformedProps = import_core4.hooks.usePropsTransform?.(tag, props, stateRef, false);
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Element2, {
      ...transformedProps,
      ref: composedRefs
    });
  }));
  return Component.acceptTagProp = true, Component;
}
__name(createTamaguiAnimatedComponent, "createTamaguiAnimatedComponent");
var AnimatedView = createTamaguiAnimatedComponent("div");
var AnimatedText = createTamaguiAnimatedComponent("span");
var onlyAnimateKeys = {
  transform: true,
  opacity: true,
  height: true,
  width: true,
  backgroundColor: true,
  borderColor: true,
  borderLeftColor: true,
  borderRightColor: true,
  borderTopColor: true,
  borderBottomColor: true,
  borderRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderTopWidth: true,
  borderBottomWidth: true,
  color: true,
  left: true,
  right: true,
  top: true,
  bottom: true,
  fontSize: true,
  fontWeight: true,
  lineHeight: true,
  letterSpacing: true
};
function createAnimations2(animations2) {
  return {
    View: import_core4.isWeb ? AnimatedView : Animated.View,
    Text: import_core4.isWeb ? AnimatedText : Animated.Text,
    // View: Animated.View,
    // Text: Animated.Text,
    isReactNative: true,
    supportsCSS: false,
    animations: animations2,
    usePresence,
    ResetPresence,
    useAnimatedNumber(initial) {
      const sharedValue = (0, import_react_native_reanimated2.useSharedValue)(initial);
      return import_react12.default.useMemo(() => ({
        getInstance() {
          "worklet";
          return sharedValue;
        },
        getValue() {
          "worklet";
          return sharedValue.value;
        },
        setValue(next, config2 = {
          type: "spring"
        }, onFinish) {
          "worklet";
          config2.type === "direct" ? (sharedValue.value = next, onFinish?.()) : config2.type === "spring" ? sharedValue.value = (0, import_react_native_reanimated2.withSpring)(next, config2, onFinish ? () => {
            "worklet";
            (0, import_react_native_reanimated2.runOnJS)(onFinish)();
          } : void 0) : sharedValue.value = (0, import_react_native_reanimated2.withTiming)(next, config2, onFinish ? () => {
            "worklet";
            (0, import_react_native_reanimated2.runOnJS)(onFinish)();
          } : void 0);
        },
        stop() {
          "worklet";
          (0, import_react_native_reanimated2.cancelAnimation)(sharedValue);
        }
      }), [sharedValue]);
    },
    useAnimatedNumberReaction({
      value
    }, onValue) {
      const instance = value.getInstance();
      return (0, import_react_native_reanimated2.useAnimatedReaction)(
        () => instance.value,
        (next, prev) => {
          prev !== next && (0, import_react_native_reanimated2.runOnJS)(onValue)(next);
        },
        // dependency array is very important here
        [onValue, instance]
      );
    },
    /**
     * `getStyle` must be a worklet
     */
    useAnimatedNumberStyle(val, getStyle) {
      const instance = val.getInstance(), derivedValue = (0, import_react_native_reanimated2.useDerivedValue)(() => instance.value, [instance, getStyle]);
      return (0, import_react_native_reanimated2.useAnimatedStyle)(() => getStyle(derivedValue.value), [val, getStyle, derivedValue, instance]);
    },
    useAnimations: /* @__PURE__ */ __name((animationProps) => {
      const {
        props,
        presence,
        style,
        componentState
      } = animationProps, animationKey = Array.isArray(props.animation) ? props.animation[0] : props.animation, isHydrating = componentState.unmounted === true, disableAnimation = isHydrating || !animationKey, presenceContext = import_react12.default.useContext(PresenceContext), {
        dontAnimate,
        motiProps
      } = (0, import_react12.useMemo)(() => {
        let animate2 = {}, dontAnimate2 = {};
        if (disableAnimation) dontAnimate2 = style;
        else {
          const animateOnly = props.animateOnly;
          for (const key in style) {
            const value = style[key];
            !onlyAnimateKeys[key] || value === "auto" || typeof value == "string" && value.startsWith("calc") || animateOnly && !animateOnly.includes(key) ? dontAnimate2[key] = value : animate2[key] = value;
          }
        }
        componentState.unmounted === "should-enter" && (dontAnimate2 = style);
        const styles = animate2, isExiting = !!presence?.[1], usePresenceValue = presence || void 0;
        let transition = isHydrating ? {
          type: "transition",
          duration: 0
        } : animations2[animationKey], hasClonedTransition = false;
        if (Array.isArray(props.animation)) {
          const config2 = props.animation[1];
          if (config2 && typeof config2 == "object") for (const key in config2) {
            const val = config2[key];
            hasClonedTransition || (transition = Object.assign({}, transition), hasClonedTransition = true), typeof val == "string" ? transition[key] = animations2[val] : transition[key] = val;
          }
        }
        return {
          dontAnimate: dontAnimate2,
          motiProps: {
            animate: isExiting || componentState.unmounted === true ? {} : styles,
            transition: componentState.unmounted ? {
              duration: 0
            } : transition,
            usePresenceValue,
            presenceContext,
            exit: isExiting ? styles : void 0
          }
        };
      }, [presenceContext, presence, animationKey, componentState.unmounted, JSON.stringify(style), presenceContext]), moti = useMotify(motiProps);
      return process.env.NODE_ENV === "development" && props.debug && props.debug !== "profile" && console.info("useMotify(", JSON.stringify(motiProps, null, 2) + ")", {
        "componentState.unmounted": componentState.unmounted,
        animationProps,
        motiProps,
        moti,
        style: [dontAnimate, moti.style]
      }), {
        style: [dontAnimate, moti.style]
      };
    }, "useAnimations")
  };
}
__name(createAnimations2, "createAnimations");

// src/theme/animations.ts
var animationConfigs = {
  // Quick transitions for micro-interactions
  fast: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250
  },
  // Standard transitions for most UI animations
  medium: {
    type: "spring",
    damping: 15,
    mass: 1,
    stiffness: 200
  },
  // Slow, pronounced animations for emphasis
  slow: {
    type: "spring",
    damping: 12,
    mass: 1.2,
    stiffness: 150
  },
  // Bouncy animation for playful interactions
  bouncy: {
    type: "spring",
    damping: 8,
    mass: 1.2,
    stiffness: 400
  },
  // Smooth, gentle animations for modals/sheets
  smooth: {
    type: "spring",
    damping: 25,
    mass: 1,
    stiffness: 120
  },
  // Quick fade for overlays and backdrops
  fade: {
    type: "timing",
    duration: 200
  },
  // Scale animation for pop-in effects
  scale: {
    type: "spring",
    damping: 18,
    mass: 0.8,
    stiffness: 300
  }
};
var motionAnimations = createAnimations(animationConfigs);
var motiAnimations = createAnimations2(animationConfigs);
var animations = import_core2.isWeb ? motionAnimations : motiAnimations;
var animationPresets = {
  fast: animationConfigs.fast,
  medium: animationConfigs.medium,
  slow: animationConfigs.slow,
  bouncy: animationConfigs.bouncy,
  smooth: animationConfigs.smooth,
  fade: animationConfigs.fade,
  scale: animationConfigs.scale
};

// tamagui.config.ts
var config = createTamagui({
  // Design tokens (colors, spacing, sizing, z-index)
  tokens: {
    color: colorTokens,
    space: tokens.space,
    size: tokens.size,
    radius: tokens.radius,
    zIndex: tokens.zIndex,
    lineHeight: tokens.lineHeight,
    letterSpacing: tokens.letterSpacing
  },
  // Theme definitions (light, dark, and variants)
  themes: allThemes,
  // Font definitions (Space Grotesk for headings, Inter for body)
  fonts,
  // Animation configurations for transitions and effects
  animations,
  // Media query breakpoints for responsive design
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    gtXl: { minWidth: 1420 + 1 },
    gtXxl: { minWidth: 1600 + 1 }
  },
  // Shorthands for common style properties
  // These allow writing `px` instead of `paddingHorizontal`
  shorthands: {
    // Padding
    px: "paddingHorizontal",
    py: "paddingVertical",
    pt: "paddingTop",
    pr: "paddingRight",
    pb: "paddingBottom",
    pl: "paddingLeft",
    p: "padding",
    // Margin
    mx: "marginHorizontal",
    my: "marginVertical",
    mt: "marginTop",
    mr: "marginRight",
    mb: "marginBottom",
    ml: "marginLeft",
    m: "margin",
    // Border
    bw: "borderWidth",
    bc: "borderColor",
    br: "borderRadius",
    // Size
    w: "width",
    h: "height",
    minW: "minWidth",
    minH: "minHeight",
    maxW: "maxWidth",
    maxH: "maxHeight",
    // Flex
    fd: "flexDirection",
    jc: "justifyContent",
    ai: "alignItems",
    ac: "alignContent",
    fw: "flexWrap",
    // Other
    bg: "backgroundColor",
    c: "color",
    fs: "fontSize",
    ff: "fontFamily",
    fwght: "fontWeight",
    ls: "letterSpacing",
    lh: "lineHeight",
    ta: "textAlign",
    pe: "pointerEvents",
    ov: "overflow",
    op: "opacity",
    z: "zIndex"
  },
  // Settings for SSR and animation
  settings: {
    // Allow CSS variables for themes (better SSR support)
    allowedStyleValues: "somewhat-strict-web",
    // Enable autocompletion for specific values
    autocompleteSpecificTokens: "except-special",
    // Disable root theme class for SSR safety
    disableRootThemeClass: false,
    // Default theme to use
    defaultTheme: "light"
  }
});
var tamagui_config_default = config;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config
});
