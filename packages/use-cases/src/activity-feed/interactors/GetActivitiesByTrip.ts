import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { ActivityReactionPortTag } from "../ports/ActivityReactionPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { TripId } from "@mirai-app/domain";
import type {
  PaginatedActivitiesDTO,
  ActivityCursor,
} from "../dto/ActivityFeedDTOs";
import {
  TripNotFoundError,
  InvalidCursorError,
} from "../errors/ActivityFeedErrors";

/**
 * Input for GetActivitiesByTripUseCase
 */
export interface GetActivitiesByTripInput {
  tripId: string;
  userId: string;
  limit: number;
  cursor?: string | null;
}

/**
 * Get Activities By Trip Use Case
 *
 * Retrieves activities for a trip with cursor pagination.
 * Returns activities sorted by isPinned DESC, createdAt DESC, id DESC.
 */
export class GetActivitiesByTripUseCase {
  execute(input: GetActivitiesByTripInput) {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const tripPort = yield* TripPortTag;
      const reactionPort = yield* ActivityReactionPortTag;

      // Verify trip exists
      const trip = yield* tripPort.findById(TripId.unsafeCreate(input.tripId));
      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      // Validate and decode cursor if provided
      if (input.cursor) {
        const cursorValidation = decodeCursor(input.cursor);
        if (!cursorValidation.success) {
          return yield* Effect.fail(
            new InvalidCursorError({
              cursor: input.cursor,
              reason: cursorValidation.error,
            }),
          );
        }
      }

      // Get paginated activities (not hidden)
      const result = yield* activityPort.findByTripIdPaginated(
        TripId.unsafeCreate(input.tripId),
        {
          limit: input.limit,
          cursor: input.cursor,
          includeHidden: false,
        },
      );

      // Get reactions for each activity
      const activitiesWithReactions = yield* Effect.all(
        result.activities.map((activity) =>
          Effect.gen(function* () {
            const reactions = yield* reactionPort.findByActivityId(activity.id);
            const userReactions = reactions.filter(
              (r) => r.userId === input.userId,
            );

            // Count reactions by type
            const reactionCounts = {
              heart: reactions.filter((r) => r.reactionType === "heart").length,
              fire: reactions.filter((r) => r.reactionType === "fire").length,
              clap: reactions.filter((r) => r.reactionType === "clap").length,
              star: reactions.filter((r) => r.reactionType === "star").length,
            };

            return {
              id: activity.id,
              tripId: activity.tripId,
              activityType: activity.activityType,
              title: activity.title,
              description: activity.description,
              imageUrl: activity.imageUrl,
              isPinned: activity.isPinned,
              isHidden: activity.isHidden,
              hiddenAt: activity.hiddenAt,
              hiddenReason: activity.hiddenReason,
              createdByAdmin: activity.createdByAdmin,
              createdAt: activity.createdAt,
              updatedAt: activity.updatedAt,
              admin: null, // Will be hydrated by adapter
              hiddenBy: null, // Will be hydrated by adapter
              submissionDetails: null, // Will be hydrated by adapter
              challengeDetails: null, // Will be hydrated by adapter
              rankChangeDetails: null, // Will be hydrated by adapter
              reactions: reactionCounts,
              userReactions: userReactions.map((r) => r.reactionType),
            };
          }),
        ),
      );

      return {
        activities: activitiesWithReactions,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    });
  }
}

function decodeCursor(
  cursor: string,
): { success: true; data: ActivityCursor } | { success: false; error: string } {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as ActivityCursor;

    if (
      typeof parsed.isPinned !== "boolean" ||
      !parsed.createdAt ||
      typeof parsed.id !== "string"
    ) {
      return { success: false, error: "Invalid cursor structure" };
    }

    return { success: true, data: parsed };
  } catch {
    return { success: false, error: "Failed to decode cursor" };
  }
}
