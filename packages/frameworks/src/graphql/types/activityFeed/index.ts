import { builder } from "../../builder.js";

export const ActivityFeedItemType = builder.objectType("ActivityFeedItem", {
  description: "Activity feed item",
  fields: (t) => ({
    id: t.exposeID("id"),
    type: t.field({
      type: "String",
      resolve: (item) => item.activityType,
    }),
    title: t.exposeString("title"),
    description: t.exposeString("description", { nullable: true }),
    imageUrl: t.exposeString("imageUrl", { nullable: true }),
    isPinned: t.exposeBoolean("isPinned"),
    isHidden: t.exposeBoolean("isHidden"),
    createdAt: t.field({ type: "DateTime", resolve: (item) => item.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (item) => item.updatedAt }),
  }),
});

export const ActivityFeedConnectionType = builder.connectionObject(
  { name: "ActivityFeedConnection", type: ActivityFeedItemType },
  { name: "ActivityFeedEdge" }
);

import "./queries.js";
