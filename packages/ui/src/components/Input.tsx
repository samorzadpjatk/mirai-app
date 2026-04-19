/**
 * Input Component - Tier 1 Primitive
 *
 * Form input with label and error support.
 * Uses Tamagui's Input base with integrated Label and error messaging.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 *   error={emailError}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <Input
 *   label="Password"
 *   type="password"
 *   placeholder="Enter password"
 *   required
 *   helperText="Must be at least 8 characters"
 * />
 * ```
 */

import {
  Input as TamaguiInput,
  Label as TamaguiLabel,
  Text,
  YStack,
  XStack,
  styled,
} from "tamagui";
import type { InputProps as TamaguiInputProps, TamaguiElement } from "tamagui";
import React, { forwardRef } from "react";

/**
 * Input size variants
 */
export type InputSize = "sm" | "md" | "lg";

/**
 * Input variant styles
 */
export type InputVariant = "outline" | "filled" | "underlined";

/**
 * Props for the Input component
 */
export interface InputProps extends Omit<TamaguiInputProps, "size" | "onChange" | "onBlur"> {
  /** Input size variant */
  size?: InputSize;
  /** Visual style variant */
  variant?: InputVariant;
  /** Label text displayed above input */
  label?: string;
  /** Error message displayed below input */
  error?: string;
  /** Helper text displayed below input (when no error) */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom ID for label association */
  id?: string;
  /** Name attribute for form integration */
  name?: string;
  /** HTML input type */
  type?: string;
  /** Minimum value (for number inputs) */
  min?: number | string;
  /** Maximum value (for number inputs) */
  max?: number | string;
  /** Step value (for number inputs) */
  step?: string | number;
  /** Callback when input value changes (string-based for direct usage) */
  onChangeText?: (value: string) => void;
  /** Callback when input changes (event-based for react-hook-form compatibility) */
  onChange?: (e: { target: { value: string; name?: string }; type?: string }) => void;
  /** Callback when input loses focus (for react-hook-form compatibility) */
  onBlur?: (event: { target: { value: string; name?: string }; type?: string }) => void;
}

/**
 * Styled Input component with consistent theming
 */
const StyledInput = styled(TamaguiInput, {
  name: "Input",

  // Base styles
  backgroundColor: "$background",
  color: "$color",
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$md",

  // Typography
  fontFamily: "$body",
  fontSize: "$base",

  // Placeholder styling via the native placeholderTextColor theme token
  placeholderTextColor: "$placeholderColor",

  // Focus state
  focusStyle: {
    borderColor: "$primary",
    borderWidth: 2,
  },

  // Hover state (web only)
  hoverStyle: {
    borderColor: "$borderColorHover",
  },

  // Disabled state
  disabledStyle: {
    backgroundColor: "$background",
    opacity: 0.5,
    cursor: "not-allowed",
  },

  // Error state (applied when data-error attribute is present)
  variants: {
    hasError: {
      true: {
        borderColor: "$danger",
        borderWidth: 2,
        focusStyle: {
          borderColor: "$dangerFocus",
        },
      },
    },

    size: {
      sm: {
        height: "$buttonSm",
        paddingHorizontal: "$3",
        fontSize: "$sm",
      },
      md: {
        height: "$inputHeight",
        paddingHorizontal: "$4",
        fontSize: "$base",
      },
      lg: {
        height: "$buttonLg",
        paddingHorizontal: "$5",
        fontSize: "$lg",
      },
    },

    variant: {
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$borderColor",
      },
      filled: {
        backgroundColor: "$backgroundStrong",
        borderWidth: 0,
        borderColor: "transparent",
        focusStyle: {
          backgroundColor: "$background",
          borderWidth: 1,
          borderColor: "$primary",
        },
      },
      underlined: {
        backgroundColor: "transparent",
        borderWidth: 0,
        borderBottomWidth: 1,
        borderRadius: 0,
        paddingHorizontal: 0,
        focusStyle: {
          borderBottomWidth: 2,
          borderColor: "$primary",
        },
      },
    },
  } as const,

  defaultVariants: {
    size: "md",
    variant: "outline",
  },
});

/**
 * Styled Label component
 */
const StyledLabel = styled(TamaguiLabel, {
  name: "InputLabel",

  color: "$color",
  fontSize: "$sm",
  fontWeight: "500",
  fontFamily: "$body",
  marginBottom: "$2",

  variants: {
    required: {
      true: {
        // Add asterisk via after pseudo-element on web
        // On native, we'll handle this separately
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
      },
    },
  } as const,
});

/**
 * Error message text styling
 */
const ErrorText = styled(Text, {
  name: "InputError",

  color: "$danger",
  fontSize: "$sm",
  fontFamily: "$body",
  marginTop: "$2",
});

/**
 * Helper text styling
 */
const HelperText = styled(Text, {
  name: "InputHelper",

  color: "$colorMuted",
  fontSize: "$sm",
  fontFamily: "$body",
  marginTop: "$2",
});

/**
 * Required indicator (asterisk)
 */
const RequiredIndicator = styled(Text, {
  name: "RequiredIndicator",

  color: "$danger",
  fontSize: "$sm",
  marginLeft: "$1",
});

/**
 * Container for the entire input field
 */
const InputContainer = styled(YStack, {
  name: "InputContainer",

  width: "100%",

  variants: {
    disabled: {
      true: {
        opacity: 0.7,
      },
    },
  } as const,
});

/**
 * Input component with integrated label and error support
 *
 * This is a Tier 1 primitive that provides a complete form field experience
 * with consistent theming across web and native platforms.
 */
export const Input = forwardRef<
  React.ElementRef<typeof TamaguiInput>,
  InputProps
>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      disabled = false,
      id,
      size = "md",
      variant = "outline",
      onChange,
      onChangeText,
      onBlur,
      name,
      ...inputProps
    },
    ref,
  ) => {
    // Generate a stable ID for label association if not provided
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Determine which descriptive text to announce (error takes precedence)
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    // Handle both react-hook-form's onChange (event-based) and direct onChangeText (string-based)
    const handleChangeText = (value: string) => {
      // Call onChangeText if provided (direct string handler)
      if (onChangeText) {
        onChangeText(value);
      }
      // Call onChange if provided (react-hook-form event handler)
      if (onChange) {
        onChange({ target: { value, name } });
      }
    };

    return (
      <InputContainer disabled={disabled}>
        {/* Label */}
        {label && (
          <XStack alignItems="center">
            <StyledLabel
              htmlFor={inputId}
              disabled={disabled}
              required={required}
            >
              {label}
            </StyledLabel>
            {required && <RequiredIndicator>*</RequiredIndicator>}
          </XStack>
        )}

        {/* Input field */}
        <StyledInput
          ref={ref}
          id={inputId}
          size={size}
          variant={variant}
          hasError={!!error}
          disabled={disabled}
          aria-invalid={!!error}
          aria-errormessage={error ? errorId : undefined}
          aria-describedby={describedBy}
          aria-required={required}
          editable={!disabled}
          onChangeText={handleChangeText}
          onBlur={onBlur as (e: unknown) => void}
          {...inputProps}
        />

        {/* Error message or helper text */}
        {error ? (
          <ErrorText id={errorId} role="alert">
            {error}
          </ErrorText>
        ) : helperText ? (
          <HelperText id={helperId}>{helperText}</HelperText>
        ) : null}
      </InputContainer>
    );
  },
);

Input.displayName = "Input";

/**
 * Standalone Label component for custom layouts
 *
 * Use this when you need a label separate from the Input component,
 * for example in complex form layouts.
 */
export const InputLabel: React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<typeof TamaguiLabel>
> = StyledLabel;

/**
 * Standalone helper text component
 */
export const InputHelper = HelperText;

/**
 * Standalone error text component
 */
export const InputError = ErrorText;

export default Input;
