export interface ValidationError {
  error: "BAD_REQUEST" | "FORBIDDEN" | "CONFLICT";
  message: string;
}

/**
 * Validates that a vote payload has unique submissionIds and unique positions.
 * Returns null if valid, or a ValidationError if invalid.
 */
export function validateVotePayload(
  votes: { submissionId: string; votePosition: number }[],
): ValidationError | null {
  const uniqueSubmissionIds = new Set(votes.map((vote) => vote.submissionId));
  if (uniqueSubmissionIds.size !== votes.length) {
    return { error: "BAD_REQUEST", message: "Nie mozna glosowac wielokrotnie na to samo zgloszenie" };
  }

  const uniquePositions = new Set(votes.map((vote) => vote.votePosition));
  if (uniquePositions.size !== votes.length) {
    return { error: "BAD_REQUEST", message: "Pozycje glosow musza byc unikalne" };
  }

  return null;
}

/**
 * Validates that a participant is not voting on their own group's submission.
 * Returns null if valid, or a ValidationError if invalid.
 */
export function validateNoSelfVoting(
  submissions: { id: string; groupId: string | null }[],
  participantGroupId: string | null | undefined,
): ValidationError | null {
  if (!participantGroupId) return null;

  const ownSubmission = submissions.find(
    (submission) => submission.groupId === participantGroupId,
  );
  if (ownSubmission) {
    return { error: "FORBIDDEN", message: "Nie mozna glosowac na wlasna grupe" };
  }

  return null;
}

/**
 * Validates that a single vote position does not conflict with existing votes.
 * For PEER_VOTING: any existing vote is a conflict.
 * For JUDGED_STAFF: only position conflicts are checked.
 * Returns null if valid, or a ValidationError if invalid.
 */
export function validateVotePositionConflict(
  existingVotes: { id: string; votePosition: number; submissionId: string }[],
  votePosition: number,
  submissionId: string,
  scoringCategory: "PEER_VOTING" | "JUDGED_STAFF" | string,
): ValidationError | null {
  if (existingVotes.length === 0) return null;

  if (scoringCategory === "PEER_VOTING") {
    return {
      error: "CONFLICT",
      message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu.",
    };
  }

  const existingByPosition = existingVotes.find(
    (vote) => vote.votePosition === votePosition,
  );

  if (existingByPosition) {
    if (existingByPosition.submissionId === submissionId) {
      return { error: "CONFLICT", message: "Glos juz istnieje" };
    }
    return { error: "BAD_REQUEST", message: "Pozycja glosu jest juz zajeta" };
  }

  return null;
}

/**
 * Computes the required vote positions based on eligible submissions count.
 * Returns 0 if fewer than 2 submissions, otherwise min(3, count).
 */
export function resolveRequiredVotePositions(eligibleSubmissionsCount: number): {
  requiredPositions: number;
  eligibleSubmissionsCount: number;
} {
  const requiredPositions =
    eligibleSubmissionsCount >= 2 ? Math.min(3, eligibleSubmissionsCount) : 0;

  return {
    requiredPositions,
    eligibleSubmissionsCount,
  };
}

/**
 * Validates that vote positions are within the required range.
 * Returns null if valid, or a ValidationError if invalid.
 */
export function validateVotePositionsRange(
  votePositions: number[],
  requiredPositions: number,
  requireExactCount: boolean,
): ValidationError | null {
  if (requiredPositions <= 0) {
    return {
      error: "BAD_REQUEST",
      message: "At least 2 eligible submissions are required for staff voting",
    };
  }

  if (votePositions.some((position) => position > requiredPositions)) {
    return {
      error: "BAD_REQUEST",
      message: `Staff voting accepts only positions 1-${requiredPositions}`,
    };
  }

  if (requireExactCount && votePositions.length !== requiredPositions) {
    return {
      error: "BAD_REQUEST",
      message: `Staff voting requires exactly ${requiredPositions} votes`,
    };
  }

  return null;
}
