import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Container } from "inversify";
import { createTestContainer, TYPES } from "@repo/frameworks/di";
import { GetUserUseCase } from "../GetUser";
import { GetChallengeUseCase } from "../GetChallenge";
import { CreateUserUseCase } from "../CreateUser";
import { CreateChallengeUseCase } from "../CreateChallenge";
import { UpdateUserUseCase } from "../UpdateUser";
import type { UserRepository } from "../../ports/UserRepository";
import type { ChallengeRepository } from "../../ports/ChallengeRepository";
import {
  User,
  UserRole,
  Challenge,
  SubmissionType,
  ScoringCategory,
} from "@repo/domain";

describe("[INTEGRATION] Use Case Container Resolution", () => {
  let container: Container;

  beforeEach(() => {
    container = createTestContainer();
    // Bind all use cases to container
    container.bind(GetUserUseCase).toSelf();
    container.bind(GetChallengeUseCase).toSelf();
    container.bind(CreateUserUseCase).toSelf();
    container.bind(CreateChallengeUseCase).toSelf();
    container.bind(UpdateUserUseCase).toSelf();
  });

  describe("GetUserUseCase", () => {
    it("should resolve from container with injected UserRepository", () => {
      // Arrange
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve({} as User)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as User)),
        delete: mock(() => Promise.resolve()),
      };
      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      // Act
      const useCase = container.get(GetUserUseCase);

      // Assert
      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(GetUserUseCase);
    });

    it("should execute with container-injected repository", async () => {
      // Arrange
      const mockUser = User.create({
        id: "user-123",
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      }).value as User;

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockUser)),
        findById: mock(() => Promise.resolve(mockUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockUser)),
        delete: mock(() => Promise.resolve()),
      };
      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      const useCase = container.get(GetUserUseCase);

      // Act
      const result = await useCase.execute({ userId: "user-123" });

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("user-123");
    });
  });

  describe("GetChallengeUseCase", () => {
    it("should resolve from container with injected ChallengeRepository", () => {
      // Arrange
      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve({} as Challenge)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as Challenge)),
        updateStatus: mock(() => Promise.resolve({} as Challenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };
      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      // Act
      const useCase = container.get(GetChallengeUseCase);

      // Assert
      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(GetChallengeUseCase);
    });
  });

  describe("CreateUserUseCase", () => {
    it("should resolve from container with injected UserRepository", () => {
      // Arrange
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve({} as User)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as User)),
        delete: mock(() => Promise.resolve()),
      };
      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      // Act
      const useCase = container.get(CreateUserUseCase);

      // Assert
      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(CreateUserUseCase);
    });
  });

  describe("CreateChallengeUseCase", () => {
    it("should resolve from container with injected ChallengeRepository", () => {
      // Arrange
      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve({} as Challenge)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as Challenge)),
        updateStatus: mock(() => Promise.resolve({} as Challenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };
      container.bind(TYPES.ChallengeRepository).toConstantValue(mockRepo);

      // Act
      const useCase = container.get(CreateChallengeUseCase);

      // Assert
      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(CreateChallengeUseCase);
    });
  });

  describe("UpdateUserUseCase", () => {
    it("should resolve from container with injected UserRepository", () => {
      // Arrange
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve({} as User)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as User)),
        delete: mock(() => Promise.resolve()),
      };
      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      // Act
      const useCase = container.get(UpdateUserUseCase);

      // Assert
      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(UpdateUserUseCase);
    });
  });

  describe("Container rebind functionality", () => {
    it("should allow repository implementation swapping via rebind", async () => {
      // Arrange - First implementation
      const firstRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve({} as User)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as User)),
        delete: mock(() => Promise.resolve()),
      };

      // Second implementation (swapped)
      const secondRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(true)), // Different behavior
        create: mock(() => Promise.resolve({} as User)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as User)),
        delete: mock(() => Promise.resolve()),
      };

      container.bind(TYPES.UserRepository).toConstantValue(firstRepo);

      // Act - Use first implementation
      const useCase1 = container.get(GetUserUseCase);
      await useCase1.execute({ userId: "test" });

      // Rebind to second implementation
      container.rebind(TYPES.UserRepository).toConstantValue(secondRepo);

      // Get new use case instance (should have second repo)
      const useCase2 = container.get(GetUserUseCase);
      await useCase2.execute({ userId: "test2" });

      // Assert
      expect(firstRepo.findById).toHaveBeenCalled();
      expect(secondRepo.findById).toHaveBeenCalled();
    });
  });
});
