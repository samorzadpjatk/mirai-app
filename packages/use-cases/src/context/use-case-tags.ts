/**
 * Use Case Context Tags - Effect DI for use cases
 *
 * This module defines Context.Tags for all use cases to enable
 * Effect-based dependency injection in controllers/resolvers.
 *
 * Pattern follows CLAUDE.md §10.4 - Tags wrap use case interfaces
 * with an execute() method for consistent access.
 *
 * @module context/use-case-tags
 */

import { Context, Effect } from "effect";

// =============================================================================
// User Use Case Types
// =============================================================================

import type {
  GetUserInput,
  GetUserOutput,
  GetUserNotFoundError,
} from "../interactors/GetUser";

import type {
  CreateUserInput,
  CreateUserOutput,
  UserAlreadyExistsError,
  UserCreationError,
} from "../interactors/CreateUser";

import type {
  UpdateUserInput,
  UpdateUserOutput,
  UserNotFoundError,
  UserUpdateError,
} from "../interactors/UpdateUser";

import type { DatabaseError } from "../ports/errors";

// =============================================================================
// Trip Use Case Types
// =============================================================================

import type {
  GetTripByIdInput,
  GetTripByIdOutput,
  GetTripByIdNotFoundError,
} from "../interactors/GetTripById";

import type {
  CreateTripInput,
  CreateTripOutput,
  TripCreationError,
} from "../interactors/CreateTrip";

import type {
  UpdateTripInput,
  UpdateTripOutput,
  UpdateTripNotFoundError,
  UpdateTripValidationError,
  UpdateTripStateError,
} from "../interactors/UpdateTrip";

// =============================================================================
// Challenge Use Case Types
// =============================================================================

import type {
  GetChallengeInput,
  GetChallengeOutput,
  ChallengeNotFoundError,
  ChallengeLoadError,
} from "../interactors/GetChallenge";

import type {
  CreateChallengeInput,
  CreateChallengeOutput,
  ChallengeCreationError,
  ChallengeRepositoryError,
} from "../interactors/CreateChallenge";

// =============================================================================
// Port Imports for Dependencies
// =============================================================================

import type { UserRepositoryTag } from "../ports/UserRepository";
import type { TripRepositoryTag } from "../ports/TripRepository";
import type { ChallengeRepositoryTag } from "../ports/ChallengeRepository";

// =============================================================================
// User Use Case Tags
// =============================================================================

/**
 * Interface for GetUserUseCase
 */
export interface GetUserUseCase {
  execute(
    input: GetUserInput,
  ): Effect.Effect<
    GetUserOutput,
    GetUserNotFoundError | DatabaseError,
    UserRepositoryTag
  >;
}

/**
 * Context.Tag for GetUserUseCase dependency injection
 */
export class GetUserUseCaseTag extends Context.Tag("GetUserUseCase")<
  GetUserUseCaseTag,
  GetUserUseCase
>() {}

/**
 * Interface for CreateUserUseCase
 */
export interface CreateUserUseCase {
  execute(
    input: CreateUserInput,
  ): Effect.Effect<
    CreateUserOutput,
    UserAlreadyExistsError | UserCreationError,
    UserRepositoryTag
  >;
}

/**
 * Context.Tag for CreateUserUseCase dependency injection
 */
export class CreateUserUseCaseTag extends Context.Tag("CreateUserUseCase")<
  CreateUserUseCaseTag,
  CreateUserUseCase
>() {}

/**
 * Interface for UpdateUserUseCase
 */
export interface UpdateUserUseCase {
  execute(
    input: UpdateUserInput,
  ): Effect.Effect<
    UpdateUserOutput,
    UserNotFoundError | UserUpdateError,
    UserRepositoryTag
  >;
}

/**
 * Context.Tag for UpdateUserUseCase dependency injection
 */
export class UpdateUserUseCaseTag extends Context.Tag("UpdateUserUseCase")<
  UpdateUserUseCaseTag,
  UpdateUserUseCase
>() {}

// =============================================================================
// Trip Use Case Tags
// =============================================================================

/**
 * Interface for GetTripUseCase (uses getTripByIdUseCase)
 */
export interface GetTripUseCase {
  execute(
    input: GetTripByIdInput,
  ): Effect.Effect<
    GetTripByIdOutput,
    GetTripByIdNotFoundError,
    TripRepositoryTag
  >;
}

/**
 * Context.Tag for GetTripUseCase dependency injection
 */
export class GetTripUseCaseTag extends Context.Tag("GetTripUseCase")<
  GetTripUseCaseTag,
  GetTripUseCase
>() {}

/**
 * Interface for CreateTripUseCase
 */
export interface CreateTripUseCase {
  execute(
    input: CreateTripInput,
  ): Effect.Effect<CreateTripOutput, TripCreationError, TripRepositoryTag>;
}

/**
 * Context.Tag for CreateTripUseCase dependency injection
 */
export class CreateTripUseCaseTag extends Context.Tag("CreateTripUseCase")<
  CreateTripUseCaseTag,
  CreateTripUseCase
>() {}

/**
 * Interface for UpdateTripUseCase
 */
export interface UpdateTripUseCase {
  execute(
    input: UpdateTripInput,
  ): Effect.Effect<
    UpdateTripOutput,
    UpdateTripNotFoundError | UpdateTripValidationError | UpdateTripStateError,
    TripRepositoryTag
  >;
}

/**
 * Context.Tag for UpdateTripUseCase dependency injection
 */
export class UpdateTripUseCaseTag extends Context.Tag("UpdateTripUseCase")<
  UpdateTripUseCaseTag,
  UpdateTripUseCase
>() {}

// =============================================================================
// Challenge Use Case Tags
// =============================================================================

/**
 * Interface for GetChallengeUseCase
 */
export interface GetChallengeUseCase {
  execute(
    input: GetChallengeInput,
  ): Effect.Effect<
    GetChallengeOutput,
    ChallengeNotFoundError | ChallengeLoadError,
    ChallengeRepositoryTag
  >;
}

/**
 * Context.Tag for GetChallengeUseCase dependency injection
 */
export class GetChallengeUseCaseTag extends Context.Tag("GetChallengeUseCase")<
  GetChallengeUseCaseTag,
  GetChallengeUseCase
>() {}

/**
 * Interface for CreateChallengeUseCase
 */
export interface CreateChallengeUseCase {
  execute(
    input: CreateChallengeInput,
  ): Effect.Effect<
    CreateChallengeOutput,
    ChallengeCreationError | ChallengeRepositoryError,
    ChallengeRepositoryTag
  >;
}

/**
 * Context.Tag for CreateChallengeUseCase dependency injection
 */
export class CreateChallengeUseCaseTag extends Context.Tag(
  "CreateChallengeUseCase",
)<CreateChallengeUseCaseTag, CreateChallengeUseCase>() {}
