/**
 * Button Component Stories
 *
 * Stories for the Button component demonstrating all variants, sizes,
 * and states with full Tamagui theming support.
 *
 * @see https://storybook.js.org/docs/writing-stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

/**
 * Storybook metadata for the Button component
 */
const meta: Meta<typeof Button> = {
  title: "Components/Primitives/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A versatile button component with multiple variants, sizes, and states.

## Features
- 4 visual variants: primary, secondary, ghost, danger
- 3 sizes: sm, md, lg
- Loading state with spinner
- Disabled state
- Full-width option
- Icon support (left/right)

## Usage
\`\`\`tsx
import { Button } from "@mirai-app/ui";

<Button variant="primary" size="md" onPress={handlePress}>
  Click me
</Button>
\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
      description: "The visual style variant of the button",
      table: {
        defaultValue: { summary: "primary" },
      },
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the button",
      table: {
        defaultValue: { summary: "md" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    isLoading: {
      control: "boolean",
      description: "Whether the button is in a loading state",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    fullWidth: {
      control: "boolean",
      description: "Whether the button takes up the full width",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    onPress: {
      action: "pressed",
      description: "Callback when the button is pressed",
    },
    children: {
      control: "text",
      description: "The content of the button",
    },
  },
  args: {
    variant: "primary",
    size: "md",
    disabled: false,
    isLoading: false,
    fullWidth: false,
    children: "Button",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Primary button variant (default)
 * Used for main call-to-action actions
 */
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

/**
 * Secondary button variant
 * Used for secondary actions
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

/**
 * Ghost button variant
 * Used for subtle actions or in tight spaces
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

/**
 * Danger button variant
 * Used for destructive actions like delete
 */
export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Danger Button",
  },
};

/**
 * Small button size
 */
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

/**
 * Medium button size (default)
 */
export const Medium: Story = {
  args: {
    size: "md",
    children: "Medium Button",
  },
};

/**
 * Large button size
 */
export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

/**
 * Loading button state
 * Shows a spinner and disables interaction
 */
export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Loading...",
  },
};

/**
 * Full-width button
 * Takes up the full width of its container
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: "Full Width Button",
  },
  parameters: {
    layout: "padded",
  },
};

/**
 * All variants displayed together
 */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
    </div>
  ),
};

/**
 * All sizes displayed together
 */
export const AllSizes: Story = {
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};
