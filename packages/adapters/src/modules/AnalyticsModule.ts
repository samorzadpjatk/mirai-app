/**
 * AnalyticsModule - Analytics Module DI Registration
 *
 * This module provides analytics-related infrastructure adapters, specifically
 * the S3StorageAdapter for file storage operations within the analytics context.
 * It serves as the bridge between the StoragePort interface (defined in use-cases)
 * and its AWS S3 implementation.
 *
 * ## Storage Port Registration
 *
 * | Token | Interface | Implementation | Environment Variables |
 * |-------|-----------|----------------|----------------------|
 * | `analyticsStoragePort` | StoragePort | S3StorageAdapter | AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY |
 *
 * ## AWS S3 Configuration
 *
 * The S3StorageAdapter requires the following environment variables:
 *
 * | Variable | Required | Description | Example |
 * |----------|----------|-------------|---------|
 * | `AWS_REGION` | Yes | AWS region for S3 bucket | `us-east-1` |
 * | `AWS_ACCESS_KEY_ID` | Yes | AWS access key ID | `AKIA...` |
 * | `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret access key | `wJalrXUtnFEMI...` |
 *
 * ## Provider Factory
 *
 * The S3StorageAdapter is instantiated via a factory function that:
 * 1. Reads AWS credentials from environment variables
 * 2. Configures the S3Client with the region and credentials
 * 3. Creates the S3StorageAdapter instance
 * 4. Returns the adapter ready for dependency injection
 *
 * ### Factory Behavior
 *
 * ```
 * Environment Variables
 *         │
 *         ▼
 * ┌─────────────────────────────┐
 * │ AWS_REGION                  │ ──► S3Client region config
 * │ AWS_ACCESS_KEY_ID           │ ──► S3Client credentials
 * │ AWS_SECRET_ACCESS_KEY       │ ──► S3Client credentials
 * └─────────────────────────────┘
 *         │
 *         ▼
 * ┌─────────────────────────────┐
 * │ new S3Client({...})         │
 * └─────────────────────────────┘
 *         │
 *         ▼
 * ┌─────────────────────────────┐
 * │ new S3StorageAdapter(s3)    │
 * └─────────────────────────────┘
 *         │
 *         ▼
 * ┌─────────────────────────────┐
 * │ analyticsStoragePort        │
 * └─────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { AnalyticsModule, PORT_TOKENS } from "@mirai-app/adapters/modules/AnalyticsModule";
 *
 * // In AppModule imports:
 * const container = initializeContainer([
 *   AnalyticsModule,
 *   ControllerModule,
 * ]);
 *
 * // Resolve storage port for analytics operations
 * const storagePort = container.resolve(PORT_TOKENS.AnalyticsStoragePort);
 * ```
 *
 * ## Error Handling
 *
 * The factory validates that all required environment variables are present.
 * If any required variable is missing, the factory throws an error with
 * details about which variable is missing.
 *
 * @module AnalyticsModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";
import { S3Client } from "@aws-sdk/client-s3";

// =============================================================================
// Adapter Imports
// =============================================================================

import { S3StorageAdapter } from "../gateways/storage/S3StorageAdapter";

// =============================================================================
// Type Imports
// =============================================================================

import type { StoragePort } from "@mirai-app/use-cases";

// =============================================================================
// Injection Tokens
// =============================================================================

/**
 * Port injection tokens for analytics infrastructure
 */
export const PORT_TOKENS = {
  /** Storage port for analytics file operations using S3 */
  AnalyticsStoragePort: "analyticsStoragePort",
} as const;

/**
 * Type for analytics port token keys
 */
export type PortToken = (typeof PORT_TOKENS)[keyof typeof PORT_TOKENS];

// =============================================================================
// Environment Configuration
// =============================================================================

/**
 * AWS configuration from environment variables
 */
export interface AwsConfig {
  /** AWS region for S3 operations */
  region: string;
  /** AWS access key ID */
  accessKeyId: string;
  /** AWS secret access key */
  secretAccessKey: string;
}

/**
 * Read AWS configuration from environment variables
 *
 * Validates that all required environment variables are present.
 * Throws if any required variable is missing.
 *
 * @returns AwsConfig with validated AWS credentials
 * @throws Error if any required environment variable is missing
 *
 * @example
 * ```typescript
 * const config = readAwsConfigFromEnv();
 * logger.debug("AWS config loaded", { region: config.region });
 * ```
 */
export function readAwsConfigFromEnv(): AwsConfig {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region) {
    throw new Error(
      "Missing required environment variable: AWS_REGION. " +
        "Please set AWS_REGION to your S3 bucket region (e.g., 'us-east-1').",
    );
  }

  if (!accessKeyId) {
    throw new Error(
      "Missing required environment variable: AWS_ACCESS_KEY_ID. " +
        "Please set AWS_ACCESS_KEY_ID with your AWS access key.",
    );
  }

  if (!secretAccessKey) {
    throw new Error(
      "Missing required environment variable: AWS_SECRET_ACCESS_KEY. " +
        "Please set AWS_SECRET_ACCESS_KEY with your AWS secret key.",
    );
  }

  return {
    region,
    accessKeyId,
    secretAccessKey,
  };
}

// =============================================================================
// Factory Functions
// =============================================================================

type Cradle = Record<string, unknown>;

/**
 * Create S3Client instance configured with AWS credentials
 *
 * Factory function that reads AWS configuration from environment variables
 * and creates a configured S3Client instance.
 *
 * @returns Configured S3Client instance
 * @throws Error if any required AWS environment variable is missing
 *
 * @example
 * ```typescript
 * const s3Client = createS3Client();
 * // Use s3Client for S3 operations
 * ```
 */
function createS3Client(): S3Client {
  const config = readAwsConfigFromEnv();

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * Create StoragePort instance using S3StorageAdapter
 *
 * Factory function that creates an S3StorageAdapter with a configured
 * S3Client for analytics file storage operations.
 *
 * @param _cradle - DI container cradle (unused but kept for DI compatibility)
 * @returns StoragePort implementation instance (S3StorageAdapter)
 * @throws Error if any required AWS environment variable is missing
 *
 * @example
 * ```typescript
 * // With DI container (awilix-modular)
 * const storagePort = container.resolve("analyticsStoragePort");
 * const metadata = await Effect.runPromise(
 *   storagePort.upload("analytics", "report.csv", fileBuffer)
 * );
 *
 * // Manual instantiation (backward-compatible)
 * const s3Client = new S3Client({ region: "us-east-1", ... });
 * const storagePort = new S3StorageAdapter(s3Client);
 * ```
 */
function createAnalyticsStoragePort(_cradle: Cradle): StoragePort {
  const s3Client = createS3Client();
  return new S3StorageAdapter(s3Client);
}

// =============================================================================
// Module Dependencies Type
// =============================================================================

/**
 * Dependencies exported by AnalyticsModule
 */
export interface AnalyticsModuleDeps {
  /** Analytics storage port - S3 implementation for file operations */
  [PORT_TOKENS.AnalyticsStoragePort]: StoragePort;
}

// =============================================================================
// Module Definition Type
// =============================================================================

/**
 * AnalyticsModule definition type for awilix-modular
 */
export interface AnalyticsModuleDef {
  name: "AnalyticsModule";
  providers: Record<string, any>;
  exports: string[];
}

// =============================================================================
// Module Creation
// =============================================================================

/**
 * AnalyticsModule - Static module for analytics infrastructure
 *
 * This module provides:
 * 1. S3StorageAdapter registration as analyticsStoragePort
 * 2. Environment-based AWS configuration
 * 3. Factory function for S3Client creation
 *
 * ## Lifetime Strategy
 *
 * | Provider | Lifetime | Rationale |
 * |----------|----------|-----------|
 * | analyticsStoragePort | SINGLETON | S3Client is stateless and can be reused across requests |
 *
 * ## DI Graph
 *
 * ```
 * AppModule
 * └── AnalyticsModule (this module)
 *     └── analyticsStoragePort ← S3StorageAdapter ← S3Client
 *                              ← AWS credentials (from env)
 * ```
 *
 * ## Environment Variables Required
 *
 * ```bash
 * # Required AWS configuration
 * export AWS_REGION=us-east-1
 * export AWS_ACCESS_KEY_ID=your-access-key
 * export AWS_SECRET_ACCESS_KEY=your-secret-key
 * ```
 *
 * ## Usage Example
 *
 * ```typescript
 * import { AnalyticsModule, PORT_TOKENS } from "@mirai-app/adapters/modules/AnalyticsModule";
 * import { initializeContainer } from "awilix-modular";
 *
 * const container = initializeContainer([
 *   AnalyticsModule,
 * ]);
 *
 * // Use the storage port
 * const storagePort = container.resolve(PORT_TOKENS.AnalyticsStoragePort);
 * ```
 */
export const AnalyticsModule: StaticModule<AnalyticsModuleDef> =
  createStaticModule<AnalyticsModuleDef>({
    name: "AnalyticsModule",

    providers: {
      /**
       * AnalyticsStoragePort - S3 implementation for analytics file storage
       * SINGLETON lifetime because S3Client is stateless and can be safely reused
       *
       * Environment variables required:
       * - AWS_REGION
       * - AWS_ACCESS_KEY_ID
       * - AWS_SECRET_ACCESS_KEY
       */
      [PORT_TOKENS.AnalyticsStoragePort]: {
        factory: createAnalyticsStoragePort,
        lifetime: Lifetime.SINGLETON,
      },
    },

    exports: [
      // Analytics storage port for file operations
      PORT_TOKENS.AnalyticsStoragePort,
    ],
  });

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { S3StorageAdapter } from "../gateways/storage/S3StorageAdapter";
