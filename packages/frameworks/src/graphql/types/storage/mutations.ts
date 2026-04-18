import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { StorageDeleteResultType } from "./index.js";

builder.mutationFields((t) => ({
  deleteFile: t.field({
    type: StorageDeleteResultType,
    args: { path: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return { success: true, path: args.path };
    },
  }),
}));
