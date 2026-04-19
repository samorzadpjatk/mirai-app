import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { ActivityReactionPortTag } from "../ports/ActivityReactionPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { TripId } from "@mirai-app/domain";
import type {
  PaginatedActivitiesDTO,
  ActivityCursor,
  SubmissionActivityDetailsDTO,
  ChallengeActivityDetailsDTO,
  RankChangeActivityDetailsDTO,
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
      const userPort = yield* UserPortTag;

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

      // Get additional ports for enrichment
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const challengePort = yield* ChallengePortTag;
      const groupPort = yield* GroupPortTag;

      // Get reactions for each activity and fetch related user data
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

            // Fetch admin user data if createdByAdmin exists
            let admin: { id: string; firstName: string; lastName: string } | null = null;
            if (activity.createdByAdmin) {
              const adminUser = yield* userPort.findById(activity.createdByAdmin);
              if (adminUser) {
                admin = {
                  id: adminUser.id,
                  firstName: adminUser.firstName,
                  lastName: adminUser.lastName,
                };
              }
            }

            // Fetch hiddenBy user data if hiddenByAdmin exists
            let hiddenBy: { id: string; firstName: string; lastName: string } | null = null;
            if (activity.hiddenByAdmin) {
              const hiddenByUser = yield* userPort.findById(activity.hiddenByAdmin);
              if (hiddenByUser) {
                hiddenBy = {
                  id: hiddenByUser.id,
                  firstName: hiddenByUser.firstName,
                  lastName: hiddenByUser.lastName,
                };
              }
            }

            // Enrich activity with submission, challenge, or group details
            let submissionDetails: SubmissionActivityDetailsDTO | null = null;
            let challengeDetails: ChallengeActivityDetailsDTO | null = null;
            let rankChangeDetails: RankChangeActivityDetailsDTO | null = null;

            if (activity.submissionId) {
              const submission = yield* submissionPort.findById(activity.submissionId);
              if (submission) {
                submissionDetails = {
                  submissionId: submission.id,
                  challengeId: submission.challengeId,
                  groupId: submission.groupId,
                  hasVideo: !!submission.videoId,
                  isWinner: submission.awardedPoints !== null && submission.awardedPoints > 0,
                  ranking: submission.ranking,
                };
              }
            }

            if (activity.challengeId) {
              const challenge = yield* challengePort.findById(activity.challengeId);
              if (challenge) {
                // Determine event type based on challenge status and timing
                let eventType: "STARTED" | "ENDED" | "VOTING_STARTED" = "STARTED";
                if (challenge.status === "VOTING_PHASE") {
                  eventType = "VOTING_STARTED";
                } else if (challenge.status === "COMPLETED") {
                  eventType = "ENDED";
                }

                challengeDetails = {
                  challengeId: challenge.id,
                  challengeTitle: challenge.name,
                  eventType,
                };
              }
            }

            // Calculate group rankings for rank change activities
            if (activity.groupId && activity.activityType === "RANK_CHANGE") {
              // Get all groups for this trip to calculate rankings
              const allGroups = yield* groupPort.findByTripId(TripId.unsafeCreate(input.tripId));
              
              // Sort groups by coins descending to determine rank
              const sortedGroups = [...allGroups].sort((a, b) => b.coins - a.coins);
              
              const currentRank = sortedGroups.findIndex((g) => g.id === activity.groupId) + 1;
              
              if (currentRank > 0) {
                const group = sortedGroups[currentRank - 1];
                
                if (group) {
                  // Try to extract previous rank from activity description or metadata
                  // If not available, assume they moved up one position
                  let previousRank = currentRank + 1;
                  
                  // Parse previous rank from description if it contains rank info
                  // Format: "Group X moved from rank Y to rank Z"
                  const rankMatch = activity.description?.match(/from rank (\d+) to rank (\d+)/);
                  if (rankMatch && rankMatch[1]) {
                    previousRank = parseInt(rankMatch[1], 10);
                  } else {
                    // Default: assume they moved up one position, but not below 1
                    previousRank = Math.max(1, currentRank + 1);
                  }
                  
                  rankChangeDetails = {
                    groupId: group.id,
                    groupName: group.name,
                    previousRank,
                    newRank: currentRank,
                    coinsAtChange: group.coins,
                  };
                }
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
              submissionDetails,
              challengeDetails,
              rankChangeDetails,
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
