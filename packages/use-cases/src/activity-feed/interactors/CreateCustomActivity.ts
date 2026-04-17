import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { ActivityFeed } from "@mirai-app/domain";
import type { TripId } from "@mirai-app/domain";
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
  execute(input: CreateCustomActivityInput) {
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
        createdByAdmin: null, // Admin ID should be converted to UserId type if needed
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
