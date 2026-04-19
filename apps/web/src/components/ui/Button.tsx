/**
 * Button Component - Web UI Primitive Wrapper
 *
 * Thin wrapper around @mirai-app/ui Button component for web-specific usage.
 * Re-exports all props and functionality from the base component.
 *
 * @example
 * ```tsx
 * import { Button } from '@/components/ui/Button';
 *
 * <Button variant="primary" onPress={handleClick}>
 *   Click Me
 * </Button>
 * ```
 */

export {
  Button,
  StyledButtonFrame,
  StyledButtonText,
  type ButtonProps,
  type StyledButtonFrameProps,
  type StyledButtonTextProps,
  type ButtonVariant,
  type ButtonSize,
} from "@mirai-app/ui";
