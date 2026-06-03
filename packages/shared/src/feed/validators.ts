export interface UpdateActivityInput {
  title?: string;
  description?: string | null;
  isPinned?: boolean;
}

/**
 * Builds the update data object for an activity feed entry.
 * Only includes fields that are explicitly provided (not undefined).
 * Pure: no side effects, no async, no DB calls.
 */
export function buildUpdateActivityData(input: UpdateActivityInput): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.isPinned !== undefined) {
    updateData.isPinned = input.isPinned;
  }
  return updateData;
}

export interface ActivityVisibilityError {
  error: "FORBIDDEN";
  message: string;
}

/**
 * Validates that an activity is visible (not hidden).
 * Returns null if valid, or an ActivityVisibilityError if hidden.
 * Pure: no side effects, no async, no DB calls.
 */
export function validateActivityVisibility(isHidden: boolean): ActivityVisibilityError | null {
  if (isHidden) {
    return { error: "FORBIDDEN", message: "This activity is hidden" };
  }
  return null;
}
