/**
 * Spinner Component - Tier 1 Primitive
 *
 * A loading indicator component that renders consistently across web and native.
 * Built on top of Tamagui's Spinner primitive with theme-aware coloring.
 *
 * @example
 * ```tsx
 * // Basic usage - defaults to medium size with primary color
 * <Spinner />
 *
 * // Small size (16px)
 * <Spinner size="small" />
 *
 * // Large size (32px)
 * <Spinner size="large" />
 *
 * // Custom theme color
 * <Spinner color="$primary" />
 *
 * // Different status colors
 * <Spinner color="$success" />
 * <Spinner color="$warning" />
 * <Spinner color="$danger" />
 * ```
 *
 * @see https://tamagui.dev/docs/components/spinner
 */

import { Spinner as TamaguiSpinner } from "tamagui";
import type { SpinnerProps as TamaguiSpinnerProps } from "tamagui";

/**
 * Spinner size values mapped to platform-native sizes
 * - "small": 16px (compact indicators, buttons)
 * - "large": 32px (prominent loading states)
 * - undefined: Default platform size (typically 24px)
 */
export type SpinnerSize = "small" | "large";

/**
 * Theme-aware color tokens for the spinner
 * Uses $-prefixed notation for automatic theme resolution to CSS variables
 */
export type SpinnerColor =
  | "$primary" // Brand primary color (cyan/turquoise)
  | "$color" // Current theme text color
  | "$colorMuted" // Muted/secondary text color
  | "$colorTertiary" // Tertiary text color
  | "$success" // Success state color (green)
  | "$warning" // Warning state color (orange)
  | "$danger" // Danger/error state color (red)
  | "$background" // Background color (useful on dark surfaces)
  | "$white" // White color
  | (string & {}); // Allow any other string for flexibility

/**
 * Props for the Spinner component
 * Extends Tamagui's Spinner props with constrained theme-aware types
 */
export interface SpinnerProps extends Omit<
  TamaguiSpinnerProps,
  "size" | "color"
> {
  /**
   * Size of the spinner
   * - "small": 16px (compact indicators, buttons)
   * - "large": 32px (prominent loading states)
   * @default undefined (platform default ~24px)
   */
  size?: SpinnerSize;

  /**
   * Color of the spinner using theme tokens
   * Use $-prefixed tokens for automatic theme resolution
   * @default "$primary" - Brand primary color
   *
   * @example
   * ```tsx
   * <Spinner color="$primary" />  // Brand color
   * <Spinner color="$success" />  // Green
   * <Spinner color="$danger" />   // Red
   * <Spinner color="$background" /> // For dark buttons
   * ```
   */
  color?: SpinnerColor;
}

/**
 * Spinner component - Loading indicator
 *
 * Renders a platform-native activity indicator with theme-aware coloring:
 * - **Web**: CSS-based animated spinner (SVG)
 * - **Native**: Platform ActivityIndicator (iOS/Android native component)
 *
 * ## Features
 * - Automatic theme color resolution via $-prefixed tokens
 * - Three size options: small (16px), default (~24px), large (32px)
 * - Cross-platform rendering parity
 * - Accessible (screen readers announce "progress indicator")
 *
 * ## Usage Guidelines
 * - Use **small** for button loading states and compact UI
 * - Use **large** for full-screen loading and prominent states
 * - Use **default** for most inline loading scenarios
 *
 * @example
 * ```tsx
 * import { Spinner } from "@mirai-app/ui";
 *
 * // Button loading state
 * <Button disabled>
 *   <Spinner size="small" color="$background" />
 *   Loading...
 * </Button>
 *
 * // Full-screen loading
 * <YStack flex={1} justifyContent="center" alignItems="center">
 *   <Spinner size="large" color="$primary" />
 *   <Text>Loading...</Text>
 * </YStack>
 *
 * // Inline loading with status color
 * <XStack gap="$2" alignItems="center">
 *   <Spinner size="small" color="$success" />
 *   <Text color="$success">Saving complete</Text>
 * </XStack>
 * ```
 */
export const Spinner = TamaguiSpinner;

// Default export for convenience
export default Spinner;
