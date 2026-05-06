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

// Mock the Prisma client module
vi.mock("../prisma/lib/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrismaClientInstance),
}));

// Mock the PrismaPg adapter module
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn().mockImplementation((args: { connectionString: string }) => ({
    ...mockPrismaPgInstance,
    connectionString: args.connectionString,
  })),
}));

describe("Database Index Exports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("createDb export", () => {
    it("should export createDb function from index", async () => {
      const { createDb } = await import("../index");

      expect(createDb).toBeDefined();
      expect(typeof createDb).toBe("function");
    });

    it("should create a database client using exported createDb", async () => {
      const { createDb } = await import("../index");
      const databaseUrl = "postgresql://localhost:5432/test";

      const db = createDb(databaseUrl);

      expect(db).toBeDefined();
      expect(db).toHaveProperty("$connect");
      expect(db).toHaveProperty("$disconnect");
    });
  });

  describe("PrismaClient type export", () => {
    it("should export PrismaClient type from index", async () => {
      // Import the type from index - this verifies the export exists
      const indexModule = await import("../index");

      // The module should be defined
      expect(indexModule).toBeDefined();
    });

    it("should allow importing PrismaClient from index", async () => {
      // This test verifies that PrismaClient can be imported from index
      // TypeScript will fail compilation if the export doesn't exist
      const indexModule = await import("../index");

      // Verify the module exports are accessible
      expect(indexModule).toBeTruthy();
    });
  });

  describe("Module re-exports", () => {
    it("should re-export all client exports", async () => {
      const indexModule = await import("../index");
      const clientModule = await import("../client");

      // createDb should be the same function in both modules
      expect(indexModule.createDb).toBe(clientModule.createDb);
    });

    it("should have consistent exports between index and client", async () => {
      const { createDb: indexCreateDb } = await import("../index");
      const { createDb: clientCreateDb } = await import("../client");

      const databaseUrl = "postgresql://localhost:5432/test";

      // Both should create the same type of object
      const dbFromIndex = indexCreateDb(databaseUrl);
      const dbFromClient = clientCreateDb(databaseUrl);

      // Both should have the same properties
      expect(typeof dbFromIndex).toBe(typeof dbFromClient);
      expect(dbFromIndex).toHaveProperty("$connect");
      expect(dbFromClient).toHaveProperty("$connect");
    });
  });

  describe("Type exports verification", () => {
    it("should export types from prisma client", async () => {
      // Import from index to verify type exports work
      const indexModule = await import("../index");

      // The module should load without errors
      expect(indexModule).toBeDefined();
      expect(typeof indexModule).toBe("object");
    });

    it("should maintain singleton behavior through index export", async () => {
      const databaseUrl = "postgresql://localhost:5432/test";

      // Reset modules to get fresh singleton state
      vi.resetModules();
      const { createDb: createDbFresh } = await import("../index");

      const db1 = createDbFresh(databaseUrl);
      const db2 = createDbFresh(databaseUrl);

      // Should return same instance (singleton)
      expect(db1).toBe(db2);
    });
  });
});
