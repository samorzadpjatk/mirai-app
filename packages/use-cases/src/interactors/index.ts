/**
 * Interactors Barrel Export
 *
 * This module re-exports all use case interactors for convenient
 * subpath imports via `@mirai-app/use-cases/interactors`.
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   AuthenticateUserUseCase,
 *   AuthorizeAdminUseCase,
 *   LogTelemetryUseCase,
 * } from "@mirai-app/use-cases/interactors";
 * ```
 *
 * @module interactors
 */

// =============================================================================
// Auth & Telemetry Use Cases
// =============================================================================
export {
  AuthenticateUserUseCase,
  type AuthenticateUserInput,
  type AuthenticateUserOutput,
} from "./AuthenticateUser";

export {
  AuthorizeAdminUseCase,
  authorizeAdminUseCase,
  type AuthorizeAdminInput,
  type AuthorizeAdminOutput,
} from "./AuthorizeAdmin";

export {
  AuthorizeModeratorUseCase,
  authorizeModeratorUseCase,
  type AuthorizeModeratorInput,
  type AuthorizeModeratorOutput,
} from "./AuthorizeModerator";

export {
  LogTelemetryUseCase,
  type LogTelemetryInput,
  type LogTelemetryOutput,
} from "./LogTelemetry";
