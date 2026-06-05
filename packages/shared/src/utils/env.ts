/**
 * Get an environment variable value.
 * Works across Bun, Node, Vitest, and React Native (via Metro replacement).
 * In Bun, `process.env` is an alias for `Bun.env`, so no runtime detection is needed.
 */
export function getEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Get a required environment variable value.
 * Throws a descriptive error if the variable is missing or empty.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Check if the current environment is a test environment (Vitest).
 */
export function isTestEnv(): boolean {
  return process.env.VITEST === "true";
}
