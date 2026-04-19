/**
 * ErrorMessage Component - Web UI Primitive Wrapper
 *
 * Thin wrapper around @mirai-app/ui ErrorMessage component for web-specific usage.
 * Re-exports all props and functionality from the base component.
 *
 * @example
 * ```tsx
 * import { ErrorMessage } from '@/components/ui/ErrorMessage';
 *
 * <ErrorMessage
 *   title="Connection Failed"
 *   message="Unable to connect to server"
 *   onRetry={() => refetch()}
 * />
 * ```
 */

export { ErrorMessage, type ErrorMessageProps } from "@mirai-app/ui";
