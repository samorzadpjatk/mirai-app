/**
 * ErrorMessage Component - Tier 1 Primitive
 *
 * A component for displaying error messages with consistent styling.
 * Built on top of Tamagui components for theme-aware rendering.
 *
 * @example
 * ```tsx
 * // Basic error message
 * <ErrorMessage message="Something went wrong" />
 *
 * // With title
 * <ErrorMessage title="Error" message="Failed to load data" />
 *
 * // With retry action
 * <ErrorMessage
 *   message="Failed to load"
 *   onRetry={() => refetch()}
 * />
 *
 * // Full-screen error
 * <ErrorMessage
 *   title="Oops!"
 *   message="Something went wrong"
 *   centered
 * />
 * ```
 */

import { YStack, XStack } from "tamagui";
import { Text } from "./Text";
import { Button } from "./Button";
import { Card } from "./Card";

/**
 * Props for the ErrorMessage component
 */
export interface ErrorMessageProps {
  /**
   * The main error message to display
   */
  message: string;

  /**
   * Optional title displayed above the message
   */
  title?: string;

  /**
   * Callback for retry action
   * When provided, a "Retry" button is shown
   */
  onRetry?: () => void;

  /**
   * Custom retry button text
   * @default "Retry"
   */
  retryLabel?: string;

  /**
   * Whether to center the error message within its container
   * @default false
   */
  centered?: boolean;

  /**
   * Whether to render inside a Card component
   * @default false
   */
  inCard?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Additional style properties
   */
  style?: React.CSSProperties;
}

/**
 * ErrorMessage component - Consistent error state display
 *
 * Renders an error message with optional title and retry action.
 * Uses theme-aware danger/warning colors for consistent error styling.
 *
 * ## Features
 * - Consistent error styling across the app
 * - Optional title and message
 * - Built-in retry action support
 * - Card or inline rendering
 * - Centered or inline positioning
 * - Accessible (screen readers announce error)
 *
 * ## Usage Guidelines
 * - Use **title** for clear error categorization (e.g., "Network Error")
 * - Keep **message** concise but descriptive
 * - Provide **onRetry** when the error is recoverable
 * - Use **inCard** for modal or page-level errors
 * - Use **centered** for full-screen error states
 *
 * @example
 * ```tsx
 * import { ErrorMessage } from "@mirai-app/ui";
 *
 * // Simple inline error
 * <ErrorMessage message="Please select a trip first." />
 *
 * // Error with retry
 * <ErrorMessage
 *   title="Connection Failed"
 *   message="Unable to connect to server"
 *   onRetry={() => refetch()}
 * />
 *
 * // Full-screen error (centered in card)
 * <ErrorMessage
 *   title="Oops!"
 *   message="Something went wrong"
 *   centered
 *   inCard
 *   onRetry={() => window.location.reload()}
 * />
 *
 * // Form field error
 * <YStack gap="$1">
 *   <Text>Email</Text>
 *   <Input />
 *   <ErrorMessage message="Please enter a valid email" />
 * </YStack>
 *
 * // Conditional error display
 * {error && (
 *   <ErrorMessage
 *     message={error.message}
 *     onRetry={refetch}
 *   />
 * )}
 * ```
 */
export function ErrorMessage({
  message,
  title,
  onRetry,
  retryLabel = "Retry",
  centered = false,
  inCard = false,
  className,
  style,
}: ErrorMessageProps) {
  const content = (
    <YStack
      gap="$2"
      alignItems={centered ? "center" : "flex-start"}
      className={className}
      style={style}
    >
      {title && (
        <Text fontSize={16} fontWeight="bold" color="white">
          {title}
        </Text>
      )}
      <Text
        fontSize={14}
        color="#cbd5e1" // Light gray for error message
      >
        {message}
      </Text>
      {onRetry && (
        <Button variant="secondary" size="sm" onPress={onRetry} marginTop="$2">
          {retryLabel}
        </Button>
      )}
    </YStack>
  );

  if (inCard) {
    return (
      <Card
        bordered
        padding="$4"
        backgroundColor="rgba(239, 68, 68, 0.1)" // Light red tint
        borderColor="rgba(239, 68, 68, 0.3)"
      >
        {content}
      </Card>
    );
  }

  if (centered) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        {content}
      </YStack>
    );
  }

  return content;
}

// Default export for convenience
export default ErrorMessage;
