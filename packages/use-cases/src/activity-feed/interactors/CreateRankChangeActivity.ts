import { Effect } from "effect";
import { ActivityFeedPortTag } from "../ports/ActivityFeedPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { GroupPort } from "../../group/ports/GroupPort";
import { ActivityFeed } from "@mirai-app/domain";
import type { ApplicationError, TripId } from "@mirai-app/domain";
import type { CreateActivityResultDTO } from "../dto/ActivityFeedDTOs";
import {
  TripNotFoundError,
  GroupNotFoundError,
} from "../errors/ActivityFeedErrors";

/**
 * Input for CreateRankChangeActivityUseCase
 */
export interface CreateRankChangeActivityInput {
  tripId: TripId;
  groupId: string;
  previousRank: number;
  newRank: number;
  coinsAtChange: number;
}

/**
 * Create Rank Change Activity Use Case
 *
 * Creates an activity when a group's rank changes.
 */
export class CreateRankChangeActivityUseCase {
  execute(
    input: CreateRankChangeActivityInput,
  ): Effect.Effect<
    CreateActivityResultDTO,
    TripNotFoundError | GroupNotFoundError | ApplicationError,
    ActivityFeedPortTag | TripPortTag | GroupPort
  > {
    return Effect.gen(function* () {
      const activityPort = yield* ActivityFeedPortTag;
      const tripPort = yield* TripPortTag;
      const groupPort = yield* GroupPort;

      // Verify trip exists
      const trip = yield* tripPort.findById(input.tripId);
      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
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

      // Generate title based on rank change
      const rankChange = input.previousRank - input.newRank;
      let title: string;
      if (rankChange > 0) {
        title = `${group.name} moved up from rank ${input.previousRank} to ${input.newRank}`;
      } else if (rankChange < 0) {
        title = `${group.name} moved down from rank ${input.previousRank} to ${input.newRank}`;
      } else {
        title = `${group.name} maintained rank ${input.newRank}`;
      }

      // Create activity entity - ID will be auto-generated
      const activityEffect = ActivityFeed.create({
        tripId: input.tripId,
        activityType: "RANK_CHANGE",
        title: title,
        description: null,
        imageUrl: null,
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
