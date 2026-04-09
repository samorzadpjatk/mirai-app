/**
 * Container Integration Tests
 *
 * Tests verify that use cases work with the awilix-modular container.
 * Updated from Inversify to awilix pattern.
 *
 * @module container-integration.test
 */

import { describe, it, expect, mock, beforeEach } from "bun:test";
import { createTestContainer } from "@mirai-app/frameworks/di";
import type { AwilixContainer } from "awilix";
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
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Effect } from "effect";

async function runAsResult<T>(
  effect: Effect.Effect<T, Error>,
): Promise<{ kind: "ok"; value: T } | { kind: "err"; error: string }> {
  try {
    const value = await Effect.runPromise(effect);
    return { kind: "ok", value };
  } catch (error) {
    return {
      kind: "err",
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

describe("[INTEGRATION] Use Case Container Resolution", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createTestContainer();
  });

  describe("GetUserUseCase", () => {
    it("should work with container-resolved UserRepository", async () => {
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

      // Register mock in awilix container
      container.register({
        userRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });

      // Resolve repository and create use case (demonstrates the pattern)
      const userRepo = container.resolve<UserRepository>("userRepository");
      const useCase = new GetUserUseCase(userRepo);

      // Act
      const result = await runAsResult(useCase.execute({ userId: "user-123" }));

      // Assert
      expect(useCase).toBeInstanceOf(GetUserUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("user-123");
    });
  });

  describe("GetChallengeUseCase", () => {
    it("should work with container-resolved ChallengeRepository", async () => {
      // Arrange
      const mockChallenge = Challenge.create({
        id: "challenge-123",
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.ACTIVE,
        basePoints: 100,
      }).value as Challenge;

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
        findById: mock(() => Promise.resolve(mockChallenge)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findBySubmissionType: mock(() => Promise.resolve([])),
        findByScoringCategory: mock(() => Promise.resolve([])),
        findActive: mock(() => Promise.resolve([])),
        findOpenForSubmission: mock(() => Promise.resolve([])),
        findRecurring: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      // Register mock in awilix container
      container.register({
        challengeRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });

      // Resolve repository and create use case
      const challengeRepo = container.resolve<ChallengeRepository>(
        "challengeRepository",
      );
      const useCase = new GetChallengeUseCase(challengeRepo);

      // Act
      const result = await runAsResult(
        useCase.execute({ challengeId: "challenge-123" }),
      );

      // Assert
      expect(useCase).toBeInstanceOf(GetChallengeUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("challenge-123");
    });
  });

  describe("CreateUserUseCase", () => {
    it("should work with container-resolved UserRepository", async () => {
      // Arrange
      const mockUser = User.create({
        authUserId: "auth-new",
        firstName: "Jane",
        lastName: "Smith",
        role: UserRole.USER,
      }).value as User;

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockUser)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockUser)),
        delete: mock(() => Promise.resolve()),
      };

      container.register({
        userRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });

      const userRepo = container.resolve<UserRepository>("userRepository");
      const useCase = new CreateUserUseCase(userRepo);

      // Act
      const result = await runAsResult(
        useCase.execute({
          authUserId: "auth-new",
          firstName: "Jane",
          lastName: "Smith",
          role: UserRole.USER,
        }),
      );

      // Assert
      expect(useCase).toBeInstanceOf(CreateUserUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });

  describe("UpdateUserUseCase", () => {
    it("should work with container-resolved UserRepository", async () => {
      // Arrange
      const existingUser = User.create({
        id: "user-123",
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      }).value as User;
      const updatedUser = existingUser.updateName({
        firstName: "Updated",
        lastName: "Doe",
      }).value as User;

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedUser)),
        delete: mock(() => Promise.resolve()),
      };

      container.register({
        userRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });

      const userRepo = container.resolve<UserRepository>("userRepository");
      const useCase = new UpdateUserUseCase(userRepo);

      // Act
      const result = await runAsResult(
        useCase.execute({
          userId: "user-123",
          firstName: "Updated",
        }),
      );

      // Assert
      expect(useCase).toBeInstanceOf(UpdateUserUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("user-123");
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  describe("CreateChallengeUseCase", () => {
    it("should work with container-resolved ChallengeRepository", async () => {
      // Arrange
      const mockChallenge = Challenge.create({
        tripId: "trip-123",
        name: "New Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.HIDDEN,
        basePoints: 100,
      }).value as Challenge;

      const mockRepo: ChallengeRepository = {
        create: mock(() => Promise.resolve(mockChallenge)),
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
        update: mock(() => Promise.resolve(mockChallenge)),
        updateStatus: mock(() => Promise.resolve(mockChallenge)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      container.register({
        challengeRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });

      const challengeRepo = container.resolve<ChallengeRepository>(
        "challengeRepository",
      );
      const useCase = new CreateChallengeUseCase(challengeRepo);

      // Act
      const result = await runAsResult(
        useCase.execute({
          tripId: "trip-123",
          name: "New Challenge",
          submissionType: SubmissionType.IMAGE,
          scoringCategory: ScoringCategory.UNLIMITED,
        }),
      );

      // Assert
      expect(useCase).toBeInstanceOf(CreateChallengeUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });

  describe("Repository swapping", () => {
    it("should allow repository implementation swapping", async () => {
      // Arrange - First repository
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

      container.register({
        userRepository: {
          resolve: () => firstRepo,
          lifetime: "SINGLETON",
        } as any,
      });

      const userRepo1 = container.resolve<UserRepository>("userRepository");
      const useCase1 = new GetUserUseCase(userRepo1);
      expect(useCase1).toBeInstanceOf(GetUserUseCase);

      // Act - Create new container with different repository
      const newContainer = createTestContainer();
      const secondRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(true)),
        create: mock(() => Promise.resolve({} as User)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as User)),
        delete: mock(() => Promise.resolve()),
      };

      newContainer.register({
        userRepository: {
          resolve: () => secondRepo,
          lifetime: "SINGLETON",
        } as any,
      });

      const userRepo2 = newContainer.resolve<UserRepository>("userRepository");
      const useCase2 = new GetUserUseCase(userRepo2);

      // Assert - Both use cases work with their respective repositories
      expect(useCase2).toBeInstanceOf(GetUserUseCase);
    });
  });
});
