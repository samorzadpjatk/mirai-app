import { describe, it, expect } from "bun:test";
import { UserDrizzleMapper } from "./mapper";
import { UserRole } from "@mirai-app/domain";
import type { UserSelect } from "@mirai-app/frameworks/drizzle";

describe("[UNIT] UserDrizzleMapper", () => {
  const mapper = UserDrizzleMapper.instance;

  // Factory for creating mock Drizzle User records
  const createMockUserSelect = (
    overrides: Partial<UserSelect> = {},
  ): UserSelect => ({
    id: "user-123",
    authUserId: "auth-user-123",
    firstName: "John",
    lastName: "Doe",
    nickname: "johnny",
    email: "john@example.com",
    phone: "+1234567890",
    avatarUrl: "https://example.com/avatar.jpg",
    role: "USER",
    status: "ACTIVE",
    groupId: "group-1",
    bio: "Hello world",
    birthDate: "1990-01-01",
    shirtSize: "L",
    dietaryRequirements: "Vegetarian",
    medicalInfo: "None",
    hasAvatar: true,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    lastSeenOn: null,
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to UserDTO", () => {
      const record = createMockUserSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("user-123");
      expect(dto.authUserId).toBe("auth-user-123");
      expect(dto.firstName).toBe("John");
      expect(dto.lastName).toBe("Doe");
      expect(dto.nickname).toBe("johnny");
      expect(dto.email).toBe("john@example.com");
      expect(dto.phone).toBe("+1234567890");
      expect(dto.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(dto.role).toBe(UserRole.USER);
      expect(dto.status).toBe("ACTIVE");
      expect(dto.groupId).toBe("group-1");
      expect(dto.bio).toBe("Hello world");
      expect(dto.birthDate).toBe("1990-01-01");
      expect(dto.shirtSize).toBe("L");
      expect(dto.dietaryRequirements).toBe("Vegetarian");
      expect(dto.medicalInfo).toBe("None");
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null values", () => {
      const record = createMockUserSelect({
        nickname: null,
        email: null,
        phone: null,
        avatarUrl: null,
        groupId: null,
        bio: null,
        birthDate: null,
        shirtSize: null,
        dietaryRequirements: null,
        medicalInfo: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.nickname).toBeNull();
      expect(dto.email).toBeNull();
      expect(dto.phone).toBeNull();
      expect(dto.avatarUrl).toBeNull();
      expect(dto.groupId).toBeNull();
      expect(dto.bio).toBeNull();
      expect(dto.birthDate).toBeNull();
      expect(dto.shirtSize).toBeNull();
      expect(dto.dietaryRequirements).toBeNull();
      expect(dto.medicalInfo).toBeNull();
    });

    it("maps roles correctly", () => {
      expect(mapper.toDTO(createMockUserSelect({ role: "USER" })).role).toBe(
        UserRole.USER,
      );
      expect(mapper.toDTO(createMockUserSelect({ role: "ADMIN" })).role).toBe(
        UserRole.ADMIN,
      );
      expect(
        mapper.toDTO(createMockUserSelect({ role: "MODERATOR" })).role,
      ).toBe(UserRole.MODERATOR);
      expect(mapper.toDTO(createMockUserSelect({ role: "SERVICE" })).role).toBe(
        UserRole.SERVICE,
      );
    });

    it("defaults unknown role to USER", () => {
      const dto = mapper.toDTO(
        createMockUserSelect({ role: "UNKNOWN" as string }),
      );
      expect(dto.role).toBe(UserRole.USER);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts UserDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockUserSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("user-123");
      expect(insert.authUserId).toBe("auth-user-123");
      expect(insert.firstName).toBe("John");
      expect(insert.lastName).toBe("Doe");
      expect(insert.nickname).toBe("johnny");
      expect(insert.email).toBe("john@example.com");
      expect(insert.phone).toBe("+1234567890");
      expect(insert.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(insert.role).toBe(UserRole.USER);
      expect(insert.status).toBe("ACTIVE");
      expect(insert.groupId).toBe("group-1");
      expect(insert.bio).toBe("Hello world");
      expect(insert.birthDate).toBe("1990-01-01");
      expect(insert.shirtSize).toBe("L");
      expect(insert.dietaryRequirements).toBe("Vegetarian");
      expect(insert.medicalInfo).toBe("None");
      expect(insert.hasAvatar).toBe(true);
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.lastSeenOn).toBeNull();
    });

    it("derives hasAvatar from avatarUrl", () => {
      const withAvatar = mapper.toDTO(
        createMockUserSelect({ avatarUrl: "https://example.com/avatar.jpg" }),
      );
      const withoutAvatar = mapper.toDTO(
        createMockUserSelect({ avatarUrl: null }),
      );

      expect(mapper.toDrizzleInsert(withAvatar).hasAvatar).toBe(true);
      expect(mapper.toDrizzleInsert(withoutAvatar).hasAvatar).toBe(false);
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts UserDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockUserSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id or createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("createdAt");

      // Should include all other fields
      expect(update.firstName).toBe("John");
      expect(update.lastName).toBe("Doe");
      expect(update.nickname).toBe("johnny");
      expect(update.email).toBe("john@example.com");
      expect(update.phone).toBe("+1234567890");
      expect(update.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(update.role).toBe(UserRole.USER);
      expect(update.status).toBe("ACTIVE");
      expect(update.groupId).toBe("group-1");
      expect(update.bio).toBe("Hello world");
      expect(update.birthDate).toBe("1990-01-01");
      expect(update.shirtSize).toBe("L");
      expect(update.dietaryRequirements).toBe("Vegetarian");
      expect(update.medicalInfo).toBe("None");
      expect(update.hasAvatar).toBe(true);
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockUserSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      // updatedAt should be a new Date (approximately now)
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = UserDrizzleMapper.instance;
      const instance2 = UserDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
