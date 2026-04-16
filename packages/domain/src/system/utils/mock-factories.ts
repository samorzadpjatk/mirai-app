/**
 * Mock Factories - Pre-built test entities
 *
 * Combines with TestIds to provide ready-to-use mock entities for tests.
 * Eliminates repetitive mock creation boilerplate.
 *
 * @example
 * ```typescript
 * import { Mocks, TestIds } from "@mirai-app/domain";
 *
 * // Pre-built mock entities
 * const user = Mocks.user();
 * const admin = Mocks.admin();
 * const trip = Mocks.trip();
 *
 * // With custom properties
 * const userWithEmail = Mocks.user({ email: "custom@example.com" });
 *
 * // Multiple mocks with different IDs
 * const [user1, user2] = Mocks.users(2);
 * ```
 */

// Import branded ID factories directly from source files to avoid circular dependency
// with the domain index barrel export
import { Id as UserId } from "../../user/value-objects";
import {
  Id as TripId,
  SponsorId as TripSponsorId,
} from "../../trip/value-objects";
import {
  Id as ChallengeId,
  VoteId,
  SubmissionId,
  ReportId,
} from "../../challenge/value-objects";
import { Id as ActivityId } from "../../activity/value-objects";
import { Id as LocationId } from "../../location/value-objects";
import { Id as NotificationId } from "../../notification/value-objects";
import { Id as SponsorId } from "../../sponsor/value-objects";
import { Id as RewardId } from "../../reward/value-objects";
import { TestIds } from "./test-ids";

// Note: GroupId uses generic branded ID pattern
import { createBrandedId } from "./branded-id";
const GroupId = createBrandedId("GroupId", {
  validate: (id) => id?.trim() !== "",
});

// =============================================================================
// User Mocks
// =============================================================================

/**
 * Create a mock user object
 */
export function mockUser(overrides?: {
  id?: string;
  email?: string;
  name?: string;
}): {
  id: ReturnType<typeof UserId.create>;
  email: string;
  name: string;
} {
  return {
    id: UserId.create(overrides?.id ?? TestIds.USER),
    email: overrides?.email ?? "user@example.com",
    name: overrides?.name ?? "Test User",
  };
}

/**
 * Create a mock admin user
 */
export function mockAdmin(overrides?: { id?: string; email?: string }): {
  id: ReturnType<typeof UserId.create>;
  email: string;
  role: "ADMIN";
} {
  return {
    id: UserId.create(overrides?.id ?? TestIds.ADMIN),
    email: overrides?.email ?? "admin@example.com",
    role: "ADMIN",
  };
}

/**
 * Create a mock moderator user
 */
export function mockModerator(overrides?: { id?: string; email?: string }): {
  id: ReturnType<typeof UserId.create>;
  email: string;
  role: "MODERATOR";
} {
  return {
    id: UserId.create(overrides?.id ?? TestIds.MODERATOR),
    email: overrides?.email ?? "moderator@example.com",
    role: "MODERATOR",
  };
}

/**
 * Create multiple mock users with sequential IDs
 */
export function mockUsers(count: number): Array<{
  id: ReturnType<typeof UserId.create>;
  email: string;
  name: string;
}> {
  return Array.from({ length: count }, (_, i) =>
    mockUser({
      id: `550e8400-e29b-41d4-a716-446655440${(i + 1).toString().padStart(3, "0")}`,
      email: `user${i + 1}@example.com`,
      name: `Test User ${i + 1}`,
    }),
  );
}

// =============================================================================
// Trip Mocks
// =============================================================================

/**
 * Create a mock trip object
 */
export function mockTrip(overrides?: { id?: string; name?: string }): {
  id: ReturnType<typeof TripId.create>;
  name: string;
  createdAt: Date;
} {
  return {
    id: TripId.create(overrides?.id ?? TestIds.TRIP),
    name: overrides?.name ?? "Test Trip",
    createdAt: new Date("2026-01-01"),
  };
}

// =============================================================================
// Group Mocks
// =============================================================================

/**
 * Create a mock group object
 */
export function mockGroup(overrides?: {
  id?: string;
  name?: string;
  tripId?: string;
}): {
  id: ReturnType<typeof GroupId.create>;
  name: string;
  tripId: ReturnType<typeof TripId.create>;
  coins: number;
} {
  return {
    id: GroupId.create(overrides?.id ?? TestIds.GROUP),
    name: overrides?.name ?? "Test Group",
    tripId: TripId.create(overrides?.tripId ?? TestIds.TRIP),
    coins: 0,
  };
}

// =============================================================================
// Challenge Mocks
// =============================================================================

/**
 * Create a mock challenge object
 */
export function mockChallenge(overrides?: { id?: string; title?: string }): {
  id: ReturnType<typeof ChallengeId.create>;
  title: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
} {
  return {
    id: ChallengeId.create(overrides?.id ?? TestIds.CHALLENGE),
    title: overrides?.title ?? "Test Challenge",
    status: "ACTIVE",
  };
}

// =============================================================================
// ID-Only Mocks (For when you just need IDs)
// =============================================================================

/**
 * Quick ID generators for tests
 */
export const Mocks = {
  // Full entity mocks
  user: mockUser,
  admin: mockAdmin,
  moderator: mockModerator,
  users: mockUsers,
  trip: mockTrip,
  group: mockGroup,
  challenge: mockChallenge,

  // ID-only shortcuts
  userId: (id?: string) => UserId.create(id ?? TestIds.USER),
  adminId: (id?: string) => UserId.create(id ?? TestIds.ADMIN),
  moderatorId: (id?: string) => UserId.create(id ?? TestIds.MODERATOR),
  tripId: (id?: string) => TripId.create(id ?? TestIds.TRIP),
  groupId: (id?: string) => GroupId.create(id ?? TestIds.GROUP),
  challengeId: (id?: string) => ChallengeId.create(id ?? TestIds.CHALLENGE),
};
