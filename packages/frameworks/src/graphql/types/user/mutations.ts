// =============================================================================
// User Mutations - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireAdmin, runEffect } from "../../context.js";
import { mapErrorToGraphQL, badRequestError } from "../../errors.js";
import {
  UpdateUserProfileInput,
  UpdateAvatarInput,
  CreateUserInput,
  UpdateUserRoleInput,
  UpdateUserNameInput,
  BanUserInput,
  UpdateWristNumberInput,
  UpdateHouseNumberInput,
  DeleteUserInput,
  UpdateProfileResultType,
  AvatarUpdateResultType,
  CreateUserResultType,
  UpdateUserResultType,
  DeleteUserResultType,
  BanUserResultType,
  ParticipantNumberResultType,
} from "./types.js";

// Import use cases
import {
  UpdateMyProfileUseCase,
  UpdateAvatarUseCase,
  CreateUserUseCase,
  UpdateUserRoleUseCase,
  UpdateUserNameUseCase,
  BanUserUseCase,
  DeleteUserUseCase,
  UpdateWristNumberUseCase,
  RemoveWristNumberUseCase,
  UpdateHouseNumberUseCase,
  RemoveHouseNumberUseCase,
} from "@mirai-app/use-cases/user";
import { UserId, TripId } from "@mirai-app/domain";

// =============================================================================
// Mutation Fields - Thin Resolvers
// =============================================================================

builder.mutationFields((t) => ({
  updateMyProfile: t.field({
    type: UpdateProfileResultType,
    args: {
      input: t.arg({ type: UpdateUserProfileInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);
      
      const useCase = new UpdateMyProfileUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(auth.userId),
        firstName: args.input.firstName,
        lastName: args.input.lastName,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  updateAvatar: t.field({
    type: AvatarUpdateResultType,
    args: {
      input: t.arg({ type: UpdateAvatarInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);
      
      const useCase = new UpdateAvatarUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(auth.userId),
        hasAvatar: args.input.hasAvatar,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  createUser: t.field({
    type: CreateUserResultType,
    args: {
      input: t.arg({ type: CreateUserInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new CreateUserUseCase();
      const effect = useCase.execute({
        tripId: args.input.tripId,
        firstName: args.input.firstName,
        lastName: args.input.lastName,
        email: args.input.email,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  updateUserRole: t.field({
    type: UpdateUserResultType,
    args: {
      input: t.arg({ type: UpdateUserRoleInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAdmin(context);
      
      if (args.input.userId === auth.userId && args.input.role !== "ADMIN") {
        throw badRequestError("You cannot remove your own admin privileges");
      }
      
      const useCase = new UpdateUserRoleUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(args.input.userId),
        role: args.input.role,
        currentUserId: UserId.unsafeCreate(auth.userId),
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  updateUserName: t.field({
    type: UpdateUserResultType,
    args: {
      input: t.arg({ type: UpdateUserNameInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new UpdateUserNameUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(args.input.userId),
        firstName: args.input.firstName,
        lastName: args.input.lastName,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  banUser: t.field({
    type: BanUserResultType,
    args: {
      input: t.arg({ type: BanUserInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const bannedUntil = new Date(args.input.bannedUntilMs);
      if (Number.isNaN(bannedUntil.getTime())) {
        throw badRequestError("Invalid ban date");
      }
      if (bannedUntil.getTime() <= Date.now()) {
        throw badRequestError("Ban date must be in the future");
      }
      
      const useCase = new BanUserUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(args.input.userId),
        bannedUntilMs: args.input.bannedUntilMs,
        reason: args.input.reason ?? undefined,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  deleteUser: t.field({
    type: DeleteUserResultType,
    args: {
      input: t.arg({ type: DeleteUserInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new DeleteUserUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(args.input.userId),
        tripId: args.input.tripId,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  updateWristNumber: t.field({
    type: ParticipantNumberResultType,
    args: {
      input: t.arg({ type: UpdateWristNumberInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new UpdateWristNumberUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(args.input.userId),
        tripId: TripId.unsafeCreate(args.input.tripId),
        wristNumber: args.input.wristNumber,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  removeWristNumber: t.field({
    type: ParticipantNumberResultType,
    args: {
      userId: t.arg.string({ required: true }),
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new RemoveWristNumberUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(args.userId),
        tripId: TripId.unsafeCreate(args.tripId),
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  updateHouseNumber: t.field({
    type: ParticipantNumberResultType,
    args: {
      input: t.arg({ type: UpdateHouseNumberInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new UpdateHouseNumberUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(args.input.userId),
        tripId: TripId.unsafeCreate(args.input.tripId),
        houseNumber: args.input.houseNumber,
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  removeHouseNumber: t.field({
    type: ParticipantNumberResultType,
    args: {
      userId: t.arg.string({ required: true }),
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      
      const useCase = new RemoveHouseNumberUseCase();
      const effect = useCase.execute({
        userId: UserId.unsafeCreate(args.userId),
        tripId: TripId.unsafeCreate(args.tripId),
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
}));

export const userMutations = {};
