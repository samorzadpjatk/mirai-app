import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import {
  ChallengeConnectionType,
  ChallengeSubmissionConnectionType,
  ChallengeVoteConnectionType,
  buildChallengeConnection,
  buildChallengeSubmissionConnection,
  buildChallengeVoteConnection,
} from "./types.js";
import type {
  ChallengeDTO,
  ChallengeSubmissionDTO,
  ChallengeVoteDTO,
} from "@mirai-app/use-cases";

/**
 * Challenge Queries
 */
builder.queryFields((t) => ({
  /**
   * Get a single challenge by ID
   */
  challenge: t.field({
    type: "Challenge",
    args: {
      id: t.arg.id({
        required: true,
        description: "ID of the challenge to fetch",
      }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
      },
      ctx: {
        controllers: {
          challengeController: {
            getById: (input: { id: string }) => Promise<{
              success: boolean;
              data?: ChallengeDTO;
              error?: string;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.challengeController;
      const result = await controller.getById({ id: args.id });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Challenge not found");
      }

      return result.data;
    },
  }),

  /**
   * Find challenges for a trip with cursor-based pagination
   */
  challengesByTrip: t.field({
    type: ChallengeConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch challenges for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        tripId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          challengeController: {
            getByTripConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: ChallengeDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.challengeController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByTripConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildChallengeConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Find submissions for a challenge with cursor-based pagination
   */
  challengeSubmissions: t.field({
    type: ChallengeSubmissionConnectionType,
    args: {
      challengeId: t.arg.id({
        required: true,
        description: "ID of the challenge to fetch submissions for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        challengeId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          challengeSubmissionController: {
            getByChallengeConnection: (input: {
              challengeId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: ChallengeSubmissionDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.challengeSubmissionController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByChallengeConnection({
        challengeId: args.challengeId,
        first,
        after: afterCursor,
      });

      return buildChallengeSubmissionConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Find votes for a challenge with cursor-based pagination
   */
  challengeVotes: t.field({
    type: ChallengeVoteConnectionType,
    args: {
      challengeId: t.arg.id({
        required: true,
        description: "ID of the challenge to fetch votes for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        challengeId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          challengeVoteController: {
            getByChallengeConnection: (input: {
              challengeId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: ChallengeVoteDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.challengeVoteController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByChallengeConnection({
        challengeId: args.challengeId,
        first,
        after: afterCursor,
      });

      return buildChallengeVoteConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),
}));
