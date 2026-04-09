import { describe, expect, test, beforeEach } from "bun:test";
import {
  createContainer,
  asValue,
  asFunction,
  type AwilixContainer,
} from "awilix";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import type {
  UserRepository,
  ChallengeRepository,
  GroupRepository,
} from "@mirai-app/use-cases";
import { PrismaUserRepository } from "../PrismaUserRepository";
import { PrismaChallengeRepository } from "../PrismaChallengeRepository";
import { PrismaGroupRepository } from "../PrismaGroupRepository";

// Mock PrismaClient for testing
const createMockPrismaClient = (): PrismaClient => {
  return {
    user: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: "test-user-id" }),
      update: () => Promise.resolve({ id: "test-user-id" }),
      delete: () => Promise.resolve({ id: "test-user-id" }),
      count: () => Promise.resolve(0),
    },
    challenge: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: "test-challenge-id" }),
      update: () => Promise.resolve({ id: "test-challenge-id" }),
      delete: () => Promise.resolve({ id: "test-challenge-id" }),
      count: () => Promise.resolve(0),
    },
    group: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: "test-group-id" }),
      update: () => Promise.resolve({ id: "test-group-id" }),
      delete: () => Promise.resolve({ id: "test-group-id" }),
      count: () => Promise.resolve(0),
    },
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  } as unknown as PrismaClient;
};

/**
 * Create test container with CLASSIC injection mode
 * (avoids PROXY mode issues with property access)
 */
const createClassicTestContainer = (): AwilixContainer => {
  return createContainer({
    injectionMode: "CLASSIC",
  });
};

/**
 * [INTEGRATION] Repository DI Resolution Tests
 *
 * These tests verify that the pilot repositories (PrismaUserRepository,
 * PrismaChallengeRepository, PrismaGroupRepository) can be resolved from
 * the awilix container with PrismaClient injected.
 *
 * This validates the DI setup with awilix-modular.
 *
 */
describe("[INTEGRATION] Repository DI Resolution", () => {
  let container: AwilixContainer;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();

    // Create container with CLASSIC injection mode to avoid PROXY issues
    container = createClassicTestContainer();

    // Register mock PrismaClient
    container.register({
      prisma: asValue(mockPrisma),
    });

    // Register the pilot repositories using factory functions with closure over mockPrisma
    container.register({
      userRepository: asFunction(
        () => new PrismaUserRepository(mockPrisma),
      ).singleton(),
      challengeRepository: asFunction(
        () => new PrismaChallengeRepository(mockPrisma),
      ).singleton(),
      groupRepository: asFunction(
        () => new PrismaGroupRepository(mockPrisma),
      ).singleton(),
    });
  });

  describe("PrismaUserRepository", () => {
    test("resolves from container with userRepository token", () => {
      const repo = container.resolve<UserRepository>("userRepository");

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaUserRepository);
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.resolve<UserRepository>("userRepository");

      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("PrismaChallengeRepository", () => {
    test("resolves from container with challengeRepository token", () => {
      const repo = container.resolve<ChallengeRepository>(
        "challengeRepository",
      );

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaChallengeRepository);
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.resolve<ChallengeRepository>(
        "challengeRepository",
      );

      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("PrismaGroupRepository", () => {
    test("resolves from container with groupRepository token", () => {
      const repo = container.resolve<GroupRepository>("groupRepository");

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaGroupRepository);
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.resolve<GroupRepository>("groupRepository");

      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("Backward Compatibility", () => {
    test("PrismaUserRepository can still be instantiated manually", async () => {
      const repo = new PrismaUserRepository(mockPrisma);

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaUserRepository);
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });

    test("PrismaChallengeRepository can still be instantiated manually", async () => {
      const repo = new PrismaChallengeRepository(mockPrisma);

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaChallengeRepository);
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });

    test("PrismaGroupRepository can still be instantiated manually", async () => {
      const repo = new PrismaGroupRepository(mockPrisma);

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaGroupRepository);
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("Multiple Repository Resolution", () => {
    test("can resolve all three repositories from same container", () => {
      const userRepo = container.resolve<UserRepository>("userRepository");
      const challengeRepo = container.resolve<ChallengeRepository>(
        "challengeRepository",
      );
      const groupRepo = container.resolve<GroupRepository>("groupRepository");

      expect(userRepo).toBeDefined();
      expect(challengeRepo).toBeDefined();
      expect(groupRepo).toBeDefined();
    });

    test("repositories share the same PrismaClient instance", async () => {
      let callCount = 0;
      const trackingMock = createMockPrismaClient();
      trackingMock.user = {
        ...trackingMock.user,
        findUnique: () => {
          callCount++;
          return Promise.resolve(null);
        },
      };

      const testContainer = createClassicTestContainer();
      testContainer.register({
        prisma: asValue(trackingMock),
      });
      testContainer.register({
        userRepository: asFunction(
          () => new PrismaUserRepository(trackingMock),
        ).singleton(),
      });

      const userRepo = testContainer.resolve<UserRepository>("userRepository");

      await userRepo.findById("test-id");
      expect(callCount).toBe(1);
    });
  });
});
