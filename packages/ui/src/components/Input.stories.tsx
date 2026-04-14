/**
 * Input Component Stories
 *
 * Stories for the Input component demonstrating all variants, sizes,
 * and states with full Tamagui theming support.
 *
 * @see https://storybook.js.org/docs/writing-stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input } from "./Input";

/**
 * Storybook metadata for the Input component
 */
const meta: Meta<typeof Input> = {
  title: "Components/Primitives/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A form input component with label and error support.

## Features
- 3 visual variants: outline, filled, underlined
- 3 sizes: sm, md, lg
- Label support with required indicator
- Error message display
- Helper text support
- Full keyboard navigation support

## Usage
\`\`\`tsx
import { Input } from "@mirai-app/ui";

<Input
  label="Email"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["outline", "filled", "underlined"],
      description: "The visual style variant of the input",
      table: {
        defaultValue: { summary: "outline" },
      },
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the input",
      table: {
        defaultValue: { summary: "md" },
      },
    },
    label: {
      control: "text",
      description: "Label text displayed above the input",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when input is empty",
    },
    error: {
      control: "text",
      description: "Error message displayed below the input",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the input (when no error)",
    },
    required: {
      control: "boolean",
      description: "Whether the field is required",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    secureTextEntry: {
      control: "boolean",
      description: "Whether to mask the input (password field)",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    value: {
      control: "text",
      description: "The current value of the input",
    },
    onChangeText: {
      action: "text changed",
      description: "Callback when the input text changes",
    },
  },
  args: {
    variant: "outline",
    size: "md",
    label: "Label",
    placeholder: "Enter text...",
    required: false,
    disabled: false,
    secureTextEntry: false,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Interactive wrapper for controlled input stories
 */
const InteractiveInput = (props: React.ComponentProps<typeof Input>) => {
  const [value, setValue] = useState(props.value || "");
  return <Input {...props} value={value} onChangeText={setValue} />;
};

/**
 * Default input appearance
 */
export const Default: Story = {
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Outline variant (default)
 * Clean bordered input style
 */
export const Outline: Story = {
  args: {
    variant: "outline",
    label: "Outline Input",
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Filled variant
 * Input with background fill
 */
export const Filled: Story = {
  args: {
    variant: "filled",
    label: "Filled Input",
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Underlined variant
 * Minimal input with only bottom border
 */
export const Underlined: Story = {
  args: {
    variant: "underlined",
    label: "Underlined Input",
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Small input size
 */
export const Small: Story = {
  args: {
    size: "sm",
    label: "Small Input",
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Medium input size (default)
 */
export const Medium: Story = {
  args: {
    size: "md",
    label: "Medium Input",
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Large input size
 */
export const Large: Story = {
  args: {
    size: "lg",
    label: "Large Input",
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Required field
 * Shows asterisk indicator
 */
export const Required: Story = {
  args: {
    label: "Required Field",
    required: true,
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Disabled input
 * Non-editable with reduced opacity
 */
export const Disabled: Story = {
  args: {
    label: "Disabled Input",
    disabled: true,
    value: "Cannot edit this",
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Input with error
 * Shows error message and error styling
 */
export const WithError: Story = {
  args: {
    label: "Email",
    placeholder: "Enter email",
    error: "Please enter a valid email address",
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Input with helper text
 * Shows helpful information below input
 */
export const WithHelperText: Story = {
  args: {
    label: "Password",
    placeholder: "Enter password",
    helperText: "Must be at least 8 characters",
    secureTextEntry: true,
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * Password input
 * Masked text entry
 */
export const Password: Story = {
  args: {
    label: "Password",
    placeholder: "Enter password",
    secureTextEntry: true,
  },
  render: (args) => <InteractiveInput {...args} />,
};

/**
 * All variants displayed together
 */
export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "300px",
      }}
    >
      <InteractiveInput
        variant="outline"
        label="Outline"
        placeholder="Outline variant"
      />
      <InteractiveInput
        variant="filled"
        label="Filled"
        placeholder="Filled variant"
      />
      <InteractiveInput
        variant="underlined"
        label="Underlined"
        placeholder="Underlined variant"
      />
    </div>
  ),
};

/**
 * All sizes displayed together
 */
export const AllSizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "300px",
      }}
    >
      <InteractiveInput size="sm" label="Small" placeholder="Small size" />
      <InteractiveInput size="md" label="Medium" placeholder="Medium size" />
      <InteractiveInput size="lg" label="Large" placeholder="Large size" />
    </div>
  ),
};

/**
 * Form example with multiple inputs
 */
export const FormExample: Story = {
  render: () => {
    const FormExampleComponent = () => {
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [error, setError] = useState("");

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "300px",
          }}
        >
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            error={error}
            required
          />
          <Input
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            helperText="Must be at least 8 characters"
            required
          />
        </div>
      );
    };
    return <FormExampleComponent />;
  },
};
