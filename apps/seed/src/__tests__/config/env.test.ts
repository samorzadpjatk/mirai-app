import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("config/env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should export env with all required variables", async () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.SUPABASE_STORAGE_IMAGE_BUCKET = "test-images";
    process.env.SUPABASE_STORAGE_VIDEO_BUCKET = "test-videos";
    process.env.SUPABASE_STORAGE_PUBLIC_BUCKET = "test-public";
    process.env.SEED_GHOST_EMAIL = "ghost@test.com";
    process.env.SEED_GHOST_PASSWORD = "ghost-password";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";

    const { env } = await import("../../config/env");

    expect(env.supabaseUrl).toBe("https://test.supabase.co");
    expect(env.serviceRoleKey).toBe("test-service-key");
    expect(env.imageBucket).toBe("test-images");
    expect(env.videoBucket).toBe("test-videos");
    expect(env.publicBucket).toBe("test-public");
    expect(env.seedGhostEmail).toBe("ghost@test.com");
    expect(env.seedGhostPassword).toBe("ghost-password");
    expect(env.databaseUrl).toBe("postgresql://localhost:5432/test");
  });

  it("should handle empty string values", async () => {
    process.env.SUPABASE_URL = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    process.env.SUPABASE_STORAGE_IMAGE_BUCKET = "";
    process.env.SUPABASE_STORAGE_VIDEO_BUCKET = "";
    process.env.SUPABASE_STORAGE_PUBLIC_BUCKET = "";
    process.env.SEED_GHOST_EMAIL = "";
    process.env.SEED_GHOST_PASSWORD = "";
    process.env.DATABASE_URL = "";

    const { env } = await import("../../config/env");

    expect(env.supabaseUrl).toBe("");
    expect(env.serviceRoleKey).toBe("");
    expect(env.imageBucket).toBe("");
    expect(env.videoBucket).toBe("");
    expect(env.publicBucket).toBe("");
    expect(env.seedGhostEmail).toBe("");
    expect(env.seedGhostPassword).toBe("");
    expect(env.databaseUrl).toBe("");
  });

  it("should handle undefined values when env vars are not set", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.DATABASE_URL;

    const { env } = await import("../../config/env");

    expect(env.supabaseUrl).toBeUndefined();
    expect(env.serviceRoleKey).toBeUndefined();
    expect(env.databaseUrl).toBeUndefined();
  });

  it("should handle special characters in env values", async () => {
    process.env.SUPABASE_URL = "https://test.supabase.co?param=value";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key-with-special-chars-!@#$%";
    process.env.DATABASE_URL = "postgresql://user:pass@host:5432/db?ssl=true";

    const { env } = await import("../../config/env");

    expect(env.supabaseUrl).toBe("https://test.supabase.co?param=value");
    expect(env.serviceRoleKey).toBe("key-with-special-chars-!@#$%");
    expect(env.databaseUrl).toBe("postgresql://user:pass@host:5432/db?ssl=true");
  });

  it("should handle very long values", async () => {
    const longValue = "a".repeat(1000);
    process.env.SUPABASE_SERVICE_ROLE_KEY = longValue;

    const { env } = await import("../../config/env");

    expect(env.serviceRoleKey).toBe(longValue);
  });
});
