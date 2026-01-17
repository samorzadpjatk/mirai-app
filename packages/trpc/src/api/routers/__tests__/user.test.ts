import { describe, it, expect, vi, beforeEach } from "vitest";
import { userRouter } from "~/api/routers/user";
const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  SERVICE: "SERVICE",
} as const;
type Role = (typeof Role)[keyof typeof Role];

vi.mock("@integral-2025-app/db");

describe("userRouter", () => {
  interface SessionOverrides {
    id?: string;
    firstName?: string;
    lastName?: string;
    role?: Role;
  }

  const createMockContext = (sessionOverrides: SessionOverrides = {}) => {
    const dbUser = {
      id: sessionOverrides.id ?? "user-1",
      authUserId: "supabase-mock-user",
      email: `${sessionOverrides.id ?? "user-1"}@test.com`,
      firstName: sessionOverrides.firstName ?? "Test",
      lastName: sessionOverrides.lastName ?? "User",
      role: sessionOverrides.role ?? Role.MODERATOR,
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
        tripParticipant: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          findFirst: vi.fn(),
          upsert: vi.fn(),
          update: vi.fn(),
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
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: Role.USER,
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
        firstName: "Test",
        lastName: "User",
        trips: [
          {
            tripId: "trip-1",
            group: { id: "group-1", name: "Test Group" },
            trip: { id: "trip-1", name: "Trip 1" },
          },
        ],
        organizerGroup: [{ id: "org-1", name: "Organizer Group" }],
      };

      mockContext.db.user.findUnique.mockResolvedValue(mockUser);

      const caller = userRouter.createCaller(mockContext);
      mockContext.db.tripParticipant.findMany.mockResolvedValue([]);

      const result = await caller.getByIdWithGroup({
        id: "user-1",
        tripId: "trip-1",
      });

      expect(result).toEqual(mockUser);
      expect(mockContext.db.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          select: expect.objectContaining({
            id: true,
            firstName: true,
            lastName: true,
            trips: expect.objectContaining({
              where: { tripId: "trip-1" },
              include: expect.objectContaining({
                group: expect.any(Object),
                trip: expect.any(Object),
              }),
            }),
            organizerGroup: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe("getMy", () => {
    it("should return current user", async () => {
      const mockUser = {
        id: "mock-user-id",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: Role.USER,
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
          firstName: "User",
          lastName: "One",
          email: "user1@test.com",
          role: Role.USER,
          wristNumber: "001",
          houseNumber: undefined,
          group: { id: "group-1", name: "Group 1" },
          tripId: "trip-1",
        },
      ];

      mockContext.db.tripParticipant.findMany.mockResolvedValue([
        {
          user: {
            id: "user-1",
            firstName: "User",
            lastName: "One",
            email: "user1@test.com",
            role: Role.USER,
          },
          wristNumber: "001",
          houseNumber: undefined,
          group: { id: "group-1", name: "Group 1" },
          tripId: "trip-1",
        },
      ]);

      const caller = userRouter.createCaller(mockContext);
      const result = await caller.getAll({ tripId: "trip-1" });

      expect(result).toEqual(mockUsers);
      expect(mockContext.db.tripParticipant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tripId: "trip-1" },
          include: expect.objectContaining({
            user: expect.objectContaining({ select: expect.any(Object) }),
            group: expect.objectContaining({ select: expect.any(Object) }),
          }),
          orderBy: [
            { user: { firstName: "asc" } },
            { user: { lastName: "asc" } },
          ],
        }),
      );
    });
  });

  describe("getAllAdminsNames", () => {
    it("should return only admin users", async () => {
      const mockAdmins = [
        { id: "admin-1", firstName: "Admin", lastName: "One" },
        { id: "admin-2", firstName: "Admin", lastName: "Two" },
      ];

      mockContext.db.user.findMany.mockResolvedValue(mockAdmins);

      const caller = userRouter.createCaller(mockContext);
      const result = await caller.getAllAdminsNames();

      expect(result).toEqual(mockAdmins);
      expect(mockContext.db.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.ADMIN },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      });
    });
  });

  describe("updateUserAdminStatus", () => {
    it("should update user admin status", async () => {
      const adminContext = createMockContext({
        id: "admin-1",
        role: Role.ADMIN,
      });

      const mockUpdatedUser = {
        id: "user-2",
        firstName: "User",
        lastName: "Two",
        email: "user2@test.com",
        role: Role.ADMIN,
      };

      adminContext.db.user.update.mockResolvedValue(mockUpdatedUser);

      const caller = userRouter.createCaller(adminContext);
      const result = await caller.updateUserAdminStatus({
        userId: "user-2",
        role: Role.ADMIN,
      });

      expect(result).toEqual(mockUpdatedUser);
      expect(adminContext.db.user.update).toHaveBeenCalledWith({
        where: { id: "user-2" },
        data: { role: Role.ADMIN },
        select: expect.any(Object),
      });
    });

    it("should prevent admin from removing their own status", async () => {
      const adminContext = createMockContext({
        id: "mock-user-id",
        role: Role.ADMIN,
      });

      const caller = userRouter.createCaller(adminContext);

      await expect(
        caller.updateUserAdminStatus({
          userId: "mock-user-id",
          role: Role.USER,
        }),
      ).rejects.toThrow("Nie możesz usunąć swoich uprawnień administratora");
    });
  });

  describe("updateWristNumber", () => {
    it("should update user wrist number", async () => {
      const adminContext = createMockContext({
        id: "admin-1",
        role: Role.ADMIN,
      });

      const mockExistingUser = null; // No conflict
      const mockUpdatedUser = {
        user: {
          id: "user-1",
          firstName: "User",
          lastName: "One",
          email: "user1@test.com",
          role: Role.USER,
        },
        wristNumber: "123",
        tripId: "trip-1",
      };

      adminContext.db.user.findUnique.mockResolvedValue(mockExistingUser);

      const caller = userRouter.createCaller(adminContext);
      adminContext.db.tripParticipant.findFirst.mockResolvedValue(null);
      adminContext.db.tripParticipant.upsert.mockResolvedValue({
        ...mockUpdatedUser,
      });

      const result = await caller.updateWristNumber({
        userId: "user-1",
        tripId: "trip-1",
        wristNumber: "123",
      });

      expect(result).toEqual(mockUpdatedUser);
    });
  });
});
