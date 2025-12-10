import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Ensure react-testing-library cleans up between tests
afterEach(() => {
  cleanup();
});

// Provide predictable defaults for env-dependent code paths
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:8000";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SKIP_ENV_VALIDATION = "true";
