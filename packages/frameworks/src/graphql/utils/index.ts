/**
 * GraphQL Utilities Index
 *
 * Central export point for all GraphQL utility functions and helpers
 * in the backend-server package.
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   getController,
 *   ControllersFrom,
 *   requireAuth,
 *   throwUnauthenticated,
 * } from "@/graphql/utils";
 * ```
 *
 * @module utils
 */

// =============================================================================
// Resolver Helpers (Effect-based controller access)
// =============================================================================

export {
  /** Generic type-safe controller accessor */
  getController,
  /** Convenient controller access shortcuts for all 17 controllers */
  ControllersFrom,
  /** Controller types for resolver type annotations */
  type Controllers,
  type UserController,
  type TripController,
  type ChallengeController,
  type GroupController,
  type LocationController,
  type NotificationController,
  type NotificationScheduleController,
  type NotificationDeliveryController,
  type ChallengeSubmissionController,
  type ChallengeVoteController,
  type ActivityFeedController,
  type RewardController,
  type CoinController,
  type CoinTransactionController,
  type SponsorController,
  type SubmissionReportController,
  type StorageController,
} from "./resolver-helpers";

// =============================================================================
// Auth Helpers
// =============================================================================

export {
  /** Require authentication - throws if not authenticated (async) */
  requireAuth,
  /** Require admin role - throws if not admin (async) */
  requireAdmin,
  /** Require moderator or admin role (async) */
  requireModerator,
  /** Get optional auth context - returns null if not authenticated (async) */
  getOptionalAuth,
  /** Check if user is authenticated (async) */
  isAuthenticated,
  /** Get current user ID - throws if not authenticated (async) */
  getCurrentUserId,
  /** Require authentication (Effect version) */
  requireAuthEffect,
  /** Require admin role (Effect version) */
  requireAdminEffect,
  /** Require moderator role (Effect version) */
  requireModeratorEffect,
  /** Get optional auth (Effect version) */
  getOptionalAuthEffect,
  /** Check authentication (Effect version) */
  isAuthenticatedEffect,
  /** Get current user ID (Effect version) */
  getCurrentUserIdEffect,
  /** Authentication error for Effect workflows */
  AuthError,
  /** Authorization error for Effect workflows */
  ForbiddenError,
  /** Convert Effect errors to GraphQL errors */
  mapEffectErrorToGraphQL,
} from "./auth-helpers";

// =============================================================================
// Error Mapping
// =============================================================================

export {
  /** Map domain errors to GraphQL errors */
  mapErrorToGraphQL,
  /** Throw unauthenticated error */
  throwUnauthenticated,
  /** Throw forbidden error */
  throwForbidden,
  /** GraphQL error codes */
  type GraphQLErrorCode,
} from "./error-mapper";
