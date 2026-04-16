import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import {
  TripType,
  TripParticipantType,
  TripParticipantRoleType,
} from "./types.js";
import type { TripDTO, TripParticipantDTO } from "@mirai-app/use-cases";

/**
 * Create Trip Input
 */
const CreateTripInput = builder.inputType("CreateTripInput", {
  description: "Input for creating a trip",
  fields: (t) => ({
    name: t.field({ type: "String", required: true }),
    description: t.field({ type: "String" }),
    destination: t.field({ type: "String", required: true }),
    startDate: t.field({ type: "DateTime", required: true }),
    endDate: t.field({ type: "DateTime", required: true }),
    imageUrl: t.field({ type: "String" }),
    basePrice: t.field({ type: "Int" }),
    totalSpots: t.field({ type: "Int" }),
    registrationDeadline: t.field({ type: "DateTime" }),
  }),
});

/**
 * Update Trip Input
 */
const UpdateTripInput = builder.inputType("UpdateTripInput", {
  description: "Input for updating a trip",
  fields: (t) => ({
    name: t.field({ type: "String" }),
    description: t.field({ type: "String" }),
    destination: t.field({ type: "String" }),
    startDate: t.field({ type: "DateTime" }),
    endDate: t.field({ type: "DateTime" }),
    imageUrl: t.field({ type: "String" }),
    basePrice: t.field({ type: "Int" }),
    totalSpots: t.field({ type: "Int" }),
    registrationDeadline: t.field({ type: "DateTime" }),
    status: t.field({ type: "String" }),
  }),
});

/**
 * Join Trip Input
 */
const JoinTripInput = builder.inputType("JoinTripInput", {
  description: "Input for joining a trip",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    role: t.field({
      type: TripParticipantRoleType,
      description: "Role in the trip (MEMBER or LEADER)",
    }),
  }),
});

/**
 * Invite To Trip Input
 */
const InviteToTripInput = builder.inputType("InviteToTripInput", {
  description: "Input for inviting someone to a trip",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    userId: t.field({ type: "ID", required: true }),
    role: t.field({
      type: TripParticipantRoleType,
      description: "Role to assign (MEMBER or LEADER)",
    }),
  }),
});

/**
 * Upload Trip Resource Input
 */
const UploadTripResourceInput = builder.inputType("UploadTripResourceInput", {
  description: "Input for uploading a trip resource",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    name: t.field({ type: "String", required: true }),
    description: t.field({ type: "String" }),
    type: t.field({ type: "String", required: true }),
    url: t.field({ type: "String", required: true }),
    fileSize: t.field({ type: "Int" }),
    mimeType: t.field({ type: "String" }),
  }),
});

/**
 * Trip Resource Type
 */
const TripResourceType = builder.objectType("TripResource", {
  description: "A resource attached to a trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    type: t.exposeString("type"),
    url: t.exposeString("url"),
    fileSize: t.exposeInt("fileSize", { nullable: true }),
    mimeType: t.exposeString("mimeType", { nullable: true }),
    uploadedById: t.exposeID("uploadedById"),
    uploadedAt: t.field({
      type: "DateTime",
      resolve: (resource: { uploadedAt: Date }) => resource.uploadedAt,
    }),
  }),
});

/**
 * Delete Trip Result Type
 */
const DeleteTripResultType = builder.objectType("DeleteTripResult", {
  description: "Result of deleting a trip",
  fields: (t) => ({
    success: t.exposeBoolean("success"),
    tripId: t.exposeID("tripId"),
  }),
});

/**
 * Leave Trip Result Type
 */
const LeaveTripResultType = builder.objectType("LeaveTripResult", {
  description: "Result of leaving a trip",
  fields: (t) => ({
    success: t.exposeBoolean("success"),
    tripId: t.exposeID("tripId"),
  }),
});

/**
 * GraphQL Context type for trip mutations
 */
interface TripMutationContext {
  controllers: {
    tripController: {
      create: (
        input: unknown,
      ) => Promise<
        { success: true; data: TripDTO } | { success: false; error: string }
      >;
      update: (
        input: unknown,
      ) => Promise<
        { success: true; data: TripDTO } | { success: false; error: string }
      >;
      delete: (
        input: unknown,
      ) => Promise<
        | { success: true; data: { deleted: true; tripId: string } }
        | { success: false; error: string }
      >;
      joinTrip?: (
        input: unknown,
      ) => Promise<
        | { success: true; data: TripParticipantDTO }
        | { success: false; error: string }
      >;
      leaveTrip?: (
        input: unknown,
      ) => Promise<
        | { success: true; data: { success: boolean; tripId: string } }
        | { success: false; error: string }
      >;
      inviteToTrip?: (
        input: unknown,
      ) => Promise<
        | { success: true; data: TripParticipantDTO }
        | { success: false; error: string }
      >;
      uploadTripResource?: (input: unknown) => Promise<
        | {
            success: true;
            data: {
              id: string;
              tripId: string;
              name: string;
              description: string | null;
              type: string;
              url: string;
              fileSize: number | null;
              mimeType: string | null;
              uploadedById: string;
              uploadedAt: Date;
            };
          }
        | { success: false; error: string }
      >;
    };
  };
  authContext?: {
    userId: string;
    role: string;
  };
}

/**
 * Trip Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a new trip
   */
  createTrip: t.field({
    type: TripType,
    args: {
      input: t.arg({ type: CreateTripInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          name: string;
          description?: string | null;
          destination: string;
          startDate: Date;
          endDate: Date;
          imageUrl?: string | null;
          basePrice?: number | null;
          totalSpots?: number | null;
          registrationDeadline?: Date | null;
        };
      },
      ctx: TripMutationContext,
    ) => {
      const controller = ctx.controllers.tripController;
      const result = await controller.create({
        name: args.input.name,
        description: args.input.description ?? undefined,
        destination: args.input.destination,
        startDate: args.input.startDate,
        endDate: args.input.endDate,
        backgroundImagePath: args.input.imageUrl ?? undefined,
        basePrice: args.input.basePrice ?? undefined,
        totalSpots: args.input.totalSpots ?? undefined,
        registrationDeadline: args.input.registrationDeadline ?? undefined,
        createdById: ctx.authContext?.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Update a trip
   */
  updateTrip: t.field({
    type: TripType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateTripInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          name?: string | null;
          description?: string | null;
          destination?: string | null;
          startDate?: Date | null;
          endDate?: Date | null;
          imageUrl?: string | null;
          basePrice?: number | null;
          totalSpots?: number | null;
          registrationDeadline?: Date | null;
          status?: string | null;
        };
      },
      ctx: TripMutationContext,
    ) => {
      const controller = ctx.controllers.tripController;
      const result = await controller.update({
        tripId: args.id,
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        destination: args.input.destination ?? undefined,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate ?? undefined,
        backgroundImagePath: args.input.imageUrl ?? undefined,
        basePrice: args.input.basePrice ?? undefined,
        totalSpots: args.input.totalSpots ?? undefined,
        registrationDeadline: args.input.registrationDeadline ?? undefined,
        status: args.input.status ?? undefined,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Delete a trip
   */
  deleteTrip: t.field({
    type: DeleteTripResultType,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: TripMutationContext,
    ) => {
      const controller = ctx.controllers.tripController;
      const result = await controller.delete({
        id: args.id,
        deletedById: ctx.authContext?.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        success: true,
        tripId: result.data.tripId,
      };
    },
  }),

  /**
   * Join a trip
   */
  joinTrip: t.field({
    type: TripParticipantType,
    args: {
      input: t.arg({ type: JoinTripInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          role?: "MEMBER" | "LEADER" | null;
        };
      },
      ctx: TripMutationContext,
    ) => {
      if (!ctx.controllers.tripController.joinTrip) {
        throw new GraphQLError("joinTrip operation not yet implemented", {
          extensions: { code: "NOT_IMPLEMENTED" },
        });
      }

      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.tripController;
      const result = await controller.joinTrip({
        tripId: args.input.tripId,
        userId: ctx.authContext.userId,
        role: args.input.role ?? "MEMBER",
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Leave a trip
   */
  leaveTrip: t.field({
    type: LeaveTripResultType,
    args: {
      tripId: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { tripId: string },
      ctx: TripMutationContext,
    ) => {
      if (!ctx.controllers.tripController.leaveTrip) {
        throw new GraphQLError("leaveTrip operation not yet implemented", {
          extensions: { code: "NOT_IMPLEMENTED" },
        });
      }

      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.tripController;
      const result = await controller.leaveTrip({
        tripId: args.tripId,
        userId: ctx.authContext.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return {
        success: result.data.success,
        tripId: result.data.tripId,
      };
    },
  }),

  /**
   * Invite someone to a trip
   */
  inviteToTrip: t.field({
    type: TripParticipantType,
    args: {
      input: t.arg({ type: InviteToTripInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          userId: string;
          role?: "MEMBER" | "LEADER" | null;
        };
      },
      ctx: TripMutationContext,
    ) => {
      if (!ctx.controllers.tripController.inviteToTrip) {
        throw new GraphQLError("inviteToTrip operation not yet implemented", {
          extensions: { code: "NOT_IMPLEMENTED" },
        });
      }

      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.tripController;
      const result = await controller.inviteToTrip({
        tripId: args.input.tripId,
        userId: args.input.userId,
        invitedById: ctx.authContext.userId,
        role: args.input.role ?? "MEMBER",
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Upload a resource to a trip
   */
  uploadTripResource: t.field({
    type: TripResourceType,
    args: {
      input: t.arg({ type: UploadTripResourceInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          name: string;
          description?: string | null;
          type: string;
          url: string;
          fileSize?: number | null;
          mimeType?: string | null;
        };
      },
      ctx: TripMutationContext,
    ) => {
      if (!ctx.controllers.tripController.uploadTripResource) {
        throw new GraphQLError(
          "uploadTripResource operation not yet implemented",
          {
            extensions: { code: "NOT_IMPLEMENTED" },
          },
        );
      }

      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.tripController;
      const result = await controller.uploadTripResource({
        tripId: args.input.tripId,
        name: args.input.name,
        description: args.input.description ?? undefined,
        type: args.input.type,
        url: args.input.url,
        fileSize: args.input.fileSize ?? undefined,
        mimeType: args.input.mimeType ?? undefined,
        uploadedById: ctx.authContext.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),
}));

export {};
