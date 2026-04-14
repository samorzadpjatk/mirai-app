#!/usr/bin/env bun
/**
 * Script to update GraphQL test files with proper Effect runtime context
 */

import { readFileSync, writeFileSync } from "fs";
import { serverLogger } from "@mirai-app/shared";

const filePath = process.argv[2];
if (!filePath) {
  serverLogger.error("Usage: bun run update-test.ts <file-path>");
  process.exit(1);
}

let content = readFileSync(filePath, "utf-8");

// Pattern to match contextValue blocks that need updating
// Match: contextValue: {
//   container: context.container,
//   request: new Request(..., {
//     headers: { Authorization: ... }
//   })
// }
// And replace with: contextValue: createTestGraphQLContext(context.container, userToken)

// We'll do this with a more targeted regex approach

// Pattern 1: With Authorization header using userToken
content = content.replace(
  /contextValue:\s*\{\s*container:\s*context\.container,\s*request:\s*new\s+Request\("http:\/\/localhost\/graphql",\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{userToken\}`,?\s*\},?\s*\}\),?\s*\}/g,
  "contextValue: createTestGraphQLContext(context.container, userToken)",
);

// Pattern 2: With Authorization header using adminToken
content = content.replace(
  /contextValue:\s*\{\s*container:\s*context\.container,\s*request:\s*new\s+Request\("http:\/\/localhost\/graphql",\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{adminToken\}`,?\s*\},?\s*\}\),?\s*\}/g,
  "contextValue: createTestGraphQLContext(context.container, adminToken)",
);

// Pattern 3: Without Authorization header (no auth)
content = content.replace(
  /contextValue:\s*\{\s*container:\s*context\.container,\s*request:\s*new\s+Request\("http:\/\/localhost\/graphql"\),?\s*\}/g,
  "contextValue: createTestGraphQLContext(context.container)",
);

// Pattern 4: With malformed token
content = content.replace(
  /contextValue:\s*\{\s*container:\s*context\.container,\s*request:\s*new\s+Request\("http:\/\/localhost\/graphql",\s*\{\s*headers:\s*\{\s*Authorization:\s*"MalformedToken",?\s*\},?\s*\}\),?\s*\}/g,
  'contextValue: createTestGraphQLContext(context.container, "invalid")',
);

// Pattern 5: With invalid token
content = content.replace(
  /contextValue:\s*\{\s*container:\s*context\.container,\s*request:\s*new\s+Request\("http:\/\/localhost\/graphql",\s*\{\s*headers:\s*\{\s*Authorization:\s*"Bearer\s+invalid-token",?\s*\},?\s*\}\),?\s*\}/g,
  'contextValue: createTestGraphQLContext(context.container, "invalid")',
);

writeFileSync(filePath, content);
serverLogger.info(`Updated ${filePath}`);
