/**
 * Pothos Schema Builder
 *
 * Code-first GraphQL schema builder with full TypeScript type inference.
 * Configures scalar types (DateTime), sets up the builder instance,
 * and provides type-safe schema construction.
 *
 * ## Architecture
 *
 * Pothos uses a code-first approach where TypeScript types drive the GraphQL
 * schema definition. This ensures type safety between domain entities and
 * the GraphQL API.
 *
 * ## Usage
 *
 * ```typescript
 * import { builder } from "./builder";
 *
 * builder.objectType("User", {
 *   fields: (t) => ({
 *     id: t.exposeID("id"),
 *     name: t.exposeString("name"),
 *   }),
 * });
 * ```
 *
 * @module builder
 */

import SchemaBuilder from "@pothos/core";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import DataLoaderPlugin from "@pothos/plugin-dataloader";
import RelayPlugin from "@pothos/plugin-relay";
import { DateTimeResolver } from "graphql-scalars";
import type {
  GetUserOutput,
  CreateUserOutput,
  UpdateUserOutput,
  GetSubmissionOutput,
  CreateSubmissionOutput,
  UpdateSubmissionOutput,
  ListSubmissionsByChallengeOutput,
  CreateReportOutput,
  GetReportsOutput,
  ReportOutput,
  ReporterOutput,
  GetRewardOutput,
  CreateRewardOutput,
  UpdateRewardOutput,
  SetRewardHiddenOutput,
  DeleteRewardOutput,
  PurchaseRewardOutput,
  UpdatePurchaseStatusOutput,
  UpdateMyPurchaseStatusOutput,
  RewardWithCalculations,
  PurchaseWithDetails,
  VoteDTO,
  ChallengeVoteDTO,
  GetMyVotesOutput,
  GetVotesByChallengeOutput,
  GetChallengeVotingProgressOutput,
  GetJudgedStaffVotingProgressOutput,
  AdminVotingInfo,
  SubmitVoteOutput,
  SubmitVotesOutput,
  ForceEndVotingOutput,
  GetCoinStatisticsOutput,
  GetCoinQuickStatsOutput,
  GetMostActiveAdminStatsOutput,
  GetCoinAdditionalInsightsOutput,
  GetCoinTransactionsOutput,
} from "@mirai-app/use-cases";
import type { CoinTransaction } from "@mirai-app/use-cases";
import type { UserRole, RewardPurchaseStatus } from "@mirai-app/domain";
import type {
  NotificationScheduleOutput,
  Controllers,
} from "@mirai-app/adapters";

// =============================================================================
// Type Definitions for Pothos
// =============================================================================

/**
 * Pothos type registry
 *
 * These types are used by Pothos for type inference in the schema builder.
 * They map domain entities and DTOs to GraphQL types.
 */
export interface PothosTypes {
  // Context type - available in all resolvers
  // Updated to include Effect runtime for GraphQL integration
  Context: {
    /** All 17 controllers via Effect-based DI */
    controllers: Controllers;
    request: Request;
    authContext?: import("@mirai-app/domain").AuthContext;
    runtime: import("effect/Runtime").Runtime<never>;
    /** Effect Layer with all repositories and services */
    appLayer: import("effect").Layer.Layer<unknown>;
  };

  // Auth scopes for @pothos/plugin-scope-auth
  AuthScopes: {
    public: boolean;
    authenticated: boolean;
    admin: boolean;
    moderator: boolean;
  };

  // Domain types mapped to GraphQL
  Objects: {
    // User domain - mapped from use case DTOs
    User: GetUserOutput;
    UserCreateResult: CreateUserOutput;
    UserUpdateResult: UpdateUserOutput;

    // ChallengeSubmission domain - mapped from use case DTOs
    ChallengeSubmission: GetSubmissionOutput;
    ChallengeSubmissionCreateResult: CreateSubmissionOutput;
    ChallengeSubmissionUpdateResult: UpdateSubmissionOutput;
    ChallengeSubmissionListResult: ListSubmissionsByChallengeOutput;
    SubmissionGroupInfo: {
      id: string;
      name: string;
      description: string | null;
      image: string | null;
    };
    SubmissionReviewerInfo: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
    };

    // Reward domain - mapped from use case DTOs
    Reward: GetRewardOutput;
    RewardWithCalculations: RewardWithCalculations;
    RewardCreateResult: CreateRewardOutput;
    RewardUpdateResult: UpdateRewardOutput;
    RewardSetHiddenResult: SetRewardHiddenOutput;
    RewardDeleteResult: DeleteRewardOutput;
    RewardPurchase: PurchaseWithDetails;
    RewardPurchaseResult: PurchaseRewardOutput;
    RewardPurchaseStatusUpdateResult: UpdatePurchaseStatusOutput;
    RewardMyPurchaseStatusUpdateResult: UpdateMyPurchaseStatusOutput;

    // Group domain - mapped from GroupController outputs
    Group: {
      id: string;
      tripId: string;
      name: string;
      description: string | null;
      image: string | null;
      organizerId: string;
      code: string;
      coins: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      isActive: boolean;
    };
    GroupSummary: {
      id: string;
      name: string;
    };
    GroupRanking: {
      id: string;
      tripId: string;
      name: string;
      description: string | null;
      image: string | null;
      organizerId: string;
      code: string;
      coins: number;
      status: string;
      createdAt: Date;
      isActive: boolean;
    };
    GroupPagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    GroupsConnection: {
      groups: unknown[];
      pagination: unknown;
    };
    GroupRankingResult: {
      data: unknown[];
      currentDate: Date;
    };
    CreateGroupPayload: {
      group: unknown;
    };
    UpdateGroupPayload: {
      group: unknown;
    };
    DeleteGroupPayload: {
      success: boolean;
    };
    AddCoinsPayload: {
      id: string;
      name: string;
      previousCoins: number;
      newCoins: number;
      updatedAt: Date;
    };

    // SubmissionReport domain - mapped from use case DTOs
    SubmissionReport: ReportOutput;
    SubmissionReportCreateResult: CreateReportOutput;
    SubmissionReportListResult: GetReportsOutput;
    SubmissionReportUserInfo: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      hasAvatar: boolean;
    };
    SubmissionReportReporterInfo: ReporterOutput;

    // Trip domain - mapped from TripController output
    Trip: {
      id: string;
      name: string;
      description: string | null;
      startDate: Date;
      endDate: Date;
      backgroundImagePath: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      isPlanning: boolean;
      isActive: boolean;
      isCompleted: boolean;
      isCancelled: boolean;
    };
    TripPaginationInfo: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    TripListResult: {
      trips: Array<{
        id: string;
        name: string;
        description: string | null;
        startDate: Date;
        endDate: Date;
        status: string;
        createdAt: Date;
      }>;
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    };
    DeleteTripResult: {
      success: boolean;
    };

    // NotificationDelivery domain - mapped from NotificationDeliveryController outputs
    NotificationDelivery: {
      id: string;
      notificationId: string;
      tripId: string;
      status: string;
      totalRecipients: number;
      successCount: number;
      failureCount: number;
      deliveryStartedAt: Date;
      deliveryCompletedAt?: Date | null;
      errorLog?: string | null;
      scheduleId?: string | null;
      createdAt: Date;
      updatedAt: Date;
      notification?: {
        id: string;
        title: string;
        body: string;
        url?: string | null;
        createdAt: Date;
        tripId?: string;
        createdBy?: {
          id: string;
          firstName?: string | null;
          lastName?: string | null;
          authUserId?: string;
        } | null;
      } | null;
    };
    NotificationDeliveryListResult: {
      deliveries: Array<{
        id: string;
        notificationId: string;
        tripId: string;
        status: string;
        totalRecipients: number;
        successCount: number;
        failureCount: number;
        deliveryStartedAt: Date;
        deliveryCompletedAt?: Date | null;
        errorLog?: string | null;
        scheduleId?: string | null;
        createdAt: Date;
        updatedAt: Date;
        notification?: {
          id: string;
          title: string;
          body: string;
          createdAt: Date;
          createdBy?: {
            id: string;
            firstName?: string | null;
            lastName?: string | null;
          } | null;
        } | null;
      }>;
      total: number;
      limit: number;
      offset: number;
    };
    DeliveryPagination: {
      total: number;
      limit: number;
      offset: number;
    };
    DeliveryStats: {
      totalDeliveries: number;
      totalRecipients: number;
      totalSuccess: number;
      totalFailures: number;
      avgSuccessPerDelivery: number;
      avgFailuresPerDelivery: number;
      successRate: number;
      statusBreakdown: Record<string, number>;
    };
    DeliveryStatusBreakdown: Record<string, number>;
    NotificationCreator: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      authUserId?: string;
    };
    NotificationInfo: {
      id: string;
      title: string;
      body: string;
      url?: string | null;
      createdAt: Date;
      tripId?: string;
      createdBy?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        authUserId?: string;
      } | null;
    };

    // Notification domain - mapped from NotificationController outputs
    Notification: {
      id: string;
      title: string;
      body: string;
      url: string | null;
      status: string;
      priority: string;
      tripId: string | null;
      createdById: string;
      createdAt: Date;
      updatedAt?: Date;
      scheduledFor?: Date | null;
      sentAt?: Date | null;
      isSent: boolean;
      isScheduled: boolean;
      isReadyToSend?: boolean;
    };
    NotificationPaginationInfo: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    NotificationOffsetPaginationInfo: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    MyNotificationsResult: {
      notifications: Array<{
        id: string;
        title: string;
        body: string;
        url: string | null;
        status: string;
        priority: string;
        tripId: string | null;
        createdById: string;
        createdAt: Date;
        isSent: boolean;
      }>;
      pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    };
    AllNotificationsResult: {
      notifications: Array<{
        id: string;
        title: string;
        body: string;
        url: string | null;
        status: string;
        priority: string;
        tripId: string | null;
        createdById: string;
        createdAt: Date;
        isSent: boolean;
      }>;
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    };
    CreateNotificationResult: {
      id: string;
      title: string;
      body: string;
      url: string | null;
      status: string;
      priority: string;
      tripId: string | null;
      createdById: string;
      createdAt: Date;
      isScheduled: boolean;
    };
    UpdateNotificationResult: {
      notification: {
        id: string;
        title: string;
        body: string;
        url: string | null;
        status: string;
        priority: string;
        tripId: string | null;
        updatedAt: Date;
      };
    };
    UpdateNotificationStatusResult: {
      id: string;
      title: string;
      previousStatus: string;
      newStatus: string;
      updatedAt: Date;
    };
    DeleteNotificationResult: {
      success: boolean;
    };

    // Activity Feed domain - mapped from ActivityFeedController outputs
    Activity: {
      id: string;
      tripId: string;
      activityType: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      isPinned: boolean;
      isHidden: boolean;
      createdAt: Date;
      updatedAt: Date;
      admin: {
        id: string;
        firstName: string;
        lastName: string;
      } | null;
    };
    ActivityAdmin: {
      id: string;
      firstName: string;
      lastName: string;
    };
    ActivityFeedResult: {
      activities: unknown[];
      nextCursor: {
        id: string;
        createdAt: Date;
        isPinned: boolean;
      } | null;
      pagination: {
        pageSize: number;
        hasMore: boolean;
      };
    };
    ActivityFeedModerationResult: {
      activities: unknown[];
      pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
      };
    };
    PaginationInfo: {
      pageSize: number;
      hasMore: boolean;
    };
    ActivityCursor: {
      id: string;
      createdAt: Date;
      isPinned: boolean;
    };
    ModerationPaginationInfo: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      hasMore: boolean;
    };
    ReactionCounts: {
      heart: number;
      fire: number;
      clap: number;
      star: number;
    };
    ReactionsSummary: {
      total: number;
      counts: {
        heart: number;
        fire: number;
        clap: number;
        star: number;
      };
      myReactions: string[];
    };
    ToggleReactionResult: {
      activityId: string;
      reactionType: string;
      isActive: boolean;
      reactionsSummary: {
        total: number;
        counts: {
          heart: number;
          fire: number;
          clap: number;
          star: number;
        };
        myReactions: string[];
      };
    };
    DeleteActivityResult: {
      success: boolean;
    };
    HiddenActivityResult: {
      id: string;
      tripId: string;
      activityType: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      isPinned: boolean;
      isHidden: boolean;
      hiddenAt: Date;
      hiddenReason: string | null;
      updatedAt: Date;
    };

    // Storage domain - mapped from StorageController outputs
    UploadUrlResult: {
      resumableUrl: string;
      token: string;
      bucket: string;
      objectPath: string;
      storagePath: string;
    };
    DownloadUrlResult: {
      signedUrl: string;
      expiresAt: string;
    };
    PublicUrlResult: {
      publicUrl: string;
    };

    // Coin domain - mapped from CoinController outputs
    CoinTransaction: {
      id: string;
      groupId: string;
      amount: number;
      reason?: string | null;
      adminId: string;
      createdAt: Date;
      group?: {
        id: string;
        name: string;
        coins: number;
      } | null;
      admin?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
      } | null;
    };
    CoinTransactionResult: {
      id: string;
      groupId: string;
      amount: number;
      reason?: string | null;
      adminId: string;
      createdAt: Date;
      group?: {
        id: string;
        name: string;
        coins: number;
      } | null;
      admin?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
      } | null;
    };

    // CoinTransaction domain - additional types for comprehensive coin management
    CoinTransactionGroup: {
      id: string;
      name: string;
      coins: number;
    };
    CoinTransactionAdmin: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    };
    CoinStatistics: {
      transactionCount: number;
      addedCoins: number;
      removedCoins: number;
      netBalance: number;
      time: Date;
    };
    CoinQuickStats: {
      totalCoins: number;
      totalGroups: number;
      averageCoinsPerGroup: number;
      richestGroupId?: string;
      richestGroupName?: string;
      time: Date;
    };
    MostActiveAdminStats: {
      adminId: string;
      totalAmount: number;
      transactionCount: number;
    };
    FormattedUser: {
      name: string;
      transactionCount: number;
    };
    CoinAdditionalInsights: {
      mostActiveAdmin: {
        name: string;
        transactionCount: number;
      } | null;
      recentTransactions: Array<{
        id: string;
        groupId: string;
        amount: number;
        reason?: string | null;
        adminId: string;
        createdAt: Date;
        group?: {
          id: string;
          name: string;
          coins: number;
        } | null;
        admin?: {
          id: string;
          firstName?: string | null;
          lastName?: string | null;
        } | null;
      }>;
    };
    CoinTransactionPagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    CoinTransactionsConnection: {
      transactions: Array<{
        id: string;
        groupId: string;
        amount: number;
        reason?: string | null;
        adminId: string;
        createdAt: Date;
        group?: {
          id: string;
          name: string;
          coins: number;
        } | null;
        admin?: {
          id: string;
          firstName?: string | null;
          lastName?: string | null;
        } | null;
      }>;
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    };

    // ChallengeVote domain - mapped from use case DTOs
    ChallengeVote: VoteDTO;
    ChallengeVoteList: GetMyVotesOutput;
    ChallengeVoteAdminList: GetVotesByChallengeOutput;
    SubmissionVoteCount: {
      submissionId: string;
      voteCount: number;
      voteScore: number;
    };
    VotingProgress: GetChallengeVotingProgressOutput;
    JudgedStaffVotingProgress: GetJudgedStaffVotingProgressOutput;
    AdminVotingInfo: AdminVotingInfo;
    SubmitVotePayload: SubmitVoteOutput;
    SubmitVotesPayload: SubmitVotesOutput;
    ForceEndVotingPayload: ForceEndVotingOutput;

    // NotificationSchedule domain - mapped from NotificationScheduleController outputs
    NotificationSchedule: NotificationScheduleOutput;
    NotificationScheduleSummary: NotificationScheduleOutput;
    NotificationSchedulePagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    NotificationSchedulesConnection: {
      schedules: NotificationScheduleOutput[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    };
    ExecutionHistoryNotification: {
      id: string;
      title: string;
      body: string;
      createdAt: Date;
    };
    ExecutionHistoryEntry: {
      id: string;
      executedAt: Date;
      notification: {
        id: string;
        title: string;
        body: string;
        createdAt: Date;
      } | null;
    };
    ExecutionHistoryResult: {
      executions: Array<{
        id: string;
        executedAt: Date;
        notification: {
          id: string;
          title: string;
          body: string;
          createdAt: Date;
        } | null;
      }>;
    };
    CreateNotificationSchedulePayload: {
      schedule: NotificationScheduleOutput;
    };
    UpdateNotificationSchedulePayload: {
      schedule: NotificationScheduleOutput;
    };
    ToggleScheduleActivePayload: {
      schedule: NotificationScheduleOutput;
    };
    DuplicateNotificationSchedulePayload: {
      schedule: NotificationScheduleOutput;
    };
    DeleteNotificationSchedulePayload: {
      success: boolean;
      message: string;
      deletedExecutionCount?: number;
    };
    BulkDeleteNotificationSchedulesPayload: {
      success: boolean;
      deletedCount: number;
      requestedCount: number;
      notFoundIds?: string[];
    };
    BulkToggleActivePayload: {
      success: boolean;
      updatedCount: number;
    };
    UpdateLastRunPayload: {
      schedule: NotificationScheduleOutput;
    };

    // Push Subscription domain - mapped from database schema
    PushSubscription: {
      id: string;
      userId: string;
      expoPushToken: string;
      platform: string;
      createdAt: Date;
      updatedAt: Date;
    };
    MyNotificationSubscriptions: {
      subscriptions: Array<{
        id: string;
        userId: string;
        expoPushToken: string;
        platform: string;
        createdAt: Date;
        updatedAt: Date;
      }>;
    };
    SubscribeToNotificationsResult: {
      success: boolean;
      subscription?: {
        id: string;
        userId: string;
        expoPushToken: string;
        platform: string;
        createdAt: Date;
        updatedAt: Date;
      };
    };
    UnsubscribeFromNotificationsResult: {
      success: boolean;
    };

    // Location domain - mapped from LocationController outputs
    Location: {
      id: string;
      userId: string;
      latitude: number | null;
      longitude: number | null;
      accuracy: number | null;
      altitude: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
      isSharingLocation: boolean;
      timestamp: Date;
      usersToShareWith: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
      }>;
    };
    SharingUserInfo: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    };
    FriendLocation: {
      id: string;
      userId: string;
      latitude: number | null;
      longitude: number | null;
      accuracy: number | null;
      altitude: number | null;
      heading: number | null;
      speed: number | null;
      isSharingLocation: boolean;
      timestamp: Date;
      distanceKm?: number;
    };
    LocationSharingSettings: {
      isSharingLocation: boolean;
      usersToShareWith: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
      }>;
    };
    UpdateLocationPayload: {
      location: {
        id: string;
        userId: string;
        latitude: number | null;
        longitude: number | null;
        accuracy: number | null;
        altitude: number | null;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
        isSharingLocation: boolean;
        timestamp: Date;
        usersToShareWith: Array<{
          id: string;
          firstName: string | null;
          lastName: string | null;
        }>;
      };
    };
    UpdateSharingSettingsPayload: {
      settings: {
        id: string;
        userId: string;
        isSharingLocation: boolean;
        usersToShareWith: Array<{
          id: string;
          firstName: string | null;
          lastName: string | null;
        }>;
        timestamp: Date;
      };
    };
    SharingUserPayload: {
      location: {
        id: string;
        userId: string;
        isSharingLocation: boolean;
        usersToShareWith: Array<{
          id: string;
          firstName: string | null;
          lastName: string | null;
        }>;
      };
    };
    FriendsLocationsConnection: {
      locations: Array<{
        id: string;
        userId: string;
        latitude: number | null;
        longitude: number | null;
        accuracy: number | null;
        altitude: number | null;
        heading: number | null;
        speed: number | null;
        isSharingLocation: boolean;
        timestamp: Date;
        distanceKm?: number;
      }>;
      total: number;
    };
  };

  // Scalars
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
    ID: {
      Input: string;
      Output: string;
    };
  };
}

// =============================================================================
// Builder Initialization
// =============================================================================

/**
 * Pothos schema builder instance
 *
 * Configured with:
 * - Scope auth plugin for field-level authorization
 * - DataLoader plugin for N+1 query optimization
 * - Relay plugin for pagination (cursor-based)
 * - DateTime scalar from graphql-scalars
 */
export const builder = new SchemaBuilder<PothosTypes>({
  plugins: [ScopeAuthPlugin, DataLoaderPlugin, RelayPlugin],

  // Scope auth configuration
  scopeAuth: {
    // Default auth scopes initializer
    // Reads from context.authContext if pre-resolved by context factory
    authScopes: async (context) => {
      const authContext = context.authContext;
      return {
        public: true,
        authenticated: !!authContext,
        admin: authContext?.role === "ADMIN" || authContext?.role === "SERVICE",
        moderator:
          authContext?.role === "MODERATOR" ||
          authContext?.role === "ADMIN" ||
          authContext?.role === "SERVICE",
      };
    },
    // Custom unauthorized error handler to return GraphQLError with proper extensions
    unauthorizedError: (_parent, _context, _info, result) => {
      const { GraphQLError } = require("graphql");
      // Determine the error code based on the failure type
      let code = "INTERNAL_SERVER_ERROR";

      // Handle AnyAuthScopes failure type (array of failures)
      if (result.failure.kind === "AnyAuthScopes") {
        const failures = result.failure.failures || [];
        // Check if any failure is for authenticated scope
        const authFailure = failures.find(
          (f) =>
            f.kind === "AuthScope" &&
            "scope" in f &&
            f.scope === "authenticated",
        );
        if (authFailure) {
          code = "UNAUTHENTICATED";
        } else {
          // Check for admin/moderator failures
          const adminFailure = failures.find(
            (f) =>
              f.kind === "AuthScope" &&
              "scope" in f &&
              (f.scope === "admin" || f.scope === "moderator"),
          );
          if (adminFailure) {
            code = "FORBIDDEN";
          }
        }
      } else if (
        result.failure.kind === "AuthScope" &&
        result.failure.scope === "authenticated"
      ) {
        code = "UNAUTHENTICATED";
      } else if (
        result.failure.kind === "AuthScope" &&
        (result.failure.scope === "admin" ||
          result.failure.scope === "moderator")
      ) {
        code = "FORBIDDEN";
      }
      return new GraphQLError(result.message, {
        extensions: { code },
      });
    },
  },

  // Relay options for pagination
  relay: {
    clientMutationId: "omit",
    cursorType: "String",
  },
});

// =============================================================================
// Scalar Types
// =============================================================================

/**
 * Add DateTime scalar type
 *
 * Provides ISO 8601 DateTime support for GraphQL schema.
 */
builder.addScalarType("DateTime", DateTimeResolver, {});

/**
 * Add UserRole enum type
 *
 * Maps the domain UserRole enum to GraphQL enum.
 */
export const UserRoleEnum = builder.enumType("UserRole", {
  description: "User roles in the system",
  values: {
    USER: { value: "USER" as UserRole },
    MODERATOR: { value: "MODERATOR" as UserRole },
    ADMIN: { value: "ADMIN" as UserRole },
    SERVICE: { value: "SERVICE" as UserRole },
  },
});

// =============================================================================
// Query and Mutation Types
// =============================================================================

/**
 * Create the root Query type
 *
 * This will be extended by individual domain types.
 */
builder.queryType({
  description: "Root query type for fetching data",
  authScopes: {
    public: true,
  },
});

/**
 * Create the root Mutation type
 *
 * This will be extended by individual domain types.
 */
builder.mutationType({
  description: "Root mutation type for modifying data",
  authScopes: {
    authenticated: true,
  },
});

// =============================================================================
// Subscription Type (for future real-time support)
// =============================================================================

/**
 * Create the root Subscription type
 *
 * Reserved for future GraphQL subscription support
 * (currently using WebSocket-based real-time via separate endpoint).
 */
builder.subscriptionType({
  description: "Root subscription type for real-time updates",
  authScopes: {
    authenticated: true,
  },
});

// =============================================================================
// Export
// =============================================================================

export default builder;
