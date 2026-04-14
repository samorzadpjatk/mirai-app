/**
 * Barrel export for @mirai-app/native test utilities
 *
 * Re-exports from @mirai-app/ui/test for convenience.
 * All test utilities are now centralized in the shared UI package.
 *
 * @deprecated Use `@mirai-app/ui/test` directly for new tests
 *
 * @module @mirai-app/native/test
 *
 * @example
 * ```typescript
 * // Preferred: Import from shared UI package
 * import { TestWrapper, TestWrapperDark, createTestWrapper } from '@mirai-app/ui/test';
 *
 * // Legacy: Still works via re-export
 * import { TestWrapper } from '@mirai-app/native/test';
 * ```
 */

// Re-export all test utilities from the shared UI package
export {
  /** React test wrapper with TamaguiProvider */
  TestWrapper,
  /** Factory for creating custom test wrappers */
  createTestWrapper,
  /** Pre-configured dark theme test wrapper */
  TestWrapperDark,
  /** Props interface for TestWrapper */
  type TestWrapperProps,
  /** Test environment indicator */
  isTestEnvironment,
} from "@mirai-app/ui/test";
