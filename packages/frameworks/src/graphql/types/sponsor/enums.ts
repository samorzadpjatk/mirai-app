import { builder } from "../../builder.js";

/**
 * Create Sponsor Input
 */
export const CreateSponsorInput = builder.inputType("CreateSponsorInput", {
  description: "Input for creating a sponsor",
  fields: (t) => ({
    name: t.field({ type: "String", required: true }),
    description: t.field({ type: "String" }),
    logoUrl: t.field({ type: "String" }),
    websiteUrl: t.field({ type: "String" }),
    contactEmail: t.field({ type: "String" }),
    contactPhone: t.field({ type: "String" }),
  }),
});

/**
 * Link Sponsor to Trip Input
 */
export const LinkSponsorInput = builder.inputType("LinkSponsorInput", {
  description: "Input for linking a sponsor to a trip",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    sponsorId: t.field({ type: "ID", required: true }),
    tier: t.field({ type: "String", required: true }),
    benefits: t.field({ type: "String" }),
    displayOrder: t.field({ type: "Int" }),
  }),
});
