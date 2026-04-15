/**
 * Repository Mock Factories
 *
 * Provides in-memory implementations of all repository ports for testing.
 * These mocks use Effect for composable, type-safe test doubles.
 *
 * @module repository-mocks
 *
 * @example
 * ```typescript
 * import {
 *   createUserRepositoryMock,
 *   createGroupRepositoryMock,
 * } from '@mirai-app/use-cases/test/repository-mocks';
 *
 * const testLayer = Layer.mergeAll(
 *   createUserRepositoryMock({ users: [mockUser1, mockUser2] }),
 *   createGroupRepositoryMock()
 * );
 * ```
 */

import { Effect, Layer, Ref } from "effect";
import type {
  User,
  Group,
  GroupStatus,
  Challenge,
  ChallengeSubmission,
  ChallengeVote,
  Location,
  Trip,
  Reward,
  RewardPurchase,
  Sponsor,
  Notification,
  NotificationSchedule,
  NotificationDelivery,
  CoinTransaction,
  Event,
  ActivityFeed,
  SubmissionReport,
  TripParticipant,
} from "@mirai-app/domain";
import { DatabaseError } from "../ports/errors.js";
import {
  UserRepositoryTag,
  type UserRepository,
} from "../ports/UserRepository.js";
import {
  GroupRepositoryTag,
  type GroupRepository,
} from "../ports/GroupRepository.js";
import {
  ChallengeRepositoryTag,
  type ChallengeRepository,
} from "../ports/ChallengeRepository.js";
import {
  ChallengeSubmissionRepositoryTag,
  type ChallengeSubmissionRepository,
} from "../ports/ChallengeSubmissionRepository.js";
import {
  ChallengeVoteRepositoryTag,
  type ChallengeVoteRepository,
} from "../ports/ChallengeVoteRepository.js";
import {
  LocationRepositoryTag,
  type LocationRepository,
} from "../ports/LocationRepository.js";
import {
  TripRepositoryTag,
  type TripRepository,
} from "../ports/TripRepository.js";
import {
  RewardRepositoryTag,
  RewardPurchaseRepositoryTag,
  type RewardRepository,
  type RewardPurchaseRepository,
} from "../ports/RewardRepository.js";
import {
  SponsorRepositoryTag,
  type SponsorRepository,
} from "../ports/SponsorRepository.js";
import {
  NotificationRepositoryTag,
  type NotificationRepository,
} from "../ports/NotificationRepository.js";
import {
  NotificationScheduleRepositoryTag,
  type NotificationScheduleRepository,
} from "../ports/NotificationScheduleRepository.js";
import {
  NotificationDeliveryRepositoryTag,
  type NotificationDeliveryRepository,
  type DeliveryStatus,
  type DeliveryFilters,
  type DeliveryStats,
} from "../ports/NotificationDeliveryRepository.js";
import {
  CoinTransactionRepositoryTag,
  type CoinTransactionRepository,
  type CoinTransactionFilters,
  type CoinStatistics,
  type MostActiveAdminStat,
} from "../ports/CoinTransactionRepository.js";
import {
  EventRepositoryTag,
  type EventRepository,
} from "../ports/EventRepository.js";
import {
  ActivityFeedRepositoryTag,
  type ActivityFeedRepository,
} from "../ports/ActivityFeedRepository.js";
import {
  SubmissionReportRepositoryTag,
  type SubmissionReportRepository,
} from "../ports/SubmissionReportRepository.js";
import {
  AuthPortTag,
  type AuthError,
  type InvalidTokenError,
  type SessionExpiredError,
} from "../ports/AuthPort.js";

// =============================================================================
// User Repository Mock
// =============================================================================

/**
 * Options for creating a UserRepository mock
 */
export interface UserRepositoryMockOptions {
  /** Initial users to populate the repository */
  users?: User[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory UserRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing UserRepositoryTag
 *
 * @example
 * ```typescript
 * const mockLayer = createUserRepositoryMock({
 *   users: [mockUser1, mockUser2],
 * });
 *
 * const result = await runWithTestLayer(
 *   repo.findById('user-123'),
 *   mockLayer
 * );
 * ```
 */
export function createUserRepositoryMock(
  options: UserRepositoryMockOptions = {},
): Layer.Layer<UserRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    UserRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, User>>(
        new Map(options.users?.map((u) => [u.id, u])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: UserRepository = {
        create: (user) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(user.id, user));
            return yield* failIfConfigured(user);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByAuthUserId: (authUserId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const user = Array.from(s.values()).find(
              (u) => "authUserId" in u && u.authUserId === authUserId,
            );
            return yield* failIfConfigured(user ?? null);
          }),

        findByRole: (role) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const users = Array.from(s.values()).filter(
              (u) => "role" in u && u.role === role,
            );
            return yield* failIfConfigured(users);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allUsers = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allUsers.length;
            return yield* failIfConfigured(
              allUsers.slice(offset, offset + limit),
            );
          }),

        update: (user) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(user.id, user));
            return yield* failIfConfigured(user);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        existsByAuthUserId: (authUserId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const exists = Array.from(s.values()).some(
              (u) => "authUserId" in u && u.authUserId === authUserId,
            );
            return yield* failIfConfigured(exists);
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Group Repository Mock
// =============================================================================

/**
 * Options for creating a GroupRepository mock
 */
export interface GroupRepositoryMockOptions {
  /** Initial groups to populate the repository */
  groups?: Group[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory GroupRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing GroupRepositoryTag
 */
export function createGroupRepositoryMock(
  options: GroupRepositoryMockOptions = {},
): Layer.Layer<GroupRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    GroupRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, Group>>(
        new Map(options.groups?.map((g) => [g.id, g])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: GroupRepository = {
        create: (group) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(group.id, group));
            return yield* failIfConfigured(group);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByTripId: (tripId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const groups = Array.from(s.values()).filter(
              (g) => g.tripId === tripId,
            );
            return yield* failIfConfigured(groups);
          }),

        findByStatus: (status) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const groups = Array.from(s.values()).filter(
              (g) => g.status === status,
            );
            return yield* failIfConfigured(groups);
          }),

        findByTripIdAndStatus: (tripId, status) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const groups = Array.from(s.values()).filter(
              (g) => g.tripId === tripId && g.status === status,
            );
            return yield* failIfConfigured(groups);
          }),

        findByOrganizerId: (organizerId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const groups = Array.from(s.values()).filter(
              (g) => g.organizerId === organizerId,
            );
            return yield* failIfConfigured(groups);
          }),

        findByCode: (code) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const group = Array.from(s.values()).find((g) => g.code === code);
            return yield* failIfConfigured(group ?? null);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allGroups = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allGroups.length;
            return yield* failIfConfigured(
              allGroups.slice(offset, offset + limit),
            );
          }),

        update: (group) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(group.id, group));
            return yield* failIfConfigured(group);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),

        countByTripId: (tripId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const count = Array.from(s.values()).filter(
              (g) => g.tripId === tripId,
            ).length;
            return yield* failIfConfigured(count);
          }),

        findParticipantByUserIdAndTripId: (_userId, _tripId) =>
          Effect.gen(function* () {
            // Simplified mock implementation - returns null
            return yield* failIfConfigured(null);
          }),

        findParticipantsByGroupId: (_groupId) =>
          Effect.gen(function* () {
            // Simplified mock implementation - returns empty array
            return yield* failIfConfigured([]);
          }),

        assignUserToGroup: (_userId, _groupId) =>
          Effect.gen(function* () {
            // Simplified mock implementation - would update participant in real scenario
            return yield* failIfConfigured(null as unknown as TripParticipant);
          }),

        removeUserFromGroup: (_userId, _groupId) =>
          Effect.gen(function* () {
            // Simplified mock implementation - would update participant in real scenario
            return yield* failIfConfigured(null as unknown as TripParticipant);
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Challenge Repository Mock
// =============================================================================

/**
 * Options for creating a ChallengeRepository mock
 */
export interface ChallengeRepositoryMockOptions {
  /** Initial challenges to populate the repository */
  challenges?: Challenge[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory ChallengeRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing ChallengeRepositoryTag
 */
export function createChallengeRepositoryMock(
  options: ChallengeRepositoryMockOptions = {},
): Layer.Layer<ChallengeRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    ChallengeRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, Challenge>>(
        new Map(options.challenges?.map((c) => [c.id, c])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: ChallengeRepository = {
        create: (challenge) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(challenge.id, challenge),
            );
            return yield* failIfConfigured(challenge);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByTripId: (tripId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const challenges = Array.from(s.values()).filter(
              (c) => "tripId" in c && c.tripId === tripId,
            );
            return yield* failIfConfigured(challenges);
          }),

        findByStatus: (status) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const challenges = Array.from(s.values()).filter(
              (c) => "status" in c && c.status === status,
            );
            return yield* failIfConfigured(challenges);
          }),

        findByTripIdAndStatus: (tripId, status) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const challenges = Array.from(s.values()).filter(
              (c) =>
                "tripId" in c &&
                c.tripId === tripId &&
                "status" in c &&
                c.status === status,
            );
            return yield* failIfConfigured(challenges);
          }),

        findBySubmissionType: (type) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const challenges = Array.from(s.values()).filter(
              (c) => "submissionType" in c && c.submissionType === type,
            );
            return yield* failIfConfigured(challenges);
          }),

        findByScoringCategory: (category) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const challenges = Array.from(s.values()).filter(
              (c) => "scoringCategory" in c && c.scoringCategory === category,
            );
            return yield* failIfConfigured(challenges);
          }),

        findActive: () =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const challenges = Array.from(s.values()).filter(
              (c) => "status" in c && c.status === "ACTIVE",
            );
            return yield* failIfConfigured(challenges);
          }),

        findOpenForSubmission: () =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const now = new Date();
            const challenges = Array.from(s.values()).filter(
              (c) =>
                "status" in c &&
                c.status === "ACTIVE" &&
                "startTime" in c &&
                c.startTime &&
                c.startTime <= now &&
                "endTime" in c &&
                c.endTime &&
                c.endTime >= now,
            );
            return yield* failIfConfigured(challenges);
          }),

        findRecurring: () =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const challenges = Array.from(s.values()).filter(
              (c) => "isRecurring" in c && c.isRecurring === true,
            );
            return yield* failIfConfigured(challenges);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allChallenges = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allChallenges.length;
            return yield* failIfConfigured(
              allChallenges.slice(offset, offset + limit),
            );
          }),

        update: (challenge) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(challenge.id, challenge),
            );
            return yield* failIfConfigured(challenge);
          }),

        updateStatus: (id, status) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const existing = s.get(id);
            if (!existing) {
              return yield* Effect.fail(
                options.error ??
                  new DatabaseError({
                    operation: "updateStatus",
                    message: `Challenge with id ${id} not found`,
                  }),
              );
            }
            const updated = { ...existing, status };
            yield* Ref.update(state, (stateMap) =>
              new Map(stateMap).set(id, updated),
            );
            return yield* failIfConfigured(updated);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),

        countByTripId: (tripId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const count = Array.from(s.values()).filter(
              (c) => "tripId" in c && c.tripId === tripId,
            ).length;
            return yield* failIfConfigured(count);
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Challenge Submission Repository Mock
// =============================================================================

/**
 * Options for creating a ChallengeSubmissionRepository mock
 */
export interface ChallengeSubmissionRepositoryMockOptions {
  /** Initial submissions to populate the repository */
  submissions?: ChallengeSubmission[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory ChallengeSubmissionRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing ChallengeSubmissionRepositoryTag
 */
export function createChallengeSubmissionRepositoryMock(
  options: ChallengeSubmissionRepositoryMockOptions = {},
): Layer.Layer<ChallengeSubmissionRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    ChallengeSubmissionRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, ChallengeSubmission>>(
        new Map(options.submissions?.map((s) => [s.id, s])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: ChallengeSubmissionRepository = {
        create: (submission) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(submission.id, submission),
            );
            return yield* failIfConfigured(submission);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByChallengeAndGroup: (challengeId, groupId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const submission = Array.from(s.values()).find(
              (sub) =>
                sub.challengeId === challengeId && sub.groupId === groupId,
            );
            return yield* failIfConfigured(submission ?? null);
          }),

        findByChallengeId: (challengeId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const submissions = Array.from(s.values()).filter(
              (sub) => sub.challengeId === challengeId,
            );
            return yield* failIfConfigured(submissions);
          }),

        findByGroupId: (groupId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const submissions = Array.from(s.values()).filter(
              (sub) => sub.groupId === groupId,
            );
            return yield* failIfConfigured(submissions);
          }),

        findByStatus: (status) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const submissions = Array.from(s.values()).filter(
              (sub) => sub.status === status,
            );
            return yield* failIfConfigured(submissions);
          }),

        findMany: (params) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            let submissions = Array.from(s.values());

            if (params.challengeId) {
              submissions = submissions.filter(
                (sub) => sub.challengeId === params.challengeId,
              );
            }
            if (params.groupId) {
              submissions = submissions.filter(
                (sub) => sub.groupId === params.groupId,
              );
            }
            if (params.status) {
              submissions = submissions.filter(
                (sub) => sub.status === params.status,
              );
            }

            const offset = params.offset ?? 0;
            const limit = params.limit ?? submissions.length;
            submissions = submissions.slice(offset, offset + limit);

            return yield* failIfConfigured(submissions);
          }),

        update: (submission) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(submission.id, submission),
            );
            return yield* failIfConfigured(submission);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        existsForChallengeAndGroup: (challengeId, groupId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const exists = Array.from(s.values()).some(
              (sub) =>
                sub.challengeId === challengeId && sub.groupId === groupId,
            );
            return yield* failIfConfigured(exists);
          }),

        countByChallengeId: (challengeId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const count = Array.from(s.values()).filter(
              (sub) => sub.challengeId === challengeId,
            ).length;
            return yield* failIfConfigured(count);
          }),

        countByChallengeAndStatus: (challengeId, status) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const count = Array.from(s.values()).filter(
              (sub) => sub.challengeId === challengeId && sub.status === status,
            ).length;
            return yield* failIfConfigured(count);
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Challenge Vote Repository Mock
// =============================================================================

/**
 * Options for creating a ChallengeVoteRepository mock
 */
export interface ChallengeVoteRepositoryMockOptions {
  /** Initial votes to populate the repository */
  votes?: ChallengeVote[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory ChallengeVoteRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing ChallengeVoteRepositoryTag
 */
export function createChallengeVoteRepositoryMock(
  options: ChallengeVoteRepositoryMockOptions = {},
): Layer.Layer<ChallengeVoteRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    ChallengeVoteRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, ChallengeVote>>(
        new Map(options.votes?.map((v) => [v.id, v])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: ChallengeVoteRepository = {
        create: (vote) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(vote.id, vote));
            return yield* failIfConfigured(vote);
          }),

        createMany: (votes) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              votes.forEach((vote) => newState.set(vote.id, vote));
              return newState;
            });
            return yield* failIfConfigured(votes);
          }),

        findById: (id: string) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByChallengeId: (challengeId: string) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const votes = Array.from(s.values()).filter(
              (v) => v.challengeId === challengeId,
            );
            return yield* failIfConfigured(votes);
          }),

        findByChallengeAndVoter: (challengeId: string, voterId: string) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const votes = Array.from(s.values()).filter(
              (v) => v.challengeId === challengeId && v.voterId === voterId,
            );
            return yield* failIfConfigured(votes);
          }),

        findBySubmissionId: (submissionId: string) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const votes = Array.from(s.values()).filter(
              (v) => v.submissionId === submissionId,
            );
            return yield* failIfConfigured(votes);
          }),

        hasVoted: (challengeId: string, voterId: string) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const hasVoted = Array.from(s.values()).some(
              (v) => v.challengeId === challengeId && v.voterId === voterId,
            );
            return yield* failIfConfigured(hasVoted);
          }),

        hasVotedForPosition: (
          challengeId: string,
          voterId: string,
          position: number,
        ) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const hasVoted = Array.from(s.values()).some(
              (v) =>
                v.challengeId === challengeId &&
                v.voterId === voterId &&
                v.position.value === position,
            );
            return yield* failIfConfigured(hasVoted);
          }),

        getVotedPositions: (challengeId: string, voterId: string) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const positions = Array.from(s.values())
              .filter(
                (v) => v.challengeId === challengeId && v.voterId === voterId,
              )
              .map((v) => v.position.value);
            return yield* failIfConfigured(positions);
          }),

        delete: (id: string) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        deleteByChallengeId: (challengeId: string) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              Array.from(newState.values())
                .filter((v) => v.challengeId === challengeId)
                .forEach((v) => newState.delete(v.id));
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Location Repository Mock
// =============================================================================

/**
 * Options for creating a LocationRepository mock
 */
export interface LocationRepositoryMockOptions {
  /** Initial locations to populate the repository */
  locations?: Location[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory LocationRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing LocationRepositoryTag
 */
export function createLocationRepositoryMock(
  options: LocationRepositoryMockOptions = {},
): Layer.Layer<LocationRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    LocationRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, Location>>(
        new Map(options.locations?.map((l) => [l.id, l])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: LocationRepository = {
        create: (location) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(location.id, location),
            );
            return yield* failIfConfigured(location);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByTripId: (tripId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const locations = Array.from(s.values()).filter(
              (l) => "tripId" in l && l.tripId === tripId,
            );
            return yield* failIfConfigured(locations);
          }),

        findByGroupId: (groupId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const locations = Array.from(s.values()).filter(
              (l) => "groupId" in l && l.groupId === groupId,
            );
            return yield* failIfConfigured(locations);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allLocations = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allLocations.length;
            return yield* failIfConfigured(
              allLocations.slice(offset, offset + limit),
            );
          }),

        update: (location) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(location.id, location),
            );
            return yield* failIfConfigured(location);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Trip Repository Mock
// =============================================================================

/**
 * Options for creating a TripRepository mock
 */
export interface TripRepositoryMockOptions {
  /** Initial trips to populate the repository */
  trips?: Trip[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory TripRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing TripRepositoryTag
 */
export function createTripRepositoryMock(
  options: TripRepositoryMockOptions = {},
): Layer.Layer<TripRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    TripRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, Trip>>(
        new Map(options.trips?.map((t) => [t.id, t])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: TripRepository = {
        create: (trip) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(trip.id, trip));
            return yield* failIfConfigured(trip);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allTrips = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allTrips.length;
            return yield* failIfConfigured(
              allTrips.slice(offset, offset + limit),
            );
          }),

        update: (trip) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(trip.id, trip));
            return yield* failIfConfigured(trip);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Reward Repository Mock
// =============================================================================

/**
 * Options for creating a RewardRepository mock
 */
export interface RewardRepositoryMockOptions {
  /** Initial rewards to populate the repository */
  rewards?: Reward[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory RewardRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing RewardRepositoryTag
 */
export function createRewardRepositoryMock(
  options: RewardRepositoryMockOptions = {},
): Layer.Layer<RewardRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    RewardRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, Reward>>(
        new Map(options.rewards?.map((r) => [r.id, r])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: RewardRepository = {
        create: (reward) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(reward.id, reward));
            return yield* failIfConfigured(reward);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByTripId: (tripId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const rewards = Array.from(s.values()).filter(
              (r) => "tripId" in r && r.tripId === tripId,
            );
            return yield* failIfConfigured(rewards);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allRewards = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allRewards.length;
            return yield* failIfConfigured(
              allRewards.slice(offset, offset + limit),
            );
          }),

        update: (reward) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(reward.id, reward));
            return yield* failIfConfigured(reward);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Reward Purchase Repository Mock
// =============================================================================

/**
 * Options for creating a RewardPurchaseRepository mock
 */
export interface RewardPurchaseRepositoryMockOptions {
  /** Initial purchases to populate the repository */
  purchases?: RewardPurchase[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory RewardPurchaseRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing RewardPurchaseRepositoryTag
 */
export function createRewardPurchaseRepositoryMock(
  options: RewardPurchaseRepositoryMockOptions = {},
): Layer.Layer<RewardPurchaseRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    RewardPurchaseRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, RewardPurchase>>(
        new Map(options.purchases?.map((p) => [p.id, p])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: RewardPurchaseRepository = {
        create: (purchase) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(purchase.id, purchase),
            );
            return yield* failIfConfigured(purchase);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByUserId: (userId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const purchases = Array.from(s.values()).filter(
              (p) => "userId" in p && p.userId === userId,
            );
            return yield* failIfConfigured(purchases);
          }),

        findByRewardId: (rewardId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const purchases = Array.from(s.values()).filter(
              (p) => "rewardId" in p && p.rewardId === rewardId,
            );
            return yield* failIfConfigured(purchases);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allPurchases = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allPurchases.length;
            return yield* failIfConfigured(
              allPurchases.slice(offset, offset + limit),
            );
          }),

        update: (purchase) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(purchase.id, purchase),
            );
            return yield* failIfConfigured(purchase);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Sponsor Repository Mock
// =============================================================================

/**
 * Options for creating a SponsorRepository mock
 */
export interface SponsorRepositoryMockOptions {
  /** Initial sponsors to populate the repository */
  sponsors?: Sponsor[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory SponsorRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing SponsorRepositoryTag
 */
export function createSponsorRepositoryMock(
  options: SponsorRepositoryMockOptions = {},
): Layer.Layer<SponsorRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    SponsorRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, Sponsor>>(
        new Map(options.sponsors?.map((s) => [s.id, s])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: SponsorRepository = {
        create: (sponsor) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(sponsor.id, sponsor),
            );
            return yield* failIfConfigured(sponsor);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allSponsors = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allSponsors.length;
            return yield* failIfConfigured(
              allSponsors.slice(offset, offset + limit),
            );
          }),

        update: (sponsor) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(sponsor.id, sponsor),
            );
            return yield* failIfConfigured(sponsor);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Notification Repository Mock
// =============================================================================

/**
 * Options for creating a NotificationRepository mock
 */
export interface NotificationRepositoryMockOptions {
  /** Initial notifications to populate the repository */
  notifications?: Notification[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory NotificationRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing NotificationRepositoryTag
 */
export function createNotificationRepositoryMock(
  options: NotificationRepositoryMockOptions = {},
): Layer.Layer<NotificationRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    NotificationRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, Notification>>(
        new Map(options.notifications?.map((n) => [n.id, n])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: NotificationRepository = {
        create: (notification) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(notification.id, notification),
            );
            return yield* failIfConfigured(notification);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByUserId: (userId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const notifications = Array.from(s.values()).filter(
              (n) => "userId" in n && n.userId === userId,
            );
            return yield* failIfConfigured(notifications);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allNotifications = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allNotifications.length;
            return yield* failIfConfigured(
              allNotifications.slice(offset, offset + limit),
            );
          }),

        update: (notification) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(notification.id, notification),
            );
            return yield* failIfConfigured(notification);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Notification Schedule Repository Mock
// =============================================================================

/**
 * Options for creating a NotificationScheduleRepository mock
 */
export interface NotificationScheduleRepositoryMockOptions {
  /** Initial schedules to populate the repository */
  schedules?: NotificationSchedule[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory NotificationScheduleRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing NotificationScheduleRepositoryTag
 */
export function createNotificationScheduleRepositoryMock(
  options: NotificationScheduleRepositoryMockOptions = {},
): Layer.Layer<NotificationScheduleRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    NotificationScheduleRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, NotificationSchedule>>(
        new Map(options.schedules?.map((s) => [s.id, s])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: NotificationScheduleRepository = {
        create: (schedule) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(schedule.id, schedule),
            );
            return yield* failIfConfigured(schedule);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByNotificationId: (notificationId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const schedules = Array.from(s.values()).filter(
              (sched) => sched.notificationId === notificationId,
            );
            return yield* failIfConfigured(schedules);
          }),

        findUpcoming: () =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const now = new Date();
            const schedules = Array.from(s.values()).filter(
              (sched) => new Date(sched.scheduledAt) > now && sched.isActive,
            );
            return yield* failIfConfigured(schedules);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allSchedules = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allSchedules.length;
            return yield* failIfConfigured(
              allSchedules.slice(offset, offset + limit),
            );
          }),

        update: (schedule) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(schedule.id, schedule),
            );
            return yield* failIfConfigured(schedule);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),

        updateLastRun: (id, lastRunAt) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const existing = s.get(id);
            if (existing) {
              const updated = { ...existing, lastRunAt };
              yield* Ref.update(state, (stateMap) =>
                new Map(stateMap).set(id, updated),
              );
            }
            return yield* failIfConfigured(undefined);
          }),

        recordExecution: (_scheduleId, _record) =>
          Effect.gen(function* () {
            // In-memory implementation - just succeed
            return yield* failIfConfigured(undefined);
          }),

        getExecutionHistory: (scheduleId, _opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const schedule = s.get(scheduleId);
            return yield* failIfConfigured(schedule?.executionHistory ?? []);
          }),

        bulkDelete: (ids) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              ids.forEach((id) => newState.delete(id));
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        bulkToggleActive: (ids, isActive) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              ids.forEach((id) => {
                const existing = s.get(id);
                if (existing) {
                  newState.set(id, { ...existing, isActive });
                }
              });
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Notification Delivery Repository Mock
// =============================================================================

/**
 * Options for creating a NotificationDeliveryRepository mock
 */
export interface NotificationDeliveryRepositoryMockOptions {
  /** Initial deliveries to populate the repository */
  deliveries?: NotificationDelivery[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory NotificationDeliveryRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing NotificationDeliveryRepositoryTag
 */
export function createNotificationDeliveryRepositoryMock(
  options: NotificationDeliveryRepositoryMockOptions = {},
): Layer.Layer<NotificationDeliveryRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    NotificationDeliveryRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, NotificationDelivery>>(
        new Map(options.deliveries?.map((d) => [d.id, d])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: NotificationDeliveryRepository = {
        create: (delivery) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(delivery.id, delivery),
            );
            return yield* failIfConfigured(delivery);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByNotificationId: (notificationId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const deliveries = Array.from(s.values()).filter(
              (d) => d.notificationId === notificationId,
            );
            return yield* failIfConfigured(deliveries);
          }),

        findByUserId: (userId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const deliveries = Array.from(s.values()).filter(
              (d) => "userId" in d && d.userId === userId,
            );
            return yield* failIfConfigured(deliveries);
          }),

        findByStatus: (status: DeliveryStatus) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const deliveries = Array.from(s.values()).filter(
              (d) => d.status === status,
            );
            return yield* failIfConfigured(deliveries);
          }),

        findFailed: () =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const deliveries = Array.from(s.values()).filter(
              (d) => d.status === "FAILED",
            );
            return yield* failIfConfigured(deliveries);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allDeliveries = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allDeliveries.length;
            return yield* failIfConfigured(
              allDeliveries.slice(offset, offset + limit),
            );
          }),

        update: (delivery) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(delivery.id, delivery),
            );
            return yield* failIfConfigured(delivery);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),

        updateStatus: (id, status) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const existing = s.get(id);
            if (existing) {
              const updated = { ...existing, status };
              yield* Ref.update(state, (stateMap) =>
                new Map(stateMap).set(id, updated),
              );
            }
            return yield* failIfConfigured(undefined);
          }),

        findByFilters: (_filters: DeliveryFilters) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            // Simplified - just return all for now
            return yield* failIfConfigured(Array.from(s.values()));
          }),

        getStats: (): Effect.Effect<DeliveryStats, DatabaseError, never> =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const deliveries = Array.from(s.values());
            const stats: DeliveryStats = {
              total: deliveries.length,
              byStatus: {
                PENDING: deliveries.filter((d) => d.status === "PENDING")
                  .length,
                SENT: deliveries.filter((d) => d.status === "SENT").length,
                DELIVERED: deliveries.filter((d) => d.status === "DELIVERED")
                  .length,
                FAILED: deliveries.filter((d) => d.status === "FAILED").length,
                RETRYING: deliveries.filter((d) => d.status === "RETRYING")
                  .length,
              },
            };
            return yield* failIfConfigured(stats);
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Coin Transaction Repository Mock
// =============================================================================

/**
 * Options for creating a CoinTransactionRepository mock
 */
export interface CoinTransactionRepositoryMockOptions {
  /** Initial transactions to populate the repository */
  transactions?: CoinTransaction[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory CoinTransactionRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing CoinTransactionRepositoryTag
 */
export function createCoinTransactionRepositoryMock(
  options: CoinTransactionRepositoryMockOptions = {},
): Layer.Layer<CoinTransactionRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    CoinTransactionRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, CoinTransaction>>(
        new Map(options.transactions?.map((t) => [t.id, t])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: CoinTransactionRepository = {
        create: (transaction) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(transaction.id, transaction),
            );
            return yield* failIfConfigured(transaction);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByUserId: (userId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const transactions = Array.from(s.values()).filter(
              (t) => "userId" in t && t.userId === userId,
            );
            return yield* failIfConfigured(transactions);
          }),

        findByFilters: (_filters: CoinTransactionFilters, opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allTransactions = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allTransactions.length;
            return yield* failIfConfigured(
              allTransactions.slice(offset, offset + limit),
            );
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allTransactions = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allTransactions.length;
            return yield* failIfConfigured(
              allTransactions.slice(offset, offset + limit),
            );
          }),

        update: (transaction) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(transaction.id, transaction),
            );
            return yield* failIfConfigured(transaction);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),

        getBalance: (userId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const transactions = Array.from(s.values()).filter(
              (t) => "userId" in t && t.userId === userId,
            );
            const balance = transactions.reduce((sum, t) => {
              const amount = "amount" in t ? (t.amount as number) : 0;
              return sum + amount;
            }, 0);
            return yield* failIfConfigured(balance);
          }),

        getStatistics: (): Effect.Effect<
          CoinStatistics,
          DatabaseError,
          never
        > =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const transactions = Array.from(s.values());
            const stats: CoinStatistics = {
              totalTransactions: transactions.length,
              totalCoinsTransferred: transactions.reduce((sum, t) => {
                const amount = "amount" in t ? Math.abs(t.amount as number) : 0;
                return sum + amount;
              }, 0),
            };
            return yield* failIfConfigured(stats);
          }),

        getMostActiveAdmins: (
          _opts,
        ): Effect.Effect<MostActiveAdminStat[], DatabaseError, never> =>
          Effect.gen(function* () {
            // Simplified implementation
            return yield* failIfConfigured([]);
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Event Repository Mock
// =============================================================================

/**
 * Options for creating an EventRepository mock
 */
export interface EventRepositoryMockOptions {
  /** Initial events to populate the repository */
  events?: Event[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory EventRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing EventRepositoryTag
 */
export function createEventRepositoryMock(
  options: EventRepositoryMockOptions = {},
): Layer.Layer<EventRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    EventRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, Event>>(
        new Map(options.events?.map((e) => [e.id, e])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: EventRepository = {
        create: (event) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(event.id, event));
            return yield* failIfConfigured(event);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByTripId: (tripId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const events = Array.from(s.values()).filter(
              (e) => "tripId" in e && e.tripId === tripId,
            );
            return yield* failIfConfigured(events);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allEvents = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allEvents.length;
            return yield* failIfConfigured(
              allEvents.slice(offset, offset + limit),
            );
          }),

        update: (event) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(event.id, event));
            return yield* failIfConfigured(event);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Activity Feed Repository Mock
// =============================================================================

/**
 * Options for creating an ActivityFeedRepository mock
 */
export interface ActivityFeedRepositoryMockOptions {
  /** Initial activities to populate the repository */
  activities?: ActivityFeed[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory ActivityFeedRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing ActivityFeedRepositoryTag
 */
export function createActivityFeedRepositoryMock(
  options: ActivityFeedRepositoryMockOptions = {},
): Layer.Layer<ActivityFeedRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    ActivityFeedRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, ActivityFeed>>(
        new Map(options.activities?.map((a) => [a.id, a])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: ActivityFeedRepository = {
        create: (activity) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(activity.id, activity),
            );
            return yield* failIfConfigured(activity);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findByTripId: (tripId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const activities = Array.from(s.values()).filter(
              (a) => "tripId" in a && a.tripId === tripId,
            );
            return yield* failIfConfigured(activities);
          }),

        findByUserId: (userId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const activities = Array.from(s.values()).filter(
              (a) => "userId" in a && a.userId === userId,
            );
            return yield* failIfConfigured(activities);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allActivities = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allActivities.length;
            return yield* failIfConfigured(
              allActivities.slice(offset, offset + limit),
            );
          }),

        update: (activity) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) =>
              new Map(s).set(activity.id, activity),
            );
            return yield* failIfConfigured(activity);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// Submission Report Repository Mock
// =============================================================================

/**
 * Options for creating a SubmissionReportRepository mock
 */
export interface SubmissionReportRepositoryMockOptions {
  /** Initial reports to populate the repository */
  reports?: SubmissionReport[];
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: DatabaseError;
}

/**
 * Creates an in-memory SubmissionReportRepository mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing SubmissionReportRepositoryTag
 */
export function createSubmissionReportRepositoryMock(
  options: SubmissionReportRepositoryMockOptions = {},
): Layer.Layer<SubmissionReportRepository, never, never> {
  const defaultError = new DatabaseError({
    operation: "mock",
    message: "Simulated database error",
  });

  return Layer.effect(
    SubmissionReportRepositoryTag,
    Effect.gen(function* () {
      const state = yield* Ref.make<Map<string, SubmissionReport>>(
        new Map(options.reports?.map((r) => [r.id, r])),
      );

      const failIfConfigured = <T>(
        success: T,
      ): Effect.Effect<T, DatabaseError, never> => {
        if (options.shouldFail) {
          return Effect.fail(options.error ?? defaultError);
        }
        return Effect.succeed(success);
      };

      const implementation: SubmissionReportRepository = {
        create: (report) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(report.id, report));
            return yield* failIfConfigured(report);
          }),

        findById: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.get(id) ?? null);
          }),

        findBySubmissionId: (submissionId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const reports = Array.from(s.values()).filter(
              (r) => r.submissionId === submissionId,
            );
            return yield* failIfConfigured(reports);
          }),

        findByReporterId: (reporterId) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const reports = Array.from(s.values()).filter(
              (r) => r.reporterId === reporterId,
            );
            return yield* failIfConfigured(reports);
          }),

        findAll: (opts) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            const allReports = Array.from(s.values());
            const offset = opts?.offset ?? 0;
            const limit = opts?.limit ?? allReports.length;
            return yield* failIfConfigured(
              allReports.slice(offset, offset + limit),
            );
          }),

        update: (report) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => new Map(s).set(report.id, report));
            return yield* failIfConfigured(report);
          }),

        delete: (id) =>
          Effect.gen(function* () {
            yield* Ref.update(state, (s) => {
              const newState = new Map(s);
              newState.delete(id);
              return newState;
            });
            return yield* failIfConfigured(undefined);
          }),

        exists: (id) =>
          Effect.gen(function* () {
            const s = yield* Ref.get(state);
            return yield* failIfConfigured(s.has(id));
          }),
      };

      return implementation;
    }),
  );
}

// =============================================================================
// AuthPort Mock
// =============================================================================

// Need to import AuthContext type at the top level - already imported in main imports

/**
 * Options for creating an AuthPort mock
 */
export interface AuthPortMockOptions {
  /** Auth context to return on successful validation */
  authContext?: AuthContext;
  /** Simulate failures for all operations */
  shouldFail?: boolean;
  /** Error to throw when shouldFail is true */
  error?: AuthError | InvalidTokenError | SessionExpiredError;
  /** Custom validateToken implementation */
  validateToken?: (
    token: string,
  ) => Effect.Effect<
    AuthContext,
    AuthError | InvalidTokenError | SessionExpiredError,
    never
  >;
  /** Custom refreshSession implementation */
  refreshSession?: (
    sessionId: string,
  ) => Effect.Effect<AuthContext, AuthError | SessionExpiredError, never>;
}

/**
 * Default mock auth context
 */
const defaultAuthContext: AuthContext = {
  userId: "mock-user-id",
  role: "user",
  authenticatedAt: new Date("2024-01-01"),
  sessionId: "mock-session-id",
};

/**
 * Creates an AuthPort mock as a Layer.
 *
 * @param options - Configuration options for the mock
 * @returns Layer providing AuthPortTag
 *
 * @example
 * ```typescript
 * const mockLayer = createAuthPortMock({
 *   authContext: { userId: "user-123", role: "admin", authenticatedAt: new Date(), sessionId: "session-123" },
 * });
 *
 * const result = await runWithTestLayer(
 *   authenticateUserUseCase({ token: "valid-token" }),
 *   mockLayer
 * );
 * ```
 */
export function createAuthPortMock(
  options: AuthPortMockOptions = {},
): Layer.Layer<
  {
    validateToken: (
      token: string,
    ) => Effect.Effect<
      AuthContext,
      AuthError | InvalidTokenError | SessionExpiredError,
      never
    >;
    refreshSession: (
      sessionId: string,
    ) => Effect.Effect<AuthContext, AuthError | SessionExpiredError, never>;
  },
  never,
  never
> {
  return Layer.succeed(AuthPortTag, {
    validateToken: options.validateToken
      ? options.validateToken
      : (_token: string) => {
          if (options.shouldFail) {
            return Effect.fail(
              options.error ??
                (new (class extends Error {
                  readonly _tag = "AuthError" as const;
                  readonly code = "AUTH_ERROR" as const;
                  constructor() {
                    super("Mock auth error");
                  }
                })() as AuthError),
            );
          }
          return Effect.succeed(options.authContext ?? defaultAuthContext);
        },
    refreshSession: options.refreshSession
      ? options.refreshSession
      : (sessionId: string) => {
          if (options.shouldFail) {
            return Effect.fail(
              options.error ??
                (new (class extends Error {
                  readonly _tag = "SessionExpiredError" as const;
                  readonly code = "SESSION_EXPIRED" as const;
                  readonly sessionId = sessionId;
                  readonly expiredAt = new Date();
                  constructor() {
                    super(`Session '${sessionId}' has expired`);
                  }
                })() as SessionExpiredError),
            );
          }
          return Effect.succeed({
            ...(options.authContext ?? defaultAuthContext),
            sessionId,
          });
        },
  });
}
