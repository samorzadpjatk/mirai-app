/**
 * User Agent Enums
 *
 * Enums for user agent tracking and platform detection.
 *
 * @module enums/user-agent
 */

/**
 * User agent platforms
 */
export enum UserAgentPlatform {
  IOS = "ios",
  ANDROID = "android",
  WEB = "web",
  UNKNOWN = "unknown",
}

/**
 * Type guard to check if a string is a valid UserAgentPlatform
 */
export function isUserAgentPlatform(value: string): value is UserAgentPlatform {
  return Object.values(UserAgentPlatform).includes(value as UserAgentPlatform);
}

/**
 * Detect platform from user agent string
 */
export function detectPlatformFromUserAgent(
  userAgent: string,
): UserAgentPlatform {
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
 * Check if platform is mobile (iOS or Android)
 */
export function isMobilePlatform(platform: UserAgentPlatform): boolean {
  return (
    platform === UserAgentPlatform.IOS || platform === UserAgentPlatform.ANDROID
  );
}
