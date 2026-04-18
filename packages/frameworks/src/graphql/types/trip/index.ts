// =============================================================================
// GraphQL Trip Module
// =============================================================================

/**
 * Trip GraphQL Module
 *
 * Provides GraphQL types, queries, and mutations for trip management:
 * - Trip CRUD operations
 * - Trip resources and insurance
 * - Trip participants and groups
 *
 * ## Queries
 * - myTrips: Get trips current user participates in
 * - trip: Get trip by ID (participant only)
 * - tripAdmin: Get trip by ID (admin only)
 * - tripResources: Get trip resources and insurance
 *
 * ## Mutations
 * - createTrip: Create new trip (admin only)
 * - updateTrip: Update trip (admin only)
 * - deleteTrip: Delete trip (admin only)
 */

// =============================================================================
// Type Exports
// =============================================================================

export {
  TripType,
  TripGroupType,
  TripParticipantUserType,
  TripParticipantDetailType,
  TripWithDetailsType,
  TripWithParticipantsType,
  TripResourceType,
  InsuranceStepType,
  TripInsuranceType,
  TripResourcesResultType,
  TripConnectionType,
  CreateTripInput,
  UpdateTripInput,
  DeleteTripInput,
  CreateTripResultType,
  UpdateTripResultType,
  DeleteTripResultType,
} from "./types.js";

// Re-export TripSponsorType from sponsor module
export { TripSponsorType } from "../sponsor/index.js";

// =============================================================================
// Side-Effect Registration
// =============================================================================

import "./types.js";
import "./queries.js";
import "./mutations.js";
