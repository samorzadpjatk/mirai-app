/**
 * AuthenticateUser Use Case
 *
 * Validates authentication tokens and returns the authentication context.
 * This use case acts as an orchestrator between the framework layer (tRPC middleware)
 * and the authentication port (Supabase Auth, JWT, etc.).
 *
 * ## Responsibility
 * - Accepts a raw authentication token
 * - Delegates validation to the AuthPort
 * - Returns Result<AuthContext, AuthError> for explicit error handling
 *
 * ## Design Decisions
 * - Uses Result type for explicit error handling (no exceptions)
 * - Framework-agnostic (no tRPC dependencies)
 * - Promise-based (async/await), not Effect
 * - Delegates to AuthPort for actual authentication mechanism
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new AuthenticateUserUseCase(authPort);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("authenticateUserUseCase");
 * ```
 *
 * @module interactors
 */

import type { Result, AuthContext } from "@mirai-app/domain";
import type { AuthPort, AuthError, InvalidTokenError, SessionExpiredError } from "../ports/AuthPort";

/**
 * Input for AuthenticateUser use case
 */
export interface AuthenticateUserInput {
  /** The authentication token to validate */
  token: string;
}

/**
 * Output DTO for AuthenticateUser use case
 *
 * Contains the authentication context on success.
 * Errors are returned as Result.err(), not thrown.
 */
export interface AuthenticateUserOutput {
  /** Unique identifier of the authenticated user */
  userId: string;
  /** Role of the authenticated user */
  role: string;
  /** Timestamp when the authentication was established */
  authenticatedAt: Date;
  /** Optional session identifier */
  sessionId?: string;
}

/**
 * AuthenticateUser Use Case
 *
 * Validates an authentication token and returns the authentication context.
 *
 * @example
 * ```typescript
 * const useCase = new AuthenticateUserUseCase(authPort);
 * const result = await useCase.execute({ token: "jwt-token-string" });
 *
 * if (isOk(result)) {
 *   const context = result.value;
 *   console.log(`User ${context.userId} authenticated with role ${context.role}`);
 * } else {
 *   // Handle error: result.error
 *   console.error(`Authentication failed: ${result.error.message}`);
 * }
 * ```
 */
export class AuthenticateUserUseCase {
  constructor(private readonly authPort: AuthPort) {}

  /**
   * Execute the authentication use case
   *
   * @param input - Object containing the token to validate
   * @returns Result<AuthContext, AuthError | InvalidTokenError>
   *
   * @example
   * ```typescript
   * const result = await useCase.execute({ token: "my-jwt-token" });
   *
   * if (isOk(result)) {
   *   // Access auth context
   *   const { userId, role, isAdmin } = result.value;
   * } else {
   *   // Handle specific error types
   *   if (result.error._tag === "InvalidTokenError") {
   *     // Token is malformed or invalid
   *   } else if (result.error._tag === "AuthError") {
   *     // General auth failure
   *   }
   * }
   * ```
   */
  async execute(
    input: AuthenticateUserInput,
  ): Promise<Result<AuthContext, AuthError | InvalidTokenError | SessionExpiredError>> {
    // Delegate validation to the auth port
    // The port handles the actual authentication mechanism (Supabase, JWT, etc.)
    return this.authPort.validateToken(input.token);
  }
}
