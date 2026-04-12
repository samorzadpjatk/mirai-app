// Test setup file - runs before all tests
// This file sets up global mocks and environment for Bun tests

// Set up environment variables for tests
process.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.PUBLIC_GRAPHQL_URL = "http://localhost:3001/graphql";
process.env.PUBLIC_GRAPHQL_WS_URL = "ws://localhost:3001/graphql";

// Mock react-hot-toast globally
const mockToast = {
  success: () => "success-toast-id",
  error: () => "error-toast-id",
  loading: () => "loading-toast-id",
  custom: () => "custom-toast-id",
  dismiss: () => {},
  remove: () => {},
  promise: () => Promise.resolve("promise-toast-id"),
};

// @ts-expect-error - bun:test types may not be available in all environments
await import("bun:test").then(({ mock }) => {
  mock.module("react-hot-toast", () => ({
    toast: mockToast,
    Toaster: () => null,
    useToaster: () => ({ toasts: [], handlers: {} }),
  }));
});
