// Activity domain module - exports and side-effect registration
// Importing this module registers all Activity types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./mutations.js";

// Re-export all types and helpers for use in other modules
export {
  ActivityType,
  ActivityEdgeType,
  ActivityConnectionType,
  ActivityReactionType,
  HiddenActivityResultType,
  ActivityTypeEnum,
  ReactionTypeEnum,
  encodeActivityCursor,
  buildActivityConnection,
} from "./types.js";
