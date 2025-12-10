import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createVitestConfig } from "@integral-2025-app/vitest-config";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default createVitestConfig({
  dirname: rootDir,
  setupFiles: ["./vitest.setup.ts"],
  alias: {
    "@integral-2025-app/auth": "../../packages/auth/src/index.ts",
    "@integral-2025-app/auth/client": "../../packages/auth/src/supabaseClient.ts",
    "@integral-2025-app/common-types": "../../packages/common-types/src/index.ts",
  },
  coverage: {
    exclude: [
      "node_modules/",
      "src/**/__tests__/**",
      "**/*.config.*",
      "**/index.ts",
      "**/*.d.ts",
    ],
  },
});
