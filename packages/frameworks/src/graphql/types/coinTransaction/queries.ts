import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import {
  CoinTransactionConnectionType,
  buildCoinTransactionConnection,
} from "./types.js";
import type { CoinTransactionDTO } from "@mirai-app/domain";

/**
 * CoinTransaction Queries
 */
builder.queryFields((t) => ({
  /**
   * Find coin transactions with cursor-based pagination
   */
  coinTransactions: t.field({
    type: CoinTransactionConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch coin transactions for",
      }),
      groupId: t.arg.id({
        description: "Optional group ID to filter transactions",
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
        groupId?: string | null;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          coinTransactionController: {
            getManyConnection: (input: {
              tripId: string;
              groupId?: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: CoinTransactionDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.coinTransactionController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getManyConnection({
        tripId: args.tripId,
        groupId: args.groupId ?? undefined,
        first,
        after: afterCursor,
      });

      return buildCoinTransactionConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),
}));
