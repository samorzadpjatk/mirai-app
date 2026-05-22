import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockPostgresClient = { end: mockEnd };
let mockDbCallCount = 0;
const createMockDb = () => {
  mockDbCallCount++;
  return { query: {}, _id: mockDbCallCount };
};

vi.mock("postgres", () => ({
  default: vi.fn(() => mockPostgresClient),
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: vi.fn(() => createMockDb()),
}));

vi.mock("../schema", () => ({
  users: {},
}));

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("client", () => {
  describe("createDb", () => {
    it("should create a postgres client and drizzle db", async () => {
      const { createDb } = await import("../client");
      const { default: postgres } = await import("postgres");
      const { drizzle } = await import("drizzle-orm/postgres-js");

      const db = createDb("postgresql://localhost/test");

      expect(postgres).toHaveBeenCalledTimes(1);
      expect(postgres).toHaveBeenCalledWith("postgresql://localhost/test");
      expect(drizzle).toHaveBeenCalledTimes(1);
      expect(drizzle).toHaveBeenCalledWith(mockPostgresClient, { schema: expect.any(Object) });
      expect(db).toEqual(expect.objectContaining({ query: {} }));
    });

    it("should return the same db instance on subsequent calls (singleton)", async () => {
      const { createDb } = await import("../client");
      const { default: postgres } = await import("postgres");

      const db1 = createDb("postgresql://localhost/test");
      const db2 = createDb("postgresql://localhost/test");

      expect(postgres).toHaveBeenCalledTimes(1);
      expect(db1).toBe(db2);
    });

    it("should create a new db after closeDb is called", async () => {
      const { createDb, closeDb } = await import("../client");
      const { default: postgres } = await import("postgres");

      const db1 = createDb("postgresql://localhost/test");
      await closeDb();
      const db2 = createDb("postgresql://localhost/test2");

      expect(postgres).toHaveBeenCalledTimes(2);
      expect(db1).not.toBe(db2);
    });
  });

  describe("closeDb", () => {
    it("should end the postgres client and reset state", async () => {
      const { createDb, closeDb } = await import("../client");

      createDb("postgresql://localhost/test");
      await closeDb();

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it("should be safe to call when no client exists", async () => {
      const { closeDb } = await import("../client");

      await expect(closeDb()).resolves.toBeUndefined();

      expect(mockEnd).not.toHaveBeenCalled();
    });

    it("should allow creating a new db after closing", async () => {
      const { createDb, closeDb } = await import("../client");
      const { default: postgres } = await import("postgres");
      const { drizzle } = await import("drizzle-orm/postgres-js");

      createDb("postgresql://localhost/test");
      await closeDb();
      const db2 = createDb("postgresql://localhost/test2");

      expect(postgres).toHaveBeenCalledTimes(2);
      expect(drizzle).toHaveBeenCalledTimes(2);
      expect(db2).toEqual(expect.objectContaining({ query: {} }));
    });
  });
});
