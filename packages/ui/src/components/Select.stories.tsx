/**
 * Select Component Stories
 *
 * Stories for the Select component demonstrating all variants, sizes,
 * and states with full Tamagui theming support.
 *
 * @see https://storybook.js.org/docs/writing-stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Select } from "./Select";

/**
 * Storybook metadata for the Select component
 */
const meta: Meta<typeof Select> = {
  title: "Components/Primitives/Select",
  component: Select,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A cross-platform dropdown/select component with label and error support.

## Features
- 3 visual variants: outline, filled, ghost
- 3 sizes: sm, md, lg
- Label support with required indicator
- Error message display
- Grouped options support
- Full keyboard navigation support (web)

## Usage
\`\`\`tsx
import { Select } from "@mirai-app/ui";

<Select
  label="Choose a country"
  placeholder="Select a country"
  value={selectedValue}
  onValueChange={setSelectedValue}
>
  <SelectItem index={0} value="us">United States</SelectItem>
  <SelectItem index={1} value="uk">United Kingdom</SelectItem>
</Select>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["outline", "filled", "ghost"],
      description: "The visual style variant of the select",
      table: {
        defaultValue: { summary: "outline" },
      },
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the select trigger",
      table: {
        defaultValue: { summary: "md" },
      },
    },
    label: {
      control: "text",
      description: "Label text displayed above the select",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text when no value selected",
    },
    error: {
      control: "text",
      description: "Error message displayed below the select",
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
      description: "Whether the select is disabled",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    value: {
      control: "text",
      description: "The currently selected value",
    },
    onValueChange: {
      action: "value changed",
      description: "Callback when the selected value changes",
    },
  },
  args: {
    variant: "outline",
    size: "md",
    label: "Select Option",
    placeholder: "Choose an option...",
    required: false,
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Sample options for stories
const countries = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
];

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "orange", label: "Orange" },
  { value: "grape", label: "Grape" },
];

// Access Select sub-components
const SelectItem = Select.Item;
const SelectGroup = Select.Group;
const SelectLabel = Select.Label;
const SelectSeparator = Select.Separator;

/**
 * Interactive wrapper for controlled select stories
 */
const InteractiveSelect = (
  props: Omit<React.ComponentProps<typeof Select>, "children">,
) => {
  const [value, setValue] = useState(props.value || "");
  return (
    <Select {...props} value={value} onValueChange={setValue}>
      {countries.map((country, index) => (
        <SelectItem key={country.value} index={index} value={country.value}>
          {country.label}
        </SelectItem>
      ))}
    </Select>
  );
};

/**
 * Default select appearance
 */
export const Default: Story = {
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Outline variant (default)
 */
export const Outline: Story = {
  args: {
    variant: "outline",
    label: "Outline Select",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Filled variant
 */
export const Filled: Story = {
  args: {
    variant: "filled",
    label: "Filled Select",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Ghost variant
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    label: "Ghost Select",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Small size
 */
export const Small: Story = {
  args: {
    size: "sm",
    label: "Small Select",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Medium size (default)
 */
export const Medium: Story = {
  args: {
    size: "md",
    label: "Medium Select",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Large size
 */
export const Large: Story = {
  args: {
    size: "lg",
    label: "Large Select",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Required field
 */
export const Required: Story = {
  args: {
    label: "Required Select",
    required: true,
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Disabled select
 */
export const Disabled: Story = {
  args: {
    label: "Disabled Select",
    disabled: true,
    value: "us",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Select with error
 */
export const WithError: Story = {
  args: {
    label: "Country",
    error: "Please select a country",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * Select without label
 */
export const WithoutLabel: Story = {
  args: {
    label: undefined,
    placeholder: "Select a country...",
  },
  render: (args) => <InteractiveSelect {...args} />,
};

/**
 * All variants displayed together
 */
export const AllVariants: Story = {
  render: () => {
    const [value1, setValue1] = useState("");
    const [value2, setValue2] = useState("");
    const [value3, setValue3] = useState("");

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "300px",
        }}
      >
        <Select
          variant="outline"
          label="Outline"
          value={value1}
          onValueChange={setValue1}
        >
          {fruits.map((fruit, index) => (
            <SelectItem key={fruit.value} index={index} value={fruit.value}>
              {fruit.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          variant="filled"
          label="Filled"
          value={value2}
          onValueChange={setValue2}
        >
          {fruits.map((fruit, index) => (
            <SelectItem key={fruit.value} index={index} value={fruit.value}>
              {fruit.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          variant="ghost"
          label="Ghost"
          value={value3}
          onValueChange={setValue3}
        >
          {fruits.map((fruit, index) => (
            <SelectItem key={fruit.value} index={index} value={fruit.value}>
              {fruit.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    );
  },
};

/**
 * All sizes displayed together
 */
export const AllSizes: Story = {
  render: () => {
    const [value1, setValue1] = useState("");
    const [value2, setValue2] = useState("");
    const [value3, setValue3] = useState("");

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "300px",
        }}
      >
        <Select
          size="sm"
          label="Small"
          value={value1}
          onValueChange={setValue1}
        >
          {fruits.map((fruit, index) => (
            <SelectItem key={fruit.value} index={index} value={fruit.value}>
              {fruit.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          size="md"
          label="Medium"
          value={value2}
          onValueChange={setValue2}
        >
          {fruits.map((fruit, index) => (
            <SelectItem key={fruit.value} index={index} value={fruit.value}>
              {fruit.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          size="lg"
          label="Large"
          value={value3}
          onValueChange={setValue3}
        >
          {fruits.map((fruit, index) => (
            <SelectItem key={fruit.value} index={index} value={fruit.value}>
              {fruit.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    );
  },
};

/**
 * Select with grouped options
 */
export const WithGroups: Story = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <div style={{ width: "300px" }}>
        <Select
          label="Food Category"
          value={value}
          onValueChange={setValue}
          placeholder="Select food"
        >
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem index={0} value="apple">
              Apple
            </SelectItem>
            <SelectItem index={1} value="banana">
              Banana
            </SelectItem>
            <SelectItem index={2} value="orange">
              Orange
            </SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem index={3} value="carrot">
              Carrot
            </SelectItem>
            <SelectItem index={4} value="broccoli">
              Broccoli
            </SelectItem>
            <SelectItem index={5} value="spinach">
              Spinach
            </SelectItem>
          </SelectGroup>
        </Select>
      </div>
    );
  },
};

/**
 * Form example with multiple selects
 */
export const FormExample: Story = {
  render: () => {
    const FormExampleComponent = () => {
      const [country, setCountry] = useState("");
      const [fruit, setFruit] = useState("");

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "300px",
          }}
        >
          <Select
            label="Country"
            value={country}
            onValueChange={setCountry}
            required
          >
            {countries.map((c, index) => (
              <SelectItem key={c.value} index={index} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </Select>
          <Select label="Favorite Fruit" value={fruit} onValueChange={setFruit}>
            {fruits.map((f, index) => (
              <SelectItem key={f.value} index={index} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      );
    };
    return <FormExampleComponent />;
  },
};
