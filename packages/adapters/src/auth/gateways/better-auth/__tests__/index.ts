/**
 * Better Auth Gateway Test Utilities
 *
 * Mock implementations and test helpers for BetterAuthGateway.
 * Export these utilities for use in other packages' tests.
 */

export {
  createMockBetterAuth,
  createMockBetterAuthGateway,
} from "./BetterAuthGateway.integration.test";

// Type re-exports are handled by TypeScript inference when importing from the test file
