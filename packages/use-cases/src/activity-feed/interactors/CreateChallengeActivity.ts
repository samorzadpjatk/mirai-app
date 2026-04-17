import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import type { ApplicationError, TripId } from "@mirai-app/domain";
import type { CreateActivityResultDTO } from "../dto/ActivityFeedDTOs";
import {
  TripNotFoundError,
  ChallengeNotFoundError,
} from "../errors/ActivityFeedErrors";

/**
 * Input for CreateChallengeActivityUseCase
 */
export interface CreateChallengeActivityInput {
  tripId: TripId;
  challengeId: string;
  eventType: "STARTED" | "ENDED" | "VOTING_STARTED";
}

/**
 * Create Challenge Activity Use Case
 *
 * Creates an activity for challenge events (started, ended, voting started).
 */
export class CreateChallengeActivityUseCase {
  execute(
    input: CreateChallengeActivityInput,
  ): Effect.Effect<
    CreateActivityResultDTO,
    TripNotFoundError | ChallengeNotFoundError | ApplicationError,
    ActivityFeedPortTag | TripPortTag | ChallengePortTag
  > {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const tripPort = yield* TripPortTag;
      const challengePort = yield* ChallengePortTag;

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

      const now = new Date();

      // Generate title based on event type
      let title: string;
      switch (input.eventType) {
        case "STARTED":
          title = `New challenge started: ${challenge.name}`;
          break;
        case "ENDED":
          title = `Challenge ended: ${challenge.name}`;
          break;
        case "VOTING_STARTED":
          title = `Voting started for: ${challenge.name}`;
          break;
        default:
          title = `Challenge update: ${challenge.name}`;
      }

      const activity = {
        id: "", // Will be assigned by repository
        tripId: input.tripId,
        activityType: "CHALLENGE" as const,
        title: title,
        description: challenge.description,
        imageUrl: null,
        isPinned: false,
        isHidden: false,
        hiddenByAdmin: null,
        hiddenAt: null,
        hiddenReason: null,
        createdByAdmin: null,
        createdAt: now,
        updatedAt: now,
      };

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
