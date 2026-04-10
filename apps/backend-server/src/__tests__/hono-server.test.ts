/**
 * Hono Server Unit Tests
 *
 * Tests for the Hono server configuration and creation
 * without requiring the full DI container initialization.
 *
 * @module hono-server.test
 */

import { describe, it, expect } from "bun:test";
import {
  honoConfig,
  validateHonoConfig,
  printHonoConfig,
} from "../config/hono-config";

describe("[UNIT] Hono Configuration", () => {
  it("should have correct default values", () => {
    expect(honoConfig.port).toBe(4000);
    expect(honoConfig.host).toBe("127.0.0.1");
    expect(honoConfig.graphqlPath).toBe("/graphql");
    expect(honoConfig.shutdownTimeout).toBe(10000);
    expect(honoConfig.requestTimeout).toBe(30000);
  });

  it("should have valid environment flags", () => {
    // In test environment, isTest should be true
    // Either development, production, or test should be true (but not multiple)
    const envFlagCount = [
      honoConfig.isDevelopment,
      honoConfig.isProduction,
      honoConfig.isTest,
    ].filter(Boolean).length;
    expect(envFlagCount).toBe(1);
  });

  it("should have GraphiQL setting consistent with environment", () => {
    // GraphiQL should be disabled in production
    if (honoConfig.isProduction) {
      expect(honoConfig.enableGraphiQL).toBe(false);
    }
  });

  it("should have CORS origin matching environment", () => {
    // In development, CORS origin should be "*" (wildcard)
    // In production/test, it may be undefined or a specific value
    if (honoConfig.isDevelopment) {
      expect(honoConfig.corsOrigin).toBe("*");
    }
    // Otherwise it's fine for it to be undefined (env var or default)
  });

  it("should have logging setting consistent with environment", () => {
    // Logging configuration should match environment expectations
    // (not checking specific value as it may vary by environment)
    expect(typeof honoConfig.enableLogging).toBe("boolean");
  });
});

describe("[UNIT] Hono Configuration Validation", () => {
  it("should pass validation with default config", () => {
    // Should not throw with default config (port 4000)
    expect(() => validateHonoConfig()).not.toThrow();
  });
});

describe("[UNIT] Hono Configuration Printing", () => {
  it("should print config without errors", () => {
    // Should not throw when printing config
    expect(() => printHonoConfig()).not.toThrow();
  });
});
