import { builder } from "../../builder.js";

/**
 * Group Ranking Entry Type
 *
 * Represents a group's ranking information within a trip.
 */
const GroupRankingType = builder.objectType("GroupRanking", {
  description: "A group's ranking entry",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    image: t.exposeString("image", { nullable: true }),
    coins: t.field({
      type: "Int",
      resolve: (parent: { coins: number }) => parent.coins,
    }),
    participants: t.field({
      type: ["User"],
      resolve: (parent: { participants: Array<{ id: string }> }) =>
        parent.participants,
    }),
  }),
});

/**
 * Trip Rankings Result Type
 *
 * Contains rankings for a specific trip.
 */
const TripRankingsType = builder.objectType("TripRankings", {
  description: "Rankings result for a specific trip",
  fields: (t) => ({
    tripId: t.exposeID("tripId"),
    groups: t.field({
      type: [GroupRankingType],
      resolve: (parent: { groups: unknown[] }) => parent.groups,
    }),
  }),
});

/**
 * Batch Rankings Result Type
 *
 * Contains rankings for multiple trips.
 */
const BatchRankingsResultType = builder.objectType("BatchRankingsResult", {
  description: "Batch rankings result for multiple trips",
  fields: (t) => ({
    rankings: t.field({
      type: [TripRankingsType],
      resolve: (parent: { rankings: unknown[] }) => parent.rankings,
    }),
  }),
});

/**
 * User Avatar URL Entry Type
 *
 * Maps a user ID to their avatar URL.
 */
const UserAvatarUrlType = builder.objectType("UserAvatarUrl", {
  description: "User ID to avatar URL mapping",
  fields: (t) => ({
    userId: t.exposeID("userId"),
    url: t.exposeString("url", { nullable: true }),
  }),
});

/**
 * Batch Avatar URLs Result Type
 *
 * Contains avatar URLs for multiple users.
 */
const BatchAvatarUrlsResultType = builder.objectType("BatchAvatarUrlsResult", {
  description: "Batch avatar URLs result for multiple users",
  fields: (t) => ({
    avatars: t.field({
      type: [UserAvatarUrlType],
      resolve: (parent: { avatars: unknown[] }) => parent.avatars,
    }),
  }),
});

export {
  GroupRankingType,
  TripRankingsType,
  BatchRankingsResultType,
  UserAvatarUrlType,
  BatchAvatarUrlsResultType,
};
