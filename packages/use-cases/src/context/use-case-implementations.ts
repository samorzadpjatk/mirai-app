/**
 * Use Case Implementations - Effect Layer bindings for use cases
 *
 * This module creates wrapper objects that adapt function-based use cases
 * to the interface expected by Context.Tags (with execute() methods).
 *
 * These are used in AppLayer to wire use case implementations to their Tags.
 *
 * @module context/use-case-implementations
 */

import { Layer } from "effect";

// =============================================================================
// Import Use Case Functions and Classes from interactors
// =============================================================================

import {
  GetUserUseCase,
  createUserUseCase,
  updateUserUseCase,
  getTripByIdUseCase,
  createTripUseCase,
  updateTripUseCase,
  getChallengeUseCase,
  createChallengeUseCase,
} from "..";

// =============================================================================
// Import Tags and Interfaces from use-case-tags
// =============================================================================

import {
  GetUserUseCaseTag,
  CreateUserUseCaseTag,
  UpdateUserUseCaseTag,
  GetTripUseCaseTag,
  CreateTripUseCaseTag,
  UpdateTripUseCaseTag,
  GetChallengeUseCaseTag,
  CreateChallengeUseCaseTag,
  // Import types with aliases to avoid conflicts
  type GetUserUseCase as GetUserUseCaseInterface,
  type CreateUserUseCase as CreateUserUseCaseInterface,
  type UpdateUserUseCase as UpdateUserUseCaseInterface,
  type GetTripUseCase as GetTripUseCaseInterface,
  type CreateTripUseCase as CreateTripUseCaseInterface,
  type UpdateTripUseCase as UpdateTripUseCaseInterface,
  type GetChallengeUseCase as GetChallengeUseCaseInterface,
  type CreateChallengeUseCase as CreateChallengeUseCaseInterface,
} from "./use-case-tags";

// =============================================================================
// User Use Case Implementations
// =============================================================================

/**
 * GetUserUseCase implementation using the class-based GetUserUseCase
 */
export const getUserUseCaseImpl: GetUserUseCaseInterface = new GetUserUseCase();

/**
 * CreateUserUseCase wrapper - adapts createUserUseCase function to execute() interface
 */
export const createUserUseCaseImpl: CreateUserUseCaseInterface = {
  execute: (input) => createUserUseCase(input),
};

/**
 * UpdateUserUseCase wrapper - adapts updateUserUseCase function to execute() interface
 */
export const updateUserUseCaseImpl: UpdateUserUseCaseInterface = {
  execute: (input) => updateUserUseCase(input),
};

// =============================================================================
// Trip Use Case Implementations
// =============================================================================

/**
 * GetTripUseCase wrapper - adapts getTripByIdUseCase function to execute() interface
 */
export const getTripUseCaseImpl: GetTripUseCaseInterface = {
  execute: (input) => getTripByIdUseCase(input),
};

/**
 * CreateTripUseCase wrapper - adapts createTripUseCase function to execute() interface
 */
export const createTripUseCaseImpl: CreateTripUseCaseInterface = {
  execute: (input) => createTripUseCase(input),
};

/**
 * UpdateTripUseCase wrapper - adapts updateTripUseCase function to execute() interface
 */
export const updateTripUseCaseImpl: UpdateTripUseCaseInterface = {
  execute: (input) => updateTripUseCase(input),
};

// =============================================================================
// Challenge Use Case Implementations
// =============================================================================

/**
 * GetChallengeUseCase wrapper - adapts getChallengeUseCase function to execute() interface
 */
export const getChallengeUseCaseImpl: GetChallengeUseCaseInterface = {
  execute: (input) => getChallengeUseCase(input),
};

/**
 * CreateChallengeUseCase wrapper - adapts createChallengeUseCase function to execute() interface
 */
export const createChallengeUseCaseImpl: CreateChallengeUseCaseInterface = {
  execute: (input) => createChallengeUseCase(input),
};

// =============================================================================
// Use Case Layers for AppLayer Composition
// =============================================================================

/**
 * Layer that provides GetUserUseCaseTag implementation
 */
export const GetUserUseCaseLayer = Layer.succeed(
  GetUserUseCaseTag,
  getUserUseCaseImpl,
);

/**
 * Layer that provides CreateUserUseCaseTag implementation
 */
export const CreateUserUseCaseLayer = Layer.succeed(
  CreateUserUseCaseTag,
  createUserUseCaseImpl,
);

/**
 * Layer that provides UpdateUserUseCaseTag implementation
 */
export const UpdateUserUseCaseLayer = Layer.succeed(
  UpdateUserUseCaseTag,
  updateUserUseCaseImpl,
);

/**
 * Layer that provides GetTripUseCaseTag implementation
 */
export const GetTripUseCaseLayer = Layer.succeed(
  GetTripUseCaseTag,
  getTripUseCaseImpl,
);

/**
 * Layer that provides CreateTripUseCaseTag implementation
 */
export const CreateTripUseCaseLayer = Layer.succeed(
  CreateTripUseCaseTag,
  createTripUseCaseImpl,
);

/**
 * Layer that provides UpdateTripUseCaseTag implementation
 */
export const UpdateTripUseCaseLayer = Layer.succeed(
  UpdateTripUseCaseTag,
  updateTripUseCaseImpl,
);

/**
 * Layer that provides GetChallengeUseCaseTag implementation
 */
export const GetChallengeUseCaseLayer = Layer.succeed(
  GetChallengeUseCaseTag,
  getChallengeUseCaseImpl,
);

/**
 * Layer that provides CreateChallengeUseCaseTag implementation
 */
export const CreateChallengeUseCaseLayer = Layer.succeed(
  CreateChallengeUseCaseTag,
  createChallengeUseCaseImpl,
);

/**
 * Combined layer with all use case implementations
 * Use this in AppLayer composition
 */
export const AllUseCasesLayer = Layer.mergeAll(
  GetUserUseCaseLayer,
  CreateUserUseCaseLayer,
  UpdateUserUseCaseLayer,
  GetTripUseCaseLayer,
  CreateTripUseCaseLayer,
  UpdateTripUseCaseLayer,
  GetChallengeUseCaseLayer,
  CreateChallengeUseCaseLayer,
);
