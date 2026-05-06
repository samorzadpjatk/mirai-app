import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock instances that will be returned by mocked constructors
const mockPrismaClientInstance = {
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  user: {},
  trip: {},
  challenge: {},
};

const mockPrismaPgInstance = {
  connectionString: "",
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  transaction: vi.fn(),
};

// Track mock calls
const prismaClientCalls: unknown[][] = [];
const prismaPgCalls: unknown[][] = [];

// Mock the Prisma client module
vi.mock("../prisma/lib/client", () => ({
  PrismaClient: vi.fn().mockImplementation((...args: unknown[]) => {
    prismaClientCalls.push(args);
    return mockPrismaClientInstance;
  }),
}));

// Mock the PrismaPg adapter module
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn().mockImplementation((...args: unknown[]) => {
    prismaPgCalls.push(args);
    return {
      ...mockPrismaPgInstance,
      ...(args[0] as Record<string, string>)?.connectionString
        ? { connectionString: (args[0] as Record<string, string>).connectionString }
        : {},
    };
  }),
}));

// Import the mocked modules to get references to the mock constructors
import { PrismaClient } from "../prisma/lib/client";
import { PrismaPg } from "@prisma/adapter-pg";

describe("Database Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset call tracking arrays
    prismaClientCalls.length = 0;
    prismaPgCalls.length = 0;
    // Reset modules to clear the singleton state in client.ts
    vi.resetModules();
  });

  describe("createDb", () => {
    it("should create a Prisma client with PostgreSQL adapter", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      // Dynamic import to get fresh module with reset singleton
      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: databaseUrl,
      });
      expect(PrismaClient).toHaveBeenCalledWith(
        expect.objectContaining({
          adapter: expect.any(Object),
        })
      );
    });

    it("should return same instance on multiple calls (singleton)", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      // Dynamic import to get fresh module with reset singleton
      const { createDb } = await import("../client");

      const db1 = createDb(databaseUrl);
      const db2 = createDb(databaseUrl);

      expect(db1).toBe(db2);
      expect(PrismaClient).toHaveBeenCalledTimes(1);
    });

    it("should use the provided database URL", async () => {
      const databaseUrl = "postgresql://user:pass@host:5433/dbname";

      const { createDb } = await import("../client");
      createDb(databaseUrl);

      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: databaseUrl,
      });
    });

    it("should handle different database URLs on first call", async () => {
      const url1 = "postgresql://localhost:5432/db1";
      const url2 = "postgresql://localhost:5432/db2";

      const { createDb } = await import("../client");

      const db1 = createDb(url1);
      const db2 = createDb(url2);

      expect(db1).toBe(db2);
      expect(PrismaPg).toHaveBeenCalledTimes(1);
      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: url1,
      });
    });

    it("should create Prisma client with correct structure", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toHaveProperty("$connect");
      expect(db).toHaveProperty("$disconnect");
      expect(db).toHaveProperty("user");
      expect(db).toHaveProperty("trip");
      expect(db).toHaveProperty("challenge");
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

  describe("PrismaPg adapter", () => {
    it("should instantiate PrismaPg with correct options", async () => {
      const databaseUrl = "postgresql://user:password@localhost:5432/mydb";

      const { createDb } = await import("../client");
      createDb(databaseUrl);

      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: databaseUrl,
      });
    });

    it("should pass adapter to PrismaClient", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      const { createDb } = await import("../client");
      createDb(databaseUrl);

      const mockAdapter = (PrismaPg as unknown as { mock: { results: { value: unknown }[] } }).mock.results[0]?.value;

      expect(PrismaClient).toHaveBeenCalledWith({
        adapter: mockAdapter,
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle empty database URL gracefully", async () => {
      const databaseUrl = "";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: databaseUrl,
      });
    });

    it("should handle complex connection strings", async () => {
      const databaseUrl =
        "postgresql://user:password@host.example.com:5432/database?schema=public&sslmode=require";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: databaseUrl,
      });
    });

    it("should handle localhost connection", async () => {
      const databaseUrl = "postgresql://localhost:5432/localdb";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: databaseUrl,
      });
    });

    it("should handle IPv4 connection string", async () => {
      const databaseUrl = "postgresql://127.0.0.1:5432/localdb";

      const { createDb } = await import("../client");
      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: databaseUrl,
      });
    });
  });
});
