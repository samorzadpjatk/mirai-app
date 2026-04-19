import { Data, Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";

/**
 * Configuration validation error for email service
 */
export class EmailConfigurationError
  extends Data.TaggedError("EmailConfigurationError")<{
    field: string;
    message: string;
  }>
  implements IPortError
{
  override readonly message: string;

  constructor(props: { field: string; message: string }) {
    super(props);
    this.message = `Email configuration error for '${props.field}': ${props.message}`;
  }
}

/**
 * SMTP email service connection configuration
 */
export interface SmtpEmailConfig {
  /** SMTP server hostname (e.g., "smtp.gmail.com") */
  host: string;

  /** SMTP server port (e.g., 587 for TLS, 465 for SSL) */
  port: number;

  /** SMTP username for authentication */
  user: string;

  /** SMTP password for authentication */
  pass: string;

  /** Sender email address (From field) */
  from: string;

  /** Whether to use secure connection (TLS/SSL) */
  secure: boolean;
}

/**
 * Default development configuration values
 * Uses Mailpit for local development (configured in docker-compose.dev.yml)
 */
export const defaultSmtpEmailConfig: SmtpEmailConfig = {
  host: process.env.SMTP_HOST ?? "mailpit",
  port: Number.parseInt(process.env.SMTP_PORT ?? "1025", 10),
  user: process.env.SMTP_USER ?? "",
  pass: process.env.SMTP_PASS ?? "",
  from: process.env.SMTP_FROM ?? "dev@pjapp.local",
  secure: process.env.SMTP_SECURE === "true",
};

/**
 * Validates SMTP email configuration
 * Returns Effect<SmtpEmailConfig, EmailConfigurationError, never>
 */
export function validateSmtpEmailConfig(
  config: Partial<SmtpEmailConfig> = {},
): Effect.Effect<SmtpEmailConfig, EmailConfigurationError, never> {
  return Effect.gen(function* () {
    const merged = { ...defaultSmtpEmailConfig, ...config };

    // Validate host
    if (!merged.host || merged.host.trim() === "") {
      return yield* Effect.fail(
        new EmailConfigurationError({
          field: "smtp.host",
          message: "SMTP host is required",
        }),
      );
    }

    // Validate port
    if (
      Number.isNaN(merged.port) ||
      merged.port < 1 ||
      merged.port > 65535
    ) {
      return yield* Effect.fail(
        new EmailConfigurationError({
          field: "smtp.port",
          message: `Invalid SMTP port: ${merged.port}. Must be between 1 and 65535.`,
        }),
      );
    }

    // Validate from address
    if (!merged.from || merged.from.trim() === "") {
      return yield* Effect.fail(
        new EmailConfigurationError({
          field: "smtp.from",
          message: "Sender email address (from) is required",
        }),
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(merged.from)) {
      return yield* Effect.fail(
        new EmailConfigurationError({
          field: "smtp.from",
          message: `Invalid sender email format: ${merged.from}`,
        }),
      );
    }

    return merged;
  });
}

/**
 * Loads configuration from environment variables
 * Returns Effect<SmtpEmailConfig, EmailConfigurationError, never>
 */
export function loadSmtpConfigFromEnv(): Effect.Effect<
  SmtpEmailConfig,
  EmailConfigurationError,
  never
> {
  return Effect.gen(function* () {
    // Build SMTP config from env vars, using defaults for missing values
    const smtp: SmtpEmailConfig = {
      host: process.env.SMTP_HOST ?? defaultSmtpEmailConfig.host,
      port: Number.parseInt(
        process.env.SMTP_PORT ?? String(defaultSmtpEmailConfig.port),
        10,
      ),
      user: process.env.SMTP_USER ?? defaultSmtpEmailConfig.user,
      pass: process.env.SMTP_PASS ?? defaultSmtpEmailConfig.pass,
      from: process.env.SMTP_FROM ?? defaultSmtpEmailConfig.from,
      secure: process.env.SMTP_SECURE === "true",
    };

    return yield* validateSmtpEmailConfig(smtp);
  });
}
