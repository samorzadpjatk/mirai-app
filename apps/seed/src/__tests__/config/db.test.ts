import { beforeEach, describe, expect, it, vi } from "vitest";

describe("config/db", () => {
  const mockCreateDb = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockCreateDb.mockReturnValue({
      user: { findFirst: vi.fn() },
      trip: { findFirst: vi.fn() },
      reward: { create: vi.fn() },
    });

    vi.doMock("@mirai-app/db", () => ({
      createDb: mockCreateDb,
    }));
  });

  it("should create drizzle client with database URL from env", async () => {
    const mockDbUrl = "postgresql://localhost:5432/testdb";

    vi.doMock("../../config/env", () => ({
      env: {
        databaseUrl: mockDbUrl,
      },
    }));

    await import("../../config/db");

    expect(mockCreateDb).toHaveBeenCalledWith(mockDbUrl);
  });

  it("should export db instance", async () => {
    const mockDb = {
      query: { users: { findMany: vi.fn() }, trips: { create: vi.fn() } },
    };

    mockCreateDb.mockReturnValue(mockDb);

    vi.doMock("../../config/env", () => ({
      env: {
        databaseUrl: "postgresql://localhost:5432/test",
      },
    }));

    const { db } = await import("../../config/db");

    expect(db).toBe(mockDb);
  });

  it("should handle different database URLs", async () => {
    const testUrls = [
      "postgresql://user:pass@localhost:5432/db",
      "postgresql://localhost:5432/db?sslmode=require",
      "postgres://user@host:5432/dbname",
    ];

    for (const url of testUrls) {
      vi.resetModules();
      mockCreateDb.mockClear();

      vi.doMock("../../config/env", () => ({
        env: { databaseUrl: url },
      }));

      await import("../../config/db");

      expect(mockCreateDb).toHaveBeenCalledWith(url);
    }
  });
});
