import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const originalEnv = process.env;
const TEST_DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

// Clear module cache before each test to test singleton behavior
beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv, DATABASE_URL: TEST_DATABASE_URL };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("db package", () => {

  describe("db export", () => {
    it("should export db as the Prisma client instance", async () => {
        const { db } = await import("../index");
      expect(db).toBeDefined();
    });

    it("should have all Prisma client methods", async () => {
        const { db } = await import("../index");
      expect(db.user).toBeDefined();
      expect(db.group).toBeDefined();
      expect(db.event).toBeDefined();
      expect(db.coinTransaction).toBeDefined();
      expect(db.notification).toBeDefined();
      expect(db.$connect).toBeDefined();
      expect(db.$disconnect).toBeDefined();
      expect(db.$transaction).toBeDefined();
    });
  });

  describe("Prisma Client operations", () => {
    it("should support user operations", async () => {
        const { db } = await import("../index");
      
      expect(db.user.findMany).toBeDefined();
      expect(db.user.findUnique).toBeDefined();
      expect(db.user.create).toBeDefined();
      expect(db.user.update).toBeDefined();
      expect(db.user.delete).toBeDefined();
      expect(db.user.upsert).toBeDefined();
    });

    it("should support group operations", async () => {
        const { db } = await import("../index");
      
      expect(db.group.findMany).toBeDefined();
      expect(db.group.findUnique).toBeDefined();
      expect(db.group.create).toBeDefined();
      expect(db.group.update).toBeDefined();
      expect(db.group.delete).toBeDefined();
    });

    it("should support event operations", async () => {
        const { db } = await import("../index");
      
      expect(db.event.findMany).toBeDefined();
      expect(db.event.findUnique).toBeDefined();
      expect(db.event.create).toBeDefined();
      expect(db.event.update).toBeDefined();
      expect(db.event.delete).toBeDefined();
    });

    it("should support coinTransaction operations", async () => {
        const { db } = await import("../index");
      
      expect(db.coinTransaction.findMany).toBeDefined();
      expect(db.coinTransaction.create).toBeDefined();
    });

    it("should support notification operations", async () => {
        const { db } = await import("../index");
      
      expect(db.notification.findMany).toBeDefined();
      expect(db.notification.create).toBeDefined();
    });
  });

  describe("Database connection", () => {
    it("should have connect method", async () => {
        const { db } = await import("../index");
      expect(db.$connect).toBeDefined();
      expect(typeof db.$connect).toBe("function");
    });

    it("should have disconnect method", async () => {
        const { db } = await import("../index");
      expect(db.$disconnect).toBeDefined();
      expect(typeof db.$disconnect).toBe("function");
    });

    it("should have transaction method", async () => {
        const { db } = await import("../index");
      expect(db.$transaction).toBeDefined();
      expect(typeof db.$transaction).toBe("function");
    });
  });
});
