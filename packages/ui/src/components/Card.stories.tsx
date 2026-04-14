/**
 * Card Component Stories
 *
 * Stories for the Card component demonstrating all variants, sizes,
 * and elevation styles with full Tamagui theming support.
 *
 * @see https://storybook.js.org/docs/writing-stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";
import { Text } from "./Text";

/**
 * Storybook metadata for the Card component
 */
const meta: Meta<typeof Card> = {
  title: "Components/Primitives/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A foundational container component with theme-aware background styling.

## Features
- Uses \`$background\` theme token for automatic light/dark mode support
- 3 size variants: sm, md, lg
- 4 elevation levels: none, sm, md, lg
- Optional border styling
- Full-width option

## Usage
\`\`\`tsx
import { Card, Text } from "@mirai-app/ui";

<Card size="md" elevation="sm">
  <Text>Card content</Text>
</Card>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the card (controls padding)",
      table: {
        defaultValue: { summary: "md" },
      },
    },
    elevation: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
      description: "The elevation/shadow level of the card",
      table: {
        defaultValue: { summary: "sm" },
      },
    },
    bordered: {
      control: "boolean",
      description: "Whether to show a border",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    fullWidth: {
      control: "boolean",
      description: "Whether the card takes up the full width",
      table: {
        defaultValue: { summary: "false" },
      },
    },
  },
  args: {
    size: "md",
    elevation: "sm",
    bordered: false,
    fullWidth: false,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default card appearance
 */
export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <Text>This is a basic card with default styling.</Text>
    </Card>
  ),
};

/**
 * Small card size
 * Compact padding for dense layouts
 */
export const Small: Story = {
  args: {
    size: "sm",
  },
  render: (args) => (
    <Card {...args}>
      <Text fontSize="$sm">Small card with compact padding.</Text>
    </Card>
  ),
};

/**
 * Medium card size (default)
 * Standard padding for most use cases
 */
export const Medium: Story = {
  args: {
    size: "md",
  },
  render: (args) => (
    <Card {...args}>
      <Text>Medium card with standard padding (default).</Text>
    </Card>
  ),
};

/**
 * Large card size
 * Generous padding for prominent content
 */
export const Large: Story = {
  args: {
    size: "lg",
  },
  render: (args) => (
    <Card {...args}>
      <Text fontSize="$lg">Large card with generous padding.</Text>
    </Card>
  ),
};

/**
 * No elevation
 * Flat card without shadow
 */
export const NoElevation: Story = {
  args: {
    elevation: "none",
    bordered: true,
  },
  render: (args) => (
    <Card {...args}>
      <Text>Card without elevation (flat).</Text>
    </Card>
  ),
};

/**
 * Small elevation (default)
 * Subtle shadow for depth
 */
export const SmallElevation: Story = {
  args: {
    elevation: "sm",
  },
  render: (args) => (
    <Card {...args}>
      <Text>Card with small elevation (default).</Text>
    </Card>
  ),
};

/**
 * Medium elevation
 * Moderate shadow for more prominence
 */
export const MediumElevation: Story = {
  args: {
    elevation: "md",
  },
  render: (args) => (
    <Card {...args}>
      <Text>Card with medium elevation.</Text>
    </Card>
  ),
};

/**
 * Large elevation
 * Strong shadow for maximum prominence
 */
export const LargeElevation: Story = {
  args: {
    elevation: "lg",
  },
  render: (args) => (
    <Card {...args}>
      <Text>Card with large elevation.</Text>
    </Card>
  ),
};

/**
 * Bordered card
 * Shows border around the card
 */
export const Bordered: Story = {
  args: {
    bordered: true,
    elevation: "none",
  },
  render: (args) => (
    <Card {...args}>
      <Text>Card with border styling.</Text>
    </Card>
  ),
};

/**
 * Full width card
 * Takes up 100% of container width
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
  render: (args) => (
    <Card {...args}>
      <Text>Full-width card that spans its container.</Text>
    </Card>
  ),
  parameters: {
    layout: "padded",
  },
};

/**
 * All sizes displayed together
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card size="sm">
        <Text fontSize="$sm">Small Card</Text>
      </Card>
      <Card size="md">
        <Text>Medium Card (Default)</Text>
      </Card>
      <Card size="lg">
        <Text fontSize="$lg">Large Card</Text>
      </Card>
    </div>
  ),
};

/**
 * All elevations displayed together
 */
export const AllElevations: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card elevation="none" bordered>
        <Text>No Elevation (with border)</Text>
      </Card>
      <Card elevation="sm">
        <Text>Small Elevation (default)</Text>
      </Card>
      <Card elevation="md">
        <Text>Medium Elevation</Text>
      </Card>
      <Card elevation="lg">
        <Text>Large Elevation</Text>
      </Card>
    </div>
  ),
};

/**
 * Complex card content
 * Demonstrates real-world usage with multiple elements
 */
export const ComplexContent: Story = {
  render: () => (
    <Card size="md" elevation="md" style={{ width: "300px" }}>
      <Text fontSize="$xl" fontWeight="$medium" color="primary">
        Card Title
      </Text>
      <Text color="muted">
        This card demonstrates complex content with multiple text elements and
        different colors.
      </Text>
    </Card>
  ),
};
