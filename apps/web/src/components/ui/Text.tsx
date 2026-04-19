/**
 * Text Component - Web UI Primitive Wrapper
 *
 * Thin wrapper around @mirai-app/ui Text component for web-specific usage.
 * Re-exports all typography components and props from the base component.
 *
 * @example
 * ```tsx
 * import { Text, H1, Body } from '@/components/ui/Text';
 *
 * <H1>Main Heading</H1>
 * <Body>Body text content</Body>
 * ```
 */

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
  SizableText,
  Paragraph,
  Heading,
} from "@mirai-app/ui";
