// Trip domain module - exports and side-effect registration
// Importing this module registers all Trip types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./mutations.js";

// Re-export all types and helpers for use in other modules
export {
  TripType,
  TripEdgeType,
  TripConnectionType,
  TripParticipantType,
  TripParticipantEdgeType,
  TripParticipantConnectionType,
  TripStatusType,
  TripParticipantRoleType,
  encodeTripCursor,
  encodeTripParticipantCursor,
  buildTripConnection,
  buildTripParticipantConnection,
} from "./types.js";
