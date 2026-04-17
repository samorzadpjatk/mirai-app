import { builder } from "../../builder.js";

/**
 * Ban Status Type
 *
 * Represents the ban status of a user account.
 */
export const BanStatusType = builder.objectType("BanStatus", {
  description: "Ban status information for a user account",
  fields: (t) => ({
    banned: t.exposeBoolean("banned"),
    bannedUntil: t.field({
      type: "DateTime",
      nullable: true,
      description: "When the ban expires, if currently banned",
      resolve: (parent: { bannedUntil: string | null }) =>
        parent.bannedUntil ? new Date(parent.bannedUntil) : null,
    }),
    reason: t.exposeString("reason", { nullable: true }),
  }),
});

/**
 * Ban Status With Existence Check Type
 *
 * Used for pre-login email checks that also verify user existence.
 */
export const BanStatusWithExistenceType = builder.objectType(
  "BanStatusWithExistence",
  {
    description: "Ban status with user existence information",
    fields: (t) => ({
      exists: t.exposeBoolean("exists"),
      banned: t.exposeBoolean("banned"),
      bannedUntil: t.field({
        type: "DateTime",
        nullable: true,
        description: "When the ban expires, if currently banned",
        resolve: (parent: { bannedUntil: string | null }) =>
          parent.bannedUntil ? new Date(parent.bannedUntil) : null,
      }),
      reason: t.exposeString("reason", { nullable: true }),
    }),
  },
);
