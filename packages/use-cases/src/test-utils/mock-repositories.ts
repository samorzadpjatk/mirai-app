import { Effect } from "effect";
import type {
  UserRepository,
  NotificationRepository,
  NotificationScheduleRepository,
  NotificationDeliveryRepository,
  LocationRepository,
  GroupRepository,
  TripRepository,
  ChallengeRepository,
  ChallengeSubmissionRepository,
  ChallengeVoteRepository,
  ActivityFeedRepository,
  CoinTransactionRepository,
  RewardRepository,
  SponsorRepository,
  SubmissionReportRepository,
} from "../ports";
import type { User, UserRole } from "@mirai-app/domain";

export function createMockUserRepository(users: User[] = []): UserRepository {
  const storage = new Map(users.map((u) => [u.id, u]));

  return {
    create: (user: User) => Effect.succeed(user),
    findById: (id: string) => Effect.succeed(storage.get(id) ?? null),
    findByAuthUserId: (authUserId: string) =>
      Effect.succeed(
        Array.from(storage.values()).find((u) => u.authUserId === authUserId) ??
          null,
      ),
    findByRole: (role: UserRole) =>
      Effect.succeed(
        Array.from(storage.values()).filter((u) => u.role === role),
      ),
    findAll: ({ limit, offset } = {}) => {
      const all = Array.from(storage.values());
      return Effect.succeed(
        limit !== undefined && offset !== undefined
          ? all.slice(offset, offset + limit)
          : all,
      );
    },
    update: (user: User) => Effect.succeed(user),
    delete: (id: string) => Effect.succeed(void storage.delete(id)),
    existsByAuthUserId: (authUserId: string) =>
      Effect.succeed(
        Array.from(storage.values()).some((u) => u.authUserId === authUserId),
      ),
  };
}
