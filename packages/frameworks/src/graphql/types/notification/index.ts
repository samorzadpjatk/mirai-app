// Notification domain module - exports and side-effect registration
// Importing this module registers all Notification types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./mutations.js";
import "./enums.js";
import "./scheduleTypes.js";
import "./deliveryTypes.js";

// Re-export all types and helpers for use in other modules
export {
  NotificationType,
  NotificationEdgeType,
  NotificationConnectionType,
  encodeNotificationCursor,
  buildNotificationConnection,
} from "./types.js";

export {
  NotificationScheduleType,
  NotificationScheduleEdgeType,
  NotificationScheduleConnectionType,
  encodeNotificationScheduleCursor,
  buildNotificationScheduleConnection,
} from "./scheduleTypes.js";

export {
  NotificationDeliveryType,
  NotificationDeliveryEdgeType,
  NotificationDeliveryConnectionType,
  encodeNotificationDeliveryCursor,
  buildNotificationDeliveryConnection,
} from "./deliveryTypes.js";

export {
  NotificationPriorityEnum,
  NotificationStatusEnum,
  NotificationScheduleTypeEnum,
  LastRunStatusEnum,
  DeliveryStatusEnum,
} from "./enums.js";
