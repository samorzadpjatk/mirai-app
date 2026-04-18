// =============================================================================
// Trip Types
// =============================================================================

import { builder } from "../../builder.js";
import type { TripDTO, TripWithDetailsDTO, TripWithParticipantsDTO } from "@mirai-app/use-cases/trip/dto";
import type { TripId } from "@mirai-app/domain";
import { TripSponsorType } from "../sponsor/index.js";

// =============================================================================
// Import Connection Utilities
// =============================================================================

import { encodeCursor, buildConnection } from "../../utils/connections.js";

// =============================================================================
// Object Types
// =============================================================================

/**
 * Trip type
 *
 * Core trip entity representing a travel event.
 * Can be converted to Relay Node pattern when PothosTypes are configured.
 */
export const TripType = builder.objectType("Trip", {
  description: "Trip entity representing a travel event",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    startDate: t.field({
      type: "DateTime",
      resolve: (trip) => trip.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      resolve: (trip) => trip.endDate,
    }),
    location: t.exposeString("location", { nullable: true }),
    image: t.exposeString("image", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (trip) => trip.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (trip) => trip.updatedAt,
    }),
  }),
});

/**
 * Group info within trip context
 */
export const TripGroupType = builder.objectType("TripGroup", {
  description: "Group information within trip context",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    code: t.field({
      type: "String",
      nullable: true,
      resolve: (group) => (group as { code?: string | null }).code ?? null,
    }),
    image: t.exposeString("image", { nullable: true }),
    coins: t.exposeInt("coins"),
    participantCount: t.int({
      resolve: (group) => (group as { participantCount?: number }).participantCount ?? 0,
    }),
    isDeleted: t.exposeBoolean("isDeleted"),
  }),
});

/**
 * Trip participant user info
 */
export const TripParticipantUserType = builder.objectType("TripParticipantUser", {
  description: "User information for trip participant",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    email: t.exposeString("email", { nullable: true }),
    role: t.exposeString("role"),
  }),
});

/**
 * Trip participant info
 */
export const TripParticipantDetailType = builder.objectType("TripParticipantDetail", {
  description: "Detailed trip participant information",
  fields: (t) => ({
    userId: t.exposeID("userId"),
    tripId: t.exposeID("tripId"),
    wristNumber: t.exposeString("wristNumber", { nullable: true }),
    houseNumber: t.exposeString("houseNumber", { nullable: true }),
    user: t.field({
      type: TripParticipantUserType,
      resolve: (participant) => participant.user,
    }),
    group: t.field({
      type: TripGroupType,
      nullable: true,
      resolve: (participant) => participant.group,
    }),
  }),
});

/**
 * Trip with groups and sponsors
 */
export const TripWithDetailsType = builder.objectType("TripWithDetails", {
  description: "Trip with groups and sponsors",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    startDate: t.field({
      type: "DateTime",
      resolve: (trip) => trip.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      resolve: (trip) => trip.endDate,
    }),
    location: t.exposeString("location", { nullable: true }),
    image: t.exposeString("image", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    groups: t.field({
      type: [TripGroupType],
      resolve: (trip) => trip.groups || [],
    }),
    tripSponsors: t.field({
      type: [TripSponsorType],
      resolve: (trip) => trip.tripSponsors || [],
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (trip) => trip.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (trip) => trip.updatedAt,
    }),
  }),
});

/**
 * Trip with full details including participants
 */
export const TripWithParticipantsType = builder.objectType("TripWithParticipants", {
  description: "Trip with full details including participants",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    startDate: t.field({
      type: "DateTime",
      resolve: (trip) => trip.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      resolve: (trip) => trip.endDate,
    }),
    location: t.exposeString("location", { nullable: true }),
    image: t.exposeString("image", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    groups: t.field({
      type: [TripGroupType],
      resolve: (trip) => trip.groups || [],
    }),
    tripSponsors: t.field({
      type: [TripSponsorType],
      resolve: (trip) => trip.tripSponsors || [],
    }),
    participants: t.field({
      type: [TripParticipantDetailType],
      resolve: (trip) =>
        (trip.participants || []).map((p) => ({
          userId: p.userId,
          tripId: p.tripId,
          wristNumber: p.wristNumber,
          houseNumber: p.houseNumber,
          user: p.user,
          group: p.group
            ? {
                id: p.group.id,
                name: p.group.name,
                code: null,
                image: p.group.image,
                coins: p.group.coins,
                participantCount: p.group.participantCount,
                isDeleted: p.group.isDeleted,
              }
            : null,
        })),
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (trip) => trip.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (trip) => trip.updatedAt,
    }),
  }),
});

/**
 * Trip resource type
 */
export const TripResourceType = builder.objectType("TripResource", {
  description: "Trip resource or document",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    title: t.exposeString("title"),
    description: t.exposeString("description", { nullable: true }),
    iconName: t.exposeString("iconName", { nullable: true }),
    content: t.exposeString("content"),
    sortOrder: t.exposeInt("sortOrder"),
    createdAt: t.field({ type: "DateTime", resolve: (r) => r.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (r) => r.updatedAt }),
  }),
});

/**
 * Trip insurance step type
 */
export const InsuranceStepType = builder.objectType("InsuranceStep", {
  description: "Insurance claim step",
  fields: (t) => ({
    id: t.exposeID("id"),
    stepNumber: t.exposeInt("stepNumber"),
    title: t.exposeString("title"),
    description: t.exposeString("description", { nullable: true }),
  }),
});

/**
 * Trip insurance type
 */
export const TripInsuranceType = builder.objectType("TripInsurance", {
  description: "Trip insurance information",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    title: t.exposeString("title"),
    description: t.exposeString("description", { nullable: true }),
    provider: t.exposeString("provider", { nullable: true }),
    policyNumber: t.exposeString("policyNumber", { nullable: true }),
    steps: t.field({
      type: [InsuranceStepType],
      resolve: (insurance) => insurance.steps || [],
    }),
    createdAt: t.field({ type: "DateTime", resolve: (i) => i.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (i) => i.updatedAt }),
  }),
});

/**
 * Trip resources result
 */
export const TripResourcesResultType = builder.objectType("TripResourcesResult", {
  description: "Trip resources query result",
  fields: (t) => ({
    resources: t.field({
      type: [TripResourceType],
      resolve: (result) => result.resources || [],
    }),
    insurance: t.field({
      type: TripInsuranceType,
      nullable: true,
      resolve: (result) => result.insurance,
    }),
  }),
});

/**
 * TripConnection - Relay connection type for paginated trips
 *
 * Uses cursor-based pagination with edges/nodes structure.
 * This is the recommended pattern for all list queries.
 */
export const TripConnectionType = builder.connectionObject(
  { name: "TripConnection", type: TripType },
  { name: "TripEdge" }
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Create trip input
 */
export const CreateTripInput = builder.inputType("CreateTripInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    startDate: t.field({ type: "DateTime", required: true }),
    endDate: t.field({ type: "DateTime", required: true }),
    backgroundImagePath: t.string({ required: false }),
  }),
});

/**
 * Update trip input
 */
export const UpdateTripInput = builder.inputType("UpdateTripInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    startDate: t.field({ type: "DateTime", required: false }),
    endDate: t.field({ type: "DateTime", required: false }),
    backgroundImagePath: t.string({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});

/**
 * Get trip by ID input
 */
export const GetTripInput = builder.inputType("GetTripInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
  }),
});

/**
 * Delete trip input
 */
export const DeleteTripInput = builder.inputType("DeleteTripInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
  }),
});

// =============================================================================
// Result Types
// =============================================================================

/**
 * Create trip result
 */
export const CreateTripResultType = builder.objectType("CreateTripResult", {
  description: "Trip creation result",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    startDate: t.field({
      type: "DateTime",
      resolve: (result) => result.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      resolve: (result) => result.endDate,
    }),
    location: t.exposeString("location", { nullable: true }),
    image: t.exposeString("image", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
  }),
});

/**
 * Update trip result
 */
export const UpdateTripResultType = builder.objectType("UpdateTripResult", {
  description: "Trip update result",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    startDate: t.field({
      type: "DateTime",
      resolve: (result) => result.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      resolve: (result) => result.endDate,
    }),
    location: t.exposeString("location", { nullable: true }),
    image: t.exposeString("image", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
  }),
});

/**
 * Delete trip result
 */
export const DeleteTripResultType = builder.objectType("DeleteTripResult", {
  description: "Trip deletion result",
  fields: (t) => ({
    success: t.exposeBoolean("success"),
  }),
});
