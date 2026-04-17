/**
 * Text Component Stories
 *
 * Stories for the Text component demonstrating typography styles
 * with full Tamagui theming support.
 *
 * @see https://storybook.js.org/docs/writing-stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "./Text";
import { Card } from "./Card";

/**
 * Storybook metadata for the Text component
 */
const meta: Meta<typeof Text> = {
  title: "Components/Primitives/Text",
  component: Text,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Tier 1 primitive for typography with theme-aware styling.

## Features
- Theme-aware color tokens
- Font weight support
- Text alignment options
- Line clamping support

## Usage
\`\`\`tsx
import { Text } from "@mirai-app/ui";

<Text fontSize="$xl" fontWeight="$bold" color="primary">Main Heading</Text>
<Text fontSize="$base" color="muted">Secondary text</Text>
<Text fontSize="$sm" fontFamily="$mono">Code: npm install</Text>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    fontSize: {
      control: "select",
      options: ["$xs", "$sm", "$base", "$lg", "$xl", "$xxl", "$xxxl", "$huge"],
      description: "Font size using theme tokens",
      table: {
        defaultValue: { summary: "$base" },
      },
    },
    color: {
      control: "select",
      options: [
        "$color",
        "$colorMuted",
        "$colorTertiary",
        "$primary",
        "$success",
        "$warning",
        "$danger",
        "$accent",
      ],
      description: "Text color using theme tokens",
      table: {
        defaultValue: { summary: "$color" },
      },
    },
    fontWeight: {
      control: "select",
      options: ["$light", "$normal", "$medium", "$semibold", "$bold"],
      description: "Font weight",
      table: {
        defaultValue: { summary: "$normal" },
      },
    },
    textAlign: {
      control: "select",
      options: ["left", "center", "right"],
      description: "Text alignment",
      table: {
        defaultValue: { summary: "left" },
      },
    },
    fontFamily: {
      control: "select",
      options: ["$body", "$heading", "$mono"],
      description: "Font family",
      table: {
        defaultValue: { summary: "$body" },
      },
    },
    children: {
      control: "text",
      description: "Text content",
    },
  },
  args: {
    fontSize: "$base",
    color: "$color",
    fontWeight: "400",
    textAlign: "left",
    fontFamily: "$body",
    children: "The quick brown fox jumps over the lazy dog",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default text appearance
 */
export const Default: Story = {
  args: {
    fontSize: "$base",
  },
};

/**
 * Heading sizes
 */
export const HeadingHuge: Story = {
  name: "Heading - Huge",
  args: {
    fontSize: "$huge",
    fontWeight: "700",
    fontFamily: "$heading",
    children: "Huge Heading (32px)",
  },
};

export const HeadingXXXL: Story = {
  name: "Heading - XXXL",
  args: {
    fontSize: "$xxxl",
    fontWeight: "$semibold",
    fontFamily: "$heading",
    children: "XXXL Heading (28px)",
  },
};

export const HeadingXXL: Story = {
  name: "Heading - XXL",
  args: {
    fontSize: "$xxl",
    fontWeight: "$semibold",
    fontFamily: "$heading",
    children: "XXL Heading (24px)",
  },
};

export const HeadingXL: Story = {
  name: "Heading - XL",
  args: {
    fontSize: "$xl",
    fontWeight: "$medium",
    fontFamily: "$heading",
    children: "XL Heading (20px)",
  },
};

export const HeadingLG: Story = {
  name: "Heading - LG",
  args: {
    fontSize: "$lg",
    fontWeight: "$medium",
    fontFamily: "$heading",
    children: "Large Heading (18px)",
  },
};

/**
 * Body text sizes
 */
export const BodyLarge: Story = {
  name: "Body - Large",
  args: {
    fontSize: "$lg",
    children: "Large body text (18px)",
  },
};

export const Body: Story = {
  name: "Body - Base",
  args: {
    fontSize: "$base",
    children: "Base body text (16px)",
  },
};

export const BodySmall: Story = {
  name: "Body - Small",
  args: {
    fontSize: "$sm",
    children: "Small body text (14px)",
  },
};

export const Caption: Story = {
  name: "Caption",
  args: {
    fontSize: "$xs",
    children: "Caption text (12px)",
  },
};

/**
 * Color variants
 */
export const ColorDefault: Story = {
  name: "Color - Default",
  args: {
    color: "$color",
    children: "Default text color",
  },
};

export const ColorPrimary: Story = {
  name: "Color - Primary",
  args: {
    color: "$primary",
    children: "Primary brand color",
  },
};

export const ColorMuted: Story = {
  name: "Color - Muted",
  args: {
    color: "$colorMuted",
    children: "Muted text color",
  },
};

export const ColorTertiary: Story = {
  name: "Color - Tertiary",
  args: {
    color: "$colorTertiary",
    children: "Tertiary text color",
  },
};

export const ColorSuccess: Story = {
  name: "Color - Success",
  args: {
    color: "$success",
    children: "Success message color",
  },
};

export const ColorWarning: Story = {
  name: "Color - Warning",
  args: {
    color: "$warning",
    children: "Warning message color",
  },
};

export const ColorDanger: Story = {
  name: "Color - Danger",
  args: {
    color: "$danger",
    children: "Danger/error message color",
  },
};

export const ColorAccent: Story = {
  name: "Color - Accent",
  args: {
    color: "$accent",
    children: "Accent color",
  },
};

/**
 * Weight variants
 */
export const WeightLight: Story = {
  name: "Weight - Light",
  args: {
    fontWeight: "$light",
    children: "Light weight text (300)",
  },
};

export const WeightNormal: Story = {
  name: "Weight - Normal",
  args: {
    fontWeight: "$normal",
    children: "Normal weight text (400)",
  },
};

export const WeightMedium: Story = {
  name: "Weight - Medium",
  args: {
    fontWeight: "$medium",
    children: "Medium weight text (500)",
  },
};

export const WeightSemibold: Story = {
  name: "Weight - Semibold",
  args: {
    fontWeight: "$semibold",
    children: "Semibold weight text (600)",
  },
};

export const WeightBold: Story = {
  name: "Weight - Bold",
  args: {
    fontWeight: "$bold",
    children: "Bold weight text (700)",
  },
};

/**
 * Alignment variants
 */
export const AlignLeft: Story = {
  name: "Align - Left",
  args: {
    textAlign: "left",
    children: "Left aligned text",
  },
};

export const AlignCenter: Story = {
  name: "Align - Center",
  args: {
    textAlign: "center",
    children: "Center aligned text",
  },
};

export const AlignRight: Story = {
  name: "Align - Right",
  args: {
    textAlign: "right",
    children: "Right aligned text",
  },
};

/**
 * Font families
 */
export const FontBody: Story = {
  name: "Font - Body",
  args: {
    fontFamily: "$body",
    children: "Body font (Inter)",
  },
};

export const FontHeading: Story = {
  name: "Font - Heading",
  args: {
    fontFamily: "$heading",
    fontSize: "$xl",
    children: "Heading font (Space Grotesk)",
  },
};

export const FontMono: Story = {
  name: "Font - Mono",
  args: {
    fontFamily: "$mono",
    children: "Monospace font (code)",
  },
};

/**
 * All headings displayed together
 */
export const AllHeadings: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Text fontSize="$huge" fontWeight="700" fontFamily="$heading">
        Heading Huge (32px) - Space Grotesk Bold
      </Text>
      <Text fontSize="$xxxl" fontWeight="600" fontFamily="$heading">
        Heading XXXL (28px) - Space Grotesk Semibold
      </Text>
      <Text fontSize="$xxl" fontWeight="600" fontFamily="$heading">
        Heading XXL (24px) - Space Grotesk Semibold
      </Text>
      <Text fontSize="$xl" fontWeight="500" fontFamily="$heading">
        Heading XL (20px) - Space Grotesk Medium
      </Text>
      <Text fontSize="$lg" fontWeight="500" fontFamily="$heading">
        Heading LG (18px) - Space Grotesk Medium
      </Text>
    </div>
  ),
};

/**
 * All body sizes displayed together
 */
export const AllBodySizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Text fontSize="$lg">Body Large (18px) - Inter Regular</Text>
      <Text fontSize="$base">Body Base (16px) - Inter Regular</Text>
      <Text fontSize="$sm">Body Small (14px) - Inter Regular</Text>
      <Text fontSize="$xs">Caption (12px) - Inter Regular</Text>
    </div>
  ),
};

/**
 * All colors displayed together
 */
export const AllColors: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Text color="$color">Default color</Text>
      <Text color="$primary">Primary color</Text>
      <Text color="$colorMuted">Muted color</Text>
      <Text color="$colorTertiary">Tertiary color</Text>
      <Text color="$success">Success color</Text>
      <Text color="$warning">Warning color</Text>
      <Text color="$danger">Danger color</Text>
      <Text color="$accent">Accent color</Text>
    </div>
  ),
};

/**
 * Typography scale showcase
 * Complete typography system overview
 */
export const TypographyScale: Story = {
  render: () => (
    <Card style={{ width: "400px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <Text fontSize="$xs" color="$colorMuted" textTransform="uppercase">
            Headings
          </Text>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginTop: "8px",
            }}
          >
            <Text fontSize="$huge" fontWeight="700" fontFamily="$heading">
              Huge (32px)
            </Text>
            <Text fontSize="$xxxl" fontWeight="600" fontFamily="$heading">
              XXXL (28px)
            </Text>
            <Text fontSize="$xxl" fontWeight="600" fontFamily="$heading">
              XXL (24px)
            </Text>
            <Text fontSize="$xl" fontWeight="500" fontFamily="$heading">
              XL (20px)
            </Text>
          </div>
        </div>

        <div>
          <Text fontSize="$xs" color="$colorMuted" textTransform="uppercase">
            Body Text
          </Text>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginTop: "8px",
            }}
          >
            <Text fontSize="$lg">Large (18px)</Text>
            <Text fontSize="$base">Base (16px)</Text>
            <Text fontSize="$sm">Small (14px)</Text>
            <Text fontSize="$xs">Extra Small (12px)</Text>
          </div>
        </div>

        <div>
          <Text fontSize="$xs" color="$colorMuted" textTransform="uppercase">
            Font Families
          </Text>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginTop: "8px",
            }}
          >
            <Text fontFamily="$heading" fontSize="$lg">
              Heading: Space Grotesk
            </Text>
            <Text fontFamily="$body" fontSize="$lg">
              Body: Inter
            </Text>
            <Text fontFamily="$mono" fontSize="$lg">
              Mono: Monospace
            </Text>
          </div>
        </div>
      </div>
    </Card>
  ),
};
