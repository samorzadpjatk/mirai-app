import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type * as EnvModule from "../env.js";

const REQUIRED_ENV_VALUES = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  AUTHENTIK_SERVICE_ACCOUNT_TOKEN: "test-token",
  AUTHENTIK_ISSUER: "http://localhost:9000",
  ADMIN_ROLE: "admin",
  MODERATOR_ROLE: "moderator",
  TECH_ROLE: "tech",
  SERVICE_ACCOUNT_ROLE: "service",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
} as const;

const setValidEnv = () => {
  Object.entries(REQUIRED_ENV_VALUES).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

const importEnvModule = async (): Promise<typeof EnvModule> =>
  await vi.importActual("../env.ts");

describe("env utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("environment variable validation", () => {
    it("should skip validation when SKIP_ENV_VALIDATION is set", async () => {
      process.env.SKIP_ENV_VALIDATION = "1";
      delete process.env.DATABASE_URL;
      delete process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN;

      // Should not throw even with missing required variables
      await expect(importEnvModule()).resolves.toBeDefined();
    });
  });

  describe("environment variable structure", () => {
    beforeEach(() => {
      setValidEnv();
    });

    it("should export env object with all required properties", async () => {
      const { env } = await importEnvModule();

      expect(env).toHaveProperty("NEXT_PUBLIC_SUPABASE_URL");
      expect(env).toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    });

    it("should have correct types for environment variables", async () => {
      const { env } = await importEnvModule();

      expect(typeof env.NEXT_PUBLIC_SUPABASE_URL).toBe("string");
      expect(typeof env.SUPABASE_SERVICE_ROLE_KEY).toBe("string");
    });
  });
});
