import { builder } from "../builder";
import { TripType, CreateTripInput, UpdateTripInput } from "../types/Trip";
import {
  TripRepositoryTag,
  type CreateTripInput as CreateTripUseCaseInput,
  type UpdateTripInput as UpdateTripUseCaseInput,
} from "@mirai-app/use-cases";
import { TripStatus } from "@mirai-app/domain";
import { Effect } from "effect";

/**
 * Trip Queries
 */
builder.queryFields((t) => ({
  trip: t.field({
    type: TripType,
    nullable: true,
    description: "Get a trip by ID",
    args: {
      id: t.arg.id({ required: true, description: "Trip ID" }),
    },
    authScopes: { authenticated: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.tripController;
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  trips: t.field({
    type: [TripType],
    description: "List all trips (admin only)",
    args: {
      limit: t.arg.int({ required: false, defaultValue: 20 }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
      status: t.arg.string({ required: false }),
    },
    authScopes: { admin: true },
    resolve: async (_, args, context) => {
      const program = Effect.gen(function* () {
        const tripRepository = yield* TripRepositoryTag;
        return yield* tripRepository.findAll({
          limit: args.limit ?? 20,
          offset: args.offset ?? 0,
        });
      }).pipe(Effect.provide(context.appLayer));
      return await Effect.runPromise(program);
    },
  }),

  activeTrips: t.field({
    type: [TripType],
    description: "List all currently active trips",
    args: {
      limit: t.arg.int({ required: false, defaultValue: 10 }),
    },
    authScopes: { public: true },
    resolve: async (_, args, context) => {
      const program = Effect.gen(function* () {
        const tripRepository = yield* TripRepositoryTag;
        const trips = yield* tripRepository.findAll({
          limit: args.limit ?? 10,
        });
        const now = new Date();
        return trips.filter(
          (trip: { startDate: Date; endDate: Date }) =>
            trip.startDate <= now && trip.endDate >= now,
        );
      }).pipe(Effect.provide(context.appLayer));
      return await Effect.runPromise(program);
    },
  }),
}));

/**
 * Trip Mutations
 */
builder.mutationFields((t) => ({
  createTrip: t.field({
    type: TripType,
    description: "Create a new trip (admin only)",
    args: {
      input: t.arg({ type: CreateTripInput, required: true }),
    },
    authScopes: { admin: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.tripController;

      const statusMap: Record<string, TripStatus> = {
        DRAFT: TripStatus.DRAFT,
        ACTIVE: TripStatus.ACTIVE,
        COMPLETED: TripStatus.COMPLETED,
        CANCELLED: TripStatus.CANCELLED,
      };

      const result = await controller.create({
        name: args.input.name,
        description: args.input.description,
        startDate: args.input.startDate,
        endDate: args.input.endDate,
        backgroundImagePath: args.input.backgroundImagePath ?? undefined,
        status: statusMap[args.input.status ?? "DRAFT"] ?? TripStatus.DRAFT,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  updateTrip: t.field({
    type: TripType,
    description: "Update a trip (admin only)",
    args: {
      id: t.arg.id({ required: true, description: "Trip ID" }),
      input: t.arg({ type: UpdateTripInput, required: true }),
    },
    authScopes: { admin: true },
    resolve: async (_, args, context) => {
      const controller = context.controllers.tripController;

      const statusMap: Record<string, TripStatus> = {
        DRAFT: TripStatus.DRAFT,
        ACTIVE: TripStatus.ACTIVE,
        COMPLETED: TripStatus.COMPLETED,
        CANCELLED: TripStatus.CANCELLED,
      };

      const result = await controller.update({
        id: args.id,
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate ?? undefined,
        backgroundImagePath: args.input.backgroundImagePath ?? undefined,
        status: args.input.status
          ? (statusMap[args.input.status] ?? undefined)
          : undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
}));
