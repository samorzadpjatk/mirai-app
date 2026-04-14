/**
 * Test Infrastructure Exports for Adapters Package
 *
 * Provides Layer-based test utilities for the adapters layer.
 *
 * @example
 * ```typescript
 * import { runWithTestLayer, createServiceLayer } from '@mirai-app/adapters/test';
 * ```
 */

export {
  // Test execution helpers
  runWithTestLayer,
  runWithTestLayerExit,
  runWithTestLayerEither,
  // Layer creation helpers
  createServiceLayer,
  mergeTestLayers,
  // Assertion helpers
  assertSuccess,
  assertFailure,
  isFailureWithTag,
  // Types
  type ServiceFromTag,
  type IdentifierFromTag,
  type TestRequirements,
} from "./test-helpers";
