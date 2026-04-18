import { Context } from "effect";
import type { IAuthZPort } from "@mirai-app/domain";
import type { AccessCheckRequest, PermissionLevel, ResourceType } from "@mirai-app/domain";
import type { Role } from "@mirai-app/domain";

/**
 * AuthZ Port Tag - Context.Tag for Effect DI
 *
 * Use this tag to access the IAuthZPort implementation in Effect workflows:
 *   const authZPort = yield* AuthZPortTag;
 *   yield* authZPort.verifyAccess({ token, resourceType, resourceId, requiredPermission });
 *
 * AuthZ (Authorization) handles permission checking:
 * - verifyAccess for resource-level permissions
 * - checkRolePermission for role-based access control
 * - Role validation (ADMIN, MODERATOR, USER, SERVICE)
 */
export class AuthZPortTag extends Context.Tag("AuthZ")<
  AuthZPortTag,
  IAuthZPort
>() {}

/**
 * Re-export types from domain for convenience
 */
export type { IAuthZPort, AccessCheckRequest, PermissionLevel, ResourceType, Role };
