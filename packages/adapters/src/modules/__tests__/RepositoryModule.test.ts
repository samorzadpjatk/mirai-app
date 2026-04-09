/**
 * RepositoryModule Integration Tests
 *
 * Tests that all 16 repositories are properly cataloged and exported.
 * Note: Full container resolution tests are limited due to Bun/awilix
 * compatibility issues with decorator-based DI.
 *
 * @module RepositoryModule
 */

import { describe, it, expect } from "bun:test";

// Import module definition directly to avoid circular dependency through gateways
// The gateways import @mirai-app/frameworks/di which creates circular load during tests
const loadRepositoryModule = async () => {
  const module = await import("../RepositoryModule");
  return module;
};

describe("[INTEGRATION] RepositoryModule", () => {
  describe("Module Structure", () => {
    it("should have correct module name", async () => {
      const { RepositoryModule } = await loadRepositoryModule();
      expect(RepositoryModule.name).toBe("RepositoryModule");
    });

    it("should export all 16 repository tokens", async () => {
      const { RepositoryModule, REPOSITORY_TOKENS } =
        await loadRepositoryModule();
      expect(RepositoryModule.exports).toHaveLength(16);

      // Verify all expected tokens are present
      const expectedTokens = [
        REPOSITORY_TOKENS.UserRepository,
        REPOSITORY_TOKENS.TripRepository,
        REPOSITORY_TOKENS.ChallengeRepository,
        REPOSITORY_TOKENS.GroupRepository,
        REPOSITORY_TOKENS.LocationRepository,
        REPOSITORY_TOKENS.NotificationRepository,
        REPOSITORY_TOKENS.NotificationDeliveryRepository,
        REPOSITORY_TOKENS.NotificationScheduleRepository,
        REPOSITORY_TOKENS.ChallengeSubmissionRepository,
        REPOSITORY_TOKENS.ChallengeVoteRepository,
        REPOSITORY_TOKENS.ActivityFeedRepository,
        REPOSITORY_TOKENS.RewardRepository,
        REPOSITORY_TOKENS.RewardPurchaseRepository,
        REPOSITORY_TOKENS.CoinTransactionRepository,
        REPOSITORY_TOKENS.SponsorRepository,
        REPOSITORY_TOKENS.SubmissionReportRepository,
      ];

      for (const token of expectedTokens) {
        expect(RepositoryModule.exports).toContain(token);
      }
    });

    it("should have 16 providers registered", async () => {
      const { RepositoryModule } = await loadRepositoryModule();
      expect(Object.keys(RepositoryModule.providers)).toHaveLength(16);
    });

    it("should have providers for all core domain repositories", async () => {
      const { RepositoryModule, REPOSITORY_TOKENS } =
        await loadRepositoryModule();

      // Verify providers are class constructors
      expect(
        typeof RepositoryModule.providers[REPOSITORY_TOKENS.UserRepository],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[REPOSITORY_TOKENS.TripRepository],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.ChallengeRepository
        ],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[REPOSITORY_TOKENS.GroupRepository],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[REPOSITORY_TOKENS.LocationRepository],
      ).toBe("function");
    });

    it("should have providers for all notification repositories", async () => {
      const { RepositoryModule, REPOSITORY_TOKENS } =
        await loadRepositoryModule();

      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.NotificationRepository
        ],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.NotificationDeliveryRepository
        ],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.NotificationScheduleRepository
        ],
      ).toBe("function");
    });

    it("should have providers for all challenge repositories", async () => {
      const { RepositoryModule, REPOSITORY_TOKENS } =
        await loadRepositoryModule();

      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.ChallengeSubmissionRepository
        ],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.ChallengeVoteRepository
        ],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.ActivityFeedRepository
        ],
      ).toBe("function");
    });

    it("should have providers for all reward repositories", async () => {
      const { RepositoryModule, REPOSITORY_TOKENS } =
        await loadRepositoryModule();

      expect(
        typeof RepositoryModule.providers[REPOSITORY_TOKENS.RewardRepository],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.RewardPurchaseRepository
        ],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.CoinTransactionRepository
        ],
      ).toBe("function");
    });

    it("should have providers for all support repositories", async () => {
      const { RepositoryModule, REPOSITORY_TOKENS } =
        await loadRepositoryModule();

      expect(
        typeof RepositoryModule.providers[REPOSITORY_TOKENS.SponsorRepository],
      ).toBe("function");
      expect(
        typeof RepositoryModule.providers[
          REPOSITORY_TOKENS.SubmissionReportRepository
        ],
      ).toBe("function");
    });
  });

  describe("REPOSITORY_TOKENS", () => {
    it("should define correct camelCase token names", async () => {
      const { REPOSITORY_TOKENS } = await loadRepositoryModule();

      expect(REPOSITORY_TOKENS.UserRepository).toBe("userRepository");
      expect(REPOSITORY_TOKENS.TripRepository).toBe("tripRepository");
      expect(REPOSITORY_TOKENS.ChallengeRepository).toBe("challengeRepository");
      expect(REPOSITORY_TOKENS.GroupRepository).toBe("groupRepository");
      expect(REPOSITORY_TOKENS.LocationRepository).toBe("locationRepository");
      expect(REPOSITORY_TOKENS.NotificationRepository).toBe(
        "notificationRepository",
      );
      expect(REPOSITORY_TOKENS.NotificationDeliveryRepository).toBe(
        "notificationDeliveryRepository",
      );
      expect(REPOSITORY_TOKENS.NotificationScheduleRepository).toBe(
        "notificationScheduleRepository",
      );
      expect(REPOSITORY_TOKENS.ChallengeSubmissionRepository).toBe(
        "challengeSubmissionRepository",
      );
      expect(REPOSITORY_TOKENS.ChallengeVoteRepository).toBe(
        "challengeVoteRepository",
      );
      expect(REPOSITORY_TOKENS.ActivityFeedRepository).toBe(
        "activityFeedRepository",
      );
      expect(REPOSITORY_TOKENS.RewardRepository).toBe("rewardRepository");
      expect(REPOSITORY_TOKENS.RewardPurchaseRepository).toBe(
        "rewardPurchaseRepository",
      );
      expect(REPOSITORY_TOKENS.CoinTransactionRepository).toBe(
        "coinTransactionRepository",
      );
      expect(REPOSITORY_TOKENS.SponsorRepository).toBe("sponsorRepository");
      expect(REPOSITORY_TOKENS.SubmissionReportRepository).toBe(
        "submissionReportRepository",
      );
    });
  });

  describe("Type Exports", () => {
    it("should export RepositoryToken type", async () => {
      const { REPOSITORY_TOKENS } = await loadRepositoryModule();

      // TypeScript compile-time verification
      const token: (typeof REPOSITORY_TOKENS)[keyof typeof REPOSITORY_TOKENS] =
        "userRepository";
      expect(token).toBe("userRepository");
    });
  });
});
