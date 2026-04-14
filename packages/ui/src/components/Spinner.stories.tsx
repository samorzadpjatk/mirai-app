/**
 * Spinner Component Stories
 *
 * Stories for the Spinner component demonstrating all sizes and
 * colors with full Tamagui theming support.
 *
 * @see https://storybook.js.org/docs/writing-stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";
import { Card } from "./Card";
import { Text } from "./Text";

/**
 * Storybook metadata for the Spinner component
 */
const meta: Meta<typeof Spinner> = {
  title: "Components/Primitives/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A loading indicator component that renders consistently across web and native.

## Features
- 2 size options: small (16px), large (32px)
- Theme-aware color tokens
- Cross-platform rendering
- Accessible (screen readers announce "progress indicator")

## Usage
\`\`\`tsx
import { Spinner } from "@mirai-app/ui";

// Basic usage - defaults to medium size with primary color
<Spinner />

// Small size
<Spinner size="small" />

// Large size
<Spinner size="large" />

// Custom theme color
<Spinner color="\$success" />
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["small", "large"],
      description: "Size of the spinner",
      table: {
        defaultValue: { summary: "undefined (~24px)" },
      },
    },
    color: {
      control: "select",
      options: [
        "$primary",
        "$color",
        "$colorMuted",
        "$colorTertiary",
        "$success",
        "$warning",
        "$danger",
        "$background",
        "$white",
      ],
      description: "Color of the spinner using theme tokens",
      table: {
        defaultValue: { summary: "$primary" },
      },
    },
  },
  args: {
    size: undefined,
    color: "$primary",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default spinner appearance
 */
export const Default: Story = {
  args: {
    color: "$primary",
  },
};

/**
 * Small spinner
 * Compact size for buttons and inline use
 */
export const Small: Story = {
  args: {
    size: "small",
    color: "$primary",
  },
};

/**
 * Large spinner
 * Prominent size for full-screen loading
 */
export const Large: Story = {
  args: {
    size: "large",
    color: "$primary",
  },
};

/**
 * Primary color (default)
 * Brand primary color
 */
export const Primary: Story = {
  args: {
    size: "large",
    color: "$primary",
  },
};

/**
 * Color variant - default text color
 */
export const ColorDefault: Story = {
  args: {
    size: "large",
    color: "$color",
  },
};

/**
 * Color variant - muted
 */
export const ColorMuted: Story = {
  args: {
    size: "large",
    color: "$colorMuted",
  },
};

/**
 * Color variant - tertiary
 */
export const ColorTertiary: Story = {
  args: {
    size: "large",
    color: "$colorTertiary",
  },
};

/**
 * Color variant - success
 */
export const ColorSuccess: Story = {
  args: {
    size: "large",
    color: "$success",
  },
};

/**
 * Color variant - warning
 */
export const ColorWarning: Story = {
  args: {
    size: "large",
    color: "$warning",
  },
};

/**
 * Color variant - danger
 */
export const ColorDanger: Story = {
  args: {
    size: "large",
    color: "$danger",
  },
};

/**
 * Color variant - background
 * Useful on dark surfaces
 */
export const ColorBackground: Story = {
  args: {
    size: "large",
    color: "$background",
  },
  decorators: [
    (Story) => (
      <Card
        style={{
          backgroundColor: "#1a1a1a",
          padding: "16px",
        }}
      >
        <Story />
      </Card>
    ),
  ],
};

/**
 * Color variant - white
 */
export const ColorWhite: Story = {
  args: {
    size: "large",
    color: "$white",
  },
  decorators: [
    (Story) => (
      <Card
        style={{
          backgroundColor: "#1a1a1a",
          padding: "16px",
        }}
      >
        <Story />
      </Card>
    ),
  ],
};

/**
 * All sizes displayed together
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      <div style={{ textAlign: "center" }}>
        <Spinner size="small" color="$primary" />
        <Text fontSize="$sm" marginTop="$2">
          Small
        </Text>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner color="$primary" />
        <Text fontSize="$sm" marginTop="$2">
          Default (~24px)
        </Text>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner size="large" color="$primary" />
        <Text fontSize="$sm" marginTop="$2">
          Large
        </Text>
      </div>
    </div>
  ),
};

/**
 * All colors displayed together
 */
export const AllColors: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
      <div style={{ textAlign: "center" }}>
        <Spinner size="large" color="$primary" />
        <Text fontSize="$sm" marginTop="$2">
          Primary
        </Text>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner size="large" color="$color" />
        <Text fontSize="$sm" marginTop="$2">
          Color
        </Text>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner size="large" color="$colorMuted" />
        <Text fontSize="$sm" marginTop="$2">
          Muted
        </Text>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner size="large" color="$success" />
        <Text fontSize="$sm" marginTop="$2">
          Success
        </Text>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner size="large" color="$warning" />
        <Text fontSize="$sm" marginTop="$2">
          Warning
        </Text>
      </div>
      <div style={{ textAlign: "center" }}>
        <Spinner size="large" color="$danger" />
        <Text fontSize="$sm" marginTop="$2">
          Danger
        </Text>
      </div>
    </div>
  ),
};

/**
 * Loading state example
 * Real-world usage pattern
 */
export const LoadingStateExample: Story = {
  render: () => (
    <Card
      style={{
        width: "300px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <Spinner size="large" color="$primary" />
      <Text color="$colorMuted">Loading...</Text>
    </Card>
  ),
};

/**
 * Inline loading example
 * Spinner with text side by side
 */
export const InlineLoadingExample: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <Spinner size="small" color="$success" />
      <Text color="$success">Saving complete</Text>
    </div>
  ),
};

/**
 * Button loading example
 * Spinner inside a button context
 */
export const ButtonLoadingExample: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "16px" }}>
      <Card
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "var(--primary)",
        }}
      >
        <Spinner size="small" color="$background" />
        <Text color="$background">Loading...</Text>
      </Card>
    </div>
  ),
};
