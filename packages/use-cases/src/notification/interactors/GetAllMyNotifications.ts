import { Effect } from "effect";
import { NotificationPortTag } from "../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { PaginatedNotificationsDTO } from "../dto/NotificationDTOs";

/**
 * Input for GetAllMyNotificationsUseCase
 */
export interface GetAllMyNotificationsInput {
  userId: string;
  page: number;
  pageSize: number;
}

/**
 * Get All My Notifications Use Case
 *
 * Retrieves paginated notifications for the current user.
 */
export class GetAllMyNotificationsUseCase {
  execute(
    input: GetAllMyNotificationsInput,
  ): Effect.Effect<
    PaginatedNotificationsDTO,
    ApplicationError,
    NotificationPortTag
  > {
    return Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;

      const result = yield* notificationPort.findPaginatedByUserId(
        input.userId,
        {
          page: input.page,
          pageSize: input.pageSize,
        },
      );

      const totalPages = Math.ceil(result.total / input.pageSize);

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
        })),
        pagination: {
          total: result.total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages,
        },
      };
    });
  }
}
