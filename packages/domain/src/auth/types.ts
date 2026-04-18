/**
 * Auth Types - Re-export from shared/services for backward compatibility
 *
 * @deprecated Import directly from @mirai-app/domain shared/services instead.
 * This file is kept for backward compatibility during the migration to Better Auth.
 */

export {
  type ResourceType,
  type PermissionLevel,
  type TripRole,
  type AccessCheckRequest,
  sanitizeAccessCheckRequest,
  accessCheckRequestToString,
} from "../shared/services";
