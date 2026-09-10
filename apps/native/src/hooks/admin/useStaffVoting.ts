import { useCallback } from "react";
import {
  MIN_SUBMISSIONS_TO_VOTE,
  type VotingPhase,
  type VotingSubmission,
  useVotingDeck,
} from "~/hooks/voting/useVotingDeck";

export type { VotingPhase, VotingSubmission };
export {
  buildVotingDeck,
  pickNextPair,
  rankByRating,
  toPairKey,
} from "~/hooks/voting/useVotingDeck";

interface UseStaffVotingProps {
  votingSubmissions: VotingSubmission[];
  hasMyCompleteVote: boolean;
  requiredVotePositions: number;
  judgedStaffProgress?: { eligibleSubmissionsCount?: number };
  myVotesError?: unknown;
  judgedStaffProgressError?: unknown;
  challenge?: {
    scoringCategory: string;
    endTime?: string | Date | null;
    status: string;
  };
  onPhaseChange?: (phase: VotingPhase, blockedReason?: string) => void;
}

/**
 * Judged staff voting: the shared comparison deck plus the staff specific gating
 * (admin progress, submission phase, already cast votes).
 */
export const useStaffVoting = ({
  votingSubmissions,
  hasMyCompleteVote,
  requiredVotePositions,
  judgedStaffProgress,
  myVotesError,
  judgedStaffProgressError,
  challenge,
  onPhaseChange,
}: UseStaffVotingProps) => {
  const deck = useVotingDeck({ votingSubmissions, onPhaseChange });
  const { phase, bootstrapped, blockVoting, completeVoting, startComparing } = deck;

  const submissionEndTimestamp = challenge?.endTime ? new Date(challenge.endTime).getTime() : null;
  // A challenge without an end time has no submission phase to wait for, so voting is
  // open right away. Treating a missing end time as "not ended yet" left such
  // challenges impossible to vote on or complete.
  const isSubmissionPhaseEnded =
    submissionEndTimestamp === null ||
    !Number.isFinite(submissionEndTimestamp) ||
    submissionEndTimestamp <= Date.now();

  const bootstrapVoting = useCallback(() => {
    if (!challenge) return;

    if (challenge.scoringCategory !== "JUDGED_STAFF") {
      blockVoting("This screen is available only for Judged Staff challenges.");
      return;
    }

    if (!isSubmissionPhaseEnded) {
      blockVoting("Staff voting will be available only after submission phase ends.");
      return;
    }

    if (challenge.status === "CANCELLED") {
      blockVoting("Challenge is cancelled.");
      return;
    }

    if (myVotesError) {
      blockVoting(
        myVotesError instanceof Error
          ? myVotesError.message
          : "Voting unavailable for your account",
      );
      return;
    }

    if (judgedStaffProgressError) {
      blockVoting(
        judgedStaffProgressError instanceof Error
          ? judgedStaffProgressError.message
          : "Unable to load staff voting progress",
      );
      return;
    }

    if (challenge.status === "COMPLETED" || hasMyCompleteVote) {
      if (phase !== "done") {
        completeVoting();
      }
      return;
    }

    // The deck can be smaller than the server side eligible count, and a deck that is
    // too small must block rather than leave the screen on a spinner that never
    // resolves.
    const deckSize = votingSubmissions.length;
    if (requiredVotePositions < MIN_SUBMISSIONS_TO_VOTE || deckSize < MIN_SUBMISSIONS_TO_VOTE) {
      const eligibleNow =
        deckSize < MIN_SUBMISSIONS_TO_VOTE
          ? deckSize
          : (judgedStaffProgress?.eligibleSubmissionsCount ?? deckSize);
      blockVoting(
        `At least ${MIN_SUBMISSIONS_TO_VOTE} eligible submissions are required to start staff voting. Eligible now: ${eligibleNow}.`,
      );
      return;
    }

    if (!bootstrapped || phase === "blocked") {
      startComparing();
    }
  }, [
    challenge,
    hasMyCompleteVote,
    myVotesError,
    judgedStaffProgressError,
    requiredVotePositions,
    judgedStaffProgress,
    votingSubmissions.length,
    isSubmissionPhaseEnded,
    phase,
    bootstrapped,
    startComparing,
    blockVoting,
    completeVoting,
  ]);

  return {
    ...deck,
    isSubmissionPhaseEnded,
    bootstrapVoting,
  };
};
