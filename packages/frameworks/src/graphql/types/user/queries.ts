import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { UserConnectionType, buildUserConnection } from "./types.js";
import type { UserDTO } from "@mirai-app/use-cases";

/**
 * User Queries
 */
builder.queryFields((t) => ({
  /**
   * Find all users with cursor-based pagination
   */
  users: t.field({
    type: UserConnectionType,
    args: {
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
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          userController: {
            getAllConnection: (input: {
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: UserDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.userController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getAllConnection({
        first,
        after: afterCursor,
      });

      return buildUserConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),

  /**
   * Find users by role with cursor-based pagination
   */
  usersByRole: t.field({
    type: UserConnectionType,
    args: {
      role: t.arg.string({
        required: true,
        description: "Role to filter users by",
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
        role: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          userController: {
            getByRoleConnection: (input: {
              role: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: UserDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.userController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByRoleConnection({
        role: args.role,
        first,
        after: afterCursor,
      });

      return buildUserConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),
}));
