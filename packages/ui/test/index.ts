/**
 * Barrel export for @mirai-app/ui test utilities
 *
 * Provides convenient imports for test infrastructure:
 * - TestWrapper: React component for wrapping tests with TamaguiProvider
 * - createTestWrapper: Factory for custom test wrappers
 * - TestWrapperDark: Pre-configured dark theme wrapper
 * - isTestEnvironment: Test environment indicator
 *
 * @module @mirai-app/ui/test
 *
 * @example
 * ```typescript
 * import { TestWrapper, TestWrapperDark, createTestWrapper } from '@mirai-app/ui/test';
 * ```
 */

export {
  /** React test wrapper with TamaguiProvider */
  TestWrapper,
  /** Factory for creating custom test wrappers */
  createTestWrapper,
  /** Pre-configured dark theme test wrapper */
  TestWrapperDark,
  /** Props interface for TestWrapper */
  type TestWrapperProps,
} from "./TestWrapper";

export {
  /** Test environment indicator */
  isTestEnvironment,
} from "./setup";
