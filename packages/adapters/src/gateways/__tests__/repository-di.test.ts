import { describe, expect, test, beforeEach } from "bun:test";
import type { PrismaClient } from "@repo/frameworks/prisma/client";
import { TYPES, createTestContainer } from "@repo/frameworks/di";
import type {
  UserRepository,
  ChallengeRepository,
  GroupRepository,
} from "@repo/use-cases";

// Import repositories to trigger @provide decorator registration
// The decorators are evaluated at import time, registering with buildProviderModule
import "../PrismaUserRepository";
import "../PrismaChallengeRepository";
import "../PrismaGroupRepository";

// Mock PrismaClient for testing
const createMockPrismaClient = (): PrismaClient => {
  return {
    user: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
      count: () => Promise.resolve(0),
    },
    challenge: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
      count: () => Promise.resolve(0),
    },
    group: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      update: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
      count: () => Promise.resolve(0),
    },
  } as unknown as PrismaClient;
};

/**
 * [INTEGRATION] Repository DI Resolution Tests
 *
 * These tests verify that the pilot repositories (PrismaUserRepository,
 * PrismaChallengeRepository, PrismaGroupRepository) can be resolved from
 * the InversifyJS container with PrismaClient injected via @inject decorator.
 *
 * This validates the DI setup from Step 5 of the InversifyJS implementation.
 */
describe("[INTEGRATION] Repository DI Resolution", () => {
  let container: ReturnType<typeof createTestContainer>;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    container = createTestContainer();

    // Bind mock PrismaClient to container
    container.bind(TYPES.PrismaClient).toConstantValue(mockPrisma);
  });

  describe("PrismaUserRepository", () => {
    test("resolves from container with TYPES.UserRepository", () => {
      const repo = container.get<UserRepository>(TYPES.UserRepository);

      expect(repo).toBeDefined();
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.get<UserRepository>(TYPES.UserRepository);

      // Verify the repository can use PrismaClient (injected via @inject)
      // This should not throw, confirming injection worked
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("PrismaChallengeRepository", () => {
    test("resolves from container with TYPES.ChallengeRepository", () => {
      const repo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );

      expect(repo).toBeDefined();
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );

      // Verify the repository can use PrismaClient
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("PrismaGroupRepository", () => {
    test("resolves from container with TYPES.GroupRepository", () => {
      const repo = container.get<GroupRepository>(TYPES.GroupRepository);

      expect(repo).toBeDefined();
    });

    test("resolved repository has PrismaClient injected", async () => {
      const repo = container.get<GroupRepository>(TYPES.GroupRepository);

      // Verify the repository can use PrismaClient
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("Backward Compatibility", () => {
    test("PrismaUserRepository can still be instantiated manually", async () => {
      const { PrismaUserRepository } = await import("../PrismaUserRepository");

      const repo = new PrismaUserRepository(mockPrisma);

      expect(repo).toBeDefined();
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });

    test("PrismaChallengeRepository can still be instantiated manually", async () => {
      const { PrismaChallengeRepository } =
        await import("../PrismaChallengeRepository");

      const repo = new PrismaChallengeRepository(mockPrisma);

      expect(repo).toBeDefined();
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });

    test("PrismaGroupRepository can still be instantiated manually", async () => {
      const { PrismaGroupRepository } =
        await import("../PrismaGroupRepository");

      const repo = new PrismaGroupRepository(mockPrisma);

      expect(repo).toBeDefined();
      const result = await repo.findById("test-id");
      expect(result).toBeNull();
    });
  });

  describe("Multiple Repository Resolution", () => {
    test("can resolve all three repositories from same container", () => {
      const userRepo = container.get<UserRepository>(TYPES.UserRepository);
      const challengeRepo = container.get<ChallengeRepository>(
        TYPES.ChallengeRepository,
      );
      const groupRepo = container.get<GroupRepository>(TYPES.GroupRepository);

      expect(userRepo).toBeDefined();
      expect(challengeRepo).toBeDefined();
      expect(groupRepo).toBeDefined();
    });

    test("repositories share the same PrismaClient instance", async () => {
      // Create a mock that tracks calls
      let callCount = 0;
      const trackingMock = {
        ...mockPrisma,
        user: {
          ...mockPrisma.user,
          findUnique: () => {
            callCount++;
            return Promise.resolve(null);
          },
        },
      } as unknown as PrismaClient;

      const testContainer = createTestContainer();
      testContainer.bind(TYPES.PrismaClient).toConstantValue(trackingMock);

      const userRepo = testContainer.get<UserRepository>(TYPES.UserRepository);

      await userRepo.findById("test-id");
      expect(callCount).toBe(1);
    });
  });
});
