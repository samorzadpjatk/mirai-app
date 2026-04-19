// Main barrel export for @mirai-app/ui
// Re-exports all Tamagui components and custom UI components

// Re-export Tamagui core primitives (excluding those we override)
export {
  // Base components
  View,
  Stack,
  XStack,
  YStack,
  ZStack,
  // Note: Button, Input, Card are exported from ./components below
  TextArea,
  Select,
  Sheet,
  Spinner,
  // Theming
  TamaguiProvider,
  Theme,
  createTheme,
  // Styling
  styled,
  // Utilities
  isWeb,
  isClient,
  useTheme,
  useMedia,
  getTokens,
  getThemes,
} from "tamagui";

// Export theme configuration
export { config } from "../tamagui.config";

// Export custom components (Phase 2: Tier 1 primitives)
// These override Tamagui's default components with our custom implementations
export * from "./components";

// Export theme tokens (colorTokens for native app compatibility)
export { colorTokens } from "./theme";

// Export hooks
// export * from "./hooks";

// Export utilities
// export * from "./utils";
