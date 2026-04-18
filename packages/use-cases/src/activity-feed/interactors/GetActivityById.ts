import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { ActivityReactionPortTag } from "../ports/ActivityReactionPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import type { ActivityFeedId } from "@mirai-app/domain";
import {
  ActivityNotFoundError,
  UserNotFoundError,
  ChallengeNotFoundError,
  SubmissionNotFoundError,
  GroupNotFoundError,
} from "../errors/ActivityFeedErrors";

/**
 * Input for GetActivityByIdUseCase
 */
export interface GetActivityByIdInput {
  activityId: ActivityFeedId;
  userId: string;
}

/**
 * Get Activity By ID Use Case
 *
 * Retrieves a single activity by ID with reaction counts and fully populated details.
 */
export class GetActivityByIdUseCase {
  execute(input: GetActivityByIdInput) {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const reactionPort = yield* ActivityReactionPortTag;
      const userPort = yield* UserPortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const challengePort = yield* ChallengePortTag;
      const groupPort = yield* GroupPortTag;

      // Find activity
      const activity = yield* activityPort.findById(input.activityId);

      if (!activity) {
        return yield* Effect.fail(
          new ActivityNotFoundError({ activityId: input.activityId }),
        );
      }

      // Get reactions
      const reactions = yield* reactionPort.findByActivityId(activity.id);
      const userReactions = reactions.filter((r) => r.userId === input.userId);

      // Count reactions by type
      const reactionCounts = {
        heart: reactions.filter((r) => r.reactionType === "heart").length,
        fire: reactions.filter((r) => r.reactionType === "fire").length,
        clap: reactions.filter((r) => r.reactionType === "clap").length,
        star: reactions.filter((r) => r.reactionType === "star").length,
      };

      // Fetch admin info in parallel if createdByAdmin exists
      const adminEffect = activity.createdByAdmin
        ? Effect.gen(function* () {
            const admin = yield* userPort.findById(activity.createdByAdmin!);
            if (!admin) {
              return yield* Effect.fail(
                new UserNotFoundError({ userId: activity.createdByAdmin! }),
              );
            }
            return {
              id: admin.id,
              firstName: admin.firstName,
              lastName: admin.lastName,
            };
          })
        : Effect.succeed(null);

      // Fetch hiddenBy info in parallel if hiddenByAdmin exists
      const hiddenByEffect = activity.hiddenByAdmin
        ? Effect.gen(function* () {
            const hiddenBy = yield* userPort.findById(activity.hiddenByAdmin!);
            if (!hiddenBy) {
              return yield* Effect.fail(
                new UserNotFoundError({ userId: activity.hiddenByAdmin! }),
              );
            }
            return {
              id: hiddenBy.id,
              firstName: hiddenBy.firstName,
              lastName: hiddenBy.lastName,
            };
          })
        : Effect.succeed(null);

      // Parse related entity IDs from description field based on activity type
      const descriptionData = activity.description
        ? (() => {
            try {
              return JSON.parse(activity.description);
            } catch {
              return null;
            }
          })()
        : null;

      // Fetch submission details if SUBMISSION type
      const submissionDetailsEffect =
        activity.activityType === "SUBMISSION" && descriptionData?.submissionId
          ? Effect.gen(function* () {
              const submission = yield* submissionPort.findById(
                descriptionData.submissionId,
              );
              if (!submission) {
                return yield* Effect.fail(
                  new SubmissionNotFoundError({
                    submissionId: descriptionData.submissionId,
                  }),
                );
              }

              const [challenge, group] = yield* Effect.all([
                challengePort.findById(submission.challengeId),
                groupPort.findById(submission.groupId),
              ]);

              if (!challenge) {
                return yield* Effect.fail(
                  new ChallengeNotFoundError({
                    challengeId: submission.challengeId,
                  }),
                );
              }

              if (!group) {
                return yield* Effect.fail(
                  new GroupNotFoundError({ groupId: submission.groupId }),
                );
              }

              return {
                submissionId: submission.id,
                challengeId: challenge.id,
                groupId: group.id,
                hasVideo: submission.videoId !== null,
                isWinner: submission.ranking === 1,
                ranking: submission.ranking,
              };
            })
          : Effect.succeed(null);

      // Fetch challenge details if CHALLENGE type
      const challengeDetailsEffect =
        activity.activityType === "CHALLENGE" && descriptionData?.challengeId
          ? Effect.gen(function* () {
              const challenge = yield* challengePort.findById(
                descriptionData.challengeId,
              );
              if (!challenge) {
                return yield* Effect.fail(
                  new ChallengeNotFoundError({
                    challengeId: descriptionData.challengeId,
                  }),
                );
              }

              return {
                challengeId: challenge.id,
                challengeTitle: challenge.name,
                eventType: descriptionData.eventType ?? "STARTED",
              };
            })
          : Effect.succeed(null);

      // Fetch rank change details if RANK_CHANGE type
      const rankChangeDetailsEffect =
        activity.activityType === "RANK_CHANGE" && descriptionData?.groupId
          ? Effect.gen(function* () {
              const group = yield* groupPort.findById(descriptionData.groupId);
              if (!group) {
                return yield* Effect.fail(
                  new GroupNotFoundError({ groupId: descriptionData.groupId }),
                );
              }

              return {
                groupId: group.id,
                groupName: group.name,
                previousRank: descriptionData.previousRank ?? 0,
                newRank: descriptionData.newRank ?? 0,
                coinsAtChange: descriptionData.coinsAtChange ?? 0,
              };
            })
          : Effect.succeed(null);

      // Execute all parallel fetches
      const [admin, hiddenBy, submissionDetails, challengeDetails, rankChangeDetails] =
        yield* Effect.all([
          adminEffect,
          hiddenByEffect,
          submissionDetailsEffect,
          challengeDetailsEffect,
          rankChangeDetailsEffect,
        ]);

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
    });
  }
}
