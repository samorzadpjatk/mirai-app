import { Effect } from "effect";
import { ValidationError } from "../errors/effect-errors";

/**
 * UserAgentPlatform - supported platforms for user agent tracking
 */
export enum UserAgentPlatform {
  IOS = "ios",
  ANDROID = "android",
  WEB = "web",
  UNKNOWN = "unknown",
}

/**
 * Validation rules for UserAgent data
 */
const VALIDATION_RULES = {
  userAgent: {
    minLength: 10,
    maxLength: 500,
  },
  endpoint: {
    maxLength: 200,
  },
};

/**
 * UserAgent entity - tracks app usage and device information
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class UserAgent {
  private constructor(
    public readonly id: string,
    public readonly userAgentString: string,
    public readonly platform: UserAgentPlatform,
    public readonly userId: string | null,
    public readonly endpoint: string | null,
    public readonly timestamp: Date,
  ) {}

  /**
   * Factory method to create a new UserAgent
   * Validates all input data
   */
  static create(props: {
    id?: string;
    userAgent: string;
    platform: UserAgentPlatform;
    userId?: string | null;
    endpoint?: string | null;
    timestamp?: Date;
  }): Effect.Effect<UserAgent, ValidationError, never> {
    // Validate userAgent
    if (!props.userAgent || props.userAgent.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "userAgent is required",
          field: "userAgent",
        }),
      );
    }
    if (props.userAgent.length < VALIDATION_RULES.userAgent.minLength) {
      return Effect.fail(
        new ValidationError({
          message: `userAgent must be at least ${VALIDATION_RULES.userAgent.minLength} characters`,
          field: "userAgent",
        }),
      );
    }
    if (props.userAgent.length > VALIDATION_RULES.userAgent.maxLength) {
      return Effect.fail(
        new ValidationError({
          message: `userAgent must be at most ${VALIDATION_RULES.userAgent.maxLength} characters`,
          field: "userAgent",
        }),
      );
    }

    // Validate platform
    if (!Object.values(UserAgentPlatform).includes(props.platform)) {
      return Effect.fail(
        new ValidationError({
          message: `Invalid platform: ${props.platform}`,
          field: "platform",
        }),
      );
    }

    // Validate endpoint if provided
    if (
      props.endpoint &&
      props.endpoint.length > VALIDATION_RULES.endpoint.maxLength
    ) {
      return Effect.fail(
        new ValidationError({
          message: `endpoint must be at most ${VALIDATION_RULES.endpoint.maxLength} characters`,
          field: "endpoint",
        }),
      );
    }

    return Effect.succeed(
      new UserAgent(
        props.id ?? crypto.randomUUID(),
        props.userAgent.trim(),
        props.platform,
        props.userId ?? null,
        props.endpoint ?? null,
        props.timestamp ?? new Date(),
      ),
    );
  }

  /**
   * Detect platform from user agent string (factory method)
   */
  static detectPlatform(userAgent: string): UserAgentPlatform {
    const ua = userAgent.toLowerCase();
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) {
      return UserAgentPlatform.IOS;
    }
    if (ua.includes("android")) {
      return UserAgentPlatform.ANDROID;
    }
    if (
      ua.includes("mozilla") ||
      ua.includes("chrome") ||
      ua.includes("safari")
    ) {
      return UserAgentPlatform.WEB;
    }
    return UserAgentPlatform.UNKNOWN;
  }

  /**
   * Create with auto-detected platform
   */
  static createWithDetectedPlatform(props: {
    id?: string;
    userAgent: string;
    userId?: string | null;
    endpoint?: string | null;
    timestamp?: Date;
  }): Effect.Effect<UserAgent, ValidationError, never> {
    const platform = UserAgent.detectPlatform(props.userAgent);
    return UserAgent.create({
      ...props,
      platform,
    });
  }

  /**
   * Check if associated with a user
   */
  isAuthenticated(): boolean {
    return this.userId !== null;
  }

  /**
   * Check if anonymous (no user)
   */
  isAnonymous(): boolean {
    return this.userId === null;
  }

  /**
   * Check if has endpoint info
   */
  hasEndpoint(): boolean {
    return this.endpoint !== null && this.endpoint.length > 0;
  }

  /**
   * Platform checks
   */
  isIOS(): boolean {
    return this.platform === UserAgentPlatform.IOS;
  }

  isAndroid(): boolean {
    return this.platform === UserAgentPlatform.ANDROID;
  }

  isWeb(): boolean {
    return this.platform === UserAgentPlatform.WEB;
  }

  /**
   * Check if belongs to specific user
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Get age of record in milliseconds
   */
  getAgeMs(): number {
    return Date.now() - this.timestamp.getTime();
  }

  /**
   * Check if record is older than given milliseconds
   */
  isOlderThan(ms: number): boolean {
    return this.getAgeMs() > ms;
  }
}
