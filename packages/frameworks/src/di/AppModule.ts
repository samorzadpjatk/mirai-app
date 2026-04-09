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
 * ├── RepositoryModule         (data access layer - 16 repositories)
 * ├── BaseUseCaseModule        (core business logic - 75 use cases)
 * ├── AuthUseCaseModule        (auth/telemetry use cases + ports)
 * ├── ControllerModule         (API layer - 17 controllers)
 * └── FrameworkModule          (infrastructure services)
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
import {
  ControllerModule,
  type ControllerModuleDef,
} from "@mirai-app/adapters/modules/ControllerModule";
import { UseCaseModule as BaseUseCaseModule } from "@mirai-app/use-cases/modules/UseCaseModule";
import { UseCaseModule as AuthUseCaseModule } from "@mirai-app/adapters/modules/UseCaseModule";

// =============================================================================
// Module Imports
// =============================================================================

// RepositoryModule is imported from adapters package
// Provides all 16 Prisma repositories as injectable services

// BaseUseCaseModule is imported from use-cases package
// Provides all 75 core use cases organized by domain

// AuthUseCaseModule is imported from adapters package
// Provides auth/telemetry use cases and port abstractions

// ControllerModule is imported from adapters package
// Provides all 17 tRPC controllers as injectable services

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
  // DefProviderMap constraint: values must be object | string | boolean | number
  providers: Record<string, object | string | boolean | number>;
  exports: string[];
}

/**
 * BaseUseCaseModule definition
 *
 * Provides all 75 core use cases organized by domain.
 * Use cases are request-scoped (SCOPED lifetime).
 */
export interface UseCaseModuleDef {
  name: "UseCaseModule";
  // DefProviderMap constraint: values must be object | string | boolean | number
  providers: Record<string, object | string | boolean | number>;
  exports: string[];
}

/**
 * AuthUseCaseModule definition
 *
 * Provides auth/telemetry use cases and port abstractions.
 * These are registered in the adapters layer.
 */
export interface AuthUseCaseModuleDef {
  name: "UseCaseModule";
  // DefProviderMap constraint: values must be object | string | boolean | number
  providers: Record<string, object | string | boolean | number>;
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
   * available for injection in this module and its children.
   * Uses lazy loading pattern for ControllerModule to avoid circular deps.
   */
  // DefProviderMap constraint: StaticModule expects object | string | boolean | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imports: Array<StaticModule<any> | (() => StaticModule<any>)>;

  /**
   * Providers defined directly in this module
   * (currently none - all providers come from imported modules)
   */
  // DefProviderMap constraint: values must be object | string | boolean | number
  providers: Record<string, object | string | boolean | number>;

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
// Type annotation uses any due to awilix-modular's complex generic constraints
// The actual type safety is provided by the module definition interfaces above
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AppModule: StaticModule<any> = createStaticModule<AppModuleDef>({
  name: "AppModule",

  /**
   * Imported modules
   *
   * Import order matters for dependency resolution:
   * 1. RepositoryModule (lowest level - no dependencies)
   * 2. BaseUseCaseModule (75 core use cases from use-cases package)
   * 3. AuthUseCaseModule (auth/telemetry use cases from adapters)
   * 4. ControllerModule (depends on all use cases)
   *
   * LAZY LOADING PATTERN:
   * ControllerModule is wrapped in a function `() => ControllerModule` to enable
   * lazy loading. This pattern defers module resolution until runtime,
   * preventing circular dependency issues between modules.
   *
   * awilix-modular supports both direct module references and lazy-loaded
   * factory functions. The factory function is evaluated on first use,
   * allowing modules that depend on each other to be defined without
   * causing import-time circular dependencies.
   */
  imports: [
    RepositoryModule, // Data access layer - 16 repositories
    BaseUseCaseModule, // Core use cases - 75 use cases
    AuthUseCaseModule, // Auth/telemetry use cases + ports
    // Lazy-loaded module: factory function prevents circular deps
    // ControllerModule is evaluated when first resolved
    // Named function preserves module name for introspection
    function loadControllerModule() {
      return ControllerModule;
    }, // API layer - 17 controllers (lazy-loaded)
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
   * All services from RepositoryModule, UseCaseModule, and ControllerModule
   * are available through the root container.
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
 * Includes all controllers and use cases from imported modules.
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
 *     const useCase = this.deps.getUserUseCase;
 *     return await controller.getById({ id: "123" });
 *   }
 * }
 * ```
 */
// Using unknown for safety, but dependencies can be cast to specific types when needed
export type ModuleDeps = Record<string, unknown>;

// =============================================================================
// Re-export Module Definition Types
// =============================================================================

// Note: ModuleDef types are defined in this file and don't need re-export

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
    // Handle both direct modules and lazy-loaded forward refs
    // Lazy loading pattern: () => Module is used to avoid circular dependencies
    if (typeof mod === "function") {
      // For lazy-loaded modules, call the function to get the actual module
      // and read its name property
      const resolvedMod = (mod as () => StaticModule<unknown>)();
      return resolvedMod.name === moduleName;
    }
    return mod.name === moduleName;
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
    // Handle both direct modules and lazy-loaded forward refs
    // Lazy loading pattern: () => Module defers module resolution to runtime
    // For lazy-loaded modules, call the function to get the actual module name
    if (typeof mod === "function") {
      const resolvedMod = (mod as () => StaticModule<unknown>)();
      return resolvedMod.name;
    }
    return mod.name;
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
