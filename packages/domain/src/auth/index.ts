// Auth domain barrel exports
export * from "./errors/AuthErrors";
export * from "./ports";

// Re-export auth types from shared/services (single source of truth)
export {
  type AccessCheckRequest,
  type PermissionLevel,
  type ResourceType,
  type TripRole,
  sanitizeAccessCheckRequest,
  accessCheckRequestToString,
} from "../shared/services";
