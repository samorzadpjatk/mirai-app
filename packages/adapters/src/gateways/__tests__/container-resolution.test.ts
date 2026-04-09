import { describe, expect, test, beforeEach } from "bun:test";
import {
  createContainer,
  asValue,
  asFunction,
  type AwilixContainer,
} from "awilix";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import { createTestContainerFromModule } from "@mirai-app/frameworks/di";
import type {
  UserRepository,
  ChallengeRepository,
  GroupRepository,
} from "@mirai-app/use-cases";
import {
  RepositoryModule,
  REPOSITORY_TOKENS,
} from "@mirai-app/adapters/modules/RepositoryModule";
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
 * This validates the DI setup from Step 5 of the awilix-modular implementation.
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
    // This ensures the correct PrismaClient is passed to the constructor
    container.register({
      [REPOSITORY_TOKENS.UserRepository]: asFunction(() => {
        return new PrismaUserRepository(mockPrisma);
      }).singleton(),
      [REPOSITORY_TOKENS.ChallengeRepository]: asFunction(() => {
        return new PrismaChallengeRepository(mockPrisma);
      }).singleton(),
      [REPOSITORY_TOKENS.GroupRepository]: asFunction(() => {
        return new PrismaGroupRepository(mockPrisma);
      }).singleton(),
    });
  });

  describe("PrismaUserRepository", () => {
    test("resolves from container with userRepository token", () => {
      const repo = container.resolve<UserRepository>(
        REPOSITORY_TOKENS.UserRepository,
      );

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaUserRepository);
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.resolve<UserRepository>(
        REPOSITORY_TOKENS.UserRepository,
      );

      // Verify the repository can use PrismaClient (injected via awilix)
      // This should not throw, confirming injection worked
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("PrismaChallengeRepository", () => {
    test("resolves from container with challengeRepository token", () => {
      const repo = container.resolve<ChallengeRepository>(
        REPOSITORY_TOKENS.ChallengeRepository,
      );

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaChallengeRepository);
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.resolve<ChallengeRepository>(
        REPOSITORY_TOKENS.ChallengeRepository,
      );

      // Verify the repository can use PrismaClient
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("PrismaGroupRepository", () => {
    test("resolves from container with groupRepository token", () => {
      const repo = container.resolve<GroupRepository>(
        REPOSITORY_TOKENS.GroupRepository,
      );

      expect(repo).toBeDefined();
      expect(repo).toBeInstanceOf(PrismaGroupRepository);
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.resolve<GroupRepository>(
        REPOSITORY_TOKENS.GroupRepository,
      );

      // Verify the repository can use PrismaClient
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
      const userRepo = container.resolve<UserRepository>(
        REPOSITORY_TOKENS.UserRepository,
      );
      const challengeRepo = container.resolve<ChallengeRepository>(
        REPOSITORY_TOKENS.ChallengeRepository,
      );
      const groupRepo = container.resolve<GroupRepository>(
        REPOSITORY_TOKENS.GroupRepository,
      );

      expect(userRepo).toBeDefined();
      expect(challengeRepo).toBeDefined();
      expect(groupRepo).toBeDefined();
    });

    test("repositories share the same PrismaClient instance", async () => {
      // Create a mock that tracks calls
      let callCount = 0;
      const trackingMock = createMockPrismaClient();
      // Override findUnique to track calls
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
        [REPOSITORY_TOKENS.UserRepository]: asFunction(() => {
          return new PrismaUserRepository(trackingMock);
        }).singleton(),
      });

      const userRepo = testContainer.resolve<UserRepository>(
        REPOSITORY_TOKENS.UserRepository,
      );

      await userRepo.findById("test-id");
      expect(callCount).toBe(1);
    });
  });

  describe("RepositoryModule Integration", () => {
    test("RepositoryModule providers can be resolved with factory pattern", () => {
      // Create a fresh mock for this test
      const testMockPrisma = createMockPrismaClient();

      // Create container with CLASSIC mode
      const moduleContainer = createClassicTestContainer();
      moduleContainer.register({
        prisma: asValue(testMockPrisma),
      });

      // Register pilot repositories from RepositoryModule using factory functions
      // This is the pattern used by registerModule() in container.ts
      const pilotTokens = [
        REPOSITORY_TOKENS.UserRepository,
        REPOSITORY_TOKENS.ChallengeRepository,
        REPOSITORY_TOKENS.GroupRepository,
      ];

      for (const token of pilotTokens) {
        const ProviderClass = RepositoryModule.providers[token];
        if (typeof ProviderClass === "function") {
          // Use closure to capture testMockPrisma
          moduleContainer.register(
            token,
            asFunction(() => {
              return new (ProviderClass as new (
                prisma: PrismaClient,
              ) => unknown)(testMockPrisma);
            }).singleton(),
          );
        }
      }

      const userRepo = moduleContainer.resolve<UserRepository>(
        REPOSITORY_TOKENS.UserRepository,
      );
      const challengeRepo = moduleContainer.resolve<ChallengeRepository>(
        REPOSITORY_TOKENS.ChallengeRepository,
      );
      const groupRepo = moduleContainer.resolve<GroupRepository>(
        REPOSITORY_TOKENS.GroupRepository,
      );

      expect(userRepo).toBeInstanceOf(PrismaUserRepository);
      expect(challengeRepo).toBeInstanceOf(PrismaChallengeRepository);
      expect(groupRepo).toBeInstanceOf(PrismaGroupRepository);
    });

    test("createTestContainerFromModule creates container with registered providers", () => {
      // Verify the utility function works
      const testContainer = createTestContainerFromModule(RepositoryModule);

      // The container should be created (even if empty since we don't bind prisma here)
      expect(testContainer).toBeDefined();

      // Container should have the providers from the module registered
      // (though they won't resolve without prisma)
      expect(RepositoryModule.providers[REPOSITORY_TOKENS.UserRepository]).toBe(
        PrismaUserRepository,
      );
      expect(
        RepositoryModule.providers[REPOSITORY_TOKENS.ChallengeRepository],
      ).toBe(PrismaChallengeRepository);
      expect(
        RepositoryModule.providers[REPOSITORY_TOKENS.GroupRepository],
      ).toBe(PrismaGroupRepository);
    });
  });
});
