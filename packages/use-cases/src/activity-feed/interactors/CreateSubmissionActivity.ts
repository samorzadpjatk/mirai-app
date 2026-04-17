import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { ChallengeSubmissionPort } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { GroupPort } from "../../group/ports/GroupPort";
import { ActivityFeed } from "@mirai-app/domain";
import type { ApplicationError, TripId } from "@mirai-app/domain";
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
  execute(
    input: CreateSubmissionActivityInput,
  ): Effect.Effect<
    CreateActivityResultDTO,
    | TripNotFoundError
    | ChallengeNotFoundError
    | SubmissionNotFoundError
    | GroupNotFoundError
    | ApplicationError,
    | ActivityFeedPortTag
    | TripPortTag
    | ChallengeSubmissionPort
    | ChallengePortTag
    | GroupPort
  > {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const tripPort = yield* TripPortTag;
      const submissionPort = yield* ChallengeSubmissionPort;
      const challengePort = yield* ChallengePortTag;
      const groupPort = yield* GroupPort;

      // Verify trip exists
      const trip = yield* tripPort.findById(input.tripId);
      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      // Verify challenge exists
      const challenge = yield* challengePort.findById(input.challengeId);
      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Verify submission exists
      const submission = yield* submissionPort.findById(input.submissionId);
      if (!submission) {
        return yield* Effect.fail(
          new SubmissionNotFoundError({ submissionId: input.submissionId }),
        );
      }

      // Verify group exists
      const group = yield* groupPort.findById(input.groupId);
      if (!group) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      const now = new Date();
      const title =
        input.title ?? `Submission approved for challenge: ${challenge.name}`;

      // Create activity entity - ID will be auto-generated
      const activityEffect = ActivityFeed.create({
        tripId: input.tripId,
        activityType: "SUBMISSION",
        title: title,
        description: null,
        imageUrl: null, // Will be hydrated by adapter from submission
        isPinned: false,
        isHidden: false,
        hiddenByAdmin: null,
        hiddenAt: null,
        hiddenReason: null,
        createdByAdmin: null,
        createdAt: now,
        updatedAt: now,
      });

      const activity = yield* activityEffect;

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
