import { PrismaClient } from "@prisma/client";

// Clear module cache before each test to test singleton behavior
beforeEach(() => {
  jest.resetModules();
});

describe("db package", () => {
  describe("getPrisma", () => {
    it("should create a new PrismaClient instance", async () => {
      const { getPrisma } = await import("../index");
      const prisma = getPrisma();
      expect(prisma).toBeDefined();
      expect(prisma).toBeInstanceOf(PrismaClient);
    });

    it("should return the same instance on multiple calls (singleton pattern)", async () => {
      const { getPrisma } = await import("../index");
      const prisma1 = getPrisma();
      const prisma2 = getPrisma();
      expect(prisma1).toBe(prisma2);
    });

    it("should create a new instance in a fresh module load", async () => {
      const { getPrisma: getPrisma1 } = await import("../index");
      const prisma1 = getPrisma1();
      
      jest.resetModules();
      
      const { getPrisma: getPrisma2 } = await import("../index");
      const prisma2 = getPrisma2();
      
      expect(prisma1).toBeDefined();
      expect(prisma2).toBeDefined();
      // After reset, they should be different instances
      expect(prisma1).not.toBe(prisma2);
    });
  });

  describe("db export", () => {
    it("should export db as the Prisma client instance", async () => {
      const { db, getPrisma } = await import("../index");
      expect(db).toBeDefined();
      expect(db).toBe(getPrisma());
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

  describe("Prisma exports", () => {
    it("should re-export Prisma namespace", async () => {
      const { Prisma } = await import("../index");
      expect(Prisma).toBeDefined();
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
