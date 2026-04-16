// Group domain module - exports and side-effect registration
// Importing this module registers all Group types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./mutations.js";

// Re-export all types and helpers for use in other modules
export {
  // Enums
  GroupRoleEnum,
  JoinRequestStatusEnum,
  // Types
  GroupType,
  GroupEdgeType,
  GroupConnectionType,
  GroupMemberType,
  GroupMemberEdgeType,
  GroupMemberConnectionType,
  GroupJoinRequestType,
  GroupJoinRequestEdgeType,
  GroupJoinRequestConnectionType,
  // Helpers
  encodeGroupCursor,
  encodeGroupMemberCursor,
  encodeGroupJoinRequestCursor,
  buildGroupConnection,
  buildGroupMemberConnection,
  buildGroupJoinRequestConnection,
} from "./types.js";
