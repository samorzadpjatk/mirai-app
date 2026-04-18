// =============================================================================
// User Queries - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireModerator, requireAdmin, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import {
  UserType,
  UserWithTripInfoType,
  UserWithGroupInfoType,
  UserProfileType,
  BanStatusType,
  TripParticipantInfoType,
  UserConnectionType,
  AdminNameType,
  SearchUsersInput,
  GetUserByEmailInput,
} from "./types.js";
import {
  normalizePaginationArgs,
  buildConnection,
  encodeCursor,
} from "../../utils/connections.js";

// Import use cases
import {
  GetMyProfileUseCase,
  GetBanStatusUseCase,
  GetBanStatusByEmailUseCase,
  GetUserByIdUseCase,
  GetUserByIdAdminUseCase,
  GetTripParticipantUseCase,
  GetUserWithGroupUseCase,
  GetAllUsersUseCase,
  GetAllAdminsNamesUseCase,
  SearchUsersUseCase,
} from "@mirai-app/use-cases/user";
import { UserId, TripId } from "@mirai-app/domain";

// =============================================================================
// Query Fields - Thin Resolvers
// =============================================================================

builder.queryFields((t) => ({
  me: t.field({
    type: UserProfileType,
    nullable: true,
    resolve: async (_parent, _args, context: GraphQLContext) => {
      const auth = requireAuth(context);
      
      const useCase = new GetMyProfileUseCase();
      const effect = useCase.execute({ userId: UserId.create(auth.userId) });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  myBanStatus: t.field({
    type: BanStatusType,
    resolve: async (_parent, _args, context: GraphQLContext) => {
      const auth = context.authContext;
      
      const useCase = new GetBanStatusUseCase();
      const effect = useCase.execute({ accessToken: auth?.accessToken ?? null });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  myGroupInfo: t.field({
    type: UserWithGroupInfoType,
    nullable: true,
    args: {
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);
      
      const useCase = new GetUserWithGroupUseCase();
      const effect = useCase.execute({ 
        userId: auth.userId,
        tripId: args.tripId,
      });
      
      return runEffect(context, effect).catch((error) => {
        // Return null if user not found (field is nullable)
        if (error && typeof error === "object" && "_tag" in error && error._tag === "UserNotFoundError") {
          return null;
        }
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  user: t.field({
    type: UserType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireModerator(context);
      
      const useCase = new GetUserByIdUseCase();
      const effect = useCase.execute({ userId: args.id });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  userWithGroup: t.field({
    type: UserWithGroupInfoType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireModerator(context);
      
      const useCase = new GetUserWithGroupUseCase();
      const effect = useCase.execute({ 
        userId: args.id,
        tripId: args.tripId,
      });
      
      return runEffect(context, effect).catch((error) => {
        // Return null if user not found (field is nullable)
        if (error && typeof error === "object" && "_tag" in error && error._tag === "UserNotFoundError") {
          return null;
        }
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  tripParticipant: t.field({
    type: TripParticipantInfoType,
    nullable: true,
    args: {
      userId: t.arg.string({ required: true }),
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireModerator(context);
      
      const useCase = new GetTripParticipantUseCase();
      const effect = useCase.execute({
        userId: UserId.create(args.userId),
        tripId: TripId.create(args.tripId),
      });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  banStatusByEmail: t.field({
    type: BanStatusType,
    args: {
      input: t.arg({ type: GetUserByEmailInput, required: true }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const useCase = new GetBanStatusByEmailUseCase();
      const effect = useCase.execute({ email: args.input.email });
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),

  users: t.field({
    type: UserConnectionType,
    args: {
      tripId: t.arg.string({ required: true }),
      first: t.arg.int(),
      after: t.arg.string(),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireModerator(context);

      const { limit, after } = normalizePaginationArgs(args);
      const offset = after ? parseInt(decodeURIComponent(after), 10) : 0;

      const useCase = new GetAllUsersUseCase();
      const effect = useCase.execute({
        tripId: args.tripId,
      });

      const allUsers = await runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });

      // Apply pagination to results
      const users = allUsers.slice(offset, offset + limit);
      const hasMore = offset + limit < allUsers.length;

      return buildConnection({
        items: users,
        hasMore,
        getCursor: (user) => encodeCursor(user.id),
        totalCount: allUsers.length,
      });
    },
  }),

  searchUsers: t.field({
    type: UserConnectionType,
    args: {
      tripId: t.arg.string({ required: true }),
      field: t.arg.string({ required: true }), // firstName, lastName, email, wristNumber, houseNumber, groupName
      searchTerm: t.arg.string(),
      first: t.arg.int(),
      after: t.arg.string(),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireModerator(context);

      const { limit, after } = normalizePaginationArgs(args);
      const offset = after ? parseInt(decodeURIComponent(after), 10) : 0;

      const useCase = new SearchUsersUseCase();
      const effect = useCase.execute({
        tripId: TripId.create(args.tripId),
        field: args.field as "firstName" | "lastName" | "email" | "wristNumber" | "houseNumber" | "groupName",
        searchTerm: args.searchTerm ?? undefined,
        limit,
        offset,
      });

      const result = await runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });

      const hasMore = result.pagination.hasNextPage;

      return buildConnection({
        items: result.users,
        hasMore,
        getCursor: (user) => encodeCursor(user.id),
        totalCount: result.pagination.total,
      });
    },
  }),

  adminNames: t.field({
    type: [AdminNameType],
    resolve: async (_parent, _args, context: GraphQLContext) => {
      requireModerator(context);
      
      const useCase = new GetAllAdminsNamesUseCase();
      const effect = useCase.execute();
      
      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
}));

export const userQueries = {};
