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
 * ├── UseCaseModule       (business logic layer - 75 use cases)
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
import {
  ControllerModule,
  type ControllerModuleDef,
} from "@mirai-app/adapters/modules/ControllerModule";
import { UseCaseModule } from "@mirai-app/use-cases/modules/UseCaseModule";

// =============================================================================
// Module Imports
// =============================================================================

// RepositoryModule is imported from adapters package
// Provides all 16 Prisma repositories as injectable services

// UseCaseModule is imported from use-cases package
// Provides all 75 use cases organized by domain

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: Record<string, any>;
  exports: string[];
}

/**
 * UseCaseModule definition
 *
 * Provides all 75 use cases organized by domain.
 * Use cases are request-scoped (SCOPED lifetime).
 */
export interface UseCaseModuleDef {
  name: "UseCaseModule";
  providers: {
    // User Domain
    getUserUseCase: unknown;
    createUserUseCase: unknown;
    updateUserUseCase: unknown;
    // Challenge Domain
    getChallengeUseCase: unknown;
    createChallengeUseCase: unknown;
    updateChallengeUseCase: unknown;
    updateChallengeStatusUseCase: unknown;
    // Group Domain
    getGroupUseCase: unknown;
    createGroupUseCase: unknown;
    updateGroupUseCase: unknown;
    // Challenge Submission
    createSubmissionUseCase: unknown;
    getSubmissionUseCase: unknown;
    getSubmissionByChallengeAndGroupUseCase: unknown;
    updateSubmissionUseCase: unknown;
    deleteSubmissionUseCase: unknown;
    listSubmissionsByChallengeUseCase: unknown;
    // Challenge Vote
    getMyVotesUseCase: unknown;
    getVotesByChallengeUseCase: unknown;
    getChallengeVotingProgressUseCase: unknown;
    getJudgedStaffVotingProgressUseCase: unknown;
    submitVoteUseCase: unknown;
    submitVotesUseCase: unknown;
    forceEndVotingUseCase: unknown;
    // Location
    getLocationUseCase: unknown;
    createLocationUseCase: unknown;
    updateLocationUseCase: unknown;
    listLocationsUseCase: unknown;
    updateSharingSettingsUseCase: unknown;
    addSharingUserUseCase: unknown;
    removeSharingUserUseCase: unknown;
    getSharingSettingsUseCase: unknown;
    // Notification
    getNotificationUseCase: unknown;
    // Activity Feed
    getActivityFeedUseCase: unknown;
    createActivityUseCase: unknown;
    addReactionUseCase: unknown;
    // Submission Report
    createReportUseCase: unknown;
    getReportsUseCase: unknown;
    // Sponsor
    createSponsorUseCase: unknown;
    getSponsorUseCase: unknown;
    updateSponsorUseCase: unknown;
    deleteSponsorUseCase: unknown;
    listSponsorsUseCase: unknown;
    linkSponsorToTripUseCase: unknown;
    unlinkSponsorFromTripUseCase: unknown;
    // Reward
    getRewardUseCase: unknown;
    createRewardUseCase: unknown;
    updateRewardUseCase: unknown;
    setRewardHiddenUseCase: unknown;
    deleteRewardUseCase: unknown;
    listRewardsUseCase: unknown;
    purchaseRewardUseCase: unknown;
    updatePurchaseStatusUseCase: unknown;
    updateMyPurchaseStatusUseCase: unknown;
    getPurchaseHistoryUseCase: unknown;
    // Coin Transaction
    getCoinStatisticsUseCase: unknown;
    getMostActiveAdminStatsUseCase: unknown;
    getCoinTransactionsUseCase: unknown;
    getCoinQuickStatsUseCase: unknown;
    getCoinAdditionalInsightsUseCase: unknown;
    addCoinsUseCase: unknown;
    removeCoinsUseCase: unknown;
    // Notification Delivery
    getDeliveriesUseCase: unknown;
    getDeliveryByNotificationIdUseCase: unknown;
    getDeliveryStatsUseCase: unknown;
    getFailedDeliveriesUseCase: unknown;
    // Notification Schedule
    getNotificationSchedulesUseCase: unknown;
    getNotificationScheduleByIdUseCase: unknown;
    createNotificationScheduleUseCase: unknown;
    updateNotificationScheduleUseCase: unknown;
    deleteNotificationScheduleUseCase: unknown;
    getActiveNotificationSchedulesUseCase: unknown;
    getUpcomingNotificationSchedulesUseCase: unknown;
    updateNotificationScheduleLastRunUseCase: unknown;
    toggleNotificationScheduleActiveUseCase: unknown;
    bulkToggleNotificationScheduleActiveUseCase: unknown;
    bulkDeleteNotificationSchedulesUseCase: unknown;
    duplicateNotificationScheduleUseCase: unknown;
    getNotificationScheduleExecutionHistoryUseCase: unknown;
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
    RepositoryModule, // Data access layer - 16 repositories
    UseCaseModule, // Business logic layer - 75 use cases
    // ControllerModule is lazy-loaded to avoid circular dependency
    // The function is evaluated when the module is first used
    () => ControllerModule, // API layer - 17 controllers
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModuleDeps = Record<string, any>;

// =============================================================================
// Re-export Module Definition Types
// =============================================================================

export type { RepositoryModuleDef, UseCaseModuleDef };
export type { ControllerModuleDef };

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
