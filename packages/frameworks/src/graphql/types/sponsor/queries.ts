import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { SponsorType } from "./index.js";

builder.queryFields((t) => ({
  sponsors: t.field({
    type: [SponsorType],
    resolve: async (_parent, _args, context: GraphQLContext) => {
      requireAuth(context);
      return [];
    },
  }),
}));
