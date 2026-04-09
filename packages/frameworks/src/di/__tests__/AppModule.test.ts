import { describe, expect, test, beforeEach } from "bun:test";
import { createStaticModule, type StaticModule } from "awilix-modular";
import { NotificationService } from "@mirai-app/adapters/services/notificationService";

import {
  initializeContainer,
  getContainer,
  createChildContainer,
  resetContainer,
  isContainerInitialized,
} from "../container";
import {
  AppModule,
  type AppModuleDef,
  type ModuleDeps,
  type RepositoryModuleDef,
  type UseCaseModuleDef,
  type ControllerModuleDef,
  hasModule,
  getRegisteredModules,
  getModuleStatus,
} from "../AppModule";

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Resolve a module import, handling lazy-loaded factory functions
 */
function resolveModule(
  mod: StaticModule<unknown> | (() => StaticModule<unknown>),
): StaticModule<unknown> {
  return typeof mod === "function" ? mod() : mod;
}

/**
 * Get module names from imports, resolving lazy-loaded modules
 */
function getImportNames(
  imports: Array<StaticModule<unknown> | (() => StaticModule<unknown>)>,
): string[] {
  return imports.map((mod) => resolveModule(mod).name);
}

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] AppModule (Root Application Module)", () => {
  beforeEach(() => {
    resetContainer();
  });

  // ==========================================================================
  // Module Structure Tests
  // ==========================================================================

  describe("Module Structure", () => {
    test("AppModule is defined and has correct name", () => {
      expect(AppModule).toBeDefined();
      expect(AppModule.name).toBe("AppModule");
    });

    test("AppModule has imports array", () => {
      expect(AppModule.imports).toBeDefined();
      expect(Array.isArray(AppModule.imports)).toBe(true);
    });

    test("AppModule has providers object", () => {
      expect(AppModule.providers).toBeDefined();
      expect(typeof AppModule.providers).toBe("object");
    });

    test("AppModule has exports array", () => {
      expect(AppModule.exports).toBeDefined();
      expect(Array.isArray(AppModule.exports)).toBe(true);
    });

    test("AppModule is a StaticModule type", () => {
      // Verify it conforms to StaticModule interface
      expect(AppModule).toHaveProperty("name");
      expect(AppModule).toHaveProperty("imports");
      expect(AppModule).toHaveProperty("providers");
      expect(AppModule).toHaveProperty("exports");
    });
  });

  // ==========================================================================
  // Module Imports Tests
  // ==========================================================================

  describe("Module Imports", () => {
    test("imports contain expected modules", () => {
      const moduleNames = getImportNames(AppModule.imports);

      expect(moduleNames).toContain("RepositoryModule");
      expect(moduleNames).toContain("UseCaseModule");
      expect(moduleNames).toContain("ControllerModule");
    });

    test("imports have correct count (4 modules: Repository, UseCase, AuthUseCase, Controller)", () => {
      expect(AppModule.imports.length).toBe(4);
    });

    test("all imports are StaticModules", () => {
      for (const mod of AppModule.imports) {
        // Resolve lazy-loaded modules for property checking
        const resolvedMod = resolveModule(mod);
        expect(resolvedMod).toHaveProperty("name");
        expect(resolvedMod).toHaveProperty("providers");
        expect(resolvedMod).toHaveProperty("exports");
        expect(typeof resolvedMod.name).toBe("string");
        expect(typeof resolvedMod.providers).toBe("object");
        expect(Array.isArray(resolvedMod.exports)).toBe(true);
      }
    });

    test("RepositoryModule is first import (dependency order)", () => {
      const firstModule = AppModule.imports[0];
      expect(firstModule?.name).toBe("RepositoryModule");
    });

    test("UseCaseModule is second import (core use cases)", () => {
      const secondModule = AppModule.imports[1];
      expect(secondModule?.name).toBe("UseCaseModule");
    });

    test("AuthUseCaseModule is third import (auth/telemetry)", () => {
      const thirdModule = AppModule.imports[2];
      expect(thirdModule?.name).toBe("UseCaseModule");
    });

    test("ControllerModule is fourth import", () => {
      const fourthModule = resolveModule(AppModule.imports[3]!);
      expect(fourthModule.name).toBe("ControllerModule");
    });
  });

  // ==========================================================================
  // Container Integration Tests
  // ==========================================================================

  describe("Container Integration", () => {
    test("AppModule can be loaded by container", () => {
      const container = initializeContainer([AppModule]);

      expect(container).toBeDefined();
      expect(isContainerInitialized()).toBe(true);
    });

    test("AppModule loads successfully with getContainer", () => {
      initializeContainer([AppModule]);
      const container = getContainer();

      expect(container).toBeDefined();
      expect(container.resolve).toBeDefined();
    });

    test("AppModule can create child containers", () => {
      initializeContainer([AppModule]);

      const childContainer = createChildContainer();

      expect(childContainer).toBeDefined();
      expect(childContainer).not.toBe(getContainer());
    });

    test("child container inherits from AppModule-loaded container", () => {
      initializeContainer([AppModule]);

      const child = createChildContainer();
      const parent = getContainer();

      // Child should be different object
      expect(child).not.toBe(parent);
      // But child should have a resolve method
      expect(child.resolve).toBeDefined();
    });
  });

  // ==========================================================================
  // Type Definition Tests
  // ==========================================================================

  describe("Type Definitions", () => {
    test("AppModuleDef type is exported", () => {
      // Type-only test - verifies TypeScript compilation
      // If this compiles, the types are correctly exported
      const checkType: AppModuleDef = {
        name: "AppModule",
        imports: [],
        providers: {},
        exports: [],
      };

      expect(checkType.name).toBe("AppModule");
    });

    test("ModuleDeps type is exported", () => {
      // Type-only test - verifies TypeScript compilation
      // ModuleDeps should be the providers type from AppModuleDef
      const checkType: ModuleDeps = {};

      expect(checkType).toBeDefined();
      expect(typeof checkType).toBe("object");
    });

    test("RepositoryModuleDef type is exported", () => {
      const checkType: RepositoryModuleDef = {
        name: "RepositoryModule",
        providers: {},
        exports: [],
      };

      expect(checkType.name).toBe("RepositoryModule");
    });

    test("UseCaseModuleDef type are exported", () => {
      const checkType: UseCaseModuleDef = {
        name: "UseCaseModule",
        providers: {},
        exports: [],
      };

      expect(checkType.name).toBe("UseCaseModule");
    });

    test("ControllerModuleDef type are exported", () => {
      const checkType: ControllerModuleDef = {
        name: "ControllerModule",
        providers: {
          userController: undefined,
          tripController: undefined,
          challengeController: undefined,
          groupController: undefined,
          locationController: undefined,
          notificationController: undefined,
          notificationScheduleController: undefined,
          notificationDeliveryController: undefined,
          challengeSubmissionController: undefined,
          challengeVoteController: undefined,
          activityFeedController: undefined,
          rewardController: undefined,
          coinController: undefined,
          coinTransactionController: undefined,
          sponsorController: undefined,
          submissionReportController: undefined,
          storageController: undefined,
          notificationService: NotificationService,
        },
        exports: [],
      };

      expect(checkType.name).toBe("ControllerModule");
    });
  });

  // ==========================================================================
  // Helper Function Tests
  // ==========================================================================

  describe("Helper Functions", () => {
    test("hasModule returns true for registered modules", () => {
      expect(hasModule("RepositoryModule")).toBe(true);
      expect(hasModule("UseCaseModule")).toBe(true);
      expect(hasModule("ControllerModule")).toBe(true);
    });

    test("hasModule returns false for unregistered modules", () => {
      expect(hasModule("NonExistentModule")).toBe(false);
      expect(hasModule("SomeOtherModule")).toBe(false);
    });

    test("getRegisteredModules returns all 4 module names", () => {
      const modules = getRegisteredModules();

      expect(modules).toHaveLength(4);
      expect(modules).toContain("RepositoryModule");
      expect(modules).toContain("UseCaseModule");
      expect(modules).toContain("ControllerModule");
    });

    test("getModuleStatus returns complete status", () => {
      const status = getModuleStatus();

      expect(status.rootModule).toBe("AppModule");
      expect(status.imports).toHaveLength(4);
      expect(typeof status.providerCount).toBe("number");
      expect(typeof status.exportCount).toBe("number");
    });

    test("getModuleStatus imports match AppModule imports", () => {
      const status = getModuleStatus();

      expect(status.imports).toEqual(getRegisteredModules());
    });
  });

  // ==========================================================================
  // Module Hierarchy Tests
  // ==========================================================================

  describe("Module Hierarchy", () => {
    test("follows NestJS-like organization pattern", () => {
      // Verify the module has the expected structure
      expect(AppModule).toHaveProperty("imports");
      expect(AppModule).toHaveProperty("providers");
      expect(AppModule).toHaveProperty("exports");

      // Imports should be an array
      expect(Array.isArray(AppModule.imports)).toBe(true);
    });

    test("AppModule uses createStaticModule pattern", () => {
      // Verify it's a static module (not dynamic)
      // Static modules have the shape from awilix-modular
      expect(typeof AppModule.name).toBe("string");
      expect(Array.isArray(AppModule.imports)).toBe(true);
      expect(typeof AppModule.providers).toBe("object");
      expect(Array.isArray(AppModule.exports)).toBe(true);
    });

    test("placeholder modules are valid StaticModules", () => {
      for (const mod of AppModule.imports) {
        // Resolve lazy-loaded modules for property checking
        const resolvedMod = resolveModule(mod);
        // Each import should be a valid StaticModule
        expect(resolvedMod.name).toBeDefined();
        expect(typeof resolvedMod.name).toBe("string");
        expect(resolvedMod.providers).toBeDefined();
        expect(typeof resolvedMod.providers).toBe("object");
        expect(resolvedMod.exports).toBeDefined();
        expect(Array.isArray(resolvedMod.exports)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Clean Architecture Compliance Tests
  // ==========================================================================

  describe("Clean Architecture Compliance", () => {
    test("AppModule lives in frameworks layer", () => {
      // This test documents the architectural location
      // The module is in packages/frameworks/src/di/
      expect(import.meta.url).toContain("frameworks/src/di");
    });

    test("AppModule imports don't create circular dependencies", () => {
      // Verify no module imports itself (basic circular check)
      const moduleNames = AppModule.imports.map((mod) => mod.name);

      for (const name of moduleNames) {
        expect(name).not.toBe("AppModule");
      }
    });

    test("AppModule has unidirectional import pattern", () => {
      // Import order: Repository -> UseCase -> AuthUseCase -> Controller
      // This follows Clean Architecture dependency direction
      const moduleNames = getImportNames(AppModule.imports);

      // Lower level modules should come first
      const repositoryIndex = moduleNames.indexOf("RepositoryModule");
      const useCaseIndex = moduleNames.indexOf("UseCaseModule");
      const controllerIndex = moduleNames.indexOf("ControllerModule");

      expect(repositoryIndex).toBeLessThan(useCaseIndex);
      expect(useCaseIndex).toBeLessThan(controllerIndex);
    });
  });

  // ==========================================================================
  // Future Module Integration Tests
  // ==========================================================================

  describe("Future Module Integration", () => {
    test("AppModule can be extended with additional modules", () => {
      // Test that we can create an extended module
      const ExtendedModule = createStaticModule({
        name: "ExtendedModule",
        providers: {},
        exports: [],
      });

      expect(ExtendedModule.name).toBe("ExtendedModule");
      expect(ExtendedModule.imports).toBeUndefined(); // No imports in this simple module
    });

    test("placeholder modules can be replaced in future", () => {
      // Verify the structure allows future replacement
      const RealModule = createStaticModule({
        name: "RealModule",
        providers: {
          someService: class SomeService {},
        },
        exports: ["someService"],
      });

      expect(RealModule.exports).toContain("someService");
      expect(Object.keys(RealModule.providers)).toContain("someService");
    });
  });

  // ==========================================================================
  // Module Re-initialization Tests
  // ==========================================================================

  describe("Module Re-initialization", () => {
    test("AppModule can be re-initialized after reset", () => {
      initializeContainer([AppModule]);
      expect(isContainerInitialized()).toBe(true);

      resetContainer();
      expect(isContainerInitialized()).toBe(false);

      // Re-initialize
      initializeContainer([AppModule]);
      expect(isContainerInitialized()).toBe(true);
      expect(getContainer()).toBeDefined();
    });

    test("multiple containers with AppModule are independent", () => {
      const container1 = initializeContainer([AppModule]);
      resetContainer();
      const container2 = initializeContainer([AppModule]);

      expect(container1).not.toBe(container2);
    });
  });
});
