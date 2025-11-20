import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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

const importEnvModule = () => vi.importActual<typeof import("../env")>("../env");

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
    it("should validate DATABASE_URL as a URL", async () => {
      setValidEnv();

      const { env } = await importEnvModule();
      
      expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
    });

    it("should throw error when DATABASE_URL is not a valid URL", async () => {
      setValidEnv();
      process.env.DATABASE_URL = "not-a-url";

      await expect(importEnvModule()).rejects.toThrow();
    });

    it("should validate AUTHENTIK_ISSUER as a URL", async () => {
      setValidEnv();

      const { env } = await importEnvModule();
      
      expect(env.AUTHENTIK_ISSUER).toBe("http://localhost:9000");
    });

    it("should require AUTHENTIK_SERVICE_ACCOUNT_TOKEN as a string", async () => {
      setValidEnv();
      process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN = "test-token-123";

      const { env } = await importEnvModule();
      
      expect(env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN).toBe("test-token-123");
    });

    it("should default NODE_ENV to development", async () => {
      setValidEnv();
      delete process.env.NODE_ENV;

      const { env } = await importEnvModule();
      
      expect(env.NODE_ENV).toBe("development");
    });

    it("should validate NODE_ENV as enum", async () => {
      setValidEnv();
      process.env.NODE_ENV = "production";

      const { env } = await importEnvModule();
      
      expect(env.NODE_ENV).toBe("production");
    });

    it("should validate all role environment variables", async () => {
      setValidEnv();
      process.env.ADMIN_ROLE = "admin-role";
      process.env.MODERATOR_ROLE = "mod-role";
      process.env.TECH_ROLE = "tech-role";
      process.env.SERVICE_ACCOUNT_ROLE = "service-role";

      const { env } = await importEnvModule();
      
      expect(env.ADMIN_ROLE).toBe("admin-role");
      expect(env.MODERATOR_ROLE).toBe("mod-role");
      expect(env.TECH_ROLE).toBe("tech-role");
      expect(env.SERVICE_ACCOUNT_ROLE).toBe("service-role");
    });

    it("should throw error when required environment variables are missing", async () => {
      delete process.env.DATABASE_URL;
      delete process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN;
      delete process.env.AUTHENTIK_ISSUER;
      setValidEnv();
      delete process.env.ADMIN_ROLE;

      await expect(importEnvModule()).rejects.toThrow();
    });

    it("should skip validation when SKIP_ENV_VALIDATION is set", async () => {
      process.env.SKIP_ENV_VALIDATION = "1";
      delete process.env.DATABASE_URL;
      delete process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN;

      // Should not throw even with missing required variables
      await expect(importEnvModule()).resolves.toBeDefined();
    });

    it("should treat empty strings as undefined when emptyStringAsUndefined is true", async () => {
      setValidEnv();
      process.env.DATABASE_URL = "";

      await expect(importEnvModule()).rejects.toThrow();
    });
  });

  describe("environment variable structure", () => {
    beforeEach(() => {
      setValidEnv();
    });

    it("should export env object with all required properties", async () => {
      const { env } = await importEnvModule();
      
      expect(env).toHaveProperty("DATABASE_URL");
      expect(env).toHaveProperty("NODE_ENV");
      expect(env).toHaveProperty("AUTHENTIK_SERVICE_ACCOUNT_TOKEN");
      expect(env).toHaveProperty("AUTHENTIK_ISSUER");
      expect(env).toHaveProperty("ADMIN_ROLE");
      expect(env).toHaveProperty("MODERATOR_ROLE");
      expect(env).toHaveProperty("TECH_ROLE");
      expect(env).toHaveProperty("SERVICE_ACCOUNT_ROLE");
      expect(env).toHaveProperty("NEXT_PUBLIC_SUPABASE_URL");
      expect(env).toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    });

    it("should have correct types for environment variables", async () => {
      const { env } = await importEnvModule();
      
      expect(typeof env.DATABASE_URL).toBe("string");
      expect(typeof env.NODE_ENV).toBe("string");
      expect(typeof env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN).toBe("string");
      expect(typeof env.AUTHENTIK_ISSUER).toBe("string");
      expect(typeof env.ADMIN_ROLE).toBe("string");
      expect(typeof env.MODERATOR_ROLE).toBe("string");
      expect(typeof env.TECH_ROLE).toBe("string");
      expect(typeof env.SERVICE_ACCOUNT_ROLE).toBe("string");
      expect(typeof env.NEXT_PUBLIC_SUPABASE_URL).toBe("string");
      expect(typeof env.SUPABASE_SERVICE_ROLE_KEY).toBe("string");
    });
  });
});
