/**
 * Structured Logging System
 *
 * Replaces console.log with a proper logger that supports:
 * - Log levels (debug, info, warn, error)
 * - Structured output (JSON)
 * - Context/metadata attachment
 * - Environment-based filtering
 * - Integration with Effect
 *
 * @module logger
 */

// ============================================================================
// Log Levels
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

// ============================================================================
// Log Entry Types
// ============================================================================

export interface LogContext {
  readonly [key: string]: unknown;
}

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: LogContext;
  readonly error?: Error;
  readonly source?: string;
}

// ============================================================================
// Logger Configuration
// ============================================================================

export interface LoggerConfig {
  readonly level: LogLevel;
  readonly output: "console" | "json" | "pretty";
  readonly includeTimestamp: boolean;
  readonly includeSource: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || "info",
  output: (process.env.LOG_OUTPUT as LoggerConfig["output"]) || "pretty",
  includeTimestamp: true,
  includeSource: true,
};

// ============================================================================
// Logger Implementation
// ============================================================================

class Logger {
  private config: LoggerConfig;
  private source: string;

  constructor(source: string = "app", config: Partial<LoggerConfig> = {}) {
    this.source = source;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  private formatOutput(entry: LogEntry): string {
    switch (this.config.output) {
      case "json":
        return JSON.stringify({
          timestamp: entry.timestamp,
          level: entry.level,
          message: entry.message,
          source: entry.source,
          context: entry.context,
          error: entry.error
            ? { message: entry.error.message, stack: entry.error.stack }
            : undefined,
        });

      case "pretty":
        const parts: string[] = [];
        if (this.config.includeTimestamp) {
          parts.push(`[${entry.timestamp}]`);
        }
        parts.push(`[${entry.level.toUpperCase()}]`);
        if (this.config.includeSource && entry.source) {
          parts.push(`[${entry.source}]`);
        }
        parts.push(entry.message);
        if (entry.context && Object.keys(entry.context).length > 0) {
          parts.push(`\n  Context: ${JSON.stringify(entry.context)}`);
        }
        if (entry.error) {
          parts.push(`\n  Error: ${entry.error.message}`);
        }
        return parts.join(" ");

      case "console":
      default:
        return entry.message;
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      source: this.source,
    };

    const output = this.formatOutput(entry);

    switch (level) {
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(output);
        break;
      case "info":
        // eslint-disable-next-line no-console
        console.info(output);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(output);
        break;
      case "error":
        // eslint-disable-next-line no-console
        console.error(output);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log("warn", message, context, error);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log("error", message, context, error);
  }

  child(additionalContext: LogContext): Logger {
    return new Logger(this.source, {
      ...this.config,
    });
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// Default Logger Instance
// ============================================================================

export const logger = new Logger("app");

export function createLogger(
  source: string,
  config?: Partial<LoggerConfig>,
): Logger {
  return new Logger(source, config);
}

// ============================================================================
// Common Loggers
// ============================================================================

export const serverLogger = createLogger("server");
export const dbLogger = createLogger("database");
export const authLogger = createLogger("auth");
export const apiLogger = createLogger("api");
export const clientLogger = createLogger("client");
