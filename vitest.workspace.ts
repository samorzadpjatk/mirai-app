import { defineWorkspace } from "vitest/config";
import { resolve } from "path";

export default defineWorkspace([
  // Packages
  resolve(__dirname, "packages/auth/vitest.config.ts"),
  resolve(__dirname, "packages/db/vitest.config.ts"),
  resolve(__dirname, "packages/shared/vitest.config.ts"),
  resolve(__dirname, "packages/supabase/vitest.config.ts"),
  resolve(__dirname, "packages/orpc/vitest.config.ts"),

  // Apps (backend only - native uses Jest)
  resolve(__dirname, "apps/backend-server/vitest.config.ts"),
  resolve(__dirname, "apps/notification-sender/vitest.config.ts"),
  resolve(__dirname, "apps/seed/vitest.config.ts"),
]);
