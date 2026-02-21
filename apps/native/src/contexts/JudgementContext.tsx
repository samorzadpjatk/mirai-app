import React, { useCallback, useContext, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

type ReviewStatus = "APPROVED" | "REJECTED";

interface Submission {
  id: string;
  status: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string | Date;
  group: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
  };
}

interface JudgementContextValue {
  tripId: string;
  challengeId: string;
  challengeName: string;
  challengeScoringCategory:
    | "SPEED"
    | "UNLIMITED"
    | "JUDGED_STAFF"
    | "PEER_VOTING"
    | null;
  isLoading: boolean;
  isReviewing: boolean;
  pendingCount: number;
  stats: { approved: number; rejected: number };
  currentSubmission: Submission | null;
  nextSubmission: Submission | null;
  reviewCurrent: (
    status: ReviewStatus,
    rejectionReason?: string,
    ranking?: 1 | 2 | 3,
  ) => void;
}

const JudgementContext = React.createContext<JudgementContextValue | null>(null);

const useJudgement = () => {
  const context = useContext(JudgementContext);
  if (!context) {
    throw new Error("useJudgement must be used within JudgementProvider");
  }
  return context;
};

const JudgementProvider = ({
  tripId,
  challengeId,
  children,
}: {
  tripId: string;
  challengeId: string;
  children: React.ReactNode;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const submissionQueryOptions =
    trpc.challengeSubmission.getByChallenge.queryOptions({
      tripId,
      challengeId,
    });
  const challengeQueryOptions = trpc.challenge.getById.queryOptions({
    id: challengeId,
    tripId,
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    ...submissionQueryOptions,
    enabled: !!tripId && !!challengeId,
  });

  const { data: challenge, isLoading: challengeLoading } = useQuery({
    ...challengeQueryOptions,
    enabled: !!tripId && !!challengeId,
  });

  const activeDismissedIds = useMemo(() => {
    if (!submissions) return dismissedIds;
    return dismissedIds.filter((id) =>
      submissions.some(
        (submission) =>
          submission.id === id && submission.status === "PENDING",
      ),
    );
  }, [dismissedIds, submissions]);

  const pendingSubmissions: Submission[] = useMemo(() => {
    return (submissions ?? [])
      .filter((submission) => submission.status === "PENDING")
      .filter((submission) => !activeDismissedIds.includes(submission.id)) as Submission[];
  }, [submissions, activeDismissedIds]);

  const stats = useMemo(() => {
    const approved = (submissions ?? []).filter(
      (submission) => submission.status === "APPROVED",
    ).length;
    const rejected = (submissions ?? []).filter(
      (submission) => submission.status === "REJECTED",
    ).length;
    return { approved, rejected };
  }, [submissions]);

  const currentSubmission = pendingSubmissions[0] ?? null;
  const nextSubmission = pendingSubmissions[1] ?? null;

  const reviewMutation = useMutation(
    trpc.challengeSubmission.review.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: submissionQueryOptions.queryKey,
        });
      },
      onError: (error, variables) => {
        setDismissedIds((prev) => prev.filter((id) => id !== variables.id));
        console.error(error);
      },
    }),
  );

  const reviewCurrent = useCallback(
    (status: ReviewStatus, rejectionReason?: string, ranking?: 1 | 2 | 3) => {
      if (!currentSubmission || reviewMutation.isPending) return;
      const normalizedRejectionReason = rejectionReason?.trim();
      if (status === "REJECTED" && !normalizedRejectionReason) return;
      setDismissedIds((prev) =>
        prev.includes(currentSubmission.id)
          ? prev
          : [...prev, currentSubmission.id],
      );
      reviewMutation.mutate({
        id: currentSubmission.id,
        status,
        rejectionReason:
          status === "REJECTED" ? normalizedRejectionReason : undefined,
        ranking: status === "APPROVED" ? ranking : undefined,
      });
    },
    [currentSubmission, reviewMutation],
  );

  const contextValue: JudgementContextValue = {
    tripId,
    challengeId,
    challengeName: challenge?.name ?? "Challenge Review",
    challengeScoringCategory: challenge?.scoringCategory ?? null,
    isLoading: submissionsLoading || challengeLoading,
    isReviewing: reviewMutation.isPending,
    pendingCount: pendingSubmissions.length,
    stats,
    currentSubmission,
    nextSubmission,
    reviewCurrent,
  };

  return (
    <JudgementContext.Provider value={contextValue}>
      {children}
    </JudgementContext.Provider>
  );
};

export { JudgementProvider, useJudgement };
export type { ReviewStatus, Submission };
