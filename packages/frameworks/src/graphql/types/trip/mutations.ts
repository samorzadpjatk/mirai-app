// =============================================================================
// Trip Mutations - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAdmin, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import {
  CreateTripInput,
  UpdateTripInput,
  DeleteTripInput,
  CreateTripResultType,
  UpdateTripResultType,
  DeleteTripResultType,
} from "./types.js";

// Import use cases
import {
  CreateTripUseCase,
  UpdateTripUseCase,
  DeleteTripUseCase,
} from "@mirai-app/use-cases/trip";

import { TripId } from "@mirai-app/domain";

// =============================================================================
// Mutation Fields - Thin Resolvers
// =============================================================================

builder.mutationFields((t) => ({
  createTrip: t.field({
    type: CreateTripResultType,
    args: {
      input: t.arg({ type: CreateTripInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new CreateTripUseCase();
      const effect = useCase.execute({
        name: args.input.name,
        description: args.input.description ?? undefined,
        startDate: args.input.startDate,
        endDate: args.input.endDate,
        backgroundImagePath: args.input.backgroundImagePath ?? undefined,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  updateTrip: t.field({
    type: UpdateTripResultType,
    args: {
      input: t.arg({ type: UpdateTripInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new UpdateTripUseCase();
      const effect = useCase.execute({
        tripId: TripId.create(args.input.id),
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate ?? undefined,
        backgroundImagePath: args.input.backgroundImagePath ?? undefined,
      });
      
      const result = await runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });

      return {
        id: result.id,
        name: result.name,
        description: result.description,
        startDate: result.startDate,
        endDate: result.endDate,
        location: result.location,
        image: result.image,
        isActive: result.isActive,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    },
  }),

  deleteTrip: t.field({
    type: DeleteTripResultType,
    args: {
      input: t.arg({ type: DeleteTripInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new DeleteTripUseCase();
      const effect = useCase.execute({
        tripId: TripId.create(args.input.id),
      });

      return runEffect(context, effect)
        .then((result) => ({
          success: result.success,
          id: TripId.toString(result.tripId),
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
}));

export const tripMutations = {};