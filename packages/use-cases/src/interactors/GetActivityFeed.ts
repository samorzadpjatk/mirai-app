import type { Result, ActivityFeed, ActivityId } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { ActivityFeedRepository } from "../ports/ActivityFeedRepository";

/**
 * Input for GetActivityFeed use case
 */
export interface GetActivityFeedInput {
  tripId: string;
  pageSize?: number;
  cursor?: {
    id: string;
    createdAt: Date;
    isPinned: boolean;
  } | null;
}

/**
 * Activity output DTO
 */
export interface ActivityOutput {
  id: string;
  tripId: string;
  activityType: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Output DTO for GetActivityFeed use case
 */
export interface GetActivityFeedOutput {
  activities: ActivityOutput[];
  nextCursor: {
    id: string;
    createdAt: Date;
    isPinned: boolean;
  } | null;
  pagination: {
    pageSize: number;
    hasMore: boolean;
  };
}

/**
 * GetActivityFeed Use Case
 *
 * Retrieves activities for a trip with cursor-based pagination.
 * Returns only visible activities (not hidden).
 */
export class GetActivityFeedUseCase {
  constructor(private activityFeedRepository: ActivityFeedRepository) {}

  async execute(
    input: GetActivityFeedInput,
  ): Promise<Result<GetActivityFeedOutput, string>> {
    const pageSize = input.pageSize ?? 30;

    const result = await this.activityFeedRepository.findByTripId(
      input.tripId,
      {
        limit: pageSize,
        ...(input.cursor !== undefined && { cursor: input.cursor }),
        includeHidden: false,
      },
    );

    return ok({
      activities: result.activities.map((activity) => this.toOutput(activity)),
      nextCursor: result.nextCursor,
      pagination: {
        pageSize,
        hasMore: result.hasMore,
      },
    });
  }

  private toOutput(activity: ActivityFeed): ActivityOutput {
    return {
      id: activity.id,
      tripId: activity.tripId,
      activityType: activity.activityType,
      title: activity.title,
      description: activity.description,
      imageUrl: activity.imageUrl,
      isPinned: activity.isPinned,
      isHidden: activity.isHidden,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      admin: activity.admin,
    };
  }
}
