import { Effect, Data } from "effect";
import { NotificationPortTag } from "../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { PaginatedAdminNotificationsDTO } from "../dto/NotificationDTOs";

/**
 * Invalid pagination error
 */
export class InvalidPaginationError extends Data.TaggedError(
  "InvalidPaginationError",
)<{
  page: number;
  totalPages: number;
}>() {}

/**
 * Input for GetAllNotificationsUseCase
 */
export interface GetAllNotificationsInput {
  tripId?: string;
  limit: number;
  offset: number;
}

/**
 * Get All Notifications Use Case (Admin)
 *
 * Retrieves all notifications with pagination for admin users.
 */
export class GetAllNotificationsUseCase {
  execute(
    input: GetAllNotificationsInput,
  ): Effect.Effect<
    PaginatedAdminNotificationsDTO,
    ApplicationError | InvalidPaginationError,
    NotificationPortTag
  > {
    return Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;

      const result = yield* notificationPort.findPaginated({
        tripId: input.tripId,
        limit: input.limit,
        offset: input.offset,
      });

      return {
        notifications: result.notifications.map((n) => ({
          id: n.id,
          tripId: n.tripId,
          title: n.title,
          body: n.body,
          url: n.url,
          createdById: n.createdById,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          createdBy: null, // To be hydrated by adapter
          pushes: [], // To be hydrated by adapter
        })),
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
