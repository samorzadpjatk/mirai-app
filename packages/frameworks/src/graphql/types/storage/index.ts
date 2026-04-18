import { builder } from "../../builder.js";

export const StorageUploadUrlType = builder.objectType("StorageUploadUrl", {
  description: "Pre-signed upload URL for storage",
  fields: (t) => ({
    url: t.exposeString("url"),
    path: t.exposeString("path"),
    expiresAt: t.field({ type: "DateTime", resolve: (u) => u.expiresAt }),
  }),
});

export const StorageDeleteResultType = builder.objectType("StorageDeleteResult", {
  fields: (t) => ({
    success: t.exposeBoolean("success"),
    path: t.exposeString("path"),
  }),
});

export const GetUploadUrlInput = builder.inputType("GetUploadUrlInput", {
  fields: (t) => ({
    filename: t.string({ required: true }),
    contentType: t.string({ required: true }),
    bucket: t.string({ required: false }),
  }),
});

import "./queries.js";
import "./mutations.js";
