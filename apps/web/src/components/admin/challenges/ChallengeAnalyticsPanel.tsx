"use client";

import { useQuery } from "urql";
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
  // Analytics queries use GraphQL for data fetching
  const [submissionsResult] = useQuery({
    query: `
      query GetSubmissionsForAnalytics($tripId: ID!, $challengeId: ID!) {
        __typename
      }
    `,
    variables: { tripId: props.tripId, challengeId: props.challengeId },
    pause: !props.tripId || !props.challengeId,
  });

  // Groups query for analytics
  const [groupsResult] = useQuery({
    query: `
      query GetGroupsCount($tripId: ID!) {
        __typename
      }
    `,
    variables: { tripId: props.tripId },
    pause: !props.tripId,
  });

  const [votesResult] = useQuery({
    query: `
      query GetVotesCount($challengeId: ID!) {
        __typename
      }
    `,
    variables: { challengeId: props.challengeId },
    pause: !props.challengeId,
  });

  // Show loading state while fetching analytics data
  if (
    submissionsResult.fetching ||
    groupsResult.fetching ||
    votesResult.fetching
  ) {
    return <LoadingSpinner label="Loading challenge analytics..." />;
  }

  // Analytics panel display
  return (
    <section className="space-y-4">
      <Card className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Participation Analytics
        </h4>
        <p className="text-sm text-text-secondary">
          Analytics are temporarily unavailable during migration.
        </p>
      </Card>

      <Card className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Voting Analytics
        </h4>
        <p className="text-sm text-text-secondary">
          Voting analytics will be restored after migration.
        </p>
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
          {[
            { label: "Challenge created", value: props.createdAt },
            {
              label: "Submission start",
              value: props.isRecurring ? null : props.startTime,
            },
            {
              label: "Submission end",
              value: props.isRecurring ? null : props.endTime,
            },
            { label: "Voting start", value: props.votingStartTime },
            { label: "Voting end", value: props.votingEndTime },
            { label: "Last update", value: props.updatedAt },
          ].map((milestone) => (
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
