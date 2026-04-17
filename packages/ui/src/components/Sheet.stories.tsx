/**
 * Sheet Component Stories
 *
 * Stories for the Sheet component demonstrating all variants,
 * positions, and states with full Tamagui theming support.
 *
 * @see https://storybook.js.org/docs/writing-stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Sheet } from "./Sheet";
import { Button } from "./Button";
import { Text } from "./Text";

/**
 * Storybook metadata for the Sheet component
 */
const meta: Meta<typeof Sheet> = {
  title: "Components/Primitives/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A cross-platform modal/sheet component.

## Features
- **Web**: Modal dialog with overlay (centered, max-width constrained)
- **Native**: Bottom sheet that slides up from the bottom
- Configurable snap points
- Optional title with close button
- Overlay backdrop support
- Dismiss on overlay press/swipe

## Usage
\`\`\`tsx
import { Sheet, Button, Text } from "@mirai-app/ui";

const [open, setOpen] = useState(false);

<Button onPress={() => setOpen(true)}>Open Sheet</Button>
<Sheet open={open} onOpenChange={setOpen} title="Sheet Title">
  <Text>Sheet content goes here</Text>
</Sheet>
\`\`\`
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controls whether the sheet is visible",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    onOpenChange: {
      action: "open changed",
      description: "Callback when the open state changes",
    },
    title: {
      control: "text",
      description: "Optional title displayed in the sheet header",
    },
    position: {
      control: "select",
      options: ["modal", "bottom"],
      description: "Sheet positioning variant",
      table: {
        defaultValue: { summary: "bottom" },
      },
    },
    snapPoints: {
      control: "object",
      description: "Snap points for sheet height (percentages, native only)",
      table: {
        defaultValue: { summary: "[85]" },
      },
    },
    overlay: {
      control: "boolean",
      description: "Whether to show the overlay/background dim",
      table: {
        defaultValue: { summary: "true" },
      },
    },
    dismissOnOverlayPress: {
      control: "boolean",
      description: "Whether the sheet can be dismissed by clicking overlay",
      table: {
        defaultValue: { summary: "true" },
      },
    },
    dismissOnSnapToBottom: {
      control: "boolean",
      description: "Whether the sheet can be dismissed by swiping down",
      table: {
        defaultValue: { summary: "true" },
      },
    },
    maxWidth: {
      control: "number",
      description: "Maximum width of the sheet (modal variant only)",
      table: {
        defaultValue: { summary: "480" },
      },
    },
    contentPadding: {
      control: "number",
      description: "Additional padding for sheet content",
      table: {
        defaultValue: { summary: "16" },
      },
    },
  },
  args: {
    open: false,
    position: "bottom",
    overlay: true,
    dismissOnOverlayPress: true,
    dismissOnSnapToBottom: true,
    maxWidth: 480,
    contentPadding: 16,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Interactive wrapper for controlled sheet stories
 */
const InteractiveSheet = (
  props: Partial<React.ComponentProps<typeof Sheet>>,
) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Open Sheet</Button>
      <Sheet
        {...(props as React.ComponentProps<typeof Sheet>)}
        open={open}
        onOpenChange={setOpen}
      >
        {props.children || <Text>Sheet content goes here.</Text>}
      </Sheet>
    </>
  );
};

/**
 * Default sheet appearance
 */
export const Default: Story = {
  args: {
    title: "Sheet Title",
    children: <Text>Basic sheet content</Text>,
  },
  render: (args) => <InteractiveSheet {...args} />,
};

/**
 * Modal position (centered)
 * Shows as a centered modal on web
 */
export const Modal: Story = {
  args: {
    position: "modal",
    title: "Modal Title",
    children: <Text>Centered modal content.</Text>,
  },
  render: (args) => <InteractiveSheet {...args} />,
};

/**
 * Bottom position
 * Slides up from the bottom
 */
export const Bottom: Story = {
  args: {
    position: "bottom",
    title: "Bottom Sheet",
    children: <Text>Bottom sheet content.</Text>,
  },
  render: (args) => <InteractiveSheet {...args} />,
};

/**
 * Sheet without title
 * No header section, just close button
 */
export const WithoutTitle: Story = {
  args: {
    title: undefined,
    position: "modal",
    children: <Text>Sheet with no title but close button available.</Text>,
  },
  render: (args) => <InteractiveSheet {...args} />,
};

/**
 * Sheet without overlay
 * No dimmed background
 */
export const WithoutOverlay: Story = {
  args: {
    overlay: false,
    title: "No Overlay",
    position: "modal",
    children: <Text>Sheet without overlay backdrop.</Text>,
  },
  render: (args) => <InteractiveSheet {...args} />,
};

/**
 * Custom snap points
 * Different height percentages
 */
export const CustomSnapPoints: Story = {
  args: {
    snapPoints: [50, 75, 90],
    title: "Custom Snap Points",
    position: "bottom",
    children: (
      <>
        <Text>Custom snap points at 50%, 75%, and 90%.</Text>
        <Text fontSize="$sm" color="$colorMuted" marginTop="$4">
          Users can drag between these heights.
        </Text>
      </>
    ),
  },
  render: (args) => <InteractiveSheet {...args} />,
};

/**
 * Sheet with long content
 * Demonstrates scrollable content
 */
export const LongContent: Story = {
  args: {
    title: "Long Content",
    position: "modal",
    children: (
      <>
        <Text>Sheet with scrollable content.</Text>
        {Array.from({ length: 20 }).map((_, i) => (
          <Text key={i} fontSize="$sm" marginTop="$2">
            Line {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing
            elit.
          </Text>
        ))}
      </>
    ),
  },
  render: (args) => <InteractiveSheet {...args} />,
};

/**
 * Non-dismissible sheet
 * Cannot be closed via overlay or swipe
 */
export const NonDismissible: Story = {
  args: {
    title: "Non-Dismissible",
    position: "modal",
    dismissOnOverlayPress: false,
    dismissOnSnapToBottom: false,
    children: (
      <>
        <Text>
          This sheet cannot be dismissed by clicking overlay or swiping.
        </Text>
        <Text fontSize="$sm" color="$colorMuted" marginTop="$4">
          Users must use the close button or complete an action.
        </Text>
      </>
    ),
  },
  render: (args) => <InteractiveSheet {...args} />,
};

/**
 * All positions displayed (story only)
 */
export const AllPositions: Story = {
  render: () => {
    const AllPositionsComponent = () => {
      const [modalOpen, setModalOpen] = useState(false);
      const [bottomOpen, setBottomOpen] = useState(false);

      return (
        <div style={{ display: "flex", gap: "16px" }}>
          <Button onPress={() => setModalOpen(true)}>Open Modal</Button>
          <Button onPress={() => setBottomOpen(true)}>Open Bottom Sheet</Button>

          <Sheet
            open={modalOpen}
            onOpenChange={setModalOpen}
            position="modal"
            title="Modal"
          >
            <Text>Centered modal dialog.</Text>
          </Sheet>

          <Sheet
            open={bottomOpen}
            onOpenChange={setBottomOpen}
            position="bottom"
            title="Bottom Sheet"
          >
            <Text>Sheet sliding from bottom.</Text>
          </Sheet>
        </div>
      );
    };
    return <AllPositionsComponent />;
  },
};

/**
 * Form example in sheet
 * Real-world usage pattern
 */
export const FormExample: Story = {
  render: () => {
    const FormExampleComponent = () => {
      const [open, setOpen] = useState(false);

      return (
        <>
          <Button onPress={() => setOpen(true)}>Open Form Sheet</Button>
          <Sheet
            open={open}
            onOpenChange={setOpen}
            position="modal"
            title="Edit Profile"
            snapPoints={[60]}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Text>Form content inside a sheet.</Text>
              <Text fontSize="$sm" color="$colorMuted">
                Form fields would go here in a real implementation.
              </Text>
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <Button variant="secondary" onPress={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onPress={() => setOpen(false)}>Save</Button>
              </div>
            </div>
          </Sheet>
        </>
      );
    };
    return <FormExampleComponent />;
  },
};
