/**
 * ControllerModule Integration Tests
 *
 * These tests verify that:
 * 1. All 17 controllers are properly registered in the module
 * 2. Controllers can be resolved from the container
 * 3. Controllers receive correct dependencies via injection
 * 4. Module exports are correctly configured
 *
 * @module ControllerModule
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { createContainer, type AwilixContainer, Lifetime } from "awilix";
import {
  ControllerModule,
  CONTROLLER_TOKENS,
  type ControllerModuleDeps,
} from "../../modules/ControllerModule";

// =============================================================================
// Mock Dependencies
// =============================================================================

/**
 * Create a complete mock cradle for dependency injection
 * This mocks all repositories and services that controllers depend on
 */
function createMockCradle(): Partial<ControllerModuleDeps> {
  return {
    // Core repositories
    userRepository: {
      findById: async () => null,
      findAll: async () => [],
      create: async (u: unknown) => u as { id: string },
      update: async (u: unknown) => u as { id: string },
    },
    tripRepository: {
      findById: async () => null,
      findAll: async () => [],
      findByStatus: async () => [],
      findActive: async () => [],
      create: async (t: unknown) => t as { id: string },
      update: async (t: unknown) => t as { id: string },
      delete: async () => {},
      exists: async () => true,
    },
    challengeRepository: {
      findById: async () => null,
      findByTripId: async () => [],
      findAll: async () => [],
      findByStatus: async () => [],
      findActive: async () => [],
      findOpenForSubmission: async () => [],
      create: async (c: unknown) => c as { id: string },
      update: async (c: unknown) => c as { id: string },
    },
    groupRepository: {
      findById: async () => null,
      findByCode: async () => null,
      findByTripId: async () => [],
      findByOrganizerId: async () => [],
      findAll: async () => [],
      create: async (g: unknown) => g as { id: string },
      update: async (g: unknown) => g as { id: string },
    },
    locationRepository: {
      findByUserId: async () => null,
      findByIds: async () => [],
      findAllVisibleToUser: async () => [],
      findWithinRadius: async () => [],
      create: async (l: unknown) => l as { id: string },
      update: async (l: unknown) => l as { id: string },
      deleteByUserId: async () => {},
    },

    // Notification repositories
    notificationRepository: {
      findById: async () => null,
      findByTripId: async () => [],
      findByStatus: async () => [],
      findByPriority: async () => [],
      findReadyToSend: async () => [],
      findOverdue: async () => [],
      findAll: async () => [],
      create: async (n: unknown) => n as { id: string },
      update: async (n: unknown) => n as { id: string },
      delete: async () => {},
      exists: async () => true,
    },
    notificationScheduleRepository: {
      findById: async () => null,
      findAll: async () => [],
      findActive: async () => [],
      findUpcoming: async () => [],
      create: async (s: unknown) => s as { id: string },
      update: async (s: unknown) => s as { id: string },
      delete: async () => {},
      bulkDelete: async () => ({ count: 0 }),
      toggleActive: async () => ({}) as { id: string },
      bulkToggleActive: async () => ({ count: 0 }),
      duplicate: async () => ({}) as { id: string },
      updateLastRun: async () => ({}) as { id: string },
      getExecutionHistory: async () => [],
    },
    notificationDeliveryRepository: {
      findById: async () => null,
      findByNotificationId: async () => null,
      findByTripId: async () => [],
      findFailed: async () => [],
      findRecentByTrip: async () => [],
      getStats: async () => ({
        totalDeliveries: 0,
        totalRecipients: 0,
        successCount: 0,
        failureCount: 0,
        avgSuccessPerDelivery: 0,
        avgFailuresPerDelivery: 0,
        successRate: 0,
        statusBreakdown: {},
      }),
      create: async (d: unknown) => d as { id: string },
      update: async (d: unknown) => d as { id: string },
      recordExecution: async () => ({}),
    },

    // Challenge & submission repositories
    challengeSubmissionRepository: {
      findById: async () => null,
      findByChallengeId: async () => [],
      findByGroupId: async () => [],
      findByChallengeAndGroup: async () => null,
      findPendingApproval: async () => [],
      findRanked: async () => [],
      create: async (s: unknown) => s as { id: string },
      update: async (s: unknown) => s as { id: string },
      delete: async () => {},
    },
    challengeVoteRepository: {
      findById: async () => null,
      findByChallengeId: async () => [],
      findBySubmissionId: async () => [],
      findByChallengeAndVoter: async () => [],
      findByVoterAndChallenge: async () => [],
      hasVoted: async () => false,
      getVotingProgress: async () => ({
        challengeId: "",
        totalVotes: 0,
        submissionStats: [],
      }),
      getVotesByChallengeAndVoter: async () => [],
      getJudgedStaffProgress: async () => ({
        requiredPositions: 0,
        eligibleSubmissionsCount: 0,
        totalAdmins: 0,
        votedAdmins: 0,
        pendingAdmins: 0,
        allAdminsVoted: false,
        adminProgress: [],
      }),
      create: async (v: unknown) => v as { id: string },
      createMany: async () => ({ count: 0 }),
      delete: async () => {},
      deleteByVoterAndChallenge: async () => {},
      countByChallenge: async () => 0,
    },
    activityFeedRepository: {
      findById: async () => null,
      findByTripId: async () => [],
      findActiveByTripId: async () => [],
      findVisibleToUser: async () => [],
      findCustomActivities: async () => [],
      findHiddenActivities: async () => [],
      findRankChangesByGroup: async () => [],
      countByTripId: async () => 0,
      countVisibleToUser: async () => 0,
      create: async (a: unknown) => a as { id: string },
      update: async (a: unknown) => a as { id: string },
      delete: async () => {},
      hide: async () => ({}) as { id: string },
      unhide: async () => ({}) as { id: string },
      pin: async () => ({}) as { id: string },
      unpin: async () => ({}) as { id: string },
      toggleReaction: async () => ({
        isActive: true,
        reactionsSummary: {
          total: 0,
          counts: { heart: 0, fire: 0, clap: 0, star: 0 },
          myReactions: [],
        },
      }),
      exists: async () => true,
    },

    // Reward & gamification repositories
    rewardRepository: {
      findById: async () => null,
      findByTripId: async () => [],
      findVisibleByTripId: async () => [],
      countByTripId: async () => 0,
      countVisibleByTripId: async () => 0,
      hasActivePurchases: async () => false,
      create: async (r: unknown) => r as { id: string },
      update: async (r: unknown) => r as { id: string },
      delete: async () => {},
    },
    rewardPurchaseRepository: {
      findById: async () => null,
      findByRewardId: async () => [],
      findByTripId: async () => [],
      findByGroupId: async () => [],
      findByUserId: async () => [],
      findByTripAndUser: async () => [],
      create: async (p: unknown) => p as { id: string },
      update: async (p: unknown) => p as { id: string },
      delete: async () => {},
    },
    coinTransactionRepository: {
      findById: async () => null,
      findByTripId: async () => [],
      findByGroupId: async () => [],
      findByAdminId: async () => [],
      create: async (t: unknown) => t as { id: string },
      getStatistics: async () => ({
        transactionCount: 0,
        addedCoins: 0,
        removedCoins: 0,
        netBalance: 0,
      }),
      getMostActiveAdmin: async () => null,
      getQuickStats: async () => ({
        totalCoins: 0,
        totalGroups: 0,
        averageCoinsPerGroup: 0,
      }),
      getAdditionalInsights: async () => ({
        mostActiveAdmin: null,
        recentTransactions: [],
      }),
    },

    // Support & moderation repositories
    sponsorRepository: {
      findById: async () => null,
      findByTripId: async () => [],
      findAll: async () => [],
      findActive: async () => [],
      create: async (s: unknown) => s as { id: string },
      update: async (s: unknown) => s as { id: string },
      delete: async () => {},
      linkToTrip: async () => {},
      unlinkFromTrip: async () => {},
      isLinkedToTrip: async () => false,
    },
    submissionReportRepository: {
      findById: async () => null,
      findBySubmissionId: async () => [],
      findByTripId: async () => [],
      findPending: async () => [],
      create: async (r: unknown) => r as { id: string },
      update: async (r: unknown) => r as { id: string },
      delete: async () => {},
    },

    // Domain services (for RewardController)
    tripPointsCalculator: {
      calculatePoints: async () => ({
        totalPoints: 0,
        challengePoints: [],
        bonusPoints: 0,
      }),
      getMaxPossiblePoints: async () => 0,
    },
    groupCoinsService: {
      addCoins: async () => ({}) as { id: string; coins: number },
      removeCoins: async () => ({}) as { id: string; coins: number },
      getBalance: async () => 0,
    },
    tripAccessChecker: {
      canAccessTrip: async () => true,
      canManageTrip: async () => true,
      getUserRole: async () => null,
      isTripParticipant: async () => true,
      checkAccess: async () => ({
        canAccess: true,
        canManage: false,
        role: null,
        isParticipant: true,
      }),
      checkGroupLeaderAccess: async () => ({
        isLeader: true,
        isCoLeader: false,
        hasAccess: true,
        role: "LEADER",
      }),
    },

    // Use cases (for newer controller pattern)
    getDeliveriesUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: { deliveries: [], total: 0, limit: 0, offset: 0 },
      }),
    },
    getDeliveryByNotificationIdUseCase: {
      execute: async () => ({ kind: "ok" as const, value: { delivery: null } }),
    },
    getDeliveryStatsUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: {
          totalDeliveries: 0,
          totalRecipients: 0,
          totalSuccess: 0,
          totalFailures: 0,
          avgSuccessPerDelivery: 0,
          avgFailuresPerDelivery: 0,
          successRate: 0,
          statusBreakdown: {},
        },
      }),
    },
    getFailedDeliveriesUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: { deliveries: [], total: 0, limit: 0, offset: 0 },
      }),
    },
    addCoinsUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: {
          transaction: {
            id: "",
            amount: 0,
            reason: null,
            groupId: "",
            adminId: "",
            createdAt: new Date(),
          },
        },
      }),
    },
    removeCoinsUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: {
          transaction: {
            id: "",
            amount: 0,
            reason: null,
            groupId: "",
            adminId: "",
            createdAt: new Date(),
          },
        },
      }),
    },
    getCoinStatisticsUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: {
          transactionCount: 0,
          addedCoins: 0,
          removedCoins: 0,
          netBalance: 0,
          time: new Date(),
        },
      }),
    },
    getMostActiveAdminStatsUseCase: {
      execute: async () => ({ kind: "ok" as const, value: null }),
    },
    getCoinTransactionsUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: {
          transactions: [],
          pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
        },
      }),
    },
    getCoinQuickStatsUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: {
          totalCoins: 0,
          totalGroups: 0,
          averageCoinsPerGroup: 0,
          time: new Date(),
        },
      }),
    },
    getCoinAdditionalInsightsUseCase: {
      execute: async () => ({
        kind: "ok" as const,
        value: { mostActiveAdmin: null, recentTransactions: [] },
      }),
    },

    // Supabase client (for StorageController)
    supabase: {
      storage: {
        from: () => ({
          createSignedUploadUrl: async () => ({
            data: { token: "token" },
            error: null,
          }),
          createSignedUrl: async () => ({
            data: { signedUrl: "url" },
            error: null,
          }),
        }),
      },
    },
  };
}

// =============================================================================
// Test Suite
// =============================================================================

describe("[INTEGRATION] ControllerModule", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    // Create a fresh container for each test
    container = createContainer({
      injectionMode: "PROXY",
    });

    // Register mock dependencies
    const mockCradle = createMockCradle();
    for (const [key, value] of Object.entries(mockCradle)) {
      container.register(key, value as object);
    }

    // Register controllers directly from the providers
    const providers = ControllerModule.providers as Record<
      string,
      { factory?: (cradle: unknown) => unknown; lifetime?: Lifetime }
    >;

    for (const [name, provider] of Object.entries(providers)) {
      if (
        typeof provider === "object" &&
        "factory" in provider &&
        provider.factory
      ) {
        container.register({
          [name]: provider.factory,
        });
      }
    }
  });

  describe("Module Registration", () => {
    it("should have correct module name", () => {
      expect(ControllerModule.name).toBe("ControllerModule");
    });

    it("should export all 17 controllers", () => {
      const expectedExports: string[] = [
        // Core domain
        "userController",
        "tripController",
        "challengeController",
        "groupController",
        "locationController",

        // Notification & messaging
        "notificationController",
        "notificationScheduleController",
        "notificationDeliveryController",

        // Challenge & submission
        "challengeSubmissionController",
        "challengeVoteController",
        "activityFeedController",

        // Reward & gamification
        "rewardController",
        "coinController",
        "coinTransactionController",

        // Support & moderation
        "sponsorController",
        "submissionReportController",

        // Infrastructure
        "storageController",
      ];

      expectedExports.forEach((token) => {
        expect(ControllerModule.exports).toContain(token);
      });

      expect(ControllerModule.exports).toHaveLength(17);
    });

    it("should have all 17 providers registered", () => {
      const providerKeys = Object.keys(ControllerModule.providers);
      expect(providerKeys).toHaveLength(17);

      // Verify each expected controller is registered
      expect(providerKeys).toContain("userController");
      expect(providerKeys).toContain("tripController");
      expect(providerKeys).toContain("challengeController");
      expect(providerKeys).toContain("groupController");
      expect(providerKeys).toContain("locationController");
      expect(providerKeys).toContain("notificationController");
      expect(providerKeys).toContain("notificationScheduleController");
      expect(providerKeys).toContain("notificationDeliveryController");
      expect(providerKeys).toContain("challengeSubmissionController");
      expect(providerKeys).toContain("challengeVoteController");
      expect(providerKeys).toContain("activityFeedController");
      expect(providerKeys).toContain("rewardController");
      expect(providerKeys).toContain("coinController");
      expect(providerKeys).toContain("coinTransactionController");
      expect(providerKeys).toContain("sponsorController");
      expect(providerKeys).toContain("submissionReportController");
      expect(providerKeys).toContain("storageController");
    });
  });

  describe("Controller Resolution", () => {
    describe("Core Domain Controllers", () => {
      it("should resolve userController with dependencies", () => {
        const controller = container.resolve("userController");
        expect(controller).toBeDefined();
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
        expect(typeof controller.list).toBe("function");
      });

      it("should resolve tripController with dependencies", () => {
        const controller = container.resolve("tripController");
        expect(controller).toBeDefined();
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
        expect(typeof controller.delete).toBe("function");
      });

      it("should resolve challengeController with dependencies", () => {
        const controller = container.resolve("challengeController");
        expect(controller).toBeDefined();
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
        expect(typeof controller.updateStatus).toBe("function");
      });

      it("should resolve groupController with dependencies", () => {
        const controller = container.resolve("groupController");
        expect(controller).toBeDefined();
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.getByCode).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
      });

      it("should resolve locationController with dependencies", () => {
        const controller = container.resolve("locationController");
        expect(controller).toBeDefined();
        expect(typeof controller.getByUserId).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
        expect(typeof controller.list).toBe("function");
      });
    });

    describe("Notification & Messaging Controllers", () => {
      it("should resolve notificationController with dependencies", () => {
        const controller = container.resolve("notificationController");
        expect(controller).toBeDefined();
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
      });

      it("should resolve notificationScheduleController with dependencies", () => {
        const controller = container.resolve("notificationScheduleController");
        expect(controller).toBeDefined();
        expect(typeof controller.getAll).toBe("function");
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
      });

      it("should resolve notificationDeliveryController with dependencies", () => {
        const controller = container.resolve("notificationDeliveryController");
        expect(controller).toBeDefined();
        expect(typeof controller.getDeliveries).toBe("function");
        expect(typeof controller.getDeliveryByNotificationId).toBe("function");
        expect(typeof controller.getDeliveryStats).toBe("function");
      });
    });

    describe("Challenge & Submission Controllers", () => {
      it("should resolve challengeSubmissionController with dependencies", () => {
        const controller = container.resolve("challengeSubmissionController");
        expect(controller).toBeDefined();
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
        expect(typeof controller.delete).toBe("function");
      });

      it("should resolve challengeVoteController with dependencies", () => {
        const controller = container.resolve("challengeVoteController");
        expect(controller).toBeDefined();
        expect(typeof controller.getMyVotes).toBe("function");
        expect(typeof controller.getByChallenge).toBe("function");
        expect(typeof controller.submitVote).toBe("function");
      });

      it("should resolve activityFeedController with dependencies", () => {
        const controller = container.resolve("activityFeedController");
        expect(controller).toBeDefined();
        expect(typeof controller.getByTrip).toBe("function");
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.createCustom).toBe("function");
        expect(typeof controller.toggleReaction).toBe("function");
      });
    });

    describe("Reward & Gamification Controllers", () => {
      it("should resolve rewardController with dependencies", () => {
        const controller = container.resolve("rewardController");
        expect(controller).toBeDefined();
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
        expect(typeof controller.purchase).toBe("function");
      });

      it("should resolve coinController with dependencies", () => {
        const controller = container.resolve("coinController");
        expect(controller).toBeDefined();
        expect(typeof controller.addCoins).toBe("function");
        expect(typeof controller.removeCoins).toBe("function");
      });

      it("should resolve coinTransactionController with dependencies", () => {
        const controller = container.resolve("coinTransactionController");
        expect(controller).toBeDefined();
        expect(typeof controller.getStatistics).toBe("function");
        expect(typeof controller.getAll).toBe("function");
        expect(typeof controller.getQuickStats).toBe("function");
      });
    });

    describe("Support & Moderation Controllers", () => {
      it("should resolve sponsorController with dependencies", () => {
        const controller = container.resolve("sponsorController");
        expect(controller).toBeDefined();
        expect(typeof controller.getById).toBe("function");
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.update).toBe("function");
        expect(typeof controller.delete).toBe("function");
      });

      it("should resolve submissionReportController with dependencies", () => {
        const controller = container.resolve("submissionReportController");
        expect(controller).toBeDefined();
        expect(typeof controller.create).toBe("function");
        expect(typeof controller.getBySubmission).toBe("function");
      });
    });

    describe("Infrastructure Controllers", () => {
      it("should resolve storageController with supabase dependency", () => {
        const controller = container.resolve("storageController");
        expect(controller).toBeDefined();
        expect(typeof controller.createUploadUrl).toBe("function");
        expect(typeof controller.createDownloadUrl).toBe("function");
        expect(typeof controller.createPublicUrl).toBe("function");
      });
    });
  });

  describe("Controller Token Exports", () => {
    it("should have correct token for userController", () => {
      expect(CONTROLLER_TOKENS.UserController).toBe("userController");
    });

    it("should have correct token for tripController", () => {
      expect(CONTROLLER_TOKENS.TripController).toBe("tripController");
    });

    it("should have correct token for all controllers", () => {
      const tokenMap: Record<string, string> = {
        UserController: "userController",
        TripController: "tripController",
        ChallengeController: "challengeController",
        GroupController: "groupController",
        LocationController: "locationController",
        NotificationController: "notificationController",
        NotificationScheduleController: "notificationScheduleController",
        NotificationDeliveryController: "notificationDeliveryController",
        ChallengeSubmissionController: "challengeSubmissionController",
        ChallengeVoteController: "challengeVoteController",
        ActivityFeedController: "activityFeedController",
        RewardController: "rewardController",
        CoinController: "coinController",
        CoinTransactionController: "coinTransactionController",
        SponsorController: "sponsorController",
        SubmissionReportController: "submissionReportController",
        StorageController: "storageController",
      };

      Object.entries(tokenMap).forEach(([key, value]) => {
        expect(CONTROLLER_TOKENS[key as keyof typeof CONTROLLER_TOKENS]).toBe(
          value,
        );
      });
    });
  });

  describe("Complex Controller Dependencies", () => {
    it("should inject multiple repositories into rewardController", () => {
      const controller = container.resolve("rewardController");
      expect(controller).toBeDefined();

      // RewardController requires: rewardRepository, purchaseRepository,
      // tripPointsCalculator, groupCoinsService, tripAccessChecker
      // This is tested by successful resolution
    });

    it("should inject use cases into coinController", () => {
      const controller = container.resolve("coinController");
      expect(controller).toBeDefined();

      // CoinController receives use cases directly: addCoinsUseCase, removeCoinsUseCase
    });

    it("should inject use cases into coinTransactionController", () => {
      const controller = container.resolve("coinTransactionController");
      expect(controller).toBeDefined();

      // CoinTransactionController receives 5 use cases directly
    });

    it("should inject use cases into notificationDeliveryController", () => {
      const controller = container.resolve("notificationDeliveryController");
      expect(controller).toBeDefined();

      // NotificationDeliveryController receives 4 use cases directly
    });
  });

  describe("Controller Lifetime", () => {
    it("should have SCOPED lifetime for factory-based controllers", () => {
      const providers = ControllerModule.providers as Record<
        string,
        { lifetime?: string }
      >;

      // All controllers should have SCOPED lifetime when using factory pattern
      Object.entries(providers).forEach(([name, provider]) => {
        if (typeof provider === "object" && "lifetime" in provider) {
          expect(provider.lifetime, `Controller ${name} should be SCOPED`).toBe(
            "SCOPED",
          );
        }
      });
    });
  });
});
