import { useCallback, useMemo, useState } from "react";

export type VotingPhase = "comparing" | "confirming" | "done" | "blocked";

export interface VotingSubmission {
  id: string;
  groupId: string;
  groupName: string;
  /** Storage path of the first submitted image, if the submission has one. */
  imagePath: string | null;
  /** Storage path of the submitted video, if the submission has one. */
  videoPath?: string | null;
  /** Text answer, used when the submission carries no media at all. */
  textContent?: string | null;
  createdAt: string | Date;
}

/** Shape of a submission as returned by the challengeSubmission routers. */
export interface VotingDeckSource {
  id: string;
  groupId: string;
  status: string;
  imageIds: string[];
  videoId?: string | null;
  textContent?: string | null;
  createdAt: string | Date;
  group: { name: string };
}

export interface BuildVotingDeckOptions {
  /** Group whose own submission must be excluded (peer voting). */
  excludeGroupId?: string | null;
  /**
   * Drop submissions without any media. Peer voting challenges are always IMAGE or
   * VIDEO, so a submission without media there is one the viewer may not see yet.
   * Judged staff challenges accept every submission type and must not drop anything.
   */
  requireMedia?: boolean;
}

const ELO_BASE_RATING = 1500;
const ELO_K = 32;
const TOP3_STABILITY_REQUIRED = 3;
const CLOSEST_PAIR_POOL_SIZE = 6;

export const MIN_SUBMISSIONS_TO_VOTE = 2;

const NOT_ENOUGH_SUBMISSIONS_REASON = `At least ${MIN_SUBMISSIONS_TO_VOTE} submissions from different groups are required to start voting.`;

/**
 * Maps router submissions onto the deck the voting screens compare.
 *
 * Media agnostic on purpose: a submission is eligible because it was not rejected,
 * not because it happens to have an image. Filtering on `imageIds[0]` silently
 * dropped every video submission from the deck, which corrupted the scoring.
 */
export const buildVotingDeck = (
  submissions: readonly VotingDeckSource[] | undefined,
  options: BuildVotingDeckOptions = {},
): VotingSubmission[] =>
  (submissions ?? [])
    .filter((submission) => submission.status !== "REJECTED")
    .filter((submission) =>
      options.excludeGroupId ? submission.groupId !== options.excludeGroupId : true,
    )
    .filter((submission) =>
      options.requireMedia ? Boolean(submission.imageIds[0] ?? submission.videoId) : true,
    )
    .map((submission) => ({
      id: submission.id,
      groupId: submission.groupId,
      groupName: submission.group.name,
      imagePath: submission.imageIds[0] ?? null,
      videoPath: submission.videoId ?? null,
      textContent: submission.textContent ?? null,
      createdAt: submission.createdAt,
    }));

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
  const poolSize = Math.min(candidates.length, CLOSEST_PAIR_POOL_SIZE);
  const pickIndex = Math.floor(Math.random() * poolSize);
  return candidates[pickIndex]?.pair ?? candidates[0]?.pair ?? null;
};

interface UseVotingDeckProps {
  votingSubmissions: VotingSubmission[];
  onPhaseChange?: (phase: VotingPhase, blockedReason?: string) => void;
}

/**
 * Pairwise Elo comparison deck shared by peer voting and judged staff voting.
 * Owns the ranking engine so neither screen has to reimplement it.
 */
export const useVotingDeck = ({ votingSubmissions, onPhaseChange }: UseVotingDeckProps) => {
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

  const currentLeft = currentPair ? submissionById.get(currentPair[0]) : null;
  const currentRight = currentPair ? submissionById.get(currentPair[1]) : null;

  const blockVoting = useCallback(
    (reason: string) => {
      setPhase("blocked");
      setBlockedReason(reason);
      setBootstrapped(true);
      onPhaseChange?.("blocked", reason);
    },
    [onPhaseChange],
  );

  const completeVoting = useCallback(() => {
    setCurrentPair(null);
    setPhase("done");
    setBootstrapped(true);
    onPhaseChange?.("done");
  }, [onPhaseChange]);

  const startComparing = useCallback(() => {
    if (votingSubmissions.length < MIN_SUBMISSIONS_TO_VOTE) {
      blockVoting(NOT_ENOUGH_SUBMISSIONS_REASON);
      return;
    }

    const initialRatings = Object.fromEntries(
      votingSubmissions.map((submission) => [submission.id, ELO_BASE_RATING]),
    );
    const initialCompared = new Set<string>();
    const pair = pickNextPair(votingSubmissions, initialRatings, initialCompared);

    // Every submission belongs to the same group, so there is nothing to compare.
    // Without this guard the screen renders a spinner that never resolves.
    if (!pair) {
      blockVoting(NOT_ENOUGH_SUBMISSIONS_REASON);
      return;
    }

    setRatings(initialRatings);
    setComparedPairs(initialCompared);
    setCurrentPair(pair);
    setComparisonCount(0);
    setStableTop3Count(0);
    setPreviousTop3Key("");
    setFinalTopThreeIds([]);
    setBlockedReason("");
    setPhase("comparing");
    setBootstrapped(true);
    onPhaseChange?.("comparing");
  }, [votingSubmissions, onPhaseChange, blockVoting]);

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
    blockVoting,
    completeVoting,

    // Constants
    MIN_SUBMISSIONS_TO_VOTE,
    TOP3_STABILITY_REQUIRED,
  };
};
