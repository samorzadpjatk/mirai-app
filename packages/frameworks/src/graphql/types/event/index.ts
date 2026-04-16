// Event domain module - exports and side-effect registration
// Importing this module registers all Event types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";

// Re-export all types and helpers for use in other modules
export {
  EventType,
  EventEdgeType,
  EventConnectionType,
  encodeEventCursor,
  buildEventConnection,
} from "./types.js";
