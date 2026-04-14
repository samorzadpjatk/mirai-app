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

// ../../node_modules/.bun/@tamagui+constants@1.144.4+eec6f78d6ddc94c6/node_modules/@tamagui/constants/dist/esm/constants.mjs
var import_react = __toESM(require("react"), 1);
var IS_REACT_19 = typeof import_react.default.use < "u";
var isWeb = true;
var isWindowDefined = typeof window < "u";
var isServer = isWeb && !isWindowDefined;
var isClient = isWeb && isWindowDefined;
var useIsomorphicLayoutEffect = isServer ? import_react.useEffect : import_react.useLayoutEffect;
var isChrome = typeof navigator < "u" && /Chrome/.test(navigator.userAgent || "");
var isWebTouchable = isClient && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
var isIos = process.env.TEST_NATIVE_PLATFORM === "ios";

// ../../node_modules/.bun/@tamagui+use-presence@1.144.4+71be497c31fe28c5/node_modules/@tamagui/use-presence/dist/esm/PresenceContext.mjs
var React2 = __toESM(require("react"), 1);
var import_jsx_runtime = require("react/jsx-runtime");
var PresenceContext = React2.createContext(null);
var ResetPresence = /* @__PURE__ */ __name((props) => {
  const parent = React2.useContext(PresenceContext);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PresenceContext.Provider, {
    value: props.disable ? parent : null,
    children: props.children
  });
}, "ResetPresence");

// ../../node_modules/.bun/@tamagui+use-presence@1.144.4+71be497c31fe28c5/node_modules/@tamagui/use-presence/dist/esm/usePresence.mjs
var React3 = __toESM(require("react"), 1);
function usePresence() {
  const context = React3.useContext(PresenceContext);
  if (!context) return [true, null, context];
  const {
    id,
    isPresent: isPresent2,
    onExitComplete,
    register
  } = context;
  return React3.useEffect(() => register(id), []), !isPresent2 && onExitComplete ? [false, () => onExitComplete?.(id), context] : [true, void 0, context];
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

// ../../node_modules/.bun/@tamagui+animations-css@1.144.4+71be497c31fe28c5/node_modules/@tamagui/animations-css/dist/esm/createAnimations.mjs
var import_web = require("@tamagui/core");
var import_react2 = __toESM(require("react"), 1);
function extractDuration(animation) {
  const msMatch = animation.match(/(\d+(?:\.\d+)?)\s*ms/);
  if (msMatch) return Number.parseInt(msMatch[1], 10);
  const sMatch = animation.match(/(\d+(?:\.\d+)?)\s*s/);
  return sMatch ? Math.round(Number.parseFloat(sMatch[1]) * 1e3) : 300;
}
__name(extractDuration, "extractDuration");
function createAnimations(animations2) {
  const reactionListeners = /* @__PURE__ */ new WeakMap();
  return {
    animations: animations2,
    usePresence,
    ResetPresence,
    supportsCSS: true,
    classNameAnimation: true,
    useAnimatedNumber(initial) {
      const [val, setVal] = import_react2.default.useState(initial), [onFinish, setOnFinish] = (0, import_react2.useState)();
      return useIsomorphicLayoutEffect(() => {
        onFinish && (onFinish?.(), setOnFinish(void 0));
      }, [onFinish]), {
        getInstance() {
          return setVal;
        },
        getValue() {
          return val;
        },
        setValue(next, config2, onFinish2) {
          setVal(next), setOnFinish(onFinish2);
        },
        stop() {
        }
      };
    },
    useAnimatedNumberReaction({
      value
    }, onValue) {
      import_react2.default.useEffect(() => {
        const instance = value.getInstance();
        let queue = reactionListeners.get(instance);
        if (!queue) {
          const next = /* @__PURE__ */ new Set();
          reactionListeners.set(instance, next), queue = next;
        }
        return queue.add(onValue), () => {
          queue?.delete(onValue);
        };
      }, []);
    },
    useAnimatedNumberStyle(val, getStyle) {
      return getStyle(val.getValue());
    },
    useAnimations: /* @__PURE__ */ __name(({
      props,
      presence,
      style,
      componentState,
      stateRef
    }) => {
      const isEntering = !!componentState.unmounted, isExiting = presence?.[0] === false, sendExitComplete = presence?.[1], [animationKey, animationConfig] = Array.isArray(props.animation) ? props.animation : [props.animation], animation = animations2[animationKey], keys = props.animateOnly ?? ["all"];
      return useIsomorphicLayoutEffect(() => {
        const host = stateRef.current.host;
        if (!sendExitComplete || !isExiting || !host) return;
        const node = host, fallbackTimeout = animation ? extractDuration(animation) : 200, timeoutId = setTimeout(() => {
          sendExitComplete?.();
        }, fallbackTimeout), onFinishAnimation = /* @__PURE__ */ __name(() => {
          clearTimeout(timeoutId), sendExitComplete?.();
        }, "onFinishAnimation");
        return node.addEventListener("transitionend", onFinishAnimation), node.addEventListener("transitioncancel", onFinishAnimation), () => {
          clearTimeout(timeoutId), node.removeEventListener("transitionend", onFinishAnimation), node.removeEventListener("transitioncancel", onFinishAnimation);
        };
      }, [sendExitComplete, isExiting]), animation && (Array.isArray(style.transform) && (style.transform = (0, import_web.transformsToString)(style.transform)), style.transition = keys.map((key) => {
        const override = animations2[animationConfig?.[key]] ?? animation;
        return `${key} ${override}`;
      }).join(", ")), process.env.NODE_ENV === "development" && props.debug === "verbose" && console.info("CSS animation", {
        props,
        animations: animations2,
        animation,
        animationKey,
        style,
        isEntering,
        isExiting
      }), animation ? {
        style,
        className: isEntering ? "t_unmounted" : ""
      } : null;
    }, "useAnimations")
  };
}
__name(createAnimations, "createAnimations");

// src/theme/animations.ts
var animations = createAnimations({
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
});

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
