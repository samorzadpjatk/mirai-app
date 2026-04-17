import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import type { ApplicationError, TripId } from "@mirai-app/domain";
import type { CreateActivityResultDTO } from "../dto/ActivityFeedDTOs";
import { TripNotFoundError } from "../errors/ActivityFeedErrors";

/**
 * Input for CreateCustomActivityUseCase
 */
export interface CreateCustomActivityInput {
  tripId: TripId;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  createdByAdmin: string;
}

/**
 * Create Custom Activity Use Case
 *
 * Creates a custom activity for a trip (admin use).
 */
export class CreateCustomActivityUseCase {
  execute(
    input: CreateCustomActivityInput,
  ): Effect.Effect<
    CreateActivityResultDTO,
    TripNotFoundError | ApplicationError,
    ActivityFeedPortTag | TripPortTag
  > {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const tripPort = yield* TripPortTag;

      // Verify trip exists
      const trip = yield* tripPort.findById(input.tripId);
      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      const now = new Date();
      const activity = {
        id: "", // Will be assigned by repository
        tripId: input.tripId,
        activityType: "USER_POST" as const,
        title: input.title,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        isPinned: false,
        isHidden: false,
        hiddenByAdmin: null,
        hiddenAt: null,
        hiddenReason: null,
        createdByAdmin: input.createdByAdmin,
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
