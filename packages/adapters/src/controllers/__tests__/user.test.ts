import { describe, it, expect, mock, beforeEach } from "bun:test";
import { UserController } from "../user";
import type { UserRepository } from "@mirai-app/use-cases";
import type { User } from "@mirai-app/domain";

// Mock User domain object
const createMockUser = (overrides?: Partial<User>): User =>
  ({
    id: "user-123",
    authUserId: "auth-123",
    firstName: "John",
    lastName: "Doe",
    getFullName: () => "John Doe",
    role: "USER",
    hasAvatar: false,
    createdAt: new Date("2024-01-01"),
    lastSeenOn: new Date("2024-01-02"),
    ...overrides,
  }) as User;

describe("[UNIT] UserController", () => {
  let controller: UserController;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: mock(() => Promise.resolve(createMockUser())),
      findByAuthUserId: mock(() => Promise.resolve(createMockUser())),
      create: mock((user: User) => Promise.resolve(user)),
      update: mock((user: User) => Promise.resolve(user)),
      findAll: mock(() => Promise.resolve([createMockUser()])),
    } as unknown as UserRepository;

    controller = new UserController(mockUserRepository);
  });

  describe("getById", () => {
    it("should return user by ID on success", async () => {
      const result = await controller.getById({ id: "user-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("user-123");
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
      mockUserRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "user-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("create", () => {
    it("should create user with valid input", async () => {
      const input = {
        authUserId: "auth-456",
        firstName: "Jane",
        lastName: "Smith",
        role: "USER",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authUserId).toBe("auth-456");
        expect(result.data.firstName).toBe("Jane");
      }
    });

    it("should return error for invalid first name", async () => {
      const input = {
        authUserId: "auth-123",
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
        authUserId: "auth-123",
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
        authUserId: "auth-789",
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

  describe("update", () => {
    it("should update user with valid input", async () => {
      const input = {
        userId: "user-123",
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
        userId: "user-123",
        hasAvatar: true,
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });
  });

  describe("list", () => {
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
