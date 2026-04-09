import { describe, it, expect } from "bun:test";
import { UserMapper } from "../mappers/UserMapper";
import { User, UserRole } from "@mirai-app/domain";

describe("[UNIT] UserMapper", () => {
  // Sample Prisma user records
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

  describe("toDomain", () => {
    it("should map Prisma user to domain User entity", () => {
      const prismaUser = createPrismaUser();
      const domainUser = UserMapper.toDomain(prismaUser);

      expect(domainUser.id).toBe("user-123");
      expect(domainUser.authUserId).toBe("auth-456");
      expect(domainUser.firstName).toBe("John");
      expect(domainUser.lastName).toBe("Doe");
      expect(domainUser.role).toBe(UserRole.USER);
      expect(domainUser.hasAvatar).toBe(false);
      expect(domainUser.lastSeenOn).toBeNull();
    });

    it("should map USER role correctly", () => {
      const prismaUser = createPrismaUser({ role: "USER" });
      const domainUser = UserMapper.toDomain(prismaUser);
      expect(domainUser.role).toBe(UserRole.USER);
    });

    it("should map ADMIN role correctly", () => {
      const prismaUser = createPrismaUser({ role: "ADMIN" });
      const domainUser = UserMapper.toDomain(prismaUser);
      expect(domainUser.role).toBe(UserRole.ADMIN);
    });

    it("should map MODERATOR role correctly", () => {
      const prismaUser = createPrismaUser({ role: "MODERATOR" });
      const domainUser = UserMapper.toDomain(prismaUser);
      expect(domainUser.role).toBe(UserRole.MODERATOR);
    });

    it("should map SERVICE role correctly", () => {
      const prismaUser = createPrismaUser({ role: "SERVICE" });
      const domainUser = UserMapper.toDomain(prismaUser);
      expect(domainUser.role).toBe(UserRole.SERVICE);
    });

    it("should default unknown role to USER", () => {
      const prismaUser = createPrismaUser({ role: "UNKNOWN_ROLE" });
      const domainUser = UserMapper.toDomain(prismaUser);
      expect(domainUser.role).toBe(UserRole.USER);
    });

    it("should map hasAvatar correctly when true", () => {
      const prismaUser = createPrismaUser({ hasAvatar: true });
      const domainUser = UserMapper.toDomain(prismaUser);
      expect(domainUser.hasAvatar).toBe(true);
    });

    it("should map lastSeenOn when provided", () => {
      const lastSeenDate = new Date("2024-01-20T14:30:00Z");
      const prismaUser = createPrismaUser({ lastSeenOn: lastSeenDate });
      const domainUser = UserMapper.toDomain(prismaUser);
      expect(domainUser.lastSeenOn).toEqual(lastSeenDate);
    });

    it("should map timestamps correctly", () => {
      const createdAt = new Date("2024-01-10T08:00:00Z");
      const updatedAt = new Date("2024-01-20T16:45:00Z");
      const prismaUser = createPrismaUser({ createdAt, updatedAt });
      const domainUser = UserMapper.toDomain(prismaUser);
      expect(domainUser.createdAt).toEqual(createdAt);
      expect(domainUser.updatedAt).toEqual(updatedAt);
    });

    it("should throw error when mapping invalid database data", () => {
      const prismaUser = createPrismaUser({
        authUserId: "", // Invalid: empty authUserId
      });

      expect(() => UserMapper.toDomain(prismaUser)).toThrow(
        "Failed to map User from database",
      );
    });

    it("should throw error when firstName is too long", () => {
      const prismaUser = createPrismaUser({
        firstName: "a".repeat(101), // Exceeds max length
      });

      expect(() => UserMapper.toDomain(prismaUser)).toThrow(
        "Failed to map User from database",
      );
    });
  });

  describe("toPrismaCreate", () => {
    it("should map domain User to Prisma create input", () => {
      const user = User.create({
        id: "user-789",
        authUserId: "auth-abc",
        firstName: "Jane",
        lastName: "Smith",
        role: UserRole.MODERATOR,
        hasAvatar: true,
        lastSeenOn: new Date("2024-02-01T12:00:00Z"),
      }).value;

      const prismaData = UserMapper.toPrismaCreate(user);

      expect(prismaData.id).toBe("user-789");
      expect(prismaData.authUserId).toBe("auth-abc");
      expect(prismaData.firstName).toBe("Jane");
      expect(prismaData.lastName).toBe("Smith");
      expect(prismaData.role).toBe("MODERATOR");
      expect(prismaData.hasAvatar).toBe(true);
      expect(prismaData.lastSeenOn).toEqual(new Date("2024-02-01T12:00:00Z"));
    });

    it("should map all role types correctly to strings", () => {
      const roles: { role: UserRole; expected: string }[] = [
        { role: UserRole.USER, expected: "USER" },
        { role: UserRole.ADMIN, expected: "ADMIN" },
        { role: UserRole.MODERATOR, expected: "MODERATOR" },
        { role: UserRole.SERVICE, expected: "SERVICE" },
      ];

      for (const { role, expected } of roles) {
        const user = User.create({
          authUserId: "test",
          firstName: "Test",
          lastName: "User",
          role,
        }).value;

        const prismaData = UserMapper.toPrismaCreate(user);
        expect(prismaData.role).toBe(expected);
      }
    });

    it("should map null lastSeenOn correctly", () => {
      const user = User.create({
        authUserId: "test",
        firstName: "Test",
        lastName: "User",
        role: UserRole.USER,
        lastSeenOn: null,
      }).value;

      const prismaData = UserMapper.toPrismaCreate(user);
      expect(prismaData.lastSeenOn).toBeNull();
    });

    it("should preserve auto-generated ID", () => {
      const user = User.create({
        authUserId: "test",
        firstName: "Test",
        lastName: "User",
        role: UserRole.USER,
      }).value;

      const prismaData = UserMapper.toPrismaCreate(user);
      expect(prismaData.id).toBeDefined();
      expect(typeof prismaData.id).toBe("string");
      expect(prismaData.id.length).toBeGreaterThan(0);
    });
  });

  describe("toPrismaUpdate", () => {
    it("should map domain User to Prisma update input", () => {
      const user = User.create({
        id: "user-xyz",
        authUserId: "auth-def",
        firstName: "Updated",
        lastName: "Name",
        role: UserRole.ADMIN,
        hasAvatar: true,
        lastSeenOn: new Date("2024-03-01T09:00:00Z"),
      }).value;

      const prismaData = UserMapper.toPrismaUpdate(user);

      expect(prismaData.firstName).toBe("Updated");
      expect(prismaData.lastName).toBe("Name");
      expect(prismaData.role).toBe("ADMIN");
      expect(prismaData.hasAvatar).toBe(true);
      expect(prismaData.lastSeenOn).toEqual(new Date("2024-03-01T09:00:00Z"));
    });

    it("should not include id or authUserId in update input", () => {
      const user = User.create({
        id: "user-abc",
        authUserId: "auth-xyz",
        firstName: "Test",
        lastName: "User",
        role: UserRole.USER,
      }).value;

      const prismaData = UserMapper.toPrismaUpdate(user);

      // Verify these keys are not in the update object
      expect("id" in prismaData).toBe(false);
      expect("authUserId" in prismaData).toBe(false);
    });

    it("should map empty names correctly", () => {
      const user = User.create({
        authUserId: "test",
        firstName: "", // Empty name
        lastName: "", // Empty name
        role: UserRole.USER,
      }).value;

      const prismaData = UserMapper.toPrismaUpdate(user);
      expect(prismaData.firstName).toBe("");
      expect(prismaData.lastName).toBe("");
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data through domain -> prisma -> domain conversion", () => {
      const originalUser = User.create({
        id: "user-123",
        authUserId: "auth-456",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.ADMIN,
        hasAvatar: true,
        lastSeenOn: new Date("2024-01-15T10:00:00Z"),
        createdAt: new Date("2024-01-10T08:00:00Z"),
        updatedAt: new Date("2024-01-20T16:45:00Z"),
      }).value;

      // Convert to Prisma format
      const prismaData = UserMapper.toPrismaCreate(originalUser);

      // Simulate database returning the data
      const prismaRecord = {
        ...prismaData,
        createdAt: originalUser.createdAt,
        updatedAt: originalUser.updatedAt,
      };

      // Convert back to domain
      const restoredUser = UserMapper.toDomain(prismaRecord);

      expect(restoredUser.id).toBe(originalUser.id);
      expect(restoredUser.authUserId).toBe(originalUser.authUserId);
      expect(restoredUser.firstName).toBe(originalUser.firstName);
      expect(restoredUser.lastName).toBe(originalUser.lastName);
      expect(restoredUser.role).toBe(originalUser.role);
      expect(restoredUser.hasAvatar).toBe(originalUser.hasAvatar);
      expect(restoredUser.lastSeenOn).toEqual(originalUser.lastSeenOn);
    });

    it("should preserve data through update conversion", () => {
      const originalUser = User.create({
        id: "user-123",
        authUserId: "auth-456",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
        hasAvatar: false,
        lastSeenOn: null,
        createdAt: new Date("2024-01-10T08:00:00Z"),
        updatedAt: new Date("2024-01-20T16:45:00Z"),
      }).value;

      // Convert to Prisma update format
      const prismaUpdateData = UserMapper.toPrismaUpdate(originalUser);

      // Simulate database returning updated record
      const prismaRecord = {
        id: originalUser.id,
        authUserId: originalUser.authUserId,
        ...prismaUpdateData,
        createdAt: originalUser.createdAt,
        updatedAt: new Date("2024-01-25T10:00:00Z"), // New updatedAt
      };

      // Convert back to domain
      const restoredUser = UserMapper.toDomain(prismaRecord);

      expect(restoredUser.id).toBe(originalUser.id);
      expect(restoredUser.authUserId).toBe(originalUser.authUserId);
      expect(restoredUser.firstName).toBe(originalUser.firstName);
      expect(restoredUser.lastName).toBe(originalUser.lastName);
      expect(restoredUser.role).toBe(originalUser.role);
    });
  });
});
