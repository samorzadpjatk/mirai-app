import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../api/errors";

/**
 * Error code types for controller responses
 */
export type ErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "INTERNAL_SERVER_ERROR";

/**
 * Maps error messages to appropriate error codes
 */
export function mapErrorToCode(error: string): ErrorCode {
  const lowerError = error.toLowerCase();
  if (lowerError.includes("not found")) return "NOT_FOUND";
  if (
    lowerError.includes("forbidden") ||
    lowerError.includes("not a participant")
  )
    return "FORBIDDEN";
  if (lowerError.includes("unauthorized")) return "UNAUTHORIZED";
  if (lowerError.includes("internal") || lowerError.includes("failed to"))
    return "INTERNAL_SERVER_ERROR";
  return "BAD_REQUEST";
}

/**
 * Maps error code to appropriate error class
 */
function mapCodeToError(code: ErrorCode, message: string): Error {
  switch (code) {
    case "NOT_FOUND":
      return new NotFoundError(message);
    case "FORBIDDEN":
      return new ForbiddenError(message);
    case "UNAUTHORIZED":
      return new UnauthorizedError(message);
    default:
      return new BadRequestError(message);
  }
}

/**
 * Handles controller results and converts to appropriate error types
 *
 * @example
 * const result = await controller.someMethod(input);
 * return handleResult(result);
 */
export function handleResult<T>(
  result: { success: true; data: T } | { success: false; error: string },
): T {
  if (!result.success) {
    const code = mapErrorToCode(result.error);
    throw mapCodeToError(code, result.error);
  }
  return result.data;
}

/**
 * Type for controller result pattern
 */
export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Creates a controller result directly from data or error
 */
export function createControllerResult<T>(
  data: T | null,
  error?: string,
): ControllerResult<T> {
  if (error || data === null) {
    return { success: false, error: error ?? "Unknown error" };
  }
  return { success: true, data };
}

// =============================================================================
// Effect Integration (Migration Phase 4.1+)
// =============================================================================

import { Effect } from "effect";
import type { DomainError } from "@mirai-app/domain";
import {
  mapDomainErrorToHttpError,
  mapErrorToGraphQL,
} from "./effect-executor";
import type {
  UserRepository,
  NotificationRepository,
  ChallengeRepository,
  ActivityFeedRepository,
  ChallengeSubmissionRepository,
  ChallengeVoteRepository,
  CoinTransactionRepository,
  LocationRepository,
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
  TripRepository,
  GroupRepository,
} from "@mirai-app/use-cases";
import type {
  User,
  UserRole,
  Notification,
  NotificationStatus,
  NotificationPriority,
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
  ActivityId,
  ActivityFeed,
  ActivityReaction,
  ChallengeSubmission,
  SubmissionId,
  ChallengeVote,
  Location,
  LocationId,
  Reward,
  RewardId,
  RewardPurchase,
  CoinTransaction,
  PaginationOptions,
} from "@mirai-app/domain";

/**
 * Converts a Promise-based repository method to an Effect-based method.
 * This is a bridge for legacy Promise-based code that needs to integrate with Effect.
 *
 * @example
 * ```typescript
 * const effectBasedRepo = {
 *   findById: promiseToEffect(repo.findById),
 *   findAll: promiseToEffect(repo.findAll),
 * };
 * ```
 */
export function promiseToEffect<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Effect.Effect<T, never, never> {
  return (...args: Args) =>
    Effect.tryPromise({
      try: () => fn(...args),
      catch: (_e: unknown) => undefined,
    }) as Effect.Effect<T, never, never>;
}

/**
 * Effect-based UserRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectUserRepository(repo: UserRepository): UserRepository {
  return repo;
}

/**
 * Effect-based NotificationRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectNotificationRepository(
  repo: NotificationRepository,
): NotificationRepository {
  return repo;
}

/**
 * Effect-based ChallengeRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectChallengeRepository(
  repo: ChallengeRepository,
): ChallengeRepository {
  return repo;
}

/**
 * Effect-based ActivityFeedRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectActivityFeedRepository(
  repo: ActivityFeedRepository,
): ActivityFeedRepository {
  return repo;
}

/**
 * Effect-based ChallengeSubmissionRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectChallengeSubmissionRepository(
  repo: ChallengeSubmissionRepository,
): ChallengeSubmissionRepository {
  return repo;
}

/**
 * Effect-based ChallengeVoteRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectChallengeVoteRepository(
  repo: ChallengeVoteRepository,
): ChallengeVoteRepository {
  return repo;
}

/**
 * Effect-based CoinTransactionRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectCoinTransactionRepository(
  repo: CoinTransactionRepository,
): CoinTransactionRepository {
  return repo;
}

/**
 * Effect-based LocationRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectLocationRepository(
  repo: LocationRepository,
): LocationRepository {
  return repo;
}

/**
 * Effect-based RewardRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectRewardRepository(
  repo: RewardRepository,
): RewardRepository {
  return repo;
}

/**
 * Effect-based RewardPurchaseRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectRewardPurchaseRepository(
  repo: RewardPurchaseRepository,
): RewardPurchaseRepository {
  return repo;
}

/**
 * Effect-based TripPointsCalculator interface
 *
 * Services are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectTripPointsCalculator(
  calc: TripPointsCalculator,
): TripPointsCalculator {
  return calc;
}

/**
 * Effect-based GroupCoinsService interface
 *
 * Services are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectGroupCoinsService(
  service: GroupCoinsService,
): GroupCoinsService {
  return service;
}

/**
 * Effect-based TripAccessChecker interface
 *
 * Services are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectTripAccessChecker(
  checker: TripAccessChecker,
): TripAccessChecker {
  return checker;
}

/**
 * Effect-based TripRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectTripRepository(repo: TripRepository): TripRepository {
  return repo;
}

/**
 * Effect-based GroupRepository interface
 *
 * Repositories are now Effect-based (Step 4.3+), so this directly exposes
 * the Effect-returning methods.
 */
export function toEffectGroupRepository(
  repo: GroupRepository,
): GroupRepository {
  return repo;
}

/**
 * Runs an Effect and returns the result, mapping errors to HTTP errors.
 *
 * This is the Effect-based replacement for `handleResult`. Use this when
 * your use case returns Effect<A, E, never> instead of Promise<Result<T,E>>.
 *
 * @example
 * ```typescript
 * // Old Result-based pattern
 * const result = await useCase.execute(input);
 * return handleEffectResult(result);
 *
 * // New Effect-based pattern
 * const effect = useCase.execute(input);
 * return await handleEffect(effect);
 * ```
 */
export async function handleEffect<T, E extends DomainError>(
  effect: Effect.Effect<T, E, never>,
): Promise<T> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Left") {
    throw mapDomainErrorToHttpError(result.left);
  }

  return result.right;
}

/**
 * Runs an Effect and returns a ControllerResult for legacy compatibility.
 *
 * Use this during the migration period when you need to maintain the
 * ControllerResult pattern while transitioning to Effect.
 *
 * @example
 * ```typescript
 * const effect = useCase.execute(input);
 * const controllerResult = await effectToControllerResult(effect);
 * return controllerResult;
 * ```
 */
export async function effectToControllerResult<T, E extends DomainError, R = T>(
  effect: Effect.Effect<T, E, never>,
  transform?: (value: T) => R,
): Promise<ControllerResult<R>> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Left") {
    return { success: false, error: result.left.message };
  }

  const data = transform
    ? transform(result.right)
    : (result.right as unknown as R);
  return { success: true, data };
}

/**
 * Handle an Effect with async transformation.
 *
 * Similar to `handleResultAsync` but for Effect-based use cases.
 */
export async function handleEffectAsync<T, E extends DomainError, R = T>(
  effect: Effect.Effect<T, E, never>,
  transform?: (value: T) => Promise<R>,
): Promise<R> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Left") {
    throw mapDomainErrorToHttpError(result.left);
  }

  if (transform) {
    return await transform(result.right);
  }

  return result.right as unknown as R;
}

/**
 * GraphQL-specific Effect handler that maps errors to GraphQLError.
 *
 * Use this in GraphQL resolvers to maintain existing error contracts.
 *
 * @example
 * ```typescript
 * // In a resolver
 * const user = await handleEffectGraphQL(
 *   useCase.execute({ id: args.id })
 * );
 * return user;
 * ```
 */
export async function handleEffectGraphQL<T, E extends DomainError>(
  effect: Effect.Effect<T, E, never>,
): Promise<T> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Left") {
    throw mapErrorToGraphQL(result.left);
  }

  return result.right;
}
