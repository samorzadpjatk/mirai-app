import { STANDARD_BUCKETS } from "@mirai-app/common/storage";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("config/env", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should export env with all required variables", async () => {
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    vi.stubEnv("SUPABASE_STORAGE_IMAGE_BUCKET", "test-images");
    vi.stubEnv("SUPABASE_STORAGE_VIDEO_BUCKET", "test-videos");
    vi.stubEnv("SUPABASE_STORAGE_PUBLIC_BUCKET", "test-public");
    vi.stubEnv("SEED_GHOST_EMAIL", "ghost@test.com");
    vi.stubEnv("SEED_GHOST_PASSWORD", "ghost-password");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

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
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SUPABASE_STORAGE_IMAGE_BUCKET", "");
    vi.stubEnv("SUPABASE_STORAGE_VIDEO_BUCKET", "");
    vi.stubEnv("SUPABASE_STORAGE_PUBLIC_BUCKET", "");
    vi.stubEnv("SEED_GHOST_EMAIL", "");
    vi.stubEnv("SEED_GHOST_PASSWORD", "");
    vi.stubEnv("DATABASE_URL", "");

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
    vi.stubEnv("SUPABASE_URL", undefined);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    vi.stubEnv("DATABASE_URL", undefined);

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.supabaseUrl).toBeUndefined();
    expect(envConfig.serviceRoleKey).toBeUndefined();
    expect(envConfig.databaseUrl).toBeUndefined();
  });

  it("should handle special characters in env values", async () => {
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co?param=value");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key-with-special-chars-!@#$%");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host:5432/db?ssl=true");

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.supabaseUrl).toBe("https://test.supabase.co?param=value");
    expect(envConfig.serviceRoleKey).toBe("key-with-special-chars-!@#$%");
    expect(envConfig.databaseUrl).toBe("postgresql://user:pass@host:5432/db?ssl=true");
  });

  it("should default the storage buckets to the standard bucket names", async () => {
    vi.stubEnv("SUPABASE_STORAGE_IMAGE_BUCKET", undefined);
    vi.stubEnv("SUPABASE_STORAGE_VIDEO_BUCKET", undefined);
    vi.stubEnv("SUPABASE_STORAGE_PUBLIC_BUCKET", undefined);

    const { env: envConfig } = await import("../../config/env");

    // The backend resolves "images/..." to the "images" bucket, so a seed that
    // defaults to "image" uploads files no signed URL will ever point at.
    expect(envConfig.imageBucket).toBe(STANDARD_BUCKETS.IMAGES);
    expect(envConfig.videoBucket).toBe(STANDARD_BUCKETS.VIDEOS);
    expect(envConfig.publicBucket).toBe(STANDARD_BUCKETS.PUBLIC);
  });

  it("should default the buckets to the values documented in .env.example", async () => {
    vi.stubEnv("SUPABASE_STORAGE_IMAGE_BUCKET", undefined);
    vi.stubEnv("SUPABASE_STORAGE_VIDEO_BUCKET", undefined);
    vi.stubEnv("SUPABASE_STORAGE_PUBLIC_BUCKET", undefined);

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.imageBucket).toBe("images");
    expect(envConfig.videoBucket).toBe("videos");
    expect(envConfig.publicBucket).toBe("files-public");
  });

  it("should handle very long values", async () => {
    const longValue = "a".repeat(1000);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", longValue);

    const { env: envConfig } = await import("../../config/env");

    expect(envConfig.serviceRoleKey).toBe(longValue);
  });
});
