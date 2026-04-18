import { Data, Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";

/**
 * Configuration validation error
 */
export class ConfigurationError
  extends Data.TaggedError("ConfigurationError")<{
    field: string;
    message: string;
  }>
  implements IPortError
{
  override readonly message: string;

  constructor(props: { field: string; message: string }) {
    super(props);
    this.message = `Configuration error for '${props.field}': ${props.message}`;
  }
}

/**
 * SeaweedFS S3-compatible storage connection configuration
 */
export interface SeaweedFSConfig {
  /** S3 API endpoint URL (e.g., "http://localhost:8333") */
  endpoint: string;

  /** S3 region (default: "us-east-1") */
  region: string;

  /** S3 access key ID */
  accessKeyId: string;

  /** S3 secret access key */
  secretAccessKey: string;

  /** Force path-style URLs for S3 (required for SeaweedFS) */
  forcePathStyle: boolean;

  /** Whether to use SSL (default: false for local dev) */
  useSsl: boolean;
}

/**
 * Default development configuration values
 */
export const defaultSeaweedFSConfig: SeaweedFSConfig = {
  endpoint: process.env.SEAWEEDFS_ENDPOINT ?? "http://localhost:8333",
  region: process.env.SEAWEEDFS_REGION ?? "us-east-1",
  accessKeyId: process.env.SEAWEEDFS_ACCESS_KEY ?? "dev_access_key",
  secretAccessKey: process.env.SEAWEEDFS_SECRET_KEY ?? "dev_secret_key",
  forcePathStyle: true,
  useSsl: false,
};

/**
 * Validates SeaweedFS configuration
 * Returns Effect<SeaweedFSConfig, ConfigurationError, never>
 */
export function validateSeaweedFSConfig(
  config: Partial<SeaweedFSConfig> = {},
): Effect.Effect<SeaweedFSConfig, ConfigurationError, never> {
  return Effect.gen(function* () {
    const merged = { ...defaultSeaweedFSConfig, ...config };

    // Validate endpoint
    if (!merged.endpoint || merged.endpoint.trim() === "") {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "seaweedfs.endpoint",
          message: "Endpoint URL is required",
        }),
      );
    }

    try {
      new URL(merged.endpoint);
    } catch {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "seaweedfs.endpoint",
          message: `Invalid URL format: ${merged.endpoint}`,
        }),
      );
    }

    // Validate access key
    if (!merged.accessKeyId || merged.accessKeyId.trim() === "") {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "seaweedfs.accessKeyId",
          message: "Access key ID is required",
        }),
      );
    }

    // Validate secret key
    if (!merged.secretAccessKey || merged.secretAccessKey.trim() === "") {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "seaweedfs.secretAccessKey",
          message: "Secret access key is required",
        }),
      );
    }

    return merged;
  });
}

/**
 * Loads configuration from environment variables
 * Returns Effect<SeaweedFSConfig, ConfigurationError, never>
 */
export function loadConfigFromEnv(): Effect.Effect<
  SeaweedFSConfig,
  ConfigurationError,
  never
> {
  return Effect.gen(function* () {
    // Build SeaweedFS config from env vars, using defaults for missing values
    const seaweedfs: SeaweedFSConfig = {
      endpoint:
        process.env.SEAWEEDFS_ENDPOINT ?? defaultSeaweedFSConfig.endpoint,
      region: process.env.SEAWEEDFS_REGION ?? defaultSeaweedFSConfig.region,
      accessKeyId:
        process.env.SEAWEEDFS_ACCESS_KEY ?? defaultSeaweedFSConfig.accessKeyId,
      secretAccessKey:
        process.env.SEAWEEDFS_SECRET_KEY ??
        defaultSeaweedFSConfig.secretAccessKey,
      forcePathStyle:
        process.env.SEAWEEDFS_FORCE_PATH_STYLE !== "false",
      useSsl: process.env.SEAWEEDFS_USE_SSL === "true",
    };

    return yield* validateSeaweedFSConfig(seaweedfs);
  });
}
