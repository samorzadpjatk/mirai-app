/**
 * Card Primitive Component
 *
 * A foundational container component with theme-aware background styling.
 * Part of Tier 1 primitives in the Tamagui migration.
 *
 * Features:
 * - Uses `$background` theme token for automatic light/dark mode support
 * - Built with Tamagui's `styled()` API for performance and consistency
 * - Supports all Tamagui View props (padding, margin, borderRadius, etc.)
 * - Cross-platform: works on web and React Native
 *
 * @module @mirai-app/ui/components/Card
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 *
 * // With padding and custom border radius
 * <Card p="$4" br="$2">
 *   <Text>Content with padding</Text>
 * </Card>
 *
 * // In dark theme (via parent TamaguiProvider)
 * <Card>
 *   <Text>Automatically adapts to dark mode</Text>
 * </Card>
 * ```
 */

import { View, styled } from "tamagui";

/**
 * Card component - A themed container with background color support.
 *
 * Built on top of Tamagui's View primitive with `$background` theme token
 * applied by default. Automatically adapts to light/dark theme contexts.
 *
 * @remarks
 * - Use shorthands like `p` (padding), `px` (paddingHorizontal), `br` (borderRadius)
 * - Combine with other Tier 1 primitives (Text, Button) for complete UI
 * - For elevation/shadows, use the `elevation` prop or custom shadow styles
 */
export const Card = styled(View, {
  name: "Card",

  // Base styles applied to all Card instances
  backgroundColor: "$background",

  // Default layout properties
  padding: "$4",
  borderRadius: "$4",

  // Variants for different card sizes and styles
  variants: {
    /**
     * Size variant - controls default padding
     */
    size: {
      sm: {
        padding: "$2",
        borderRadius: "$2",
      },
      md: {
        padding: "$4",
        borderRadius: "$4",
      },
      lg: {
        padding: "$6",
        borderRadius: "$4",
      },
    },

    /**
     * Elevation variant - visual depth through shadow
     */
    elevation: {
      none: {
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      sm: {
        shadowColor: "$shadowColor",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
      md: {
        shadowColor: "$shadowColor",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      },
      lg: {
        shadowColor: "$shadowColor",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
      },
    },

    /**
     * Border variant - show/hide border with theme color
     */
    bordered: {
      true: {
        borderWidth: 1,
        borderColor: "$borderColor",
      },
      false: {
        borderWidth: 0,
      },
    },

    /**
     * Full width variant
     */
    fullWidth: {
      true: {
        width: "100%",
      },
      false: {},
    },
  } as const,

  // Default variant values
  defaultVariants: {
    size: "md",
    elevation: "sm",
    bordered: false,
    fullWidth: false,
  },
});

/**
 * Type definition for Card component props.
 * Includes all Tamagui View props plus Card-specific variants.
 */
export type CardProps = React.ComponentProps<typeof Card>;

/**
 * Named export for explicit imports.
 *
 * @example
 * ```tsx
 * import { Card } from '@mirai-app/ui';
 * // or
 * import { Card } from '@mirai-app/ui/components';
 * ```
 */
export default Card;
