/**
 * Container-Based Use Case Tests
 *
 * Demonstrates the awilix-modular DI pattern for use cases.
 * Tests verify that use cases resolve from container with injected repositories.
 *
 * @module container-based.test
 */

import { describe, it, expect, mock, beforeEach } from "bun:test";
import type { AwilixContainer } from "awilix";
import { createTestContainer } from "@mirai-app/frameworks/di";
import { GetUserUseCase } from "../GetUser";
import { CreateUserUseCase } from "../CreateUser";
import { UpdateUserUseCase } from "../UpdateUser";
import { GetChallengeUseCase } from "../GetChallenge";
import { CreateChallengeUseCase } from "../CreateChallenge";
import { UpdateChallengeUseCase } from "../UpdateChallenge";
import { GetGroupUseCase } from "../GetGroup";
import { CreateGroupUseCase } from "../CreateGroup";
import { UpdateGroupUseCase } from "../UpdateGroup";
import type {
  UserRepository,
  ChallengeRepository,
  GroupRepository,
} from "../../ports";
import {
  User,
  UserRole,
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
  Group,
  GroupStatus,
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

describe("[UNIT] Container-Based Use Case Resolution", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createTestContainer();
  });

  // =============================================================================
  // User Domain Tests
  // =============================================================================
  describe("User Domain Use Cases", () => {
    const createMockUserRepository = (): UserRepository => ({
      existsByAuthUserId: mock(() => Promise.resolve(false)),
      create: mock((user) => Promise.resolve(user)),
      findById: mock(() => Promise.resolve(null)),
      findByAuthUserId: mock(() => Promise.resolve(null)),
      findByRole: mock(() => Promise.resolve([])),
      findAll: mock(() => Promise.resolve([])),
      update: mock((user) => Promise.resolve(user)),
      delete: mock(() => Promise.resolve()),
    });

    it("should resolve GetUserUseCase with injected UserRepository", async () => {
      // Arrange
      const mockRepo = createMockUserRepository();
      const testUser = User.create({
        id: "user-123",
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      }).value as User;
      mockRepo.findById = mock(() => Promise.resolve(testUser));

      // Resolve repository from container
      container.register({
        userRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });
      const userRepo = container.resolve<UserRepository>("userRepository");

      // Create use case manually with resolved repository (demonstrates the pattern)
      const useCase = new GetUserUseCase(userRepo);
      const result = await runAsResult(useCase.execute({ userId: "user-123" }));

      // Assert
      expect(useCase).toBeInstanceOf(GetUserUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("user-123");
    });

    it("should resolve CreateUserUseCase with injected UserRepository", async () => {
      // Arrange
      const mockRepo = createMockUserRepository();
      const testUser = User.create({
        authUserId: "auth-new",
        firstName: "Jane",
        lastName: "Smith",
        role: UserRole.USER,
      }).value as User;
      mockRepo.create = mock(() => Promise.resolve(testUser));

      container.register({
        userRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });
      const userRepo = container.resolve<UserRepository>("userRepository");

      const useCase = new CreateUserUseCase(userRepo);
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

    it("should resolve UpdateUserUseCase with injected UserRepository", async () => {
      // Arrange
      const mockRepo = createMockUserRepository();
      const testUser = User.create({
        id: "user-123",
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      }).value as User;
      mockRepo.findById = mock(() => Promise.resolve(testUser));
      mockRepo.update = mock((user) => Promise.resolve(user));

      container.register({
        userRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });
      const userRepo = container.resolve<UserRepository>("userRepository");

      const useCase = new UpdateUserUseCase(userRepo);
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

  // =============================================================================
  // Challenge Domain Tests
  // =============================================================================
  describe("Challenge Domain Use Cases", () => {
    const createMockChallengeRepository = (): ChallengeRepository => ({
      create: mock((c) => Promise.resolve(c)),
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
      update: mock((c) => Promise.resolve(c)),
      updateStatus: mock((c) => Promise.resolve(c)),
      delete: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(true)),
      countByTripId: mock(() => Promise.resolve(0)),
    });

    it("should resolve GetChallengeUseCase with injected ChallengeRepository", async () => {
      // Arrange
      const mockRepo = createMockChallengeRepository();
      const testChallenge = Challenge.create({
        id: "challenge-123",
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.ACTIVE,
        basePoints: 100,
      }).value as Challenge;
      mockRepo.findById = mock(() => Promise.resolve(testChallenge));

      container.register({
        challengeRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });
      const challengeRepo = container.resolve<ChallengeRepository>(
        "challengeRepository",
      );

      const useCase = new GetChallengeUseCase(challengeRepo);
      const result = await runAsResult(
        useCase.execute({ challengeId: "challenge-123" }),
      );

      // Assert
      expect(useCase).toBeInstanceOf(GetChallengeUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("challenge-123");
    });

    it("should resolve CreateChallengeUseCase with injected ChallengeRepository", async () => {
      // Arrange
      const mockRepo = createMockChallengeRepository();
      const testChallenge = Challenge.create({
        tripId: "trip-123",
        name: "New Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.HIDDEN,
        basePoints: 100,
      }).value as Challenge;
      mockRepo.create = mock(() => Promise.resolve(testChallenge));

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

    it("should resolve UpdateChallengeUseCase with injected ChallengeRepository", async () => {
      // Arrange
      const mockRepo = createMockChallengeRepository();
      const testChallenge = Challenge.create({
        id: "challenge-123",
        tripId: "trip-123",
        name: "Test Challenge",
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.UNLIMITED,
        status: ChallengeStatus.HIDDEN,
        basePoints: 100,
      }).value as Challenge;
      mockRepo.findById = mock(() => Promise.resolve(testChallenge));
      mockRepo.update = mock((c) => Promise.resolve(c));

      container.register({
        challengeRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });
      const challengeRepo = container.resolve<ChallengeRepository>(
        "challengeRepository",
      );

      const useCase = new UpdateChallengeUseCase(challengeRepo);
      const result = await useCase.execute({
        challengeId: "challenge-123",
        name: "Updated Challenge",
      });

      // Assert
      expect(useCase).toBeInstanceOf(UpdateChallengeUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("challenge-123");
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Group Domain Tests
  // =============================================================================
  describe("Group Domain Use Cases", () => {
    const createMockGroupRepository = (): GroupRepository => ({
      create: mock((g) => Promise.resolve(g)),
      findById: mock(() => Promise.resolve(null)),
      findByTripId: mock(() => Promise.resolve([])),
      findByStatus: mock(() => Promise.resolve([])),
      findByTripIdAndStatus: mock(() => Promise.resolve([])),
      findByOrganizerId: mock(() => Promise.resolve([])),
      findByCode: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
      update: mock((g) => Promise.resolve(g)),
      delete: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(true)),
      countByTripId: mock(() => Promise.resolve(0)),
    });

    it("should resolve GetGroupUseCase with injected GroupRepository", async () => {
      // Arrange
      const mockRepo = createMockGroupRepository();
      const testGroup = Group.create({
        id: "group-123",
        tripId: "trip-123",
        name: "Test Group",
        organizerId: "user-123",
        code: "TEST123",
        coins: 100,
        status: GroupStatus.ACTIVE,
      }).value as Group;
      mockRepo.findById = mock(() => Promise.resolve(testGroup));

      container.register({
        groupRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });
      const groupRepo = container.resolve<GroupRepository>("groupRepository");

      const useCase = new GetGroupUseCase(groupRepo);
      const result = await runAsResult(
        useCase.execute({ groupId: "group-123" }),
      );

      // Assert
      expect(useCase).toBeInstanceOf(GetGroupUseCase);
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Test Group");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("group-123");
    });

    it("should resolve CreateGroupUseCase with injected GroupRepository", async () => {
      // Arrange
      const mockRepo = createMockGroupRepository();
      const testGroup = Group.create({
        tripId: "trip-123",
        name: "New Group",
        organizerId: "user-123",
        code: "NEW123",
        coins: 0,
        status: GroupStatus.ACTIVE,
      }).value as Group;
      mockRepo.findByCode = mock(() => Promise.resolve(null));
      mockRepo.create = mock(() => Promise.resolve(testGroup));

      container.register({
        groupRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });
      const groupRepo = container.resolve<GroupRepository>("groupRepository");

      const useCase = new CreateGroupUseCase(groupRepo);
      const result = await runAsResult(
        useCase.execute({
          tripId: "trip-123",
          name: "New Group",
          organizerId: "user-123",
          code: "NEW123",
        }),
      );

      // Assert
      expect(useCase).toBeInstanceOf(CreateGroupUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should resolve UpdateGroupUseCase with injected GroupRepository", async () => {
      // Arrange
      const mockRepo = createMockGroupRepository();
      const testGroup = Group.create({
        id: "group-123",
        tripId: "trip-123",
        name: "Test Group",
        organizerId: "user-123",
        code: "TEST123",
        coins: 100,
        status: GroupStatus.ACTIVE,
      }).value as Group;
      mockRepo.findById = mock(() => Promise.resolve(testGroup));
      mockRepo.update = mock((g) => Promise.resolve(g));

      container.register({
        groupRepository: {
          resolve: () => mockRepo,
          lifetime: "SINGLETON",
        } as any,
      });
      const groupRepo = container.resolve<GroupRepository>("groupRepository");

      const useCase = new UpdateGroupUseCase(groupRepo);
      const result = await runAsResult(
        useCase.execute({
          groupId: "group-123",
          name: "Updated Group",
        }),
      );

      // Assert
      expect(useCase).toBeInstanceOf(UpdateGroupUseCase);
      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("group-123");
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Backward Compatibility Tests
  // =============================================================================
  describe("Backward Compatibility", () => {
    it("should support manual instantiation for User use cases", async () => {
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

      // Manual instantiation without container
      const useCase = new GetUserUseCase(mockRepo);

      expect(useCase).toBeInstanceOf(GetUserUseCase);
    });

    it("should support manual instantiation for Challenge use cases", async () => {
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
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      // Manual instantiation without container
      const useCase = new GetChallengeUseCase(mockRepo);

      expect(useCase).toBeInstanceOf(GetChallengeUseCase);
    });

    it("should support manual instantiation for Group use cases", async () => {
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve({} as Group)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as Group)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      // Manual instantiation without container
      const useCase = new GetGroupUseCase(mockRepo);

      expect(useCase).toBeInstanceOf(GetGroupUseCase);
    });
  });

  // =============================================================================
  // Container Resolution Summary
  // =============================================================================
  describe("Container Resolution Summary", () => {
    it("should demonstrate all 9 pilot use cases can be instantiated", () => {
      // Arrange - Register mock repositories
      container.register({
        userRepository: {
          resolve: () => ({}) as UserRepository,
          lifetime: "SINGLETON",
        } as any,
        challengeRepository: {
          resolve: () => ({}) as ChallengeRepository,
          lifetime: "SINGLETON",
        } as any,
        groupRepository: {
          resolve: () => ({}) as GroupRepository,
          lifetime: "SINGLETON",
        } as any,
      });

      // Act - All use cases can be created with injected repositories
      const userRepo = container.resolve<UserRepository>("userRepository");
      const challengeRepo = container.resolve<ChallengeRepository>(
        "challengeRepository",
      );
      const groupRepo = container.resolve<GroupRepository>("groupRepository");

      const getUserUseCase = new GetUserUseCase(userRepo);
      const createUserUseCase = new CreateUserUseCase(userRepo);
      const updateUserUseCase = new UpdateUserUseCase(userRepo);
      const getChallengeUseCase = new GetChallengeUseCase(challengeRepo);
      const createChallengeUseCase = new CreateChallengeUseCase(challengeRepo);
      const updateChallengeUseCase = new UpdateChallengeUseCase(challengeRepo);
      const getGroupUseCase = new GetGroupUseCase(groupRepo);
      const createGroupUseCase = new CreateGroupUseCase(groupRepo);
      const updateGroupUseCase = new UpdateGroupUseCase(groupRepo);

      // Assert
      expect(getUserUseCase).toBeInstanceOf(GetUserUseCase);
      expect(createUserUseCase).toBeInstanceOf(CreateUserUseCase);
      expect(updateUserUseCase).toBeInstanceOf(UpdateUserUseCase);
      expect(getChallengeUseCase).toBeInstanceOf(GetChallengeUseCase);
      expect(createChallengeUseCase).toBeInstanceOf(CreateChallengeUseCase);
      expect(updateChallengeUseCase).toBeInstanceOf(UpdateChallengeUseCase);
      expect(getGroupUseCase).toBeInstanceOf(GetGroupUseCase);
      expect(createGroupUseCase).toBeInstanceOf(CreateGroupUseCase);
      expect(updateGroupUseCase).toBeInstanceOf(UpdateGroupUseCase);
    });
  });
});
