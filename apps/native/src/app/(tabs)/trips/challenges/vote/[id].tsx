import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "urql";
import {
  GetChallengeDocument,
  GetChallengeSubmissionsDocument,
  GetMyVotesDocument,
  SubmitVoteDocument,
  GetCurrentUserDocument,
} from "@mirai-app/graphql-client";
import { View, Text } from "@mirai-app/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTripDetails } from "~/hooks/trips";
import { ChallengeLoadingState } from "~/components/trips/challenges/ChallengeLoadingState";
import { ChallengeNotFoundState } from "~/components/trips/challenges/ChallengeNotFoundState";

type VotingPhase = "comparing" | "confirming" | "done" | "blocked";

interface VotingSubmission {
  id: string;
  groupId: string;
  groupName: string;
  imagePath: string;
  createdAt: string | Date;
}

const ELO_BASE_RATING = 1500;
const ELO_K = 32;
const TOP3_STABILITY_REQUIRED = 3;
const MIN_SUBMISSIONS_TO_VOTE = 2;

const toPairKey = (leftId: string, rightId: string) =>
  leftId < rightId ? `${leftId}|${rightId}` : `${rightId}|${leftId}`;

const rankByRating = (
  submissions: VotingSubmission[],
  ratings: Record<string, number>,
) =>
  [...submissions].sort((a, b) => {
    const ratingDelta =
      (ratings[b.id] ?? ELO_BASE_RATING) - (ratings[a.id] ?? ELO_BASE_RATING);
    if (Math.abs(ratingDelta) > 0.0001) return ratingDelta;
    const createdAtDelta =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (createdAtDelta !== 0) return createdAtDelta;
    return a.id.localeCompare(b.id);
  });

const pickNextPair = (
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
        (ratings[left.id] ?? ELO_BASE_RATING) -
          (ratings[right.id] ?? ELO_BASE_RATING),
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

const isConflictError = (error: unknown) => {
  if (typeof error !== "object" || error === null) return false;
  if ("data" in error) {
    const data = (error as { data?: { code?: string } }).data;
    if (data?.code === "CONFLICT") return true;
  }
  if ("message" in error) {
    const rawMessage = (error as { message?: unknown }).message;
    if (typeof rawMessage === "string") {
      return rawMessage.toUpperCase().includes("CONFLICT");
    }
  }
  return false;
};

function SubmissionImageCard({
  submission,
  title,
  subtitle,
  onPress,
  disabled = false,
}: {
  submission: VotingSubmission;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  // For image loading, we'll use a simple placeholder pattern
  // Storage URL generation would need a separate hook or util
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const content = (
    <View
      backgroundColor="$cardDark"
      borderWidth={1}
      borderColor="$whiteOpacity8"
      borderRadius="$xl"
      overflow="hidden"
    >
      <View
        width="100%"
        aspectRatio={16 / 10}
        backgroundColor="$backgroundDarkOpacity45"
      >
        {!imageLoaded && !imageError ? (
          <View
            width="100%"
            height="100%"
            alignItems="center"
            justifyContent="center"
          >
            <ActivityIndicator size="small" color="#2e9d8e" />
          </View>
        ) : imageError ? (
          <View
            width="100%"
            height="100%"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="$textMuted" fontSize={20} fontWeight="bold">
              {submission.groupName.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: submission.imagePath }}
            style={{ width: "100%", height: "100%" }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </View>
      <View padding="$md" gap={2}>
        <Text
          color="$primary"
          fontSize="$sm"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing={0.8}
        >
          {title}
        </Text>
        <Text color="$white" fontSize="$base" fontWeight="bold">
          {submission.groupName}
        </Text>
        {subtitle ? (
          <Text color="$textMuted" fontSize="$xs">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      {content}
    </TouchableOpacity>
  );
}

export default function ChallengePeerVotingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const insets = useSafeAreaInsets();

  const challengeId =
    typeof params.id === "string" ? params.id : params.id?.[0];
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  // GraphQL queries - using tuple destructuring with reexecute functions
  const [{ data: challenge, fetching: isLoadingChallenge }] = useQuery({
    query: GetChallengeDocument,
    variables: { id: challengeId ?? "", tripId: tripId ?? "" },
    pause: !challengeId || !tripId,
  });
  const [
    { data: challengeSubmissionsData, fetching: isLoadingSubmissions },
    reexecuteSubmissions,
  ] = useQuery({
    query: GetChallengeSubmissionsDocument,
    variables: { challengeId: challengeId ?? "", tripId: tripId ?? "" },
    pause: !challengeId || !tripId,
  });
  const [{ data: myVotesData, fetching: isLoadingVotes }, reexecuteMyVotes] =
    useQuery({
      query: GetMyVotesDocument,
      variables: { challengeId: challengeId ?? "", tripId: tripId ?? "" },
      pause: !challengeId || !tripId,
    });
  const [{ data: currentUser, fetching: isLoadingCurrentUser }] = useQuery({
    query: GetCurrentUserDocument,
    pause: !tripId,
  });

  const myVotes = myVotesData?.myVotes ?? [];

  const { isTripPast } = useTripDetails(tripId);

  useEffect(() => {
    if (isTripPast && challengeId && tripId) {
      router.replace({
        pathname: "/trips/challenges/[id]",
        params: {
          id: challengeId,
          tripId: tripId,
        },
      });
    }
  }, [isTripPast, challengeId, tripId, router]);

  // GraphQL mutation
  const [, submitVote] = useMutation(SubmitVoteDocument);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [phase, setPhase] = useState<VotingPhase>("comparing");
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comparedPairs, setComparedPairs] = useState<Set<string>>(new Set());
  const [currentPair, setCurrentPair] = useState<[string, string] | null>(null);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [stableTop3Count, setStableTop3Count] = useState(0);
  const [previousTop3Key, setPreviousTop3Key] = useState<string | null>(null);
  const [finalTopThreeIds, setFinalTopThreeIds] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Get user's group from challenge data
  const ownGroupId = useMemo(() => {
    if (!challenge?.challenge?.submissions) return null;
    const userSubmission = challenge.challenge.submissions.find(
      (s) => s.userId === currentUser?.currentUser?.id,
    );
    return userSubmission?.groupId ?? null;
  }, [challenge, currentUser]);

  const votingSubmissions: VotingSubmission[] = useMemo(() => {
    const submissionsData =
      challengeSubmissionsData?.challengeSubmissions?.submissions ?? [];
    const raw = submissionsData ?? [];
    return raw
      .filter((submission) => Boolean(submission.imageIds?.[0]))
      .filter((submission) =>
        ownGroupId ? submission.groupId !== ownGroupId : true,
      )
      .map((submission) => ({
        id: submission.id,
        groupId: submission.groupId,
        groupName: submission.group?.name ?? "Unknown",
        imagePath: submission.imageIds?.[0] ?? "",
        createdAt: submission.createdAt,
      }));
  }, [challengeSubmissionsData, ownGroupId]);

  const submissionById = useMemo(
    () =>
      new Map(
        votingSubmissions.map((submission) => [submission.id, submission]),
      ),
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
        .filter((submission): submission is VotingSubmission =>
          Boolean(submission),
        );
    }
    return calculatedTopThree;
  }, [calculatedTopThree, finalTopThreeIds, submissionById]);

  const currentLeft = currentPair ? submissionById.get(currentPair[0]) : null;
  const currentRight = currentPair ? submissionById.get(currentPair[1]) : null;
  const navigateBackToChallenge = useCallback(() => {
    router.replace({
      pathname: "/trips/challenges/[id]",
      params: {
        id: challengeId ?? "",
        tripId: tripId ?? "",
      },
    });
  }, [challengeId, router, tripId]);
  const shouldRedirectToChallengeDetails = Boolean(
    challengeId &&
    tripId &&
    challenge &&
    (challenge.challenge?.scoringCategory !== "PEER_VOTING" ||
      challenge.challenge?.status !== "VOTING_PHASE"),
  );

  const startComparing = useCallback(() => {
    if (votingSubmissions.length < MIN_SUBMISSIONS_TO_VOTE) return;
    const initialRatings = Object.fromEntries(
      votingSubmissions.map((submission) => [submission.id, ELO_BASE_RATING]),
    );
    const initialCompared = new Set<string>();
    const pair = pickNextPair(
      votingSubmissions,
      initialRatings,
      initialCompared,
    );

    setRatings(initialRatings);
    setComparedPairs(initialCompared);
    setCurrentPair(pair);
    setComparisonCount(0);
    setStableTop3Count(0);
    setPreviousTop3Key(null);
    setFinalTopThreeIds([]);
    setBlockedReason(null);
    setPhase("comparing");
  }, [votingSubmissions]);

  useEffect(() => {
    if (!shouldRedirectToChallengeDetails) return;
    navigateBackToChallenge();
  }, [navigateBackToChallenge, shouldRedirectToChallengeDetails]);

  useEffect(() => {
    if (!challengeId || !tripId) return;
    if (
      isLoadingChallenge ||
      isLoadingSubmissions ||
      isLoadingVotes ||
      isLoadingCurrentUser
    ) {
      return;
    }

    if (!challenge?.challenge) return;

    if (
      challenge.challenge.scoringCategory !== "PEER_VOTING" ||
      challenge.challenge.status !== "VOTING_PHASE"
    ) {
      return;
    }

    if ((myVotes?.length ?? 0) > 0) {
      navigateBackToChallenge();
      setBootstrapped(true);
      return;
    }

    if (votingSubmissions.length < MIN_SUBMISSIONS_TO_VOTE) {
      if (phase !== "blocked") {
        setPhase("blocked");
      }
      setBlockedReason(
        `At least ${MIN_SUBMISSIONS_TO_VOTE} approved submissions are required. Voting starts automatically after moderation and after submissions end. Eligible now: ${votingSubmissions.length}.`,
      );
      setBootstrapped(true);
      return;
    }

    if (!bootstrapped || phase === "blocked") {
      startComparing();
      setBootstrapped(true);
    }
  }, [
    bootstrapped,
    challenge,
    challengeId,
    phase,
    isLoadingChallenge,
    isLoadingCurrentUser,
    isLoadingSubmissions,
    isLoadingVotes,
    myVotes?.length,
    navigateBackToChallenge,
    shouldRedirectToChallengeDetails,
    startComparing,
    tripId,
    votingSubmissions.length,
  ]);

  const handlePickWinner = (winnerId: string) => {
    if (phase !== "comparing") return;
    if (!currentPair) return;
    const [leftId, rightId] = currentPair;
    const loserId = winnerId === leftId ? rightId : leftId;

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
    const nextTop3Ids = nextRanking
      .slice(0, 3)
      .map((submission) => submission.id);
    const nextTop3Key = nextTop3Ids.join("|");
    const nextStableTop3Count =
      previousTop3Key === nextTop3Key ? stableTop3Count + 1 : 0;

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
      return;
    }

    setCurrentPair(nextPair);
    void loserId;
  };

  const handleSubmitPodium = async () => {
    if (
      !tripId ||
      !challengeId ||
      finalTopThree.length < MIN_SUBMISSIONS_TO_VOTE
    ) {
      return;
    }

    const votesPayload = [
      {
        submissionId: finalTopThree[0]?.id ?? "",
        votePosition: 1,
        votePoints: 3,
      },
      {
        submissionId: finalTopThree[1]?.id ?? "",
        votePosition: 2,
        votePoints: 2,
      },
      {
        submissionId: finalTopThree[2]?.id ?? "",
        votePosition: 3,
        votePoints: 1,
      },
    ].filter((vote) => Boolean(vote.submissionId));

    try {
      setIsSubmitting(true);
      await Promise.all(
        votesPayload.map((vote) =>
          submitVote({
            tripId,
            challengeId,
            submissionId: vote.submissionId,
            votePosition: vote.votePosition,
            votePoints: vote.votePoints,
          }).catch((error) => {
            if (isConflictError(error)) {
              return null;
            }
            throw error;
          }),
        ),
      );

      // Reexecute queries to refresh data
      await Promise.all([
        reexecuteMyVotes({ requestPolicy: "network-only" }),
        reexecuteSubmissions({ requestPolicy: "network-only" }),
      ]);
      navigateBackToChallenge();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit votes";
      setBlockedReason(message);
      setPhase("blocked");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = Math.min(comparisonCount / hardCap, 1);

  if (
    !challengeId ||
    !tripId ||
    isLoadingChallenge ||
    shouldRedirectToChallengeDetails
  ) {
    return <ChallengeLoadingState />;
  }

  if (!challenge?.challenge) {
    return (
      <View flex={1} backgroundColor="$backgroundDark">
        <ChallengeNotFoundState onGoBack={() => router.back()} />
      </View>
    );
  }

  if (!bootstrapped) {
    return <ChallengeLoadingState />;
  }

  return (
    <View flex={1} backgroundColor="$backgroundDark">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          paddingBottom: insets.bottom + 64,
        }}
      >
        <Text fontSize="$xl" fontWeight="bold" color="$white">
          {challenge.challenge.name}
        </Text>
        <Text
          marginTop={-8}
          color="$textMuted"
          textTransform="uppercase"
          letterSpacing={1}
          fontSize="$xs"
        >
          Peer voting
        </Text>

        {phase === "comparing" ? (
          <>
            <View gap="$xs">
              <View
                height={8}
                borderRadius={999}
                backgroundColor="$whiteOpacity10"
                overflow="hidden"
              >
                <View
                  height="100%"
                  backgroundColor="$primary"
                  width={`${progress * 100}%`}
                />
              </View>
              <Text
                color="$textMuted"
                fontSize="$xs"
                textTransform="uppercase"
                letterSpacing={0.8}
              >
                {comparisonCount}/{hardCap} comparisons
              </Text>
            </View>

            {currentLeft && currentRight ? (
              <View gap="$md">
                <SubmissionImageCard
                  submission={currentLeft}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() => handlePickWinner(currentLeft.id)}
                />
                <SubmissionImageCard
                  submission={currentRight}
                  title="Pick this"
                  subtitle="Tap to select winner"
                  onPress={() => handlePickWinner(currentRight.id)}
                />
              </View>
            ) : (
              <View paddingVertical="$xl" alignItems="center">
                <ActivityIndicator size="small" color="#2e9d8e" />
              </View>
            )}

            {stableTop3Count > 0 ? (
              <Text
                color="$textMuted"
                fontSize="$xs"
                textTransform="uppercase"
                letterSpacing={0.8}
              >
                Top 3 stable streak: {stableTop3Count}/{TOP3_STABILITY_REQUIRED}
              </Text>
            ) : null}
          </>
        ) : null}

        {phase === "confirming" ? (
          <>
            <Text color="$white" fontSize="$lg" fontWeight="bold">
              Confirm your podium
            </Text>
            {comparisonCount < hardCap ? (
              <Text
                color="$emerald500"
                fontSize="$xs"
                textTransform="uppercase"
                letterSpacing={0.8}
                fontWeight="bold"
              >
                Mamy Twoje TOP 3!
              </Text>
            ) : null}
            <View gap="$sm">
              {finalTopThree.map((submission, index) => (
                <SubmissionImageCard
                  key={`${submission.id}-${index + 1}`}
                  submission={submission}
                  title={`#${index + 1}`}
                  subtitle={
                    index === 0
                      ? "3 points"
                      : index === 1
                        ? "2 points"
                        : "1 point"
                  }
                />
              ))}
            </View>
            <View gap="$sm">
              <TouchableOpacity
                style={{
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#2e9d8e",
                }}
                onPress={() => void handleSubmitPodium()}
                disabled={isSubmitting}
              >
                <Text
                  color="$backgroundDark"
                  fontSize="$sm"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing={0.8}
                >
                  {isSubmitting ? "Submitting..." : "Confirm Podium"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {phase === "blocked" ? (
          <View
            borderRadius="$xl"
            borderWidth={1}
            borderColor="rgba(255,107,107,0.35)"
            backgroundColor="rgba(255,107,107,0.12)"
            padding="$lg"
            gap="$sm"
          >
            <Text
              color="$danger"
              fontSize="$lg"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing={0.8}
            >
              Voting unavailable
            </Text>
            <Text color="$white" fontSize="$sm">
              {blockedReason ??
                "Voting is not available right now. It starts automatically after moderation and after the submission phase ends."}
            </Text>
            <TouchableOpacity
              style={{
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#2e9d8e",
                marginTop: 8,
              }}
              onPress={navigateBackToChallenge}
            >
              <Text
                color="$backgroundDark"
                fontSize="$sm"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing={0.8}
              >
                Back
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
