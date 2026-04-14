/**
 * Button Component - Tier 1 Primitive
 *
 * A cross-platform button component with multiple variants.
 * Built with Tamagui's styled() API for consistent theming.
 *
 * @example
 * ```tsx
 * // Primary button (default)
 * <Button onPress={handlePress}>Click me</Button>
 *
 * // Secondary button
 * <Button variant="secondary" onPress={handlePress}>Secondary</Button>
 *
 * // Ghost button
 * <Button variant="ghost" onPress={handlePress}>Ghost</Button>
 *
 * // Danger button
 * <Button variant="danger" onPress={handlePress}>Delete</Button>
 *
 * // Loading state
 * <Button isLoading onPress={handlePress}>Loading...</Button>
 *
 * // Disabled state
 * <Button disabled onPress={handlePress}>Disabled</Button>
 *
 * // Different sizes
 * <Button size="sm">Small</Button>
 * <Button size="md">Medium (default)</Button>
 * <Button size="lg">Large</Button>
 * ```
 */

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { styled, Text, View, Spinner } from "tamagui";
import type { GetProps, ThemeTokens } from "tamagui";

// ============================================================================
// Styled Button Base
// ============================================================================

/**
 * Button variant types
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Button size types
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Base styled button component using Tamagui's styled() API.
 * Defines the base styling and variant configurations.
 */
const StyledButtonFrame = styled(View, {
  name: "Button",
  tag: "button",

  // Base styles
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "$2",

  // Accessibility
  accessibilityRole: "button",

  // Variant definitions
  variants: {
    // Variant: primary, secondary, ghost, danger
    variant: {
      primary: {
        backgroundColor: "$primary",
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: "$primaryHover",
        },
        pressStyle: {
          backgroundColor: "$primaryPress",
        },
      },
      secondary: {
        backgroundColor: "$surface",
        borderWidth: 1,
        borderColor: "$borderColor",
        hoverStyle: {
          backgroundColor: "$surfaceHover",
        },
        pressStyle: {
          backgroundColor: "$surfacePress",
        },
      },
      ghost: {
        backgroundColor: "transparent",
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: "$backgroundHover",
        },
        pressStyle: {
          backgroundColor: "$backgroundPress",
        },
      },
      danger: {
        backgroundColor: "$danger",
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: "$dangerHover",
        },
        pressStyle: {
          backgroundColor: "$dangerPress",
        },
      },
    },

    // Size: sm, md, lg
    size: {
      sm: {
        height: 32,
        paddingHorizontal: "$3",
        borderRadius: "$md",
      },
      md: {
        height: 40,
        paddingHorizontal: "$4",
        borderRadius: "$lg",
      },
      lg: {
        height: 48,
        paddingHorizontal: "$5",
        borderRadius: "$xl",
      },
    },

    // Disabled state
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
      },
    },

    // Full width
    fullWidth: {
      true: {
        width: "100%",
      },
    },
  } as const,

  // Default variants
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

// Type for the styled button frame props
type StyledButtonFrameProps = GetProps<typeof StyledButtonFrame>;

// ============================================================================
// Styled Button Text
// ============================================================================

/**
 * Styled text component for button labels.
 * Color adapts based on button variant.
 */
const StyledButtonText = styled(Text, {
  name: "ButtonText",

  // Base styles
  fontFamily: "$body",
  fontWeight: 500,
  textAlign: "center",

  // Variant definitions
  variants: {
    variant: {
      primary: {
        color: "$background",
      },
      secondary: {
        color: "$color",
      },
      ghost: {
        color: "$colorMuted",
      },
      danger: {
        color: "$white",
      },
    },

    size: {
      sm: {
        fontSize: "$sm",
      },
      md: {
        fontSize: "$base",
      },
      lg: {
        fontSize: "$xl",
      },
    },
  } as const,

  // Default variants
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

// Type for the styled button text props
type StyledButtonTextProps = GetProps<typeof StyledButtonText>;

// ============================================================================
// Button Component Props
// ============================================================================

/**
 * Props for the Button component.
 *
 * @extends ComponentPropsWithoutRef<typeof StyledButtonFrame>
 */
export interface ButtonProps extends Omit<
  ComponentPropsWithoutRef<typeof StyledButtonFrame>,
  "variant" | "size" | "disabled"
> {
  /**
   * The visual style variant of the button.
   * @default "primary"
   */
  variant?: ButtonVariant;

  /**
   * The size of the button.
   * @default "md"
   */
  size?: ButtonSize;

  /**
   * Whether the button is disabled.
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the button is in a loading state.
   * When true, shows a spinner and disables the button.
   * @default false
   */
  isLoading?: boolean;

  /**
   * The content of the button (typically text).
   */
  children: ReactNode;

  /**
   * Whether the button takes up the full width of its container.
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Icon to display before the button text (left side).
   */
  leftIcon?: ReactNode;

  /**
   * Icon to display after the button text (right side).
   */
  rightIcon?: ReactNode;

  /**
   * Callback when the button is pressed.
   */
  onPress?: () => void;

  /**
   * Accessibility label for the button.
   * Required if button content is not text.
   */
  accessibilityLabel?: string;

  /**
   * ID for testing purposes.
   */
  testID?: string;
}

// ============================================================================
// Button Component
// ============================================================================

/**
 * Button - A cross-platform button component with multiple variants.
 *
 * This is a Tier 1 primitive component that renders consistently
 * across web and native platforms using Tamagui.
 *
 * Features:
 * - 4 visual variants: primary, secondary, ghost, danger
 * - 3 sizes: sm, md, lg
 * - Loading state with spinner
 * - Disabled state with reduced opacity
 * - Full-width option
 * - Left/right icons
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * import { Button } from "@mirai-app/ui";
 *
 * export function MyComponent() {
 *   return (
 *     <Button
 *       variant="primary"
 *       size="md"
 *       onPress={handleSubmit}
 *       isLoading={isSubmitting}
 *     >
 *       Submit
 *     </Button>
 *   );
 * }
 * ```
 */
export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  fullWidth = false,
  children,
  leftIcon,
  rightIcon,
  onPress,
  accessibilityLabel,
  testID,
  ...props
}: ButtonProps) {
  // Combine disabled and isLoading states
  const isDisabled = disabled || isLoading;

  // Determine spinner color based on variant
  const getSpinnerColor = (): ThemeTokens => {
    switch (variant) {
      case "primary":
      case "danger":
        return "$background";
      case "secondary":
      case "ghost":
      default:
        return "$color";
    }
  };

  // Determine spinner size based on button size
  const getSpinnerSize = (): "small" | "large" => {
    switch (size) {
      case "sm":
        return "small";
      case "md":
        return "small";
      case "lg":
        return "large";
      default:
        return "small";
    }
  };

  return (
    <StyledButtonFrame
      variant={variant}
      size={size}
      disabled={isDisabled}
      fullWidth={fullWidth}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      accessibilityHint={isLoading ? "Loading in progress" : undefined}
      testID={testID}
      {...props}
    >
      {isLoading ? (
        <Spinner size={getSpinnerSize()} color={getSpinnerColor()} />
      ) : (
        <>
          {leftIcon}
          <StyledButtonText variant={variant} size={size}>
            {children}
          </StyledButtonText>
          {rightIcon}
        </>
      )}
    </StyledButtonFrame>
  );
}

// ============================================================================
// Type Exports
// ============================================================================

export type { StyledButtonFrameProps, StyledButtonTextProps };

// Re-export styled components for advanced use cases
export { StyledButtonFrame, StyledButtonText };
