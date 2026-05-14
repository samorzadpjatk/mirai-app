import { ORPCError } from "@orpc/server";

/**
 * Validates that a URL uses an allowed protocol.
 * Prevents SSRF, XSS via javascript: URLs, and local file access.
 */
export function validateUrlProtocol(
  value: string,
  allowedProtocols: string[] = ["http:", "https:"],
): void {
  if (!value?.trim()) {
    return;
  }

  try {
    const url = new URL(value);
    if (!allowedProtocols.includes(url.protocol)) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Invalid URL protocol: ${url.protocol}. Only ${allowedProtocols.join(", ")} are allowed.`,
      });
    }
  } catch (error) {
    if (error instanceof ORPCError) {
      throw error;
    }
    throw new ORPCError("BAD_REQUEST", {
      message: `Invalid URL format: ${value}`,
    });
  }
}

/**
 * Safe URL validator for Zod refinements.
 * Returns true if the URL is valid and uses an allowed protocol.
 */
export function isValidHttpUrl(value: string): boolean {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
