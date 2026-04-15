/**
 * Select Component - Tier 1 Primitive
 *
 * Cross-platform dropdown/select component built on Tamagui's Select.
 * Provides a consistent selection interface for web and native platforms.
 *
 * Features:
 * - Cross-platform dropdown (web uses native HTML select, native uses custom implementation)
 * - Full keyboard navigation support (web)
 * - Form integration with label and error message support
 * - Theme token integration for consistent styling
 * - Disabled state and placeholder support
 * - Grouped options support
 *
 * @example
 * ```tsx
 * <Select
 *   label="Choose a country"
 *   placeholder="Select a country"
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 * >
 *   <Select.Item index={0} value="us">United States</Select.Item>
 *   <Select.Item index={1} value="uk">United Kingdom</Select.Item>
 * </Select>
 * ```
 *
 * @example With groups
 * ```tsx
 * <Select label="Fruit" value={value} onValueChange={setValue}>
 *   <Select.Group>
 *     <Select.Label>Citrus</Select.Label>
 *     <Select.Item index={0} value="orange">Orange</Select.Item>
 *     <Select.Item index={1} value="lemon">Lemon</Select.Item>
 *   </Select.Group>
 *   <Select.Group>
 *     <Select.Label>Berries</Select.Label>
 *     <Select.Item index={2} value="strawberry">Strawberry</Select.Item>
 *   </Select.Group>
 * </Select>
 * ```
 *
 * @see https://tamagui.dev/ui/select
 */

import React from "react";
import {
  Adapt,
  Select as TamaguiSelect,
  Sheet,
  YStack,
  XStack,
  SizableText,
  Separator,
} from "tamagui";
import type {
  SelectProps as TamaguiSelectBaseProps,
  SelectItemProps as TamaguiItemProps,
} from "tamagui";

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the Select Item component
 */
export interface SelectItemProps {
  /** Unique index for keyboard navigation */
  index: number;
  /** Value when this item is selected */
  value: string;
  /** Display text (if different from value) */
  children: React.ReactNode;
  /** Whether this item is disabled */
  disabled?: boolean;
}

/**
 * Props for the Select Group component
 */
export interface SelectGroupProps {
  /** Group content */
  children: React.ReactNode;
}

/**
 * Props for the Select Label component
 */
export interface SelectLabelProps {
  /** Label text */
  children: React.ReactNode;
}

/**
 * Props for the main Select component
 */
export interface SelectProps {
  /** Controlled value of the select */
  value?: string;
  /** Default value for uncontrolled usage */
  defaultValue?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Callback when selection is opened */
  onOpenChange?: (open: boolean) => void;
  /** Whether the select is open (controlled) */
  open?: boolean;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Label text displayed above the select */
  label?: string;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Name attribute for form integration */
  name?: string;
  /** Size variant of the select trigger */
  size?: "sm" | "md" | "lg";
  /** Visual variant of the select trigger */
  variant?: "outline" | "filled" | "ghost";
  /** Additional className for styling */
  className?: string;
  /** Content - Select.Item and Select.Group components */
  children: React.ReactNode;
  /** ID for accessibility */
  id?: string;
  /** Native ID for form integration */
  nativeID?: string;
}

// ============================================================================
// Helper Types for Size/Variant Styles
// ============================================================================

type SizeStyles = {
  height: number;
  paddingHorizontal: number;
  fontSize: number;
  iconSize: number;
};

// ============================================================================
// Size Configuration
// ============================================================================

const SIZE_STYLES: Record<NonNullable<SelectProps["size"]>, SizeStyles> = {
  sm: {
    height: 32,
    paddingHorizontal: 12,
    fontSize: 14,
    iconSize: 16,
  },
  md: {
    height: 40,
    paddingHorizontal: 16,
    fontSize: 16,
    iconSize: 18,
  },
  lg: {
    height: 48,
    paddingHorizontal: 20,
    fontSize: 16,
    iconSize: 20,
  },
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Select Item - Individual selectable option
 *
 * @example
 * ```tsx
 * <Select.Item index={0} value="option1">Option 1</Select.Item>
 * ```
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof TamaguiSelect.Item>,
  SelectItemProps &
    Omit<TamaguiItemProps, "index" | "value" | "children" | "disabled">
>(({ index, value, children, disabled }, ref) => {
  return (
    <TamaguiSelect.Item
      ref={ref}
      index={index}
      value={value}
      disabled={disabled}
      backgroundColor="$background"
      pressStyle={{ backgroundColor: "$backgroundPress" }}
      hoverStyle={{ backgroundColor: "$backgroundHover" }}
      paddingVertical="$2"
      paddingHorizontal="$3"
    >
      <TamaguiSelect.ItemText
        color={disabled ? "$colorMuted" : "$color"}
        fontSize="$4"
        fontFamily="$body"
      >
        {children}
      </TamaguiSelect.ItemText>
      <TamaguiSelect.ItemIndicator marginLeft="auto">
        <SizableText color="$color">✓</SizableText>
      </TamaguiSelect.ItemIndicator>
    </TamaguiSelect.Item>
  );
});

SelectItem.displayName = "Select.Item";

/**
 * Select Group - Groups related options with a label
 *
 * @example
 * ```tsx
 * <Select.Group>
 *   <Select.Label>Group Label</Select.Label>
 *   <Select.Item index={0} value="opt1">Option 1</Select.Item>
 * </Select.Group>
 * ```
 */
const SelectGroup = React.forwardRef<
  React.ElementRef<typeof TamaguiSelect.Group>,
  React.ComponentPropsWithoutRef<typeof TamaguiSelect.Group>
>(({ children, ...props }, ref) => {
  return (
    <TamaguiSelect.Group ref={ref} {...props}>
      {children}
    </TamaguiSelect.Group>
  );
});

SelectGroup.displayName = "Select.Group";

/**
 * Select Label - Label for a group of items
 *
 * @example
 * ```tsx
 * <Select.Label>Group Name</Select.Label>
 * ```
 */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof TamaguiSelect.Label>,
  SelectLabelProps
>(({ children }, ref) => {
  return (
    <TamaguiSelect.Label
      ref={ref}
      paddingVertical="$1"
      paddingHorizontal="$3"
      fontSize="$2"
      fontWeight={600}
      color="$colorMuted"
    >
      {children}
    </TamaguiSelect.Label>
  );
});

SelectLabel.displayName = "Select.Label";

/**
 * Select Scroll Up Button - Scroll indicator for the list
 */
const SelectScrollUpButton = TamaguiSelect.ScrollUpButton;

/**
 * Select Scroll Down Button - Scroll indicator for the list
 */
const SelectScrollDownButton = TamaguiSelect.ScrollDownButton;

/**
 * Select Viewport - Container for the scrollable item list
 */
const SelectViewport = TamaguiSelect.Viewport;

/**
 * Select Content - Wrapper for the dropdown content
 */
const SelectContent = TamaguiSelect.Content;

/**
 * Select Trigger - The button that opens the dropdown
 *
 * Internal component used by the main Select component.
 */
interface SelectTriggerProps extends Omit<
  React.ComponentPropsWithoutRef<typeof TamaguiSelect.Trigger>,
  "size"
> {
  size: SizeStyles;
  variant: NonNullable<SelectProps["variant"]>;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof TamaguiSelect.Trigger>,
  SelectTriggerProps
>(
  (
    { size, variant, disabled, hasError, placeholder, children, ...props },
    ref,
  ) => {
    // Get variant-based border colors
    const getBorderColor = () => {
      if (disabled) return "$borderColor";
      if (hasError) return "$danger";
      return "$borderColor";
    };

    return (
      <TamaguiSelect.Trigger
        ref={ref}
        height={size.height}
        paddingHorizontal={size.paddingHorizontal}
        backgroundColor="$background"
        borderColor={getBorderColor()}
        borderWidth={1}
        borderRadius="$3"
        disabled={disabled}
        opacity={disabled ? 0.5 : 1}
        hoverStyle={{
          borderColor: hasError ? "$danger" : "$borderColorHover",
          backgroundColor: "$backgroundHover",
        }}
        pressStyle={{
          borderColor: hasError ? "$danger" : "$borderColorPress",
          backgroundColor: "$backgroundPress",
        }}
        focusStyle={{
          borderColor: hasError ? "$danger" : "$primary",
        }}
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        {...props}
      >
        <TamaguiSelect.Value
          color={children ? "$color" : "$placeholderColor"}
          fontSize={size.fontSize}
          fontFamily="$body"
          placeholder={placeholder}
        >
          {children}
        </TamaguiSelect.Value>
        <XStack alignItems="center" justifyContent="center">
          <TamaguiSelect.Icon disabled={disabled}>
            <SizableText
              fontSize={size.iconSize}
              color={disabled ? "$colorMuted" : "$color"}
            >
              ▼
            </SizableText>
          </TamaguiSelect.Icon>
        </XStack>
      </TamaguiSelect.Trigger>
    );
  },
);

SelectTrigger.displayName = "Select.Trigger";

// ============================================================================
// Main Select Component
// ============================================================================

/**
 * Select - Cross-platform dropdown select component
 *
 * A Tier 1 primitive that provides consistent select/dropdown behavior
 * across web and native platforms.
 *
 * @example Basic usage
 * ```tsx
 * <Select
 *   label="Country"
 *   placeholder="Select a country"
 *   value={country}
 *   onValueChange={setCountry}
 * >
 *   <Select.Item index={0} value="us">United States</Select.Item>
 *   <Select.Item index={1} value="uk">United Kingdom</Select.Item>
 *   <Select.Item index={2} value="ca">Canada</Select.Item>
 * </Select>
 * ```
 *
 * @example With error state
 * ```tsx
 * <Select
 *   label="Country"
 *   error="Please select a country"
 *   value={country}
 *   onValueChange={setCountry}
 * >
 *   <Select.Item index={0} value="us">United States</Select.Item>
 * </Select>
 * ```
 *
 * @example With groups
 * ```tsx
 * <Select
 *   label="Fruit"
 *   value={fruit}
 *   onValueChange={setFruit}
 * >
 *   <Select.Group>
 *     <Select.Label>Citrus</Select.Label>
 *     <Select.Item index={0} value="orange">Orange</Select.Item>
 *     <Select.Item index={1} value="lemon">Lemon</Select.Item>
 *   </Select.Group>
 *   <Select.Separator />
 *   <Select.Group>
 *     <Select.Label>Berries</Select.Label>
 *     <Select.Item index={2} value="strawberry">Strawberry</Select.Item>
 *   </Select.Group>
 * </Select>
 * ```
 */
const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  onOpenChange,
  open,
  disabled = false,
  label,
  placeholder = "Select...",
  error,
  required = false,
  name,
  size = "md",
  variant = "outline",
  className,
  children,
  id,
  nativeID,
}) => {
  const sizeStyles = SIZE_STYLES[size];
  const hasError = Boolean(error);

  // Generate IDs for accessibility
  const triggerId =
    id || nativeID || `select-${Math.random().toString(36).slice(2, 9)}`;
  const labelId = `${triggerId}-label`;
  const errorId = hasError ? `${triggerId}-error` : undefined;

  return (
    <YStack gap="$1" width="100%" className={className}>
      {/* Label */}
      {label && (
        <SizableText
          id={labelId}
          size={size === "sm" ? "$3" : "$4"}
          fontWeight={500}
          color={disabled ? "$colorMuted" : "$color"}
          fontFamily="$body"
        >
          {label}
          {required && (
            <SizableText color="$danger" fontFamily="$body">
              {" *"}
            </SizableText>
          )}
        </SizableText>
      )}

      {/* Select Control */}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore - Tamagui Select generic type complexity */}
      <TamaguiSelect
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore */
        value={value}
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore */
        defaultValue={defaultValue}
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore */
        onValueChange={onValueChange}
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore */
        onOpenChange={onOpenChange}
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore */
        open={open}
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore */
        disabled={disabled}
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-ignore */
        name={name}
      >
        <Adapt when="sm" platform="touch">
          {/* Native Sheet adaptation for mobile */}
          <Sheet modal dismissOnSnapToBottom snapPoints={[50]}>
            <Sheet.Frame padding="$4" backgroundColor="$background">
              <Sheet.Handle backgroundColor="$borderColor" />
              <Adapt.Contents />
            </Sheet.Frame>
            <Sheet.Overlay backgroundColor="$overlay" />
          </Sheet>
        </Adapt>

        {/* Trigger */}
        <SelectTrigger
          size={sizeStyles}
          variant={variant}
          disabled={disabled}
          hasError={hasError}
          placeholder={placeholder}
          id={triggerId}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={errorId}
          aria-invalid={hasError}
        />

        {/* Dropdown Content */}
        <TamaguiSelect.Content zIndex={100}>
          <TamaguiSelect.ScrollUpButton
            alignItems="center"
            justifyContent="center"
            position="relative"
            width="100%"
            height="$3"
          >
            <SizableText color="$colorMuted">▲</SizableText>
          </TamaguiSelect.ScrollUpButton>

          <TamaguiSelect.Viewport minWidth={200}>
            <TamaguiSelect.Group>{children}</TamaguiSelect.Group>
          </TamaguiSelect.Viewport>

          <TamaguiSelect.ScrollDownButton
            alignItems="center"
            justifyContent="center"
            position="relative"
            width="100%"
            height="$3"
          >
            <SizableText color="$colorMuted">▼</SizableText>
          </TamaguiSelect.ScrollDownButton>
        </TamaguiSelect.Content>
      </TamaguiSelect>

      {/* Error Message */}
      {error && (
        <SizableText
          id={errorId}
          size="$3"
          color="$danger"
          fontFamily="$body"
          marginTop="$1"
        >
          {error}
        </SizableText>
      )}
    </YStack>
  );
};

Select.displayName = "Select";

// ============================================================================
// Attach Sub-components
// ============================================================================

type SelectComponent = React.FC<SelectProps> & {
  Item: typeof SelectItem;
  Group: typeof SelectGroup;
  Label: typeof SelectLabel;
  ScrollUpButton: typeof SelectScrollUpButton;
  ScrollDownButton: typeof SelectScrollDownButton;
  Viewport: typeof SelectViewport;
  Content: typeof SelectContent;
  Trigger: typeof TamaguiSelect.Trigger;
  Value: typeof TamaguiSelect.Value;
  Icon: typeof TamaguiSelect.Icon;
  Separator: typeof Separator;
};

// Attach sub-components
(Select as SelectComponent).Item = SelectItem;
(Select as SelectComponent).Group = SelectGroup;
(Select as SelectComponent).Label = SelectLabel;
(Select as SelectComponent).ScrollUpButton = SelectScrollUpButton;
(Select as SelectComponent).ScrollDownButton = SelectScrollDownButton;
(Select as SelectComponent).Viewport = SelectViewport;
(Select as SelectComponent).Content = SelectContent;
(Select as SelectComponent).Trigger = TamaguiSelect.Trigger;
(Select as SelectComponent).Value = TamaguiSelect.Value;
(Select as SelectComponent).Icon = TamaguiSelect.Icon;
(Select as SelectComponent).Separator = Separator;

export { Select };
export default Select;
