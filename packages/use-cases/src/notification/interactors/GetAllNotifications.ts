import { Data, Effect } from "effect";
import { TripId, UserId } from "@mirai-app/domain";
import { NotificationPortTag } from "../ports/NotificationPort";
import { UserPortTag } from "../../user/ports/UserPort";

/**
 * Invalid pagination error
 */
export class InvalidPaginationError extends Data.TaggedError(
  "InvalidPaginationError",
)<{
  reason: string;
}> {}

/**
 * Input for GetAllNotificationsUseCase
 */
export interface GetAllNotificationsInput {
  tripId?: TripId;
  limit: number;
  offset: number;
}

/**
 * Get All Notifications Use Case (Admin)
 *
 * Retrieves all notifications with pagination for admin users.
 * Populates all DTO fields within the use case - no adapter hydration.
 */
export class GetAllNotificationsUseCase {
  execute(input: GetAllNotificationsInput) {
    return Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;
      const userPort = yield* UserPortTag;

      const result = yield* notificationPort.findPaginated({
        tripId: input.tripId ? TripId.toString(input.tripId) : undefined,
        limit: input.limit,
        offset: input.offset,
      });

      if (result.notifications.length === 0) {
        return {
          notifications: [],
          pagination: {
            total: result.total,
            limit: input.limit,
            offset: input.offset,
            hasMore: result.hasMore,
          },
        };
      }

      const notificationIds = result.notifications.map((n) => n.id);

      const pushesResults = yield* Effect.all(
        notificationIds.map((id) => notificationPort.findWithPushes(id)),
        { concurrency: 5 },
      );

      const uniqueCreatorIds = [
        ...new Set(
          result.notifications.map((n) => n.createdById),
        ),
      ];

      const creators =
        uniqueCreatorIds.length > 0
          ? yield* Effect.all(
              uniqueCreatorIds.map((id) => userPort.findById(id)),
              { concurrency: 5 },
            )
          : [];

      const creatorMap = new Map(
        creators
          .filter((user): user is NonNullable<typeof user> => user !== null)
          .map((user) => [UserId.toString(user.id), user]),
      );

      const pushesMap = new Map(
        notificationIds.map((id, index) => [
          id,
          pushesResults[index]?.pushes ?? [],
        ]),
      );

      return {
        notifications: result.notifications.map((n) => {
          const creator = creatorMap.get(UserId.toString(n.createdById)) ?? null;
          const pushes = pushesMap.get(n.id) ?? [];

          return {
            id: n.id,
            tripId: n.tripId,
            title: n.title,
            body: n.body,
            url: n.url,
            createdById: n.createdById,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
            createdBy: creator
              ? {
                  id: UserId.toString(creator.id),
                  firstName: creator.firstName,
                  lastName: creator.lastName,
                  email: null,
                }
              : null,
            pushes: pushes.map((p) => ({
              id: p.id,
              userId: UserId.toString(p.targetUserId),
              status: p.status,
              sentAt: p.sentAt,
              failureReason: p.failureReason,
            })),
          };
        }),
        pagination: {
          total: result.total,
          limit: input.limit,
          offset: input.offset,
          hasMore: result.hasMore,
        },
      };
    });
  }
}
