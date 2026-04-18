import { TripId as TripIdFactory } from "@mirai-app/domain";
import { Effect } from "effect";
import { TripPortTag } from "../ports/TripPort";
import type { PaginatedTripsDTO, TripDTO } from "../dto/TripDTOs";

/**
 * Input for GetAllTripsUseCase
 */
export interface GetAllTripsInput {
  userId: string;
  pagination?: {
    limit: number;
    offset: number;
  };
}

/**
 * Get All Trips Use Case
 *
 * Retrieves paginated trips for a user.
 */
export class GetAllTripsUseCase {
  execute(input: GetAllTripsInput) {
    return Effect.gen(function* () {
      const tripPort = yield* TripPortTag;

      const limit = input.pagination?.limit ?? 30;
      const offset = input.pagination?.offset ?? 0;
      const now = new Date();

      const result = yield* tripPort.findPaginated({
        userId: input.userId,
        limit,
        offset,
      });

      const trips: TripDTO[] = result.trips.map((trip) => ({
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        location: null,
        image: trip.backgroundImagePath,
        isActive: trip.isActive(now),
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      }));

      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(result.total / limit);

      return {
        trips,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: result.hasMore,
          currentPage,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
      };
    });
  }
}
