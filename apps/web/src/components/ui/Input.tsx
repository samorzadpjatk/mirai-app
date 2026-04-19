/**
 * Input Component - Web UI Primitive Wrapper
 *
 * Thin wrapper around @mirai-app/ui Input component for web-specific usage.
 * Re-exports all props and functionality from the base component.
 *
 * @example
 * ```tsx
 * import { Input } from '@/components/ui/Input';
 *
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 *   error={emailError}
 * />
 * ```
 */

export {
  Input,
  InputLabel,
  InputHelper,
  InputError,
  type InputProps,
  type InputSize,
  type InputVariant,
} from "@mirai-app/ui";
