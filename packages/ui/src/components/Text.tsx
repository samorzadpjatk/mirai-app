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
  lineHeight: 1.5,
  letterSpacing: 0,

  // Variants for different typography use cases
  variants: {
    // Typography hierarchy variants
    variant: {
      // Display/heading variants
      h1: {
        fontFamily: "$heading",
        fontSize: "$huge",
        fontWeight: "700",
        lineHeight: 1.2,
        letterSpacing: -0.025,
      },
      h2: {
        fontFamily: "$heading",
        fontSize: "$xxxl",
        fontWeight: "600",
        lineHeight: 1.2,
        letterSpacing: -0.025,
      },
      h3: {
        fontFamily: "$heading",
        fontSize: "$xxl",
        fontWeight: "600",
        lineHeight: 1.2,
        letterSpacing: -0.025,
      },
      h4: {
        fontFamily: "$heading",
        fontSize: "$xl",
        fontWeight: "500",
        lineHeight: 1.5,
        letterSpacing: 0,
      },
      h5: {
        fontFamily: "$heading",
        fontSize: "$lg",
        fontWeight: "500",
        lineHeight: 1.5,
        letterSpacing: 0,
      },
      h6: {
        fontFamily: "$heading",
        fontSize: "$base",
        fontWeight: "500",
        lineHeight: 1.5,
        letterSpacing: 0.025,
        textTransform: "uppercase",
      },

      // Body text variants
      body: {
        fontFamily: "$body",
        fontSize: "$base",
        fontWeight: "400",
        lineHeight: 1.75,
        letterSpacing: 0,
      },
      bodyLarge: {
        fontFamily: "$body",
        fontSize: "$lg",
        fontWeight: "400",
        lineHeight: 1.75,
        letterSpacing: 0,
      },
      bodySmall: {
        fontFamily: "$body",
        fontSize: "$sm",
        fontWeight: "400",
        lineHeight: 1.5,
        letterSpacing: 0,
      },

      // Specialized variants
      caption: {
        fontFamily: "$body",
        fontSize: "$xs",
        fontWeight: "400",
        lineHeight: 1.5,
        letterSpacing: 0.025,
      },
      label: {
        fontFamily: "$body",
        fontSize: "$sm",
        fontWeight: "500",
        lineHeight: 1.5,
        letterSpacing: 0.025,
      },
      button: {
        fontFamily: "$body",
        fontSize: "$base",
        fontWeight: "600",
        lineHeight: 1.5,
        letterSpacing: 0.025,
      },
      code: {
        fontFamily: "$mono",
        fontSize: "$sm",
        fontWeight: "400",
        lineHeight: 1.5,
        letterSpacing: 0,
      },
      overline: {
        fontFamily: "$heading",
        fontSize: "$xs",
        fontWeight: "600",
        lineHeight: 1.5,
        letterSpacing: 0.05,
        textTransform: "uppercase",
      },
    },

    // Font weight variants (in addition to variant defaults)
    weight: {
      light: {
        fontWeight: "300",
      },
      normal: {
        fontWeight: "400",
      },
      medium: {
        fontWeight: "500",
      },
      semibold: {
        fontWeight: "600",
      },
      bold: {
        fontWeight: "700",
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
export const H1 = (props: TextProps) => <Text variant="h1" {...props} />;
H1.displayName = "H1";

export const H2 = (props: TextProps) => <Text variant="h2" {...props} />;
H2.displayName = "H2";

export const H3 = (props: TextProps) => <Text variant="h3" {...props} />;
H3.displayName = "H3";

export const H4 = (props: TextProps) => <Text variant="h4" {...props} />;
H4.displayName = "H4";

export const H5 = (props: TextProps) => <Text variant="h5" {...props} />;
H5.displayName = "H5";

export const H6 = (props: TextProps) => <Text variant="h6" {...props} />;
H6.displayName = "H6";

export const Body = (props: TextProps) => <Text variant="body" {...props} />;
Body.displayName = "Body";

export const Caption = (props: TextProps) => (
  <Text variant="caption" {...props} />
);
Caption.displayName = "Caption";

export const LabelText = (props: TextProps) => (
  <Text variant="label" {...props} />
);
LabelText.displayName = "LabelText";

export default Text;
