// Main barrel export for @mirai-app/ui
// Re-exports all Tamagui components and custom UI components

// Re-export Tamagui core primitives
export {
  // Base components (Text is exported from ./components with variants)
  View,
  Stack,
  XStack,
  YStack,
  ZStack,
  Button,
  Input,
  TextArea,
  Select,
  Sheet,
  Spinner,
  Card,
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
export * from "./components";

// Export theme tokens
// export * from "./theme";

// Export hooks
// export * from "./hooks";

// Export utilities
// export * from "./utils";
