// Sponsor domain module - exports and side-effect registration
// Importing this module registers all Sponsor types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";

// Re-export all types and helpers for use in other modules
export {
  SponsorType,
  TripSponsorType,
  SponsorEdgeType,
  TripSponsorEdgeType,
  SponsorConnectionType,
  TripSponsorConnectionType,
  encodeSponsorCursor,
  encodeTripSponsorCursor,
  buildSponsorConnection,
  buildTripSponsorConnection,
} from "./types.js";
