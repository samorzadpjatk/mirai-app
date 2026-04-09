"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/frameworks/trpc/client";
import { Card } from "../../ui/Card";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";

interface ChallengeAnalyticsPanelProps {
  tripId: string;
  challengeId: string;
  scoringCategory: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  startTime: string | null;
  endTime: string | null;
  votingStartTime: string | null;
  votingEndTime: string | null;
  isRecurring: boolean;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export function ChallengeAnalyticsPanel(props: ChallengeAnalyticsPanelProps) {
  const trpcClient = useTRPCClient();

  const submissionsQuery = useQuery({
    queryKey: [
      "challenge",
      "analytics",
      "submissions",
      props.challengeId,
      props.tripId,
    ],
    enabled: Boolean(props.tripId) && Boolean(props.challengeId),
    queryFn: async () => {
      const result =
        await trpcClient.challengeSubmission.getByChallengeForAdmin.query({
          tripId: props.tripId,
          challengeId: props.challengeId,
        });
      return Array.isArray(result)
        ? result.filter((item) => typeof item === "object" && item !== null)
        : [];
    },
  });

  const groupsQuery = useQuery({
    queryKey: ["challenge", "analytics", "groups", props.tripId],
    enabled: Boolean(props.tripId),
    queryFn: async () => {
      const result = await trpcClient.group.getAll.query({
        tripId: props.tripId,
        pagination: {
          limit: 1,
          offset: 0,
        },
      });

      if (!isObject(result) || !isObject(result.pagination)) {
        return 0;
      }

      return typeof result.pagination.total === "number"
        ? result.pagination.total
        : 0;
    },
  });

  const votesQuery = useQuery({
    queryKey: ["challenge", "analytics", "votes", props.challengeId],
    enabled: Boolean(props.challengeId),
    queryFn: async () => {
      const result = await trpcClient.challengeVote.getByChallenge.query({
        challengeId: props.challengeId,
      });

      return Array.isArray(result)
        ? result.filter((item) => typeof item === "object" && item !== null)
        : [];
    },
  });

  const judgedProgressQuery = useQuery({
    queryKey: [
      "challenge",
      "analytics",
      "judged-progress",
      props.challengeId,
      props.tripId,
    ],
    enabled:
      props.scoringCategory === "JUDGED_STAFF" &&
      Boolean(props.tripId) &&
      Boolean(props.challengeId),
    queryFn: async () => {
      const result =
        await trpcClient.challengeVote.getJudgedStaffProgress.query({
          challengeId: props.challengeId,
          tripId: props.tripId,
        });

      if (!isObject(result)) {
        return null;
      }

      return {
        totalAdmins:
          typeof result.totalAdmins === "number" ? result.totalAdmins : 0,
        votedAdmins:
          typeof result.votedAdmins === "number" ? result.votedAdmins : 0,
        pendingAdmins:
          typeof result.pendingAdmins === "number" ? result.pendingAdmins : 0,
      };
    },
  });

  if (
    submissionsQuery.isLoading ||
    groupsQuery.isLoading ||
    votesQuery.isLoading
  ) {
    return <LoadingSpinner label="Loading challenge analytics..." />;
  }

  if (submissionsQuery.error || groupsQuery.error || votesQuery.error) {
    return <ErrorMessage message="Could not load challenge analytics." />;
  }

  const submissions = submissionsQuery.data ?? [];
  const groupsTotal = groupsQuery.data ?? 0;
  const votes = votesQuery.data ?? [];

  const pendingCount = submissions.filter(
    (item) => isObject(item) && item.status === "PENDING",
  ).length;
  const approvedCount = submissions.filter(
    (item) => isObject(item) && item.status === "APPROVED",
  ).length;
  const rejectedCount = submissions.filter(
    (item) => isObject(item) && item.status === "REJECTED",
  ).length;

  const participationRate =
    groupsTotal > 0 ? Math.round((submissions.length / groupsTotal) * 100) : 0;

  const uniqueVoters = new Set(
    votes
      .map((vote) => (isObject(vote) ? vote.voterId : null))
      .filter((value): value is string => typeof value === "string"),
  ).size;

  const votesBySubmission = new Map<string, number>();
  for (const submission of submissions) {
    if (!isObject(submission) || typeof submission.id !== "string") continue;
    const voteCount =
      typeof submission.voteCount === "number" ? submission.voteCount : 0;
    votesBySubmission.set(submission.id, voteCount);
  }

  const topByScore = submissions
    .filter(
      (submission) => isObject(submission) && typeof submission.id === "string",
    )
    .map((submission) => {
      const group = isObject(submission.group) ? submission.group : null;
      return {
        id: submission.id,
        groupName:
          group && typeof group.name === "string"
            ? group.name
            : "Unknown group",
        voteScore:
          typeof submission.voteScore === "number" ? submission.voteScore : 0,
        voteCount:
          typeof submission.voteCount === "number" ? submission.voteCount : 0,
      };
    })
    .sort((a, b) => {
      const byScore = b.voteScore - a.voteScore;
      if (byScore !== 0) return byScore;
      return b.voteCount - a.voteCount;
    })
    .slice(0, 5);

  const milestones = [
    {
      label: "Challenge created",
      value: props.createdAt,
    },
    {
      label: "Submission start",
      value: props.isRecurring ? null : props.startTime,
    },
    {
      label: "Submission end",
      value: props.isRecurring ? null : props.endTime,
    },
    {
      label: "Voting start",
      value: props.votingStartTime,
    },
    {
      label: "Voting end",
      value: props.votingEndTime,
    },
    {
      label: "Last update",
      value: props.updatedAt,
    },
  ];

  return (
    <section className="space-y-4">
      <Card className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Participation Analytics
        </h4>
        <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-3">
          <p>
            <span className="font-medium text-text-primary">
              Groups in trip:
            </span>{" "}
            {groupsTotal}
          </p>
          <p>
            <span className="font-medium text-text-primary">Submissions:</span>{" "}
            {submissions.length}
          </p>
          <p>
            <span className="font-medium text-text-primary">
              Participation rate:
            </span>{" "}
            {participationRate}%
          </p>
          <p>
            <span className="font-medium text-text-primary">Pending:</span>{" "}
            {pendingCount}
          </p>
          <p>
            <span className="font-medium text-text-primary">Approved:</span>{" "}
            {approvedCount}
          </p>
          <p>
            <span className="font-medium text-text-primary">Rejected:</span>{" "}
            {rejectedCount}
          </p>
        </div>
      </Card>

      <Card className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Voting Analytics
        </h4>
        <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
          <p>
            <span className="font-medium text-text-primary">Total votes:</span>{" "}
            {votes.length}
          </p>
          <p>
            <span className="font-medium text-text-primary">
              Unique voters:
            </span>{" "}
            {uniqueVoters}
          </p>
          {props.scoringCategory === "JUDGED_STAFF" ? (
            <p>
              <span className="font-medium text-text-primary">
                Admin participation:
              </span>{" "}
              {judgedProgressQuery.data
                ? `${judgedProgressQuery.data.votedAdmins}/${judgedProgressQuery.data.totalAdmins} voted`
                : "-"}
            </p>
          ) : null}
          {props.scoringCategory === "JUDGED_STAFF" &&
          judgedProgressQuery.data ? (
            <p>
              <span className="font-medium text-text-primary">
                Admins pending:
              </span>{" "}
              {judgedProgressQuery.data.pendingAdmins}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Top submissions by vote score
          </p>
          {topByScore.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No scored submissions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {topByScore.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm"
                >
                  <p className="text-text-secondary">
                    #{index + 1} {entry.groupName}
                  </p>
                  <p className="text-text-secondary">
                    score {entry.voteScore.toFixed(2)} ({entry.voteCount} votes)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Completion Timeline
        </h4>
        {props.isRecurring ? (
          <p className="text-sm text-text-secondary">
            Recurring window: {props.dailyStartTime ?? "-"} -{" "}
            {props.dailyEndTime ?? "-"}
          </p>
        ) : null}
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.label}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm"
            >
              <p className="font-medium text-text-secondary">
                {milestone.label}
              </p>
              <p className="text-text-secondary">
                {formatDateTime(milestone.value)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted">
          Current status: {props.status}
        </p>
      </Card>
    </section>
  );
}
