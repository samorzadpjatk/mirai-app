import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import { BatchRankingsResultType, BatchAvatarUrlsResultType } from "./types.js";

/**
 * GraphQL Context type for community queries
 */
interface CommunityQueryContext {
  controllers: {
    groupController: {
      getByTripId: (input: {
        tripId: string;
        limit: number;
        after: { id: string; createdAt: Date } | null;
      }) => Promise<{
        items: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          image: string | null;
          organizerId: string;
          code: string;
          coins: number;
          status: string;
          createdAt: Date;
          isActive: boolean;
        }>;
        hasMore: boolean;
      }>;
    };
    userController: {
      getById: (input: { id: string }) => Promise<
        | {
            success: true;
            data: {
              id: string;
              authUserId: string;
              firstName: string;
              lastName: string;
              fullName: string;
              role: string;
              hasAvatar: boolean;
              createdAt: Date;
              lastSeenOn: Date | null;
            };
          }
        | { success: false; error: string }
      >;
    };
  };
}

/**
 * Community Queries
 */
builder.queryFields((t) => ({
  /**
   * Batch fetch rankings for multiple trips at once
   */
  batchRankings: t.field({
    type: BatchRankingsResultType,
    args: {
      tripIds: t.arg({
        type: ["ID"],
        required: true,
        description: "Array of trip IDs to fetch rankings for",
      }),
    },
    resolve: async (
      _parent,
      args: {
        tripIds: string[];
      },
      ctx: CommunityQueryContext,
    ) => {
      const { groupController } = ctx.controllers;

      // Fetch groups for each trip in parallel
      const rankings = await Promise.all(
        args.tripIds.map(async (tripId) => {
          const result = await groupController.getByTripId({
            tripId,
            limit: 100, // Get all groups for ranking
            after: null,
          });

          // Sort groups by coins (descending) for ranking
          const sortedGroups = result.items
            .filter((g) => g.isActive)
            .sort((a, b) => b.coins - a.coins);

          return {
            tripId,
            groups: sortedGroups.map((group) => ({
              id: group.id,
              name: group.name,
              image: group.image,
              coins: group.coins,
              participants: [], // Participants loaded separately if needed
            })),
          };
        }),
      );

      return { rankings };
    },
  }),

  /**
   * Batch fetch avatar URLs for multiple users at once
   */
  batchAvatarUrls: t.field({
    type: BatchAvatarUrlsResultType,
    args: {
      userIds: t.arg({
        type: ["ID"],
        required: true,
        description: "Array of user IDs to fetch avatar URLs for",
      }),
    },
    resolve: async (
      _parent,
      args: {
        userIds: string[];
      },
      ctx: CommunityQueryContext,
    ) => {
      const { userController } = ctx.controllers;

      // Fetch avatar info for each user in parallel
      const avatars = await Promise.all(
        args.userIds.map(async (userId) => {
          const result = await userController.getById({ id: userId });

          if (!result.success) {
            return {
              userId,
              url: null,
            };
          }

          // Construct avatar URL based on hasAvatar flag
          const url = result.data.hasAvatar
            ? `/api/avatars/${result.data.authUserId}`
            : null;

          return {
            userId,
            url,
          };
        }),
      );

      return { avatars };
    },
  }),
}));
