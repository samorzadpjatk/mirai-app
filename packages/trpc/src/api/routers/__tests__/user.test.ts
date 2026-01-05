import { describe, it, expect, vi, beforeEach } from "vitest";
import { userRouter } from "~/api/routers/user";

vi.mock("@integral-2025-app/db");

describe("userRouter", () => {
  interface SessionOverrides {
    id?: string;
    name?: string;
    isAdmin?: boolean;
    isModerator?: boolean;
  }

  const createMockContext = (sessionOverrides: SessionOverrides = {}) => {
    const dbUser = {
      id: sessionOverrides.id ?? "user-1",
      authUserId: "supabase-mock-user",
      email: `${sessionOverrides.id ?? "user-1"}@test.com`,
      name: sessionOverrides.name ?? "Test User",
      isAdmin: sessionOverrides.isAdmin ?? false,
      isModerator: sessionOverrides.isModerator ?? true,
      isServiceAccount: false,
    };

    return {
      headers: new Headers(),
      db: {
        user: {
          findUnique: vi.fn(),
          findMany: vi.fn(),
          update: vi.fn(),
          findFirst: vi.fn().mockResolvedValue(dbUser),
        },
      },
      dbUser,
      supabase: {} as any,
    } as any;
  };

  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockContext = createMockContext();
    vi.clearAllMocks();
  });

  describe("getById", () => {
    it("should return user by id", async () => {
      const mockUser = {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        isAdmin: false,
      };

      mockContext.db.user.findUnique.mockResolvedValue(mockUser);

      const caller = userRouter.createCaller(mockContext);
      const result = await caller.getById({ id: "user-1" });

      expect(result).toEqual(mockUser);
      expect(mockContext.db.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });
  });

  describe("getByIdWithGroup", () => {
    it("should return user with group information", async () => {
      const mockUser = {
        id: "user-1",
        name: "Test User",
        group: { id: "group-1", name: "Test Group" },
        organizerGroup: [],
      };

      mockContext.db.user.findUnique.mockResolvedValue(mockUser);

      const caller = userRouter.createCaller(mockContext);
      const result = await caller.getByIdWithGroup({ id: "user-1" });

      expect(result).toEqual(mockUser);
      expect(mockContext.db.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          select: expect.objectContaining({
            id: true,
            name: true,
            group: expect.any(Object),
            organizerGroup: expect.any(Object),
          }),
        })
      );
    });
  });

  describe("getMy", () => {
    it("should return current user", async () => {
      const mockUser = {
        id: "mock-user-id",
        name: "Test User",
        email: "test@example.com",
        isAdmin: false,
      };

      mockContext.db.user.findUnique.mockResolvedValue(mockUser);

      const caller = userRouter.createCaller(mockContext);
      const result = await caller.getMy();

      expect(result).toEqual(mockUser);
      expect(mockContext.db.user.findUnique).toHaveBeenCalledWith({
        where: { id: "mock-user-id" },
      });
    });
  });

  describe("getAll", () => {
    it("should return all users with group info", async () => {
      const mockUsers = [
        {
          id: "user-1",
          name: "User 1",
          email: "user1@test.com",
          isAdmin: false,
          wristNumber: "001",
          group: { id: "group-1", name: "Group 1" },
          organizerGroup: [],
        },
      ];

      mockContext.db.user.findMany.mockResolvedValue(mockUsers);

      const caller = userRouter.createCaller(mockContext);
      const result = await caller.getAll();

      expect(result).toEqual(mockUsers);
      expect(mockContext.db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      );
    });
  });

  describe("getAllAdminsNames", () => {
    it("should return only admin users", async () => {
      const mockAdmins = [
        { id: "admin-1", name: "Admin 1" },
        { id: "admin-2", name: "Admin 2" },
      ];

      mockContext.db.user.findMany.mockResolvedValue(mockAdmins);

      const caller = userRouter.createCaller(mockContext);
      const result = await caller.getAllAdminsNames();

      expect(result).toEqual(mockAdmins);
      expect(mockContext.db.user.findMany).toHaveBeenCalledWith({
        where: { isAdmin: true },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("updateUserAdminStatus", () => {
    it("should update user admin status", async () => {
      const adminContext = createMockContext({ id: "admin-1", isAdmin: true });

      const mockUpdatedUser = {
        id: "user-2",
        name: "User 2",
        email: "user2@test.com",
        isAdmin: true,
      };

      adminContext.db.user.update.mockResolvedValue(mockUpdatedUser);

      const caller = userRouter.createCaller(adminContext);
      const result = await caller.updateUserAdminStatus({
        userId: "user-2",
        isAdmin: true,
      });

      expect(result).toEqual(mockUpdatedUser);
      expect(adminContext.db.user.update).toHaveBeenCalledWith({
        where: { id: "user-2" },
        data: { isAdmin: true },
        select: expect.any(Object),
      });
    });

    it("should prevent admin from removing their own status", async () => {
      const adminContext = createMockContext({ id: "mock-user-id", isAdmin: true });

      const caller = userRouter.createCaller(adminContext);

      await expect(
        caller.updateUserAdminStatus({
          userId: "mock-user-id",
          isAdmin: false,
        })
      ).rejects.toThrow("Nie możesz usunąć swoich uprawnień administratora");
    });
  });

  describe("updateWristNumber", () => {
    it("should update user wrist number", async () => {
      const adminContext = createMockContext({ id: "admin-1", isAdmin: true });

      const mockExistingUser = null; // No conflict
      const mockUpdatedUser = {
        id: "user-1",
        name: "User 1",
        wristNumber: "123",
      };

      adminContext.db.user.findUnique.mockResolvedValue(mockExistingUser);
      adminContext.db.user.update.mockResolvedValue(mockUpdatedUser);

      const caller = userRouter.createCaller(adminContext);
      const result = await caller.updateWristNumber({
        userId: "user-1",
        wristNumber: "123",
      });

      expect(result).toEqual(mockUpdatedUser);
    });
  });
});
