#!/usr/bin/env bun
/**
 * Test Prefix Validation Script
 *
 * Validates that all test files use proper [UNIT] or [INTEGRATION] prefixes
 * in their describe() blocks. This prevents silent test skips when regex
 * patterns fail to match.
 *
 * @module validate-test-prefixes
 */

import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
import { serverLogger } from "@mirai-app/shared";

// =============================================================================
// Configuration
// =============================================================================

const VALID_PREFIXES = ["[UNIT]", "[INTEGRATION]"];
const TEST_FILE_PATTERNS = [/\.test\.ts$/, /\.spec\.ts$/];
const DESCRIBE_PATTERN = /describe\s*\(\s*["']([^"']+)["']/g;

// Directories to scan
const SCAN_DIRECTORIES = ["apps", "packages"];

// Files to exclude from validation (e.g., generated files, legacy tests)
const EXCLUDED_FILES: string[] = [];

// =============================================================================
// Types
// =============================================================================

interface Violation {
  file: string;
  line: number;
  prefix: string;
  suggestion: string;
}

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  testFilesFound: number;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Check if a file is a test file based on patterns
 */
function isTestFile(filename: string): boolean {
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(filename));
}

/**
 * Check if a prefix is valid
 */
function isValidPrefix(prefix: string): boolean {
  return VALID_PREFIXES.some((valid) => prefix.startsWith(valid));
}

/**
 * Get the suggested prefix based on the current prefix
 */
function getSuggestion(currentPrefix: string): string {
  const lower = currentPrefix.toLowerCase();

  // Map common variations to valid prefixes
  if (lower.includes("e2e") || lower.includes("integration")) {
    return "[INTEGRATION]";
  }
  if (lower.includes("unit") || lower.includes("test")) {
    return "[UNIT]";
  }
  if (lower.includes("debug")) {
    return "[DEBUG] (or use [UNIT] if not debugging)";
  }

  return VALID_PREFIXES[0]; // Default suggestion
}

/**
 * Extract describe blocks and their prefixes from file content
 */
function extractDescribes(
  content: string,
  filePath: string,
): Array<{ prefix: string; line: number }> {
  const describes: Array<{ prefix: string; line: number }> = [];
  let match;

  // Reset regex state
  DESCRIBE_PATTERN.lastIndex = 0;

  while ((match = DESCRIBE_PATTERN.exec(content)) !== null) {
    const prefix = match[1];
    const upToMatch = content.slice(0, match.index);
    const line = upToMatch.split("\n").length;
    describes.push({ prefix, line });
  }

  return describes;
}

/**
 * Validate a single test file
 */
async function validateFile(
  filePath: string,
  projectRoot: string,
): Promise<Violation[]> {
  const violations: Violation[] = [];
  const relativePath = relative(projectRoot, filePath);

  // Skip excluded files
  if (EXCLUDED_FILES.some((excluded) => relativePath.includes(excluded))) {
    return violations;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    const describes = extractDescribes(content, filePath);

    for (const { prefix, line } of describes) {
      if (!isValidPrefix(prefix)) {
        violations.push({
          file: relativePath,
          line,
          prefix,
          suggestion: getSuggestion(prefix),
        });
      }
    }
  } catch (error) {
    serverLogger.error(`Error reading ${filePath}:`, error);
  }

  return violations;
}

/**
 * Recursively find all test files in a directory
 */
async function findTestFiles(dir: string): Promise<string[]> {
  const testFiles: string[] = [];

  async function scan(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }
        await scan(fullPath);
      } else if (entry.isFile() && isTestFile(entry.name)) {
        testFiles.push(fullPath);
      }
    }
  }

  await scan(dir);
  return testFiles;
}

/**
 * Run validation across all configured directories
 */
async function validateAll(projectRoot: string): Promise<ValidationResult> {
  const violations: Violation[] = [];
  let filesChecked = 0;
  let testFilesFound = 0;

  for (const dir of SCAN_DIRECTORIES) {
    const fullDir = join(projectRoot, dir);

    try {
      const dirStat = await stat(fullDir);
      if (!dirStat.isDirectory()) {
        continue;
      }

      const testFiles = await findTestFiles(fullDir);
      testFilesFound += testFiles.length;

      for (const file of testFiles) {
        filesChecked++;
        const fileViolations = await validateFile(file, projectRoot);
        violations.push(...fileViolations);
      }
    } catch (error) {
      // Directory might not exist
      serverLogger.warn(`Warning: Could not scan ${fullDir}`);
    }
  }

  return { violations, filesChecked, testFilesFound };
}

// =============================================================================
// Output Formatting
// =============================================================================

/**
 * Format violations for human-readable output
 */
function formatViolations(violations: Violation[]): string {
  if (violations.length === 0) {
    return "";
  }

  let output = "\n" + "=".repeat(80) + "\n";
  output += "❌ TEST PREFIX VALIDATION FAILED\n";
  output += "=".repeat(80) + "\n\n";
  output += "The following test files have invalid describe() prefixes:\n\n";

  // Group violations by file
  const byFile = new Map<string, Violation[]>();
  for (const v of violations) {
    const existing = byFile.get(v.file) || [];
    existing.push(v);
    byFile.set(v.file, existing);
  }

  for (const [file, fileViolations] of byFile) {
    output += `\n📄 ${file}\n`;
    for (const v of fileViolations) {
      output += `   Line ${v.line}: describe("${v.prefix}...")\n`;
      output += `   💡 Suggested: describe("${v.suggestion} ...")\n`;
    }
  }

  output += "\n" + "=".repeat(80) + "\n";
  output += "Valid prefixes are:\n";
  for (const prefix of VALID_PREFIXES) {
    output += `  - ${prefix}\n`;
  }
  output += "=".repeat(80) + "\n";

  return output;
}

/**
 * Format summary for successful validation
 */
function formatSuccess(filesChecked: number): string {
  return `
✅ All test files validated successfully!
   Files checked: ${filesChecked}
   All describe() blocks use valid [UNIT] or [INTEGRATION] prefixes.
`;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const projectRoot = process.cwd();

  serverLogger.info("🔍 Validating test file prefixes...\n");
  serverLogger.info(`Project root: ${projectRoot}`);
  serverLogger.info(`Scanning directories: ${SCAN_DIRECTORIES.join(", ")}`);
  serverLogger.info(`Valid prefixes: ${VALID_PREFIXES.join(", ")}\n`);

  const result = await validateAll(projectRoot);

  if (result.violations.length > 0) {
    serverLogger.error(formatViolations(result.violations));
    serverLogger.error(
      `\n❌ Found ${result.violations.length} violation(s) in ${result.testFilesFound} test files.`,
    );
    process.exit(1);
  } else {
    serverLogger.info(formatSuccess(result.filesChecked));
    serverLogger.info(
      `📊 Summary: ${result.testFilesFound} test file(s) checked`,
    );
  }
}

main().catch((error) => {
  serverLogger.error("Unexpected error:", error);
  process.exit(1);
});
