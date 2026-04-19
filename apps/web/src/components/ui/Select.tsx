/**
 * Select Component - Web UI Primitive Wrapper
 *
 * Thin wrapper around @mirai-app/ui Select component for web-specific usage.
 * Re-exports all props and functionality from the base component.
 *
 * @example
 * ```tsx
 * import { Select } from '@/components/ui/Select';
 *
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
 */

export {
  Select,
  type SelectProps,
  type SelectItemProps,
  type SelectGroupProps,
  type SelectLabelProps,
} from "@mirai-app/ui";
