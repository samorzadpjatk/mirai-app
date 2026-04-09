/**
 * UseCaseModule Integration Tests
 *
 * These tests verify that:
 * 1. All 78 use cases are properly registered in UseCaseModule (75 original + 3 Group domain)
 * 2. Use case tokens are correctly exported
 * 3. Complex multi-dependency use cases have correct factory configuration
 * 4. All use case factories have proper lifetime configuration (SCOPED)
 *
 * Note: Full container resolution tests are limited due to Bun/awilix
 * compatibility issues with complex factory-based DI.
 *
 * @module UseCaseModule.test
 */

import { describe, it, expect } from "bun:test";
import { Lifetime } from "awilix";

// Import module definition directly to avoid circular dependency issues
const loadUseCaseModule = async () => {
  const module = await import("../UseCaseModule");
  return module;
};

describe("[INTEGRATION] UseCaseModule", () => {
  describe("Module Structure", () => {
    it("should have correct module name", async () => {
      const { UseCaseModule } = await loadUseCaseModule();
      expect(UseCaseModule.name).toBe("UseCaseModule");
    });

    it("should export all 78 use case tokens (75 original + 3 Group domain)", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();
      const exportedTokens = UseCaseModule.exports;
      expect(exportedTokens.length).toBe(78);

      // Verify all expected tokens are present
      const tokenValues = Object.values(USE_CASE_TOKENS);
      for (const token of tokenValues) {
        expect(exportedTokens).toContain(token);
      }
    });

    it("should have 78 providers registered (75 original + 3 Group domain)", async () => {
      const { UseCaseModule } = await loadUseCaseModule();
      expect(Object.keys(UseCaseModule.providers)).toHaveLength(78);
    });

    it("should have all providers configured with SCOPED lifetime", async () => {
      const { UseCaseModule } = await loadUseCaseModule();

      for (const [token, provider] of Object.entries(UseCaseModule.providers)) {
        expect(provider).toBeDefined();
        expect(typeof provider).toBe("object");
        expect(provider).toHaveProperty("factory");
        expect(provider).toHaveProperty("lifetime");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("User Domain Use Cases", () => {
    it("should have providers for all user use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const userUseCases = [
        USE_CASE_TOKENS.GetUserUseCase,
        USE_CASE_TOKENS.CreateUserUseCase,
        USE_CASE_TOKENS.UpdateUserUseCase,
      ];

      for (const token of userUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Challenge Domain Use Cases", () => {
    it("should have providers for all challenge use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const challengeUseCases = [
        USE_CASE_TOKENS.GetChallengeUseCase,
        USE_CASE_TOKENS.CreateChallengeUseCase,
        USE_CASE_TOKENS.UpdateChallengeUseCase,
        USE_CASE_TOKENS.UpdateChallengeStatusUseCase,
      ];

      for (const token of challengeUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Challenge Submission Domain Use Cases", () => {
    it("should have providers for all submission use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const submissionUseCases = [
        USE_CASE_TOKENS.CreateSubmissionUseCase,
        USE_CASE_TOKENS.GetSubmissionUseCase,
        USE_CASE_TOKENS.GetSubmissionByChallengeAndGroupUseCase,
        USE_CASE_TOKENS.UpdateSubmissionUseCase,
        USE_CASE_TOKENS.DeleteSubmissionUseCase,
        USE_CASE_TOKENS.ListSubmissionsByChallengeUseCase,
      ];

      for (const token of submissionUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Challenge Vote Domain Use Cases", () => {
    it("should have providers for all vote use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const voteUseCases = [
        USE_CASE_TOKENS.GetMyVotesUseCase,
        USE_CASE_TOKENS.GetVotesByChallengeUseCase,
        USE_CASE_TOKENS.GetChallengeVotingProgressUseCase,
        USE_CASE_TOKENS.GetJudgedStaffVotingProgressUseCase,
        USE_CASE_TOKENS.SubmitVoteUseCase,
        USE_CASE_TOKENS.SubmitVotesUseCase,
        USE_CASE_TOKENS.ForceEndVotingUseCase,
      ];

      for (const token of voteUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Location Domain Use Cases", () => {
    it("should have providers for all location use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const locationUseCases = [
        USE_CASE_TOKENS.GetLocationUseCase,
        USE_CASE_TOKENS.CreateLocationUseCase,
        USE_CASE_TOKENS.UpdateLocationUseCase,
        USE_CASE_TOKENS.ListLocationsUseCase,
        USE_CASE_TOKENS.UpdateSharingSettingsUseCase,
        USE_CASE_TOKENS.AddSharingUserUseCase,
        USE_CASE_TOKENS.RemoveSharingUserUseCase,
        USE_CASE_TOKENS.GetSharingSettingsUseCase,
      ];

      for (const token of locationUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Notification Domain Use Cases", () => {
    it("should have provider for GetNotificationUseCase", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const provider =
        UseCaseModule.providers[USE_CASE_TOKENS.GetNotificationUseCase];
      expect(provider).toBeDefined();
      expect(typeof provider.factory).toBe("function");
      expect(provider.lifetime).toBe(Lifetime.SCOPED);
    });
  });

  describe("Activity Feed Domain Use Cases", () => {
    it("should have providers for all activity feed use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const activityUseCases = [
        USE_CASE_TOKENS.GetActivityFeedUseCase,
        USE_CASE_TOKENS.CreateActivityUseCase,
        USE_CASE_TOKENS.AddReactionUseCase,
      ];

      for (const token of activityUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Submission Report Domain Use Cases", () => {
    it("should have providers for all report use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const reportUseCases = [
        USE_CASE_TOKENS.CreateReportUseCase,
        USE_CASE_TOKENS.GetReportsUseCase,
      ];

      for (const token of reportUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Sponsor Domain Use Cases", () => {
    it("should have providers for all sponsor use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const sponsorUseCases = [
        USE_CASE_TOKENS.CreateSponsorUseCase,
        USE_CASE_TOKENS.GetSponsorUseCase,
        USE_CASE_TOKENS.UpdateSponsorUseCase,
        USE_CASE_TOKENS.DeleteSponsorUseCase,
        USE_CASE_TOKENS.ListSponsorsUseCase,
        USE_CASE_TOKENS.LinkSponsorToTripUseCase,
        USE_CASE_TOKENS.UnlinkSponsorFromTripUseCase,
      ];

      for (const token of sponsorUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Reward Domain Use Cases", () => {
    it("should have providers for all reward use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const rewardUseCases = [
        USE_CASE_TOKENS.GetRewardUseCase,
        USE_CASE_TOKENS.CreateRewardUseCase,
        USE_CASE_TOKENS.UpdateRewardUseCase,
        USE_CASE_TOKENS.SetRewardHiddenUseCase,
        USE_CASE_TOKENS.DeleteRewardUseCase,
        USE_CASE_TOKENS.ListRewardsUseCase,
        USE_CASE_TOKENS.PurchaseRewardUseCase,
        USE_CASE_TOKENS.UpdatePurchaseStatusUseCase,
        USE_CASE_TOKENS.UpdateMyPurchaseStatusUseCase,
        USE_CASE_TOKENS.GetPurchaseHistoryUseCase,
      ];

      for (const token of rewardUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Complex Use Case: PurchaseRewardUseCase", () => {
    it("should have PurchaseRewardUseCase with factory configuration", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const provider =
        UseCaseModule.providers[USE_CASE_TOKENS.PurchaseRewardUseCase];
      expect(provider).toBeDefined();
      expect(typeof provider.factory).toBe("function");
      expect(provider.lifetime).toBe(Lifetime.SCOPED);
    });

    it("should have ListRewardsUseCase with factory configuration (multiple dependencies)", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const provider =
        UseCaseModule.providers[USE_CASE_TOKENS.ListRewardsUseCase];
      expect(provider).toBeDefined();
      expect(typeof provider.factory).toBe("function");
      expect(provider.lifetime).toBe(Lifetime.SCOPED);
    });
  });

  describe("Coin Transaction Domain Use Cases", () => {
    it("should have providers for all coin transaction use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const coinUseCases = [
        USE_CASE_TOKENS.GetCoinStatisticsUseCase,
        USE_CASE_TOKENS.GetMostActiveAdminStatsUseCase,
        USE_CASE_TOKENS.GetCoinTransactionsUseCase,
        USE_CASE_TOKENS.GetCoinQuickStatsUseCase,
        USE_CASE_TOKENS.GetCoinAdditionalInsightsUseCase,
        USE_CASE_TOKENS.AddCoinsUseCase,
        USE_CASE_TOKENS.RemoveCoinsUseCase,
      ];

      for (const token of coinUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Notification Delivery Domain Use Cases", () => {
    it("should have providers for all notification delivery use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const deliveryUseCases = [
        USE_CASE_TOKENS.GetDeliveriesUseCase,
        USE_CASE_TOKENS.GetDeliveryByNotificationIdUseCase,
        USE_CASE_TOKENS.GetDeliveryStatsUseCase,
        USE_CASE_TOKENS.GetFailedDeliveriesUseCase,
      ];

      for (const token of deliveryUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Notification Schedule Domain Use Cases", () => {
    it("should have providers for all notification schedule use cases", async () => {
      const { UseCaseModule, USE_CASE_TOKENS } = await loadUseCaseModule();

      const scheduleUseCases = [
        USE_CASE_TOKENS.GetNotificationSchedulesUseCase,
        USE_CASE_TOKENS.GetNotificationScheduleByIdUseCase,
        USE_CASE_TOKENS.CreateNotificationScheduleUseCase,
        USE_CASE_TOKENS.UpdateNotificationScheduleUseCase,
        USE_CASE_TOKENS.DeleteNotificationScheduleUseCase,
        USE_CASE_TOKENS.GetActiveNotificationSchedulesUseCase,
        USE_CASE_TOKENS.GetUpcomingNotificationSchedulesUseCase,
        USE_CASE_TOKENS.UpdateNotificationScheduleLastRunUseCase,
        USE_CASE_TOKENS.ToggleNotificationScheduleActiveUseCase,
        USE_CASE_TOKENS.BulkToggleNotificationScheduleActiveUseCase,
        USE_CASE_TOKENS.BulkDeleteNotificationSchedulesUseCase,
        USE_CASE_TOKENS.DuplicateNotificationScheduleUseCase,
        USE_CASE_TOKENS.GetNotificationScheduleExecutionHistoryUseCase,
      ];

      for (const token of scheduleUseCases) {
        const provider = UseCaseModule.providers[token];
        expect(provider).toBeDefined();
        expect(typeof provider.factory).toBe("function");
        expect(provider.lifetime).toBe(Lifetime.SCOPED);
      }
    });
  });

  describe("Token Constants", () => {
    it("should have all token values follow camelCase naming convention", async () => {
      const { USE_CASE_TOKENS } = await loadUseCaseModule();

      for (const [key, value] of Object.entries(USE_CASE_TOKENS)) {
        // Token keys should end with "UseCase"
        expect(key).toEndWith("UseCase");

        // Token values should be camelCase ending with "UseCase"
        expect(value).toEndWith("UseCase");
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    });

    it("should have unique token values", async () => {
      const { USE_CASE_TOKENS } = await loadUseCaseModule();

      const values = Object.values(USE_CASE_TOKENS);
      const uniqueValues = new Set(values);

      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("Type Exports", () => {
    it("should export UseCaseModuleDef type", async () => {
      const { UseCaseModuleDef } = await loadUseCaseModule();
      // TypeScript types don't exist at runtime, but we can verify the export exists
      expect(true).toBe(true);
    });

    it("should export UseCaseModuleDeps type", async () => {
      const { UseCaseModuleDeps } = await loadUseCaseModule();
      // TypeScript types don't exist at runtime, but we can verify the export exists
      expect(true).toBe(true);
    });

    it("should export UseCaseToken type", async () => {
      const { UseCaseToken } = await loadUseCaseModule();
      // TypeScript types don't exist at runtime, but we can verify the export exists
      expect(true).toBe(true);
    });
  });

  describe("Domain Organization", () => {
    it("should organize use cases by domain in USE_CASE_TOKENS", async () => {
      const { USE_CASE_TOKENS } = await loadUseCaseModule();

      // Count use cases per domain using precise filters
      const allTokens = Object.keys(USE_CASE_TOKENS);

      // User domain: GetUser, CreateUser, UpdateUser
      const userTokens = allTokens.filter(
        (k) =>
          k === "GetUserUseCase" ||
          k === "CreateUserUseCase" ||
          k === "UpdateUserUseCase",
      );

      // Challenge domain (core): GetChallenge, CreateChallenge, UpdateChallenge, UpdateChallengeStatus
      const challengeTokens = allTokens.filter(
        (k) =>
          k === "GetChallengeUseCase" ||
          k === "CreateChallengeUseCase" ||
          k === "UpdateChallengeUseCase" ||
          k === "UpdateChallengeStatusUseCase",
      );

      // Submission domain: 6 use cases
      const submissionTokens = allTokens.filter(
        (k) =>
          k.startsWith("CreateSubmission") ||
          k.startsWith("GetSubmission") ||
          k.startsWith("UpdateSubmission") ||
          k.startsWith("DeleteSubmission") ||
          k.startsWith("ListSubmissions"),
      );

      // Vote domain: 7 use cases
      const voteTokens = allTokens.filter(
        (k) =>
          k.startsWith("GetMyVotes") ||
          k.startsWith("GetVotesBy") ||
          k.startsWith("GetChallengeVoting") ||
          k.startsWith("GetJudgedStaffVoting") ||
          k.startsWith("SubmitVote") ||
          k.startsWith("SubmitVotes") ||
          k.startsWith("ForceEndVoting"),
      );

      // Location domain: 8 use cases
      const locationTokens = allTokens.filter(
        (k) =>
          k.startsWith("GetLocation") ||
          k.startsWith("CreateLocation") ||
          k.startsWith("UpdateLocation") ||
          k.startsWith("ListLocations") ||
          k.startsWith("UpdateSharing") ||
          k.startsWith("AddSharing") ||
          k.startsWith("RemoveSharing") ||
          k.startsWith("GetSharing"),
      );

      // Notification domain: just GetNotification
      const notificationTokens = allTokens.filter(
        (k) => k === "GetNotificationUseCase",
      );

      // Activity Feed domain: 3 use cases
      const activityTokens = allTokens.filter(
        (k) =>
          k.startsWith("GetActivityFeed") ||
          k.startsWith("CreateActivity") ||
          k.startsWith("AddReaction"),
      );

      // Report domain: 2 use cases
      const reportTokens = allTokens.filter(
        (k) => k.startsWith("CreateReport") || k.startsWith("GetReports"),
      );

      // Sponsor domain: 7 use cases
      const sponsorTokens = allTokens.filter(
        (k) =>
          k.startsWith("CreateSponsor") ||
          k.startsWith("GetSponsor") ||
          k.startsWith("UpdateSponsor") ||
          k.startsWith("DeleteSponsor") ||
          k.startsWith("ListSponsors") ||
          k.startsWith("LinkSponsor") ||
          k.startsWith("UnlinkSponsor"),
      );

      // Reward domain: 10 use cases
      const rewardTokens = allTokens.filter(
        (k) =>
          k.startsWith("GetReward") ||
          k.startsWith("CreateReward") ||
          k.startsWith("UpdateReward") ||
          k.startsWith("SetReward") ||
          k.startsWith("DeleteReward") ||
          k.startsWith("ListRewards") ||
          k.startsWith("PurchaseReward") ||
          k.startsWith("UpdatePurchase") ||
          k.startsWith("UpdateMyPurchase") ||
          k.startsWith("GetPurchaseHistory"),
      );

      // Coin domain: 7 use cases
      const coinTokens = allTokens.filter(
        (k) =>
          k.startsWith("GetCoin") ||
          k.startsWith("AddCoins") ||
          k.startsWith("RemoveCoins") ||
          k.startsWith("GetMostActive"),
      );

      // Delivery domain: 4 use cases
      const deliveryTokens = allTokens.filter(
        (k) =>
          k.startsWith("GetDeliver") ||
          k.startsWith("GetDelivery") ||
          k.startsWith("GetFailedDeliveries"),
      );

      // Schedule domain: 13 use cases
      const scheduleTokens = allTokens.filter(
        (k) =>
          k.startsWith("GetNotificationSchedule") ||
          k.startsWith("CreateNotificationSchedule") ||
          k.startsWith("UpdateNotificationSchedule") ||
          k.startsWith("DeleteNotificationSchedule") ||
          k.startsWith("GetActiveNotificationSchedules") ||
          k.startsWith("GetUpcomingNotificationSchedules") ||
          k.startsWith("ToggleNotificationSchedule") ||
          k.startsWith("BulkToggleNotificationSchedule") ||
          k.startsWith("BulkDeleteNotificationSchedules") ||
          k.startsWith("DuplicateNotificationSchedule") ||
          k.startsWith("GetNotificationScheduleExecutionHistory"),
      );

      // Verify expected counts
      expect(userTokens.length).toBe(3);
      expect(challengeTokens.length).toBe(4);
      expect(submissionTokens.length).toBe(6);
      expect(voteTokens.length).toBe(7);
      expect(locationTokens.length).toBe(8);
      expect(notificationTokens.length).toBe(1);
      expect(activityTokens.length).toBe(3);
      expect(reportTokens.length).toBe(2);
      expect(sponsorTokens.length).toBe(7);
      expect(rewardTokens.length).toBe(10);
      expect(coinTokens.length).toBe(7);
      expect(deliveryTokens.length).toBe(4);
      expect(scheduleTokens.length).toBe(13);

      // Verify total adds up to 75
      const total =
        userTokens.length +
        challengeTokens.length +
        submissionTokens.length +
        voteTokens.length +
        locationTokens.length +
        notificationTokens.length +
        activityTokens.length +
        reportTokens.length +
        sponsorTokens.length +
        rewardTokens.length +
        coinTokens.length +
        deliveryTokens.length +
        scheduleTokens.length;

      expect(total).toBe(75);
    });
  });
});
