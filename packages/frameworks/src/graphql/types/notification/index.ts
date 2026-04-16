// Notification domain module - exports and side-effect registration
// Importing this module registers all Notification types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";

// Re-export all types and helpers for use in other modules
export {
  NotificationType,
  NotificationEdgeType,
  NotificationConnectionType,
  encodeNotificationCursor,
  buildNotificationConnection,
} from "./types.js";
