import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createVitestConfig } from "@integral-2025-app/vitest-config";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default createVitestConfig({
  dirname: rootDir,
  environment: "node",
  setupFiles: ["./vitest.setup.ts"],
  include: ["src/**/__tests__/**/*.test.ts"],
  coverage: {
    exclude: ["prisma/lib/**"],
  },
});
