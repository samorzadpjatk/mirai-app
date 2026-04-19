/**
 * Sheet Component - Web UI Primitive Wrapper
 *
 * Thin wrapper around @mirai-app/ui Sheet component for web-specific usage.
 * Re-exports all props and functionality from the base component.
 *
 * Provides modal/sheet dialogs for web admin pages.
 *
 * @example
 * ```tsx
 * import { Sheet } from '@/components/ui/Sheet';
 *
 * <Sheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Sheet Title"
 * >
 *   <Text>Sheet content goes here</Text>
 * </Sheet>
 * ```
 */

export { Sheet, type SheetProps } from "@mirai-app/ui";
