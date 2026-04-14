import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { UserController } from "../user";
import type { UserRepository } from "@mirai-app/use-cases";
import type { User } from "@mirai-app/domain";

// Valid UUID for testing
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_AUTH_USER_ID = "550e8400-e29b-41d4-a716-446655440002";

// Mock User domain object
const createMockUser = (overrides?: Partial<User>): User =>
  ({
    id: TEST_USER_ID,
    authUserId: TEST_AUTH_USER_ID,
    firstName: "John",
    lastName: "Doe",
    getFullName: () => "John Doe",
    getDisplayName: () => "John Doe",
    getInitials: () => "JD",
    role: "USER",
    hasAvatar: false,
    createdAt: new Date("2024-01-01"),
    lastSeenOn: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-01"),
    hasRole: () => true,
    hasAtLeastRole: () => true,
    isAdmin: () => false,
    isModerator: () => false,
    isBanned: () => false,
    updateName: function ({
      firstName,
      lastName,
    }: {
      firstName: string;
      lastName: string;
    }) {
      return Effect.succeed({ ...this, firstName, lastName } as User);
    },
    updateRole: function (role: string) {
      return { ...this, role } as User;
    },
    setAvatar: function (hasAvatar: boolean) {
      return { ...this, hasAvatar } as User;
    },
    updateLastSeen: function (timestamp?: Date) {
      return { ...this, lastSeenOn: timestamp ?? new Date() } as User;
    },
    ...overrides,
  }) as User;

describe("[UNIT] UserController", () => {
  let controller: UserController;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: mock(() => Effect.succeed(createMockUser())),
      findByAuthUserId: mock(() => Effect.succeed(createMockUser())),
      findByRole: mock(() => Effect.succeed([createMockUser()])),
      create: mock((user: User) => Effect.succeed(user)),
      update: mock((user: User) => Effect.succeed(user)),
      findAll: mock(() => Effect.succeed([createMockUser()])),
      delete: mock(() => Effect.succeed(void 0)),
      existsByAuthUserId: mock(() => Effect.succeed(false)),
    } as unknown as UserRepository;

    controller = new UserController(mockUserRepository);
  });

  describe("[UNIT] getById", () => {
    it("should return user by ID on success", async () => {
      const result = await controller.getById({ id: TEST_USER_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_USER_ID);
        expect(result.data.firstName).toBe("John");
        expect(result.data.fullName).toBe("John Doe");
      }
    });

    it("should return error for invalid UUID", async () => {
      const result = await controller.getById({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should return error when user not found", async () => {
      mockUserRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({ id: TEST_USER_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("[UNIT] create", () => {
    it("should create user with valid input", async () => {
      const input = {
        authUserId: "550e8400-e29b-41d4-a716-446655440003",
        firstName: "Jane",
        lastName: "Smith",
        role: "USER",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authUserId).toBe(
          "550e8400-e29b-41d4-a716-446655440003",
        );
        expect(result.data.firstName).toBe("Jane");
      }
    });

    it("should return error for invalid first name", async () => {
      const input = {
        authUserId: "550e8400-e29b-41d4-a716-446655440004",
        firstName: "J", // Too short
        lastName: "Doe",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should return error for first name with digits", async () => {
      const input = {
        authUserId: "550e8400-e29b-41d4-a716-446655440005",
        firstName: "John123",
        lastName: "Doe",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("cannot contain digits");
      }
    });

    it("should use default role when not provided", async () => {
      const input = {
        authUserId: "550e8400-e29b-41d4-a716-446655440006",
        firstName: "Test",
        lastName: "User",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("USER");
      }
    });
  });

  describe("[UNIT] update", () => {
    it("should update user with valid input", async () => {
      const input = {
        userId: TEST_USER_ID,
        firstName: "Updated",
        lastName: "Name",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("Updated");
      }
    });

    it("should return error for invalid userId", async () => {
      const result = await controller.update({ userId: "invalid" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should handle partial updates", async () => {
      const input = {
        userId: TEST_USER_ID,
        hasAvatar: true,
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });
  });

  describe("[UNIT] list", () => {
    it("should return paginated list of users", async () => {
      const result = await controller.list({ limit: 10, offset: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should use default pagination values", async () => {
      const result = await controller.list({});

      expect(result.success).toBe(true);
    });

    it("should return error for invalid limit", async () => {
      const result = await controller.list({ limit: 200 });

      expect(result.success).toBe(false);
    });
  });
});
