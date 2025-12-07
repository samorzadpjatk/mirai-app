import { describe, it, expect, vi, beforeEach } from "vitest";
import { coinRouter } from "../coin";
import { db } from "@integral-2025-app/db";

vi.mock("@integral-2025-app/db");

describe("coinRouter", () => {
  const createMockContext = () => {
    const dbUser = {
      id: "admin-1",
      authUserId: "supabase-mock-user",
      email: "admin@test.com",
      name: "Admin User",
      isAdmin: true,
      isModerator: true,
      isServiceAccount: false,
    };

    return {
      headers: new Headers(),
      db: {
        group: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        coinTransaction: {
          create: vi.fn(),
        },
        user: {
          findFirst: vi.fn().mockResolvedValue(dbUser),
        },
      },
      session: {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          isAdmin: dbUser.isAdmin,
        },
      },
      supabase: {} as any,
    } as any;
  };

  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    vi.clearAllMocks();
  });

  describe("addCoins", () => {
    it("should be defined", () => {
      expect(coinRouter._def.procedures.addCoins).toBeDefined();
    });

    it("should add coins to a group", async () => {
      const mockTransaction = {
        id: "tx-1",
        groupId: "group-1",
        amount: 100,
        reason: "Good work",
        adminId: "admin-1",
        createdAt: new Date(),
        group: {
          id: "group-1",
          name: "Test Group",
          coins: 200,
        },
        admin: {
          id: "admin-1",
          name: "Admin User",
        },
      };

      mockContext.db.group.update.mockResolvedValue({
        id: "group-1",
        coins: 200,
      });
      mockContext.db.coinTransaction.create.mockResolvedValue(mockTransaction);

      const caller = coinRouter.createCaller(mockContext);
      const result = await caller.addCoins({
        groupId: "group-1",
        amount: 100,
        reason: "Good work",
      });

      expect(result).toEqual(mockTransaction);
      expect(mockContext.db.group.update).toHaveBeenCalledWith({
        where: { id: "group-1" },
        data: { coins: { increment: 100 } },
      });
      expect(mockContext.db.coinTransaction.create).toHaveBeenCalled();
    });
  });

  describe("removeCoins", () => {
    it("should be defined", () => {
      expect(coinRouter._def.procedures.removeCoins).toBeDefined();
    });

    it("should remove coins from a group", async () => {
      const mockGroup = {
        id: "group-1",
        coins: 150,
      };

      const mockTransaction = {
        id: "tx-2",
        groupId: "group-1",
        amount: -50,
        reason: "Penalty",
        adminId: "admin-1",
        createdAt: new Date(),
        group: {
          id: "group-1",
          name: "Test Group",
          coins: 100,
        },
        admin: {
          id: "admin-1",
          name: "Admin User",
        },
      };

      mockContext.db.group.findUnique.mockResolvedValue(mockGroup);
      mockContext.db.group.update.mockResolvedValue({
        id: "group-1",
        coins: 100,
      });
      mockContext.db.coinTransaction.create.mockResolvedValue(mockTransaction);

      const caller = coinRouter.createCaller(mockContext);
      const result = await caller.removeCoins({
        groupId: "group-1",
        amount: 50,
        reason: "Penalty",
      });

      expect(result).toEqual(mockTransaction);
      expect(mockContext.db.group.findUnique).toHaveBeenCalledWith({
        where: { id: "group-1" },
        select: { coins: true },
      });
      expect(mockContext.db.group.update).toHaveBeenCalledWith({
        where: { id: "group-1" },
        data: { coins: { decrement: 50 } },
      });
    });

    it("should throw error if group does not have enough coins", async () => {
      const mockGroup = {
        id: "group-1",
        coins: 30,
      };

      mockContext.db.group.findUnique.mockResolvedValue(mockGroup);

      const caller = coinRouter.createCaller(mockContext);

      await expect(
        caller.removeCoins({
          groupId: "group-1",
          amount: 50,
        })
      ).rejects.toThrow("Guild does not have enough coins");
    });

    it("should throw error if group not found", async () => {
      mockContext.db.group.findUnique.mockResolvedValue(null);

      const caller = coinRouter.createCaller(mockContext);

      await expect(
        caller.removeCoins({
          groupId: "non-existent",
          amount: 50,
        })
      ).rejects.toThrow("Guild does not have enough coins");
    });
  });
});
