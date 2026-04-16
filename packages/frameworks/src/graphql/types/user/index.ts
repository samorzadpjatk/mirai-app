// User domain module - exports and side-effect registration
// Importing this module registers all User types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";

// Re-export all types and helpers for use in other modules
export {
  UserType,
  UserEdgeType,
  UserConnectionType,
  encodeUserCursor,
  buildUserConnection,
} from "./types.js";
