// =============================================================================
// Trip Queries - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireModerator, requireAdmin, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import {
  TripType,
  TripWithDetailsType,
  TripWithParticipantsType,
  TripResourcesResultType,
  TripConnectionType,
} from "./types.js";

import {
  normalizePaginationArgs,
  buildConnection,
  encodeCursor,
  decodeCursor,
} from "../../utils/connections.js";

// Import use cases
import {
  GetAllTripsUseCase,
  GetTripByIdUseCase,
  GetTripByIdAdminUseCase,
  GetTripResourcesUseCase,
} from "@mirai-app/use-cases/trip";

import type { TripDTO } from "@mirai-app/use-cases/trip";

import { TripId, UserId } from "@mirai-app/domain";

// =============================================================================
// Query Fields - Thin Resolvers
// =============================================================================

builder.queryFields((t) => ({
  myTrips: t.field({
    type: TripConnectionType,
    args: {
      first: t.arg.int(),
      after: t.arg.string(),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);
      const { limit, after } = normalizePaginationArgs(args);
      const offset = after ? decodeCursor(after).length : 0;

      const useCase = new GetAllTripsUseCase();
      const effect = useCase.execute({
        userId: auth.userId,
        pagination: {
          limit,
          offset,
        },
      });

      const result = await runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });

      return buildConnection({
        items: result.trips,
        hasMore: result.pagination.hasMore,
        getCursor: (trip: TripDTO) => encodeCursor(trip.id),
        totalCount: result.pagination.total,
      });
    },
  }),

  trip: t.field({
    type: TripWithParticipantsType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);
      
      const useCase = new GetTripByIdUseCase();
      const effect = useCase.execute({
        tripId: TripId.create(args.id),
        userId: UserId.create(auth.userId),
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  tripAdmin: t.field({
    type: TripWithParticipantsType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new GetTripByIdAdminUseCase();
      const effect = useCase.execute({
        tripId: TripId.create(args.id),
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  tripResources: t.field({
    type: TripResourcesResultType,
    args: {
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);
      
      const useCase = new GetTripResourcesUseCase();
      const effect = useCase.execute({
        tripId: TripId.create(args.tripId),
        userId: UserId.unsafeCreate(auth.userId),
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
}));

export const tripQueries = {};