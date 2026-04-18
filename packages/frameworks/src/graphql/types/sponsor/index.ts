import { builder } from "../../builder.js";

export const SponsorType = builder.objectType("Sponsor", {
  description: "Sponsor entity",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description"),
    logoPath: t.exposeString("logoPath"),
    height: t.exposeFloat("height", { nullable: true }),
    offsetX: t.exposeFloat("offsetX", { nullable: true }),
    offsetY: t.exposeFloat("offsetY", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.field({ type: "DateTime", resolve: (s) => s.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (s) => s.updatedAt }),
  }),
});

export const TripSponsorType = builder.objectType("TripSponsor", {
  description: "Sponsor association with trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    sponsorId: t.exposeID("sponsorId"),
    sponsor: t.field({ type: SponsorType, resolve: (ts) => ts.sponsor }),
  }),
});

import "./queries.js";
