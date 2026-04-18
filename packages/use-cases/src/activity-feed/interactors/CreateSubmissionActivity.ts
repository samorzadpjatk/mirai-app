import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { StoragePortTag } from "../../storage/ports/StoragePort";
import {
  ActivityFeed,
  ChallengeId,
  ChallengeSubmissionId,
  GroupId,
} from "@mirai-app/domain";
import type { TripId } from "@mirai-app/domain";
import type { CreateActivityResultDTO } from "../dto/ActivityFeedDTOs";
import {
  TripNotFoundError,
  ChallengeNotFoundError,
  SubmissionNotFoundError,
  GroupNotFoundError,
} from "../errors/ActivityFeedErrors";

/**
 * Input for CreateSubmissionActivityUseCase
 */
export interface CreateSubmissionActivityInput {
  tripId: TripId;
  submissionId: string;
  challengeId: string;
  groupId: string;
  title?: string;
}

/**
 * Create Submission Activity Use Case
 *
 * Creates an activity when a submission is approved.
 */
export class CreateSubmissionActivityUseCase {
  execute(input: CreateSubmissionActivityInput) {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const tripPort = yield* TripPortTag;
      const submissionPort = yield* ChallengeSubmissionPortTag;
      const challengePort = yield* ChallengePortTag;
      const groupPort = yield* GroupPortTag;
      const storagePort = yield* StoragePortTag;

      // Verify trip exists
      const trip = yield* tripPort.findById(input.tripId);
      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      // Verify challenge exists
      const challenge = yield* challengePort.findById(
        ChallengeId.create(input.challengeId),
      );
      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Verify submission exists
      const submission = yield* submissionPort.findById(
        ChallengeSubmissionId.create(input.submissionId),
      );
      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Verify group exists
      const group = yield* groupPort.findById(GroupId.create(input.groupId));
      if (!group) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      const now = new Date();
      const title =
        input.title ?? `Submission approved for challenge: ${challenge.name}`;

      // Resolve image URL from submission if images exist
      const firstImageId = submission.imageIds[0];
      const imageUrl =
        firstImageId !== undefined
          ? storagePort.getPublicUrl("images", firstImageId)
          : null;

      // Create activity entity - ID will be auto-generated
      const activityEffect = ActivityFeed.create({
        tripId: input.tripId,
        activityType: "SUBMISSION",
        title: title,
        description: null,
        imageUrl,
        isPinned: false,
        isHidden: false,
        hiddenByAdmin: null,
        hiddenAt: null,
        hiddenReason: null,
        createdByAdmin: null,
        createdAt: now,
        updatedAt: now,
      });

      const activity = yield* activityEffect as Effect.Effect<
        ActivityFeed,
        never,
        never
      >;

      // Save activity
      const saved = yield* activityPort.create(activity);

      return {
        id: saved.id,
        tripId: saved.tripId,
        activityType: saved.activityType,
        title: saved.title,
        createdAt: saved.createdAt,
      };
    });
  }
}
