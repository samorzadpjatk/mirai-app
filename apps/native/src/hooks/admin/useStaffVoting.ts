import { useCallback, useMemo, useState } from "react";

export type VotingPhase = "comparing" | "confirming" | "done" | "blocked";

export interface VotingSubmission {
  id: string;
  groupId: string;
  groupName: string;
  imagePath: string;
  createdAt: string | Date;
}

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

const ELO_BASE_RATING = 1500;
const ELO_K = 32;
const TOP3_STABILITY_REQUIRED = 3;
const MIN_SUBMISSIONS_TO_VOTE = 2;

export const toPairKey = (leftId: string, rightId: string) =>
  leftId < rightId ? `${leftId}|${rightId}` : `${rightId}|${leftId}`;

export const rankByRating = (submissions: VotingSubmission[], ratings: Record<string, number>) =>
  [...submissions].sort((a, b) => {
    const ratingDelta = (ratings[b.id] ?? ELO_BASE_RATING) - (ratings[a.id] ?? ELO_BASE_RATING);
    if (Math.abs(ratingDelta) > 0.0001) return ratingDelta;
    const createdAtDelta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (createdAtDelta !== 0) return createdAtDelta;
    return a.id.localeCompare(b.id);
  });

export const pickNextPair = (
  submissions: VotingSubmission[],
  ratings: Record<string, number>,
  comparedPairs: Set<string>,
) => {
  const candidates: {
    pair: [string, string];
    diff: number;
  }[] = [];

  for (let i = 0; i < submissions.length; i += 1) {
    const left = submissions[i];
    if (!left) continue;
    for (let j = i + 1; j < submissions.length; j += 1) {
      const right = submissions[j];
      if (!right) continue;
      if (left.groupId === right.groupId) continue;
      const key = toPairKey(left.id, right.id);
      if (comparedPairs.has(key)) continue;
      const diff = Math.abs(
        (ratings[left.id] ?? ELO_BASE_RATING) - (ratings[right.id] ?? ELO_BASE_RATING),
      );
      candidates.push({ pair: [left.id, right.id], diff });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.diff - b.diff);
  const poolSize = Math.min(candidates.length, 6);
  const pickIndex = Math.floor(Math.random() * poolSize);
  return candidates[pickIndex]?.pair ?? candidates[0]?.pair ?? null;
};

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
  const [phase, setPhase] = useState<VotingPhase>("comparing");
  const [blockedReason, setBlockedReason] = useState<string>("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comparedPairs, setComparedPairs] = useState<Set<string>>(new Set());
  const [currentPair, setCurrentPair] = useState<[string, string] | null>(null);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [stableTop3Count, setStableTop3Count] = useState(0);
  const [previousTop3Key, setPreviousTop3Key] = useState<string>("");
  const [finalTopThreeIds, setFinalTopThreeIds] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  const submissionById = useMemo(
    () => new Map(votingSubmissions.map((submission) => [submission.id, submission])),
    [votingSubmissions],
  );

  const hardCap = Math.max(votingSubmissions.length * 2, 1);
  const ranking = useMemo(
    () => rankByRating(votingSubmissions, ratings),
    [votingSubmissions, ratings],
  );
  const calculatedTopThree = ranking.slice(0, 3);
  const finalTopThree = useMemo(() => {
    if (finalTopThreeIds.length > 0) {
      return finalTopThreeIds
        .map((id) => submissionById.get(id))
        .filter((submission): submission is VotingSubmission => Boolean(submission));
    }
    return calculatedTopThree;
  }, [calculatedTopThree, finalTopThreeIds, submissionById]);

  const submissionEndTimestamp = challenge?.endTime ? new Date(challenge.endTime).getTime() : null;
  const isSubmissionPhaseEnded =
    submissionEndTimestamp !== null &&
    Number.isFinite(submissionEndTimestamp) &&
    submissionEndTimestamp <= Date.now();

  const currentLeft = currentPair ? submissionById.get(currentPair[0]) : null;
  const currentRight = currentPair ? submissionById.get(currentPair[1]) : null;

  const startComparing = useCallback(() => {
    if (votingSubmissions.length < MIN_SUBMISSIONS_TO_VOTE) return;
    const initialRatings = Object.fromEntries(
      votingSubmissions.map((submission) => [submission.id, ELO_BASE_RATING]),
    );
    const initialCompared = new Set<string>();
    const pair = pickNextPair(votingSubmissions, initialRatings, initialCompared);

    setRatings(initialRatings);
    setComparedPairs(initialCompared);
    setCurrentPair(pair);
    setComparisonCount(0);
    setStableTop3Count(0);
    setPreviousTop3Key("");
    setFinalTopThreeIds([]);
    setBlockedReason("");
    setPhase("comparing");
    onPhaseChange?.("comparing");
  }, [votingSubmissions, onPhaseChange]);

  const handlePickWinner = useCallback(
    (winnerId: string) => {
      if (phase !== "comparing") return;
      if (!currentPair) return;
      const [leftId, rightId] = currentPair;

      const leftRating = ratings[leftId] ?? ELO_BASE_RATING;
      const rightRating = ratings[rightId] ?? ELO_BASE_RATING;
      const expectedLeft = 1 / (1 + 10 ** ((rightRating - leftRating) / 400));
      const expectedRight = 1 / (1 + 10 ** ((leftRating - rightRating) / 400));
      const leftScore = winnerId === leftId ? 1 : 0;
      const rightScore = winnerId === rightId ? 1 : 0;

      const nextRatings: Record<string, number> = {
        ...ratings,
        [leftId]: leftRating + ELO_K * (leftScore - expectedLeft),
        [rightId]: rightRating + ELO_K * (rightScore - expectedRight),
      };

      const nextCompared = new Set(comparedPairs);
      nextCompared.add(toPairKey(leftId, rightId));
      const nextComparisonCount = comparisonCount + 1;
      const nextRanking = rankByRating(votingSubmissions, nextRatings);
      const nextTop3Ids = nextRanking.slice(0, 3).map((submission) => submission.id);
      const nextTop3Key = nextTop3Ids.join("|");
      const nextStableTop3Count = previousTop3Key === nextTop3Key ? stableTop3Count + 1 : 0;

      const reachedHardCap = nextComparisonCount >= hardCap;
      const reachedStableTop3 = nextStableTop3Count >= TOP3_STABILITY_REQUIRED;
      const nextPair = pickNextPair(votingSubmissions, nextRatings, nextCompared);
      const noMorePairs = !nextPair;

      setRatings(nextRatings);
      setComparedPairs(nextCompared);
      setComparisonCount(nextComparisonCount);
      setStableTop3Count(nextStableTop3Count);
      setPreviousTop3Key(nextTop3Key);

      if (reachedHardCap || reachedStableTop3 || noMorePairs) {
        setFinalTopThreeIds(nextTop3Ids);
        setCurrentPair(null);
        setPhase("confirming");
        onPhaseChange?.("confirming");
        return;
      }

      setCurrentPair(nextPair);
    },
    [
      phase,
      currentPair,
      ratings,
      comparedPairs,
      comparisonCount,
      stableTop3Count,
      previousTop3Key,
      votingSubmissions,
      hardCap,
      onPhaseChange,
    ],
  );

  const bootstrapVoting = useCallback(() => {
    const setBlockedState = (reason: string) => {
      setPhase("blocked");
      setBlockedReason(reason);
      setBootstrapped(true);
      onPhaseChange?.("blocked", reason);
    };

    if (!challenge) return;

    if (challenge.scoringCategory !== "JUDGED_STAFF") {
      setBlockedState("This screen is available only for Judged Staff challenges.");
      return;
    }

    if (!challenge.endTime) {
      setBlockedState(
        "Staff voting will be available after submission phase ends. Set submission end time first.",
      );
      return;
    }

    if (!isSubmissionPhaseEnded) {
      setBlockedState("Staff voting will be available only after submission phase ends.");
      return;
    }

    if (challenge.status === "CANCELLED") {
      setBlockedState("Challenge is cancelled.");
      return;
    }

    if (myVotesError) {
      const message =
        myVotesError instanceof Error
          ? myVotesError.message
          : "Voting unavailable for your account";
      setBlockedState(message);
      return;
    }

    if (judgedStaffProgressError) {
      const message =
        judgedStaffProgressError instanceof Error
          ? judgedStaffProgressError.message
          : "Unable to load staff voting progress";
      setBlockedState(message);
      return;
    }

    if (challenge.status === "COMPLETED" || hasMyCompleteVote) {
      if (phase !== "done") {
        setTimeout(() => {
          setPhase("done");
          onPhaseChange?.("done");
        }, 0);
      }
      setTimeout(() => setBootstrapped(true), 0);
      return;
    }

    if (requiredVotePositions < MIN_SUBMISSIONS_TO_VOTE) {
      if (phase !== "blocked") {
        setTimeout(() => {
          setPhase("blocked");
          onPhaseChange?.("blocked");
        }, 0);
      }
      setTimeout(
        () =>
          setBlockedReason(
            `At least ${MIN_SUBMISSIONS_TO_VOTE} eligible submissions are required to start staff voting. Eligible now: ${judgedStaffProgress?.eligibleSubmissionsCount ?? votingSubmissions.length}.`,
          ),
        0,
      );
      setTimeout(() => setBootstrapped(true), 0);
      return;
    }

    if (!bootstrapped || phase === "blocked") {
      setTimeout(() => startComparing(), 0);
      setTimeout(() => setBootstrapped(true), 0);
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
    onPhaseChange,
  ]);

  const resetVoting = useCallback(() => {
    setPhase("comparing");
    setBlockedReason("");
    setRatings({});
    setComparedPairs(new Set());
    setCurrentPair(null);
    setComparisonCount(0);
    setStableTop3Count(0);
    setPreviousTop3Key("");
    setFinalTopThreeIds([]);
    setBootstrapped(false);
    onPhaseChange?.("comparing");
  }, [onPhaseChange]);

  const progress = Math.min(comparisonCount / hardCap, 1);

  return {
    // State
    phase,
    blockedReason,
    currentPair,
    currentLeft,
    currentRight,
    comparisonCount,
    hardCap,
    progress,
    finalTopThree,
    stableTop3Count,
    bootstrapped,

    // Computed
    ranking,
    calculatedTopThree,

    // Actions
    handlePickWinner,
    startComparing,
    resetVoting,
    bootstrapVoting,

    // Constants
    MIN_SUBMISSIONS_TO_VOTE,
    TOP3_STABILITY_REQUIRED,
  };
};
