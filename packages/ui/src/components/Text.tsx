/**
 * Text Primitive Component
 *
 * Tier 1 primitive for typography with semantic variants.
 * Wraps Tamagui's Text component with styled() for theme integration.
 *
 * Features:
 * - Semantic typography variants (heading levels, body sizes)
 * - Theme-aware color variants
 * - Font family switching (heading, body, mono)
 * - Weight, alignment, and transform variants
 * - Full TypeScript support with typed props
 *
 * @example
 * ```tsx
 * <Text variant="h1" color="primary">Main Heading</Text>
 * <Text variant="body" color="muted">Secondary text</Text>
 * <Text variant="caption" fontFamily="mono">Code: npm install</Text>
 * ```
 */

import { styled, Text as TamaguiText } from "tamagui";

/**
 * Text component with typography variants
 *
 * Built on top of Tamagui's Text with styled() for consistent
 * typography across web and native platforms.
 */
export const Text = styled(TamaguiText, {
  name: "Text",

  // Base styles applied to all text
  color: "$color",
  fontFamily: "$body",
  fontSize: "$base",
  lineHeight: "$normal",
  letterSpacing: "$normal",

  // Variants for different typography use cases
  variants: {
    // Typography hierarchy variants
    variant: {
      // Display/heading variants
      h1: {
        fontFamily: "$heading",
        fontSize: "$huge",
        fontWeight: "$bold",
        lineHeight: "$tight",
        letterSpacing: "$tight",
      },
      h2: {
        fontFamily: "$heading",
        fontSize: "$xxxl",
        fontWeight: "$semibold",
        lineHeight: "$tight",
        letterSpacing: "$tight",
      },
      h3: {
        fontFamily: "$heading",
        fontSize: "$xxl",
        fontWeight: "$semibold",
        lineHeight: "$tight",
        letterSpacing: "$tight",
      },
      h4: {
        fontFamily: "$heading",
        fontSize: "$xl",
        fontWeight: "$medium",
        lineHeight: "$normal",
        letterSpacing: "$normal",
      },
      h5: {
        fontFamily: "$heading",
        fontSize: "$lg",
        fontWeight: "$medium",
        lineHeight: "$normal",
        letterSpacing: "$normal",
      },
      h6: {
        fontFamily: "$heading",
        fontSize: "$base",
        fontWeight: "$medium",
        lineHeight: "$normal",
        letterSpacing: "$wide",
        textTransform: "uppercase",
      },

      // Body text variants
      body: {
        fontFamily: "$body",
        fontSize: "$base",
        fontWeight: "$normal",
        lineHeight: "$relaxed",
        letterSpacing: "$normal",
      },
      bodyLarge: {
        fontFamily: "$body",
        fontSize: "$lg",
        fontWeight: "$normal",
        lineHeight: "$relaxed",
        letterSpacing: "$normal",
      },
      bodySmall: {
        fontFamily: "$body",
        fontSize: "$sm",
        fontWeight: "$normal",
        lineHeight: "$normal",
        letterSpacing: "$normal",
      },

      // Specialized variants
      caption: {
        fontFamily: "$body",
        fontSize: "$xs",
        fontWeight: "$normal",
        lineHeight: "$normal",
        letterSpacing: "$wide",
      },
      label: {
        fontFamily: "$body",
        fontSize: "$sm",
        fontWeight: "$medium",
        lineHeight: "$normal",
        letterSpacing: "$wide",
      },
      button: {
        fontFamily: "$body",
        fontSize: "$base",
        fontWeight: "$semibold",
        lineHeight: "$normal",
        letterSpacing: "$wide",
      },
      code: {
        fontFamily: "$mono",
        fontSize: "$sm",
        fontWeight: "$normal",
        lineHeight: "$normal",
        letterSpacing: "$normal",
      },
      overline: {
        fontFamily: "$heading",
        fontSize: "$xs",
        fontWeight: "$semibold",
        lineHeight: "$normal",
        letterSpacing: "$wider",
        textTransform: "uppercase",
      },
    },

    // Color variants using theme tokens
    color: {
      default: {
        color: "$color",
      },
      primary: {
        color: "$primary",
      },
      secondary: {
        color: "$colorMuted",
      },
      muted: {
        color: "$colorMuted",
      },
      tertiary: {
        color: "$colorTertiary",
      },
      inverse: {
        color: "$background",
      },
      success: {
        color: "$success",
      },
      warning: {
        color: "$warning",
      },
      danger: {
        color: "$danger",
      },
      accent: {
        color: "$accent",
      },
    },

    // Font weight variants (in addition to variant defaults)
    weight: {
      light: {
        fontWeight: "$light",
      },
      normal: {
        fontWeight: "$normal",
      },
      medium: {
        fontWeight: "$medium",
      },
      semibold: {
        fontWeight: "$semibold",
      },
      bold: {
        fontWeight: "$bold",
      },
    },

    // Text alignment variants
    align: {
      left: {
        textAlign: "left",
      },
      center: {
        textAlign: "center",
      },
      right: {
        textAlign: "right",
      },
      justify: {
        textAlign: "justify",
      },
    },

    // Text transform variants
    transform: {
      none: {
        textTransform: "none",
      },
      uppercase: {
        textTransform: "uppercase",
      },
      lowercase: {
        textTransform: "lowercase",
      },
      capitalize: {
        textTransform: "capitalize",
      },
    },

    // Whether text should wrap or truncate
    wrap: {
      true: {
        whiteSpace: "normal",
        numberOfLines: undefined,
      },
      false: {
        whiteSpace: "nowrap",
        numberOfLines: 1,
      },
      truncate: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        numberOfLines: 1,
      },
    },

    // Line clamping for multi-line truncation
    lineClamp: {
      1: {
        numberOfLines: 1,
      },
      2: {
        numberOfLines: 2,
      },
      3: {
        numberOfLines: 3,
      },
      4: {
        numberOfLines: 4,
      },
      5: {
        numberOfLines: 5,
      },
    },
  } as const,

  // Default variant values
  defaultVariants: {
    variant: "body",
    color: "default",
    weight: "normal",
    align: "left",
    wrap: true,
  },
});

// Type export for component props
type TextProps = React.ComponentProps<typeof Text>;

export type { TextProps };

// Re-export Tamagui's SizableText for when you need dynamic sizing
export { SizableText, Paragraph, Heading } from "tamagui";

// Convenience exports for common text patterns
export const H1 = Text.styleable((props) => <Text variant="h1" {...props} />);
H1.displayName = "H1";

export const H2 = Text.styleable((props) => <Text variant="h2" {...props} />);
H2.displayName = "H2";

export const H3 = Text.styleable((props) => <Text variant="h3" {...props} />);
H3.displayName = "H3";

export const H4 = Text.styleable((props) => <Text variant="h4" {...props} />);
H4.displayName = "H4";

export const H5 = Text.styleable((props) => <Text variant="h5" {...props} />);
H5.displayName = "H5";

export const H6 = Text.styleable((props) => <Text variant="h6" {...props} />);
H6.displayName = "H6";

export const Body = Text.styleable((props) => (
  <Text variant="body" {...props} />
));
Body.displayName = "Body";

export const Caption = Text.styleable((props) => (
  <Text variant="caption" {...props} />
));
Caption.displayName = "Caption";

export const LabelText = Text.styleable((props) => (
  <Text variant="label" {...props} />
));
LabelText.displayName = "LabelText";

export default Text;
