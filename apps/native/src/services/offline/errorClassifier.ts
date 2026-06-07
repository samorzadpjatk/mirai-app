export type ErrorType = "NETWORK_ERROR" | "VALIDATION_ERROR" | "CONFLICT_ERROR" | "SERVER_ERROR";

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  shouldQueue: boolean;
  shouldRetry: boolean;
}

export function classifyError(error: unknown): ClassifiedError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Network errors (no connection, timeout, DNS failure)
  if (
    errorMessage.includes("Network request failed") ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("Network Error") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("ECONNREFUSED") ||
    errorMessage.includes("ENOTFOUND") ||
    errorMessage.includes("ENETUNREACH") ||
    (error instanceof Error && error.name === "TypeError" && errorMessage.includes("fetch"))
  ) {
    return {
      type: "NETWORK_ERROR",
      message: "No internet connection. Will retry when online.",
      shouldQueue: true,
      shouldRetry: true,
    };
  }

  // Validation errors (4xx client errors)
  const statusCode = (error as { status?: number })?.status;
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    if (statusCode === 409) {
      return {
        type: "CONFLICT_ERROR",
        message: "Conflict detected. This action may have already been processed.",
        shouldQueue: false,
        shouldRetry: false,
      };
    }

    return {
      type: "VALIDATION_ERROR",
      message: errorMessage || "Invalid request. Please check your input.",
      shouldQueue: false,
      shouldRetry: false,
    };
  }

  // Server errors (5xx)
  if (statusCode && statusCode >= 500) {
    return {
      type: "SERVER_ERROR",
      message: "Server error. Will retry automatically.",
      shouldQueue: true,
      shouldRetry: true,
    };
  }

  // Default to server error for unknown errors
  return {
    type: "SERVER_ERROR",
    message: "An unexpected error occurred. Will retry automatically.",
    shouldQueue: true,
    shouldRetry: true,
  };
}

export function isNetworkError(error: unknown): boolean {
  return classifyError(error).type === "NETWORK_ERROR";
}
