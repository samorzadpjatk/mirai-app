#!/usr/bin/env bun
/**
 * Script to update GraphQL test files with proper Effect runtime context
 *
 * NOTE: This script is deprecated as the container-based DI pattern has been
 * replaced with Effect-based controllers. Use createTestGraphQLContext with
 * the new controller-based pattern instead.
 */

import { readFileSync, writeFileSync } from "fs";
import { serverLogger } from "@mirai-app/shared";

const filePath = process.argv[2];
if (!filePath) {
  serverLogger.error("Usage: bun run update-test.ts <file-path>");
  process.exit(1);
}

let content = readFileSync(filePath, "utf-8");

// DEPRECATED: This script was used to migrate from the old container-based
// context pattern to the new Effect-based controller pattern.
//
// Old pattern: contextValue: { container: context.container, ... }
// New pattern: contextValue: createTestGraphQLContext(controllers, userToken)
//
// The patterns below are kept for reference but should not be used for new code.

serverLogger.warn(
  "This script is deprecated. The container-based DI pattern has been replaced with Effect-based controllers.",
);
serverLogger.info(`No changes made to ${filePath}`);

// Exit without making changes - new tests should use the Effect-based pattern
process.exit(0);
