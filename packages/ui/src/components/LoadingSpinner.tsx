/**
 * LoadingSpinner Component - Tier 1 Primitive
 *
 * A loading indicator component with optional label text.
 * Built on top of the Spinner component for consistent theming.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 *
 * // With label
 * <LoadingSpinner label="Loading trips..." />
 *
 * // Large size with custom label
 * <LoadingSpinner size="large" label="Loading..." />
 *
 * // Small size for inline loading
 * <LoadingSpinner size="small" />
 *
 * // Vertical layout
 * <LoadingSpinner label="Processing..." layout="vertical" />
 * ```
 */

import { YStack, XStack } from "tamagui";
import { Spinner } from "./Spinner";
import { Text } from "./Text";
import type { SpinnerSize, SpinnerColor } from "./Spinner";

/**
 * Props for the LoadingSpinner component
 */
export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * - "small": 16px (compact indicators)
   * - "medium": Default platform size (~24px)
   * - "large": 32px (prominent loading states)
   * @default "medium"
   */
  size?: SpinnerSize | "medium";

  /**
   * Color of the spinner using theme tokens
   * @default "$primary"
   */
  color?: SpinnerColor;

  /**
   * Optional label text displayed next to or below the spinner
   */
  label?: string;

  /**
   * Layout direction for spinner and label
   * - "horizontal": Spinner and label side by side (default)
   * - "vertical": Spinner above label
   * @default "horizontal"
   */
  layout?: "horizontal" | "vertical";

  /**
   * Whether to center the spinner within its container
   * @default false
   */
  centered?: boolean;
}

/**
 * LoadingSpinner component - Loading indicator with optional label
 *
 * Combines a Spinner with optional text label for clear loading state communication.
 * Supports both horizontal (side-by-side) and vertical (stacked) layouts.
 *
 * ## Features
 * - Optional label text
 * - Horizontal or vertical layout
 * - Centered or inline positioning
 * - Accessible (screen readers announce loading state)
 *
 * ## Usage Guidelines
 * - Use **horizontal** for inline loading in buttons/forms
 * - Use **vertical** for full-screen or modal loading states
 * - Use **centered** for page-level loading overlays
 * - Keep labels concise (e.g., "Loading...", "Saving...", "Processing...")
 *
 * @example
 * ```tsx
 * import { LoadingSpinner } from "@mirai-app/ui";
 *
 * // Inline loading
 * <LoadingSpinner label="Loading..." />
 *
 * // Page loading (centered, vertical)
 * <LoadingSpinner
 *   size="large"
 *   label="Loading trips..."
 *   layout="vertical"
 *   centered
 * />
 *
 * // Button loading state
 * <Button disabled>
 *   <LoadingSpinner size="small" color="white" />
 *   <Text>Processing...</Text>
 * </Button>
 *
 * // Full-screen overlay
 * <YStack
 *   flex={1}
 *   justifyContent="center"
 *   alignItems="center"
 *   backgroundColor="rgba(0,0,0,0.5)"
 * >
 *   <LoadingSpinner
 *     size="large"
 *     color="white"
 *     label="Loading..."
 *     layout="vertical"
 *   />
 * </YStack>
 * ```
 */
export function LoadingSpinner({
  size = "medium",
  color = "$primary",
  label,
  layout = "horizontal",
  centered = false,
}: LoadingSpinnerProps) {
  // Map medium to undefined (platform default)
  const spinnerSize = size === "medium" ? undefined : size;

  const spinnerElement = <Spinner size={spinnerSize} color={color} />;

  if (!label) {
    // No label - just return spinner, optionally centered
    if (centered) {
      return (
        <YStack justifyContent="center" alignItems="center">
          {spinnerElement}
        </YStack>
      );
    }
    return spinnerElement;
  }

  const labelElement = (
    <Text
      color="white"
      fontSize={size === "small" ? 12 : size === "large" ? 16 : 14}
    >
      {label}
    </Text>
  );

  const content =
    layout === "horizontal" ? (
      <XStack gap="$2" alignItems="center">
        {spinnerElement}
        {labelElement}
      </XStack>
    ) : (
      <YStack gap="$2" alignItems="center">
        {spinnerElement}
        {labelElement}
      </YStack>
    );

  if (centered) {
    return (
      <YStack justifyContent="center" alignItems="center">
        {content}
      </YStack>
    );
  }

  return content;
}

// Default export for convenience
export default LoadingSpinner;
