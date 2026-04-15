// Component exports
// Phase 2: Tier 1 primitives - Barrel export
// @module @mirai-app/ui/components

// Button - Button primitive with variants: primary, secondary, ghost, danger
export {
  Button,
  StyledButtonFrame,
  StyledButtonText,
  type ButtonProps,
  type StyledButtonFrameProps,
  type StyledButtonTextProps,
  type ButtonVariant,
  type ButtonSize,
} from "./Button";

// Card - Container primitive with theme background
export { Card, type CardProps } from "./Card";

// ErrorMessage - Error state display component
export { ErrorMessage, type ErrorMessageProps } from "./ErrorMessage";

// Image - Cross-platform image primitive
export { Image, type ImageProps } from "./Image";

// Input - Form input with label/error support
export {
  Input,
  InputLabel,
  InputHelper,
  InputError,
  type InputProps,
  type InputSize,
  type InputVariant,
} from "./Input";

// LoadingSpinner - Loading indicator with optional label
export { LoadingSpinner, type LoadingSpinnerProps } from "./LoadingSpinner";

// Select - Cross-platform dropdown/select primitive
export {
  Select,
  type SelectProps,
  type SelectItemProps,
  type SelectGroupProps,
  type SelectLabelProps,
} from "./Select";

// Sheet - Cross-platform modal/sheet primitive (replaces Modal)
export { Sheet, type SheetProps } from "./Sheet";

// Spinner - Loading indicator primitive
export {
  Spinner,
  type SpinnerProps,
  type SpinnerSize,
  type SpinnerColor,
} from "./Spinner";

// Text - Typography primitive with variants: h1-h6, body, caption, label, etc.
export {
  Text,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Body,
  Caption,
  LabelText,
  type TextProps,
  // Re-export additional Tamagui text primitives
  SizableText,
  Paragraph,
  Heading,
} from "./Text";
