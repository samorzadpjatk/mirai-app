import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getEnv = () => (typeof Bun !== "undefined" ? Bun.env : undefined);

describe("config/env", () => {
  const originalEnv = { ...(getEnv() ?? {}) };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    const env = getEnv();
    if (!env) return;
    for (const key of Object.keys(env)) {
      if (key in originalEnv) {
        env[key] = originalEnv[key];
      } else {
        delete env[key];
      }
    }
  });

  it("should export env with all required variables", async () => {
    const env = getEnv();
    if (!env) return;
    env.SUPABASE_URL = "https://test.supabase.co";
    env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    env.SUPABASE_STORAGE_IMAGE_BUCKET = "test-images";
    env.SUPABASE_STORAGE_VIDEO_BUCKET = "test-videos";
    env.SUPABASE_STORAGE_PUBLIC_BUCKET = "test-public";
    env.SEED_GHOST_EMAIL = "ghost@test.com";
    env.SEED_GHOST_PASSWORD = "ghost-password";
    env.DATABASE_URL = "postgresql://localhost:5432/test";

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.supabaseUrl).toBe("https://test.supabase.co");
    expect(envConfig.serviceRoleKey).toBe("test-service-key");
    expect(envConfig.imageBucket).toBe("test-images");
    expect(envConfig.videoBucket).toBe("test-videos");
    expect(envConfig.publicBucket).toBe("test-public");
    expect(envConfig.seedGhostEmail).toBe("ghost@test.com");
    expect(envConfig.seedGhostPassword).toBe("ghost-password");
    expect(envConfig.databaseUrl).toBe("postgresql://localhost:5432/test");
  });

  it("should handle empty string values", async () => {
    const env = getEnv();
    if (!env) return;
    env.SUPABASE_URL = "";
    env.SUPABASE_SERVICE_ROLE_KEY = "";
    env.SUPABASE_STORAGE_IMAGE_BUCKET = "";
    env.SUPABASE_STORAGE_VIDEO_BUCKET = "";
    env.SUPABASE_STORAGE_PUBLIC_BUCKET = "";
    env.SEED_GHOST_EMAIL = "";
    env.SEED_GHOST_PASSWORD = "";
    env.DATABASE_URL = "";

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.supabaseUrl).toBe("");
    expect(envConfig.serviceRoleKey).toBe("");
    expect(envConfig.imageBucket).toBe("");
    expect(envConfig.videoBucket).toBe("");
    expect(envConfig.publicBucket).toBe("");
    expect(envConfig.seedGhostEmail).toBe("");
    expect(envConfig.seedGhostPassword).toBe("");
    expect(envConfig.databaseUrl).toBe("");
  });

  it("should handle undefined values when env vars are not set", async () => {
    const env = getEnv();
    if (!env) return;
    delete env.SUPABASE_URL;
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    delete env.DATABASE_URL;

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.supabaseUrl).toBeUndefined();
    expect(envConfig.serviceRoleKey).toBeUndefined();
    expect(envConfig.databaseUrl).toBeUndefined();
  });

  it("should handle special characters in env values", async () => {
    const env = getEnv();
    if (!env) return;
    env.SUPABASE_URL = "https://test.supabase.co?param=value";
    env.SUPABASE_SERVICE_ROLE_KEY = "key-with-special-chars-!@#$%";
    env.DATABASE_URL = "postgresql://user:pass@host:5432/db?ssl=true";

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.supabaseUrl).toBe("https://test.supabase.co?param=value");
    expect(envConfig.serviceRoleKey).toBe("key-with-special-chars-!@#$%");
    expect(envConfig.databaseUrl).toBe("postgresql://user:pass@host:5432/db?ssl=true");
  });

  it("should handle very long values", async () => {
    const env = getEnv();
    if (!env) return;
    const longValue = "a".repeat(1000);
    env.SUPABASE_SERVICE_ROLE_KEY = longValue;

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.serviceRoleKey).toBe(longValue);
  });
});
