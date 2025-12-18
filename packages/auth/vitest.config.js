import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createVitestConfig } from "@integral-2025-app/vitest-config";
const rootDir = dirname(fileURLToPath(import.meta.url));
export default createVitestConfig({
    dirname: rootDir,
    setupFiles: ["./vitest.setup.ts"],
    alias: {
        "@integral-2025-app/common-types": "../common-types/src/index.ts",
    },
});
