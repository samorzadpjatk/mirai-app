import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { ActivityReactionPortTag } from "../ports/ActivityReactionPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { TripId, UserId } from "@mirai-app/domain";
import {
  TripNotFoundError,
  InvalidCursorError,
} from "../errors/ActivityFeedErrors";

/**
 * Input for GetActivitiesByTripModerationUseCase
 */
export interface GetActivitiesByTripModerationInput {
  tripId: string;
  limit: number;
  cursor?: string | null;
}

/**
 * Get Activities By Trip For Moderation Use Case
 *
 * Retrieves ALL activities for a trip including hidden ones.
 * Used by moderators and admins.
 */
export class GetActivitiesByTripModerationUseCase {
  execute(input: GetActivitiesByTripModerationInput) {
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

      // Validate cursor if provided
      if (input.cursor) {
        const isValid = validateCursor(input.cursor);
        if (!isValid) {
          return yield* Effect.fail(
            new InvalidCursorError({
              cursor: input.cursor,
              reason: "Invalid cursor format",
            }),
          );
        }
      }

      // Get paginated activities for moderation (includes hidden)
      const result = yield* activityPort.findByTripIdForModeration(
        TripId.unsafeCreate(input.tripId),
        {
          limit: input.limit,
          cursor: input.cursor,
        },
      );

      // Get reactions for each activity
      const userPort = yield* UserPortTag;

      const activitiesWithReactions = yield* Effect.all(
        result.activities.map((activity) =>
          Effect.gen(function* () {
            const reactions = yield* reactionPort.findByActivityId(activity.id);

            // Count reactions by type
            const reactionCounts = {
              heart: reactions.filter((r) => r.reactionType === "heart").length,
              fire: reactions.filter((r) => r.reactionType === "fire").length,
              clap: reactions.filter((r) => r.reactionType === "clap").length,
              star: reactions.filter((r) => r.reactionType === "star").length,
            };

            // Fetch admin details if activity was created by admin
            let admin = null;
            if (activity.createdByAdmin) {
              const adminUser = yield* userPort.findById(
                UserId.unsafeCreate(activity.createdByAdmin),
              );
              if (adminUser) {
                admin = {
                  id: adminUser.id,
                  firstName: adminUser.firstName,
                  lastName: adminUser.lastName,
                };
              }
            }

            // Fetch hiddenBy details if activity was hidden
            let hiddenBy = null;
            if (activity.hiddenByAdmin) {
              const hiddenByUser = yield* userPort.findById(
                UserId.unsafeCreate(activity.hiddenByAdmin),
              );
              if (hiddenByUser) {
                hiddenBy = {
                  id: hiddenByUser.id,
                  firstName: hiddenByUser.firstName,
                  lastName: hiddenByUser.lastName,
                };
              }
            }

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
              admin,
              hiddenBy,
              submissionDetails: null,
              challengeDetails: null,
              rankChangeDetails: null,
              reactions: reactionCounts,
              userReactions: [],
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

function validateCursor(cursor: string): boolean {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    return (
      typeof parsed.isPinned === "boolean" &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.id === "string"
    );
  } catch {
    return false;
  }
}
