import { describe, it, expect } from "bun:test";
import { UserDTOServiceImpl } from "./dto-service";
import { User, UserRole } from "@mirai-app/domain";
import type { UserDTO } from "@mirai-app/use-cases";
import { Effect } from "effect";

/**
 * Helper type for testing toDomain results
 * The service returns Partial<User> but actually includes DTO-specific fields
 */
type PartialUserWithDTOFields = Partial<User> &
  Partial<
    Pick<
      UserDTO,
      | "nickname"
      | "email"
      | "phone"
      | "avatarUrl"
      | "bio"
      | "birthDate"
      | "shirtSize"
      | "dietaryRequirements"
      | "medicalInfo"
      | "status"
      | "groupId"
    >
  >;

describe("[UNIT] UserDTOServiceImpl", () => {
  const service = UserDTOServiceImpl.getInstance();

  // Factory for creating mock domain Users
  const createMockUser = async (
    overrides: Partial<User> = {},
  ): Promise<User> => {
    const effect = User.create({
      id: "user-123",
      authUserId: "auth-user-123",
      firstName: "John",
      lastName: "Doe",
      hasAvatar: true,
      role: UserRole.USER,
      lastSeenOn: null,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-20T14:30:00Z"),
    });

    const user = await Effect.runPromise(effect);

    // Apply overrides by creating a new user with modified properties
    if (Object.keys(overrides).length === 0) {
      return user;
    }

    // For properties that require updates, use domain methods
    let modifiedUser = user;

    if (
      overrides.firstName ||
      overrides.lastName ||
      overrides.hasAvatar !== undefined
    ) {
      const profileEffect = modifiedUser.updateProfile({
        firstName: overrides.firstName,
        lastName: overrides.lastName,
        hasAvatar: overrides.hasAvatar,
      });
      modifiedUser = await Effect.runPromise(profileEffect);
    }

    if (overrides.role && overrides.role !== user.role) {
      const roleEffect = modifiedUser.updateRole(overrides.role);
      modifiedUser = await Effect.runPromise(roleEffect);
    }

    return modifiedUser;
  };

  // Factory for creating mock UserDTOs
  const createMockUserDTO = (overrides: Partial<UserDTO> = {}): UserDTO => ({
    id: "user-123",
    authUserId: "auth-user-123",
    firstName: "John",
    lastName: "Doe",
    nickname: "johnny",
    email: "john@example.com",
    phone: "+1234567890",
    avatarUrl: "https://example.com/avatar.jpg",
    role: UserRole.USER,
    status: "ACTIVE",
    groupId: "group-1",
    bio: "Hello world",
    birthDate: new Date("1990-01-15"),
    shirtSize: "L",
    dietaryRequirements: "Vegetarian",
    medicalInfo: "None",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-20T14:30:00Z"),
    ...overrides,
  });

  describe("singleton instance", () => {
    it("returns the same instance on multiple calls", () => {
      const instance1 = UserDTOServiceImpl.getInstance();
      const instance2 = UserDTOServiceImpl.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("returns the service as UserDTOService type", () => {
      const instance = UserDTOServiceImpl.getInstance();

      expect(instance).toBeDefined();
      expect(typeof instance.fromDomain).toBe("function");
      expect(typeof instance.toDomain).toBe("function");
      expect(typeof instance.fromDomainList).toBe("function");
    });
  });

  describe("fromDomain", () => {
    it("converts domain User to UserDTO with all fields", async () => {
      const user = await createMockUser();

      const dto = service.fromDomain(user);

      expect(dto.id).toBe("user-123");
      expect(dto.authUserId).toBe("auth-user-123");
      expect(dto.firstName).toBe("John");
      expect(dto.lastName).toBe("Doe");
      expect(dto.role).toBe(UserRole.USER);
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-20T14:30:00Z"));
    });

    it("converts user with ADMIN role to DTO", async () => {
      const user = await createMockUser({ role: UserRole.ADMIN });

      const dto = service.fromDomain(user);

      expect(dto.role).toBe(UserRole.ADMIN);
    });

    it("converts user with MODERATOR role to DTO", async () => {
      const user = await createMockUser({ role: UserRole.MODERATOR });

      const dto = service.fromDomain(user);

      expect(dto.role).toBe(UserRole.MODERATOR);
    });

    it("converts user with SERVICE role to DTO", async () => {
      const user = await createMockUser({ role: UserRole.SERVICE });

      const dto = service.fromDomain(user);

      expect(dto.role).toBe(UserRole.SERVICE);
    });

    it("maps domain fields to DTO fields correctly", async () => {
      const user = await createMockUser({
        firstName: "Jane",
        lastName: "Smith",
      });

      const dto = service.fromDomain(user);

      expect(dto.firstName).toBe("Jane");
      expect(dto.lastName).toBe("Smith");
    });

    it("preserves id and authUserId in DTO conversion", async () => {
      const user = await createMockUser();

      const dto = service.fromDomain(user);

      expect(dto.id).toBe(user.id);
      expect(dto.authUserId).toBe(user.authUserId);
    });
  });

  describe("fromDomainList", () => {
    it("converts empty array to empty array", async () => {
      const dtos = service.fromDomainList([]);

      expect(dtos).toEqual([]);
    });

    it("converts single user in array", async () => {
      const user = await createMockUser();

      const dtos = service.fromDomainList([user]);

      expect(dtos).toHaveLength(1);
      expect(dtos[0]!.id).toBe("user-123");
      expect(dtos[0]!.firstName).toBe("John");
    });

    it("converts multiple users in array", async () => {
      const user1 = await createMockUser();
      const user2Effect = User.create({
        id: "user-456",
        authUserId: "auth-user-456",
        firstName: "Jane",
        lastName: "Smith",
        hasAvatar: false,
        role: UserRole.ADMIN,
        lastSeenOn: null,
        createdAt: new Date("2024-02-01T10:00:00Z"),
        updatedAt: new Date("2024-02-01T10:00:00Z"),
      });
      const user2 = await Effect.runPromise(user2Effect);

      const dtos = service.fromDomainList([user1, user2]);

      expect(dtos).toHaveLength(2);
      expect(dtos[0]!.id).toBe("user-123");
      expect(dtos[1]!.id).toBe("user-456");
      expect(dtos[1]!.firstName).toBe("Jane");
      expect(dtos[1]!.role).toBe(UserRole.ADMIN);
    });

    it("preserves order of users in array", async () => {
      const user1 = await createMockUser();
      const user2Effect = User.create({
        id: "user-789",
        authUserId: "auth-user-789",
        firstName: "Bob",
        lastName: "Brown",
        hasAvatar: false,
        role: UserRole.USER,
        lastSeenOn: null,
        createdAt: new Date("2024-03-01T10:00:00Z"),
        updatedAt: new Date("2024-03-01T10:00:00Z"),
      });
      const user2 = await Effect.runPromise(user2Effect);

      const dtos = service.fromDomainList([user2, user1]);

      expect(dtos[0]!.id).toBe("user-789");
      expect(dtos[1]!.id).toBe("user-123");
    });
  });

  describe("toDomain", () => {
    it("converts full DTO to partial domain User", () => {
      const dto = createMockUserDTO();

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(partial.firstName).toBe("John");
      expect(partial.lastName).toBe("Doe");
      expect(partial.nickname).toBe("johnny");
      expect(partial.email).toBe("john@example.com");
      expect(partial.phone).toBe("+1234567890");
      expect(partial.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(partial.bio).toBe("Hello world");
      expect(partial.birthDate).toEqual(new Date("1990-01-15"));
      expect(partial.shirtSize).toBe("L");
      expect(partial.dietaryRequirements).toBe("Vegetarian");
      expect(partial.medicalInfo).toBe("None");
    });

    it("returns empty object for empty DTO", () => {
      const partial = service.toDomain({});

      expect(partial).toEqual({});
    });

    it("only includes defined fields in partial conversion", () => {
      const dto: Partial<UserDTO> = {
        firstName: "Updated",
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(Object.keys(partial)).toHaveLength(1);
      expect(partial.firstName).toBe("Updated");
      expect(partial.lastName).toBeUndefined();
      expect(partial.email).toBeUndefined();
    });

    it("excludes fields when value is undefined", () => {
      const dto: Partial<UserDTO> = {
        firstName: "John",
        lastName: undefined,
        email: "test@example.com",
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(partial.firstName).toBe("John");
      expect(partial.lastName).toBeUndefined();
      expect(partial.email).toBe("test@example.com");
    });

    it("handles null values correctly (includes them)", () => {
      const dto: Partial<UserDTO> = {
        firstName: null,
        nickname: null,
        email: null,
        bio: null,
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(partial.firstName).toBeNull();
      expect(partial.nickname).toBeNull();
      expect(partial.email).toBeNull();
      expect(partial.bio).toBeNull();
    });

    it("converts partial DTO with only personal info", () => {
      const dto: Partial<UserDTO> = {
        firstName: "NewFirst",
        lastName: "NewLast",
        nickname: "newbie",
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(partial.firstName).toBe("NewFirst");
      expect(partial.lastName).toBe("NewLast");
      expect(partial.nickname).toBe("newbie");
      expect(partial.email).toBeUndefined();
    });

    it("converts partial DTO with only contact info", () => {
      const dto: Partial<UserDTO> = {
        email: "new@example.com",
        phone: "+9876543210",
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(partial.email).toBe("new@example.com");
      expect(partial.phone).toBe("+9876543210");
    });

    it("converts partial DTO with profile metadata", () => {
      const dto: Partial<UserDTO> = {
        avatarUrl: "https://new-avatar.com/img.jpg",
        bio: "Updated bio",
        birthDate: new Date("1995-05-20"),
        shirtSize: "XL",
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(partial.avatarUrl).toBe("https://new-avatar.com/img.jpg");
      expect(partial.bio).toBe("Updated bio");
      expect(partial.birthDate).toEqual(new Date("1995-05-20"));
      expect(partial.shirtSize).toBe("XL");
    });

    it("converts partial DTO with special requirements", () => {
      const dto: Partial<UserDTO> = {
        dietaryRequirements: "Vegan, No nuts",
        medicalInfo: "Penicillin allergy",
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(partial.dietaryRequirements).toBe("Vegan, No nuts");
      expect(partial.medicalInfo).toBe("Penicillin allergy");
    });

    it("does not include id, authUserId, role, status, groupId, createdAt, updatedAt in conversion", () => {
      const dto: Partial<UserDTO> = {
        id: "different-id",
        authUserId: "different-auth-id",
        role: UserRole.ADMIN,
        status: "INACTIVE",
        groupId: "different-group",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(partial.id).toBeUndefined();
      expect(partial.authUserId).toBeUndefined();
      expect(partial.role).toBeUndefined();
      expect(partial.status).toBeUndefined();
      expect(partial.groupId).toBeUndefined();
      expect(partial.createdAt).toBeUndefined();
      expect(partial.updatedAt).toBeUndefined();
    });

    it("handles mixed defined and undefined fields", () => {
      const dto: Partial<UserDTO> = {
        firstName: "OnlyFirstNameDefined",
        lastName: undefined,
        email: "only@email.com",
        phone: undefined,
        bio: "Bio is defined",
      };

      const partial = service.toDomain(dto) as PartialUserWithDTOFields;

      expect(Object.keys(partial)).toHaveLength(3);
      expect(partial.firstName).toBe("OnlyFirstNameDefined");
      expect(partial.email).toBe("only@email.com");
      expect(partial.bio).toBe("Bio is defined");
      expect(partial.lastName).toBeUndefined();
      expect(partial.phone).toBeUndefined();
    });
  });

  describe("interface compliance", () => {
    it("implements UserDTOService interface", () => {
      const instance = UserDTOServiceImpl.getInstance();

      expect(instance).toHaveProperty("fromDomain");
      expect(instance).toHaveProperty("toDomain");
      expect(instance).toHaveProperty("fromDomainList");
    });

    it("fromDomain accepts User domain entity", async () => {
      const user = await createMockUser();

      expect(() => service.fromDomain(user)).not.toThrow();
    });

    it("toDomain accepts Partial<UserDTO>", () => {
      const dto: Partial<UserDTO> = { firstName: "Test" };

      expect(() => service.toDomain(dto)).not.toThrow();
    });

    it("fromDomainList accepts User[] array", async () => {
      const user = await createMockUser();

      expect(() => service.fromDomainList([user])).not.toThrow();
    });
  });
});

/**
 * Summary
 *
 * These unit tests comprehensively cover the UserDTOServiceImpl class:
 *
 * - Singleton instance: Verifies the service is a singleton and returns the same instance
 *
 * - fromDomain: Tests conversion from domain User to UserDTO
 *   - Full field mapping
 *   - All role types (USER, ADMIN, MODERATOR, SERVICE)
 *   - Id and authUserId preservation
 *
 * - fromDomainList: Tests batch conversion
 *   - Empty array handling
 *   - Single user conversion
 *   - Multiple users conversion
 *   - Order preservation
 *
 * - toDomain: Tests partial conversion from UserDTO to Partial<User>
 *   - Full DTO conversion
 *   - Empty DTO handling
 *   - Undefined field exclusion
 *   - Null value inclusion
 *   - Partial DTOs with specific field groups (personal, contact, metadata)
 *   - Exclusion of non-updatable fields (id, authUserId, role, etc.)
 *   - Mixed defined/undefined fields
 *
 * - Interface compliance: Verifies the service implements UserDTOService correctly
 */
