import { describe, it, expect, mock, beforeEach } from "bun:test";
import { PrismaUserRepository } from "../gateways/PrismaUserRepository";
import { User, UserRole } from "@repo/domain";

describe("[INTEGRATION] PrismaUserRepository", () => {
  // Create mock Prisma client
  const createMockPrisma = () => ({
    user: {
      create: mock(() => Promise.resolve({})),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve(0)),
    },
  });

  // Sample Prisma user data
  const createPrismaUser = (
    overrides: Partial<{
      id: string;
      authUserId: string;
      firstName: string;
      lastName: string;
      role: string;
      hasAvatar: boolean;
      lastSeenOn: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }> = {},
  ) => ({
    id: "user-123",
    authUserId: "auth-456",
    firstName: "John",
    lastName: "Doe",
    role: "USER",
    hasAvatar: false,
    lastSeenOn: null,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("create", () => {
    it("should create a user and return domain entity", async () => {
      const mockPrisma = createMockPrisma();
      const prismaUser = createPrismaUser();
      mockPrisma.user.create = mock(() => Promise.resolve(prismaUser));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const user = User.create({
        authUserId: "auth-456",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      }).value;

      const result = await repository.create(user);

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          authUserId: "auth-456",
          firstName: "John",
          lastName: "Doe",
          role: "USER",
        }),
      });
      expect(result.id).toBe("user-123");
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });

    it("should propagate database errors", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.create = mock(() =>
        Promise.reject(new Error("Database error")),
      );

      const repository = new PrismaUserRepository(mockPrisma as any);
      const user = User.create({
        authUserId: "auth-123",
        firstName: "Test",
        lastName: "User",
        role: UserRole.USER,
      }).value;

      await expect(repository.create(user)).rejects.toThrow("Database error");
    });
  });

  describe("findById", () => {
    it("should find user by id and return domain entity", async () => {
      const mockPrisma = createMockPrisma();
      const prismaUser = createPrismaUser({ id: "user-789" });
      mockPrisma.user.findUnique = mock(() => Promise.resolve(prismaUser));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const result = await repository.findById("user-789");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-789" },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe("user-789");
    });

    it("should return null when user not found", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique = mock(() => Promise.resolve(null));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });

    it("should handle different user roles", async () => {
      const mockPrisma = createMockPrisma();
      const prismaUser = createPrismaUser({ role: "ADMIN" });
      mockPrisma.user.findUnique = mock(() => Promise.resolve(prismaUser));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const result = await repository.findById("user-123");

      expect(result?.role).toBe(UserRole.ADMIN);
    });
  });

  describe("findByAuthUserId", () => {
    it("should find user by authUserId", async () => {
      const mockPrisma = createMockPrisma();
      const prismaUser = createPrismaUser({
        id: "user-456",
        authUserId: "auth-xyz",
      });
      mockPrisma.user.findUnique = mock(() => Promise.resolve(prismaUser));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const result = await repository.findByAuthUserId("auth-xyz");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { authUserId: "auth-xyz" },
      });
      expect(result?.authUserId).toBe("auth-xyz");
    });

    it("should return null when auth user not found", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique = mock(() => Promise.resolve(null));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const result = await repository.findByAuthUserId("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByRole", () => {
    it("should find users by role", async () => {
      const mockPrisma = createMockPrisma();
      const prismaUsers = [
        createPrismaUser({ id: "admin-1", role: "ADMIN" }),
        createPrismaUser({ id: "admin-2", role: "ADMIN" }),
      ];
      mockPrisma.user.findMany = mock(() => Promise.resolve(prismaUsers));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const results = await repository.findByRole(UserRole.ADMIN);

      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
      expect(results).toHaveLength(2);
      expect(results[0].role).toBe(UserRole.ADMIN);
      expect(results[1].role).toBe(UserRole.ADMIN);
    });

    it("should return empty array when no users found", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findMany = mock(() => Promise.resolve([]));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const results = await repository.findByRole(UserRole.MODERATOR);

      expect(results).toEqual([]);
    });

    it("should handle MODERATOR role", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findMany = mock(() =>
        Promise.resolve([createPrismaUser({ role: "MODERATOR" })]),
      );

      const repository = new PrismaUserRepository(mockPrisma as any);
      const results = await repository.findByRole(UserRole.MODERATOR);

      expect(results[0].role).toBe(UserRole.MODERATOR);
    });

    it("should handle SERVICE role", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findMany = mock(() =>
        Promise.resolve([createPrismaUser({ role: "SERVICE" })]),
      );

      const repository = new PrismaUserRepository(mockPrisma as any);
      const results = await repository.findByRole(UserRole.SERVICE);

      expect(results[0].role).toBe(UserRole.SERVICE);
    });
  });

  describe("findAll", () => {
    it("should return all users without options", async () => {
      const mockPrisma = createMockPrisma();
      const prismaUsers = [
        createPrismaUser({ id: "user-1" }),
        createPrismaUser({ id: "user-2" }),
        createPrismaUser({ id: "user-3" }),
      ];
      mockPrisma.user.findMany = mock(() => Promise.resolve(prismaUsers));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const results = await repository.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        take: undefined,
        skip: undefined,
        orderBy: { createdAt: "desc" },
      });
      expect(results).toHaveLength(3);
    });

    it("should respect limit option", async () => {
      const mockPrisma = createMockPrisma();
      const prismaUsers = [createPrismaUser({ id: "user-1" })];
      mockPrisma.user.findMany = mock(() => Promise.resolve(prismaUsers));

      const repository = new PrismaUserRepository(mockPrisma as any);
      await repository.findAll({ limit: 1 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        take: 1,
        skip: undefined,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should respect offset option", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findMany = mock(() => Promise.resolve([]));

      const repository = new PrismaUserRepository(mockPrisma as any);
      await repository.findAll({ offset: 10 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        take: undefined,
        skip: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should respect both limit and offset options", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findMany = mock(() => Promise.resolve([]));

      const repository = new PrismaUserRepository(mockPrisma as any);
      await repository.findAll({ limit: 5, offset: 10 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        take: 5,
        skip: 10,
        orderBy: { createdAt: "desc" },
      });
    });

    it("should order results by createdAt desc", async () => {
      const mockPrisma = createMockPrisma();
      const prismaUsers = [
        createPrismaUser({
          id: "user-2",
          createdAt: new Date("2024-01-20T10:00:00Z"),
        }),
        createPrismaUser({
          id: "user-1",
          createdAt: new Date("2024-01-15T10:00:00Z"),
        }),
      ];
      mockPrisma.user.findMany = mock(() => Promise.resolve(prismaUsers));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const results = await repository.findAll();

      // Verify orderBy was passed
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });

  describe("update", () => {
    it("should update user and return updated domain entity", async () => {
      const mockPrisma = createMockPrisma();
      const updatedPrismaUser = createPrismaUser({
        id: "user-123",
        firstName: "Updated",
        lastName: "Name",
      });
      mockPrisma.user.update = mock(() => Promise.resolve(updatedPrismaUser));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const user = User.create({
        id: "user-123",
        authUserId: "auth-456",
        firstName: "Updated",
        lastName: "Name",
        role: UserRole.USER,
      }).value;

      const result = await repository.update(user);

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: expect.objectContaining({
          firstName: "Updated",
          lastName: "Name",
        }),
      });
      expect(result.firstName).toBe("Updated");
      expect(result.lastName).toBe("Name");
    });

    it("should propagate update errors", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.update = mock(() =>
        Promise.reject(new Error("Update failed")),
      );

      const repository = new PrismaUserRepository(mockPrisma as any);
      const user = User.create({
        id: "user-123",
        authUserId: "auth-456",
        firstName: "Test",
        lastName: "User",
        role: UserRole.USER,
      }).value;

      await expect(repository.update(user)).rejects.toThrow("Update failed");
    });
  });

  describe("delete", () => {
    it("should delete user by id", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.delete = mock(() => Promise.resolve({}));

      const repository = new PrismaUserRepository(mockPrisma as any);
      await repository.delete("user-123");

      expect(mockPrisma.user.delete).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });

    it("should propagate delete errors", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.delete = mock(() =>
        Promise.reject(new Error("Delete failed")),
      );

      const repository = new PrismaUserRepository(mockPrisma as any);
      await expect(repository.delete("user-123")).rejects.toThrow(
        "Delete failed",
      );
    });
  });

  describe("existsByAuthUserId", () => {
    it("should return true when user exists", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique = mock(() =>
        Promise.resolve(createPrismaUser()),
      );

      const repository = new PrismaUserRepository(mockPrisma as any);
      const result = await repository.existsByAuthUserId("auth-456");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { authUserId: "auth-456" },
      });
      expect(result).toBe(true);
    });

    it("should return false when user does not exist", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique = mock(() => Promise.resolve(null));

      const repository = new PrismaUserRepository(mockPrisma as any);
      const result = await repository.existsByAuthUserId("non-existent");

      expect(result).toBe(false);
    });

    it("should return true for existing user (edge case verification)", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique = mock(() =>
        Promise.resolve(
          createPrismaUser({ id: "user-123", authUserId: "auth-456" }),
        ),
      );

      const repository = new PrismaUserRepository(mockPrisma as any);
      const result = await repository.existsByAuthUserId("auth-456");

      expect(result).toBe(true);
    });
  });
});
