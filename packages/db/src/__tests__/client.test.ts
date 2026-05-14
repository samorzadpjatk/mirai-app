import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPostgresInstance = vi.fn();

vi.mock("postgres", () => ({
  default: vi.fn(() => mockPostgresInstance),
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn(() => ({
    $client: mockPostgresInstance,
    query: {},
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  })),
}));

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

describe("Database Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("createDb", () => {
    it("should create a Drizzle client with postgres driver", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(postgres).toHaveBeenCalledWith(databaseUrl);
      expect(drizzle).toHaveBeenCalledWith(
        mockPostgresInstance,
        expect.objectContaining({ schema: expect.any(Object) }),
      );
    });

    it("should return same instance on multiple calls (singleton)", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      const { createDb } = await import("../client");

      const db1 = createDb(databaseUrl);
      const db2 = createDb(databaseUrl);

      expect(db1).toBe(db2);
      expect(postgres).toHaveBeenCalledTimes(1);
      expect(drizzle).toHaveBeenCalledTimes(1);
    });

    it("should use the provided database URL", async () => {
      const databaseUrl = "postgresql://user:pass@host:5433/dbname";

      const { createDb } = await import("../client");
      createDb(databaseUrl);

      expect(postgres).toHaveBeenCalledWith(databaseUrl);
    });

    it("should handle different database URLs on first call", async () => {
      const url1 = "postgresql://localhost:5432/db1";
      const url2 = "postgresql://localhost:5432/db2";

      const { createDb } = await import("../client");

      const db1 = createDb(url1);
      const db2 = createDb(url2);

      expect(db1).toBe(db2);
      expect(postgres).toHaveBeenCalledTimes(1);
      expect(postgres).toHaveBeenCalledWith(url1);
    });

    it("should create Drizzle client with correct structure", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toHaveProperty("$client");
      expect(db).toHaveProperty("select");
      expect(db).toHaveProperty("insert");
      expect(db).toHaveProperty("update");
      expect(db).toHaveProperty("delete");
      expect(db).toHaveProperty("transaction");
    });
  });

  describe("Module exports", () => {
    it("should export createDb function", async () => {
      const { createDb: exportedCreateDb } = await import("../client");

      expect(typeof exportedCreateDb).toBe("function");
    });

    it("should export a callable function", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      const { createDb } = await import("../client");
      expect(() => createDb(databaseUrl)).not.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty database URL gracefully", async () => {
      const databaseUrl = "";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(postgres).toHaveBeenCalledWith(databaseUrl);
    });

    it("should handle complex connection strings", async () => {
      const databaseUrl =
        "postgresql://user:password@host.example.com:5432/database?schema=public&sslmode=require";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(postgres).toHaveBeenCalledWith(databaseUrl);
    });

    it("should handle localhost connection", async () => {
      const databaseUrl = "postgresql://localhost:5432/localdb";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(postgres).toHaveBeenCalledWith(databaseUrl);
    });

    it("should handle IPv4 connection string", async () => {
      const databaseUrl = "postgresql://127.0.0.1:5432/localdb";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(postgres).toHaveBeenCalledWith(databaseUrl);
    });
  });
});
