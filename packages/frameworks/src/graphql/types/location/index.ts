// Location domain module - exports and side-effect registration
// Importing this module registers all Location types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./mutations.js";
import "./subscriptions.js";

// Re-export all types and helpers for use in other modules
export {
  LocationType,
  FriendLocationType,
  LocationEdgeType,
  LocationConnectionType,
  encodeLocationCursor,
  buildLocationConnection,
} from "./types.js";
