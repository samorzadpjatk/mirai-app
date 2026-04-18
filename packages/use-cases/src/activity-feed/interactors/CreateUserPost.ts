import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { ActivityFeed, UserId } from "@mirai-app/domain";
import type { TripId } from "@mirai-app/domain";
import type { CreateActivityResultDTO } from "../dto/ActivityFeedDTOs";
import {
  TripNotFoundError,
  NotTripParticipantError,
} from "../errors/ActivityFeedErrors";

/**
 * Input for CreateUserPostUseCase
 */
export interface CreateUserPostInput {
  tripId: TripId;
  userId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
}

/**
 * Create User Post Use Case
 *
 * Creates a user-generated post activity.
 */
export class CreateUserPostUseCase {
  execute(input: CreateUserPostInput) {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;

      // Verify trip exists
      const trip = yield* tripPort.findById(input.tripId);
      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      // Verify user is a participant
      const isParticipant = yield* participantPort.isParticipant(
        UserId.create(input.userId),
        input.tripId,
      );
      if (!isParticipant) {
        return yield* Effect.fail(
          new NotTripParticipantError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      const now = new Date();

      // Create activity entity - ID will be auto-generated
      const activityEffect = ActivityFeed.create({
        tripId: input.tripId,
        activityType: "USER_POST",
        title: input.title,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
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
