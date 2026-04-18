import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { StorageUploadUrlType, GetUploadUrlInput } from "./index.js";

builder.queryFields((t) => ({
  uploadUrl: t.field({
    type: StorageUploadUrlType,
    args: { input: t.arg({ type: GetUploadUrlInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return { url: "", path: args.input.filename, expiresAt: new Date(Date.now() + 60000) };
    },
  }),
}));
