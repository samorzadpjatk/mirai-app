/**
 * AppModule - Root Application Module
 *
 * The root module that orchestrates all other modules in the application.
 * Follows NestJS-like module organization patterns using awilix-modular.
 *
 * ## Module Hierarchy
 *
 * ```
 * AppModule (root)
 * ├── RepositoryModule    (data access layer - 16 repositories)
 * ├── UseCaseModule       (business logic layer - 73 use cases)
 * ├── ControllerModule    (API layer - 17 controllers)
 * └── FrameworkModule     (infrastructure services)
 * ```
 *
 * ## Usage
 *
 * ### Bootstrapping the Application
 *
 * ```typescript
 * import { initializeContainer } from "@mirai-app/frameworks/di";
 * import { AppModule } from "./AppModule";
 *
 * // Initialize container with root module
 * const container = initializeContainer([AppModule]);
 * ```
 *
 * ### Resolving Services from AppModule
 *
 * ```typescript
 * const userController = container.resolve("userController");
 * const userRepository = container.resolve("userRepository");
 * ```
 *
 * ## Design Patterns
 *
 * - **Static Modules**: All modules are static (defined at compile time)
 * - **Automatic Exports**: All exported providers are available through root container
 * - **No Circular Dependencies**: Import direction is always inward (Framework -> Adapters -> UseCases -> Domain)
 *
 * @module AppModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
import { ControllerModule } from "@mirai-app/adapters/modules/ControllerModule";

// =============================================================================
// Module Imports
// =============================================================================

// RepositoryModule is imported from adapters package (Step 4/5 completed)
// Provides all 16 Prisma repositories as injectable services

// ControllerModule is imported from adapters package (Step 8 completed)
// Provides all 17 tRPC controllers as injectable services

/**
 * PLACEHOLDER: UseCaseModule
 *
 * Will be created in Step 6 of the awilix-modular implementation.
 * Provides all 73 use cases organized by domain.
 *
 * Expected exports: getUserUseCase, createUserUseCase, etc.
 */
const UseCaseModulePlaceholder: StaticModule = createStaticModule({
  name: "UseCaseModule",
  providers: {},
  exports: [],
});

// =============================================================================
// Module Type Definitions
// =============================================================================

/**
 * Module definition types for AppModule imports
 *
 * These types define the expected structure of imported modules.
 * They are used for type checking and documentation purposes.
 */
export interface RepositoryModuleDef {
  name: "RepositoryModule";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: Record<string, any>;
  exports: string[];
}

/**
 * UseCaseModule definition (placeholder)
 */
export interface UseCaseModuleDef {
  name: "UseCaseModule";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: Record<string, any>;
  exports: string[];
}

/**
 * ControllerModule definition
 *
 * Provides all 17 tRPC controllers as injectable services.
 * Controllers are request-scoped (SCOPED lifetime).
 */
export interface ControllerModuleDef {
  name: "ControllerModule";
  providers: {
    userController: unknown;
    tripController: unknown;
    challengeController: unknown;
    groupController: unknown;
    locationController: unknown;
    notificationController: unknown;
    notificationScheduleController: unknown;
    notificationDeliveryController: unknown;
    challengeSubmissionController: unknown;
    challengeVoteController: unknown;
    activityFeedController: unknown;
    rewardController: unknown;
    coinController: unknown;
    coinTransactionController: unknown;
    sponsorController: unknown;
    submissionReportController: unknown;
    storageController: unknown;
  };
  exports: string[];
}

/**
 * AppModule definition type
 *
 * Defines the structure of the root module with proper typing
 * for imports, providers, and exports.
 */
export interface AppModuleDef {
  /** Module name for debugging */
  name: "AppModule";

  /**
   * Imported modules - these modules' exported providers become
   * available for injection in this module and its children
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imports: Array<StaticModule<any>>;

  /**
   * Providers defined directly in this module
   * (currently none - all providers come from imported modules)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: Record<string, any>;

  /**
   * Providers exported by this module
   * All exports from imported modules are re-exported
   */
  exports: string[];
}

// =============================================================================
// Root Module Creation
// =============================================================================

/**
 * AppModule - Root application module
 *
 * Composes all sub-modules to create the complete application dependency graph.
 * Acts as the entry point for dependency injection in the Mirai App.
 *
 * @example
 * ```typescript
 * // Initialize container with root module
 * import { initializeContainer } from "@mirai-app/frameworks/di";
 * import { AppModule } from "./AppModule";
 *
 * const container = initializeContainer([AppModule]);
 *
 * // Resolve a service through the module hierarchy
 * const controller = container.resolve("userController");
 * ```
 */
export const AppModule: StaticModule = createStaticModule({
  name: "AppModule",

  /**
   * Imported modules
   *
   * Import order matters for dependency resolution:
   * 1. RepositoryModule (lowest level - no dependencies)
   * 2. UseCaseModule (depends on RepositoryModule)
   * 3. ControllerModule (depends on UseCaseModule)
   */
  imports: [
    RepositoryModule, // Real repository module from adapters (Step 4/5)
    UseCaseModulePlaceholder,
    // ControllerModule is lazy-loaded to avoid circular dependency
    // The function is evaluated when the module is first used
    () => ControllerModule, // Real controller module from adapters (Step 8 - THIS MODULE)
  ],

  /**
   * Root-level providers
   *
   * Currently no direct providers - all services come through imports.
   * Future additions could include:
   * - Global interceptors
   * - Application-level services
   * - Cross-cutting concerns (logging, metrics)
   */
  providers: {},

  /**
   * Exports
   *
   * Aggregates all exports from imported modules for public API surface.
   * Currently empty since placeholders have no exports.
   * Will be populated as modules gain providers.
   */
  exports: [],
});

// =============================================================================
// Module Dependency Type
// =============================================================================

/**
 * Module dependencies type for constructor injection
 *
 * Use this type to access any dependency registered through AppModule.
 *
 * @example
 * ```typescript
 * // In a service that needs user controller
 * class SomeService {
 *   constructor(
 *     private deps: ModuleDeps
 *   ) {}
 *
 *   async doSomething() {
 *     const controller = this.deps.userController;
 *     return await controller.getById({ id: "123" });
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModuleDeps = Record<string, any>;

// =============================================================================
// Re-export Module Definition Types
// =============================================================================

export type { RepositoryModuleDef, UseCaseModuleDef, ControllerModuleDef };

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a module is registered in AppModule
 *
 * @param moduleName - Name of the module to check
 * @returns True if module is in imports array
 *
 * @example
 * ```typescript
 * if (hasModule("RepositoryModule")) {
 *   console.log("RepositoryModule is registered");
 * }
 * ```
 */
export function hasModule(moduleName: string): boolean {
  if (!AppModule.imports) {
    return false;
  }
  return AppModule.imports.some((mod) => {
    // Handle both direct modules and forward refs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modName = typeof mod === "function" ? (mod as any).name : mod.name;
    return modName === moduleName;
  });
}

/**
 * Get all registered module names
 *
 * @returns Array of module names
 */
export function getRegisteredModules(): string[] {
  if (!AppModule.imports) {
    return [];
  }
  return AppModule.imports.map((mod) => {
    // Handle both direct modules and forward refs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof mod === "function" ? (mod as any).name : mod.name;
  });
}

/**
 * Module registration status
 *
 * Returns detailed information about the AppModule state.
 * Useful for debugging and health checks.
 */
export function getModuleStatus(): {
  rootModule: string;
  imports: string[];
  providerCount: number;
  exportCount: number;
} {
  return {
    rootModule: AppModule.name,
    imports: getRegisteredModules(),
    providerCount: AppModule.providers
      ? Object.keys(AppModule.providers).length
      : 0,
    exportCount: AppModule.exports?.length ?? 0,
  };
}
