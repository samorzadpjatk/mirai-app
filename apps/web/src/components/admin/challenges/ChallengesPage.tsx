"use client";

import { useMemo, useState } from "react";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useGetChallengesQuery, graphqlClient } from "@mirai-app/graphql-types";
import type {
  ChallengeFilterStatus,
  ChallengeSortBy,
} from "@mirai-app/graphql-types";
import { ChallengeCard } from "./ChallengeCard";
import { useTrip } from "../../../contexts/TripContext";

const statusOptions: { value: ChallengeFilterStatus; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "HIDDEN", label: "Draft" },
  { value: "VISIBLE", label: "Visible" },
  { value: "ACTIVE", label: "Active" },
  { value: "VOTING_PHASE", label: "Voting" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const sortOptions: { value: ChallengeSortBy; label: string }[] = [
  { value: "priority", label: "Priority" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
  { value: "points", label: "Points" },
];

const isStatusOption = (value: string): value is ChallengeFilterStatus =>
  statusOptions.some((option) => option.value === value);

const isSortOption = (value: string): value is ChallengeSortBy =>
  sortOptions.some((option) => option.value === value);

export function ChallengesPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ChallengeFilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<ChallengeSortBy>("priority");

  const challengesQuery = useGetChallengesQuery(
    graphqlClient,
    {
      tripId,
      search: searchTerm || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      sortBy,
      first: 20,
    },
    { enabled: Boolean(tripId) },
  );

  const challenges = useMemo(() => {
    return (
      challengesQuery.data?.challenges.edges.map((edge) => edge.node) ?? []
    );
  }, [challengesQuery.data]);

  const pagination = challengesQuery.data?.challenges.pageInfo;
  const allChallengesCount = challengesQuery.data?.challenges.totalCount ?? 0;

  const statusCounts = useMemo(() => {
    const counts = {
      ALL: allChallengesCount,
      HIDDEN: 0,
      VISIBLE: 0,
      ACTIVE: 0,
      VOTING_PHASE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    // Count from current fetched challenges
    challenges.forEach((c) => {
      if (c.status && counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [challenges, allChallengesCount]);

  const totalCountLabel = useMemo(() => {
    const total = allChallengesCount;
    if (typeof total !== "number") {
      return null;
    }

    return `${challenges.length} / ${total} challenges`;
  }, [challenges.length, allChallengesCount]);

  const fetchMoreChallenges = async () => {
    if (pagination?.hasNextPage && pagination.endCursor) {
      await challengesQuery.fetchNextPage();
    }
  };

  if (!tripId) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-text-primary">Challenges</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage challenge lifecycle.
        </p>
        <a
          href="/challenges/new"
          className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Create challenge
        </a>
      </header>

      <div className="grid gap-3 rounded-xl border border-border-subtle bg-card p-4 md:grid-cols-3">
        <Input
          label="Search"
          placeholder="Search by challenge name"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(event) => {
            const next = event.target.value;
            if (isStatusOption(next)) {
              setStatusFilter(next);
            }
          }}
          options={statusOptions}
        />
        <Select
          label="Sort by"
          value={sortBy}
          onChange={(event) => {
            const next = event.target.value;
            if (isSortOption(next)) {
              setSortBy(next);
            }
          }}
          options={sortOptions}
        />
      </div>

      <div className="grid gap-2 rounded-xl border border-border-subtle bg-card p-4 text-sm text-text-secondary md:grid-cols-3">
        <p>
          <span className="font-medium text-text-primary">Total:</span>{" "}
          {allChallengesCount}
        </p>
        <p>
          <span className="font-medium text-text-primary">Active:</span>{" "}
          {statusCounts.ACTIVE}
        </p>
        <p>
          <span className="font-medium text-text-primary">Voting:</span>{" "}
          {statusCounts.VOTING_PHASE}
        </p>
      </div>

      {challengesQuery.isLoading ? (
        <LoadingSpinner label="Loading challenges..." />
      ) : null}

      {!challengesQuery.isLoading && challenges.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-subtle bg-card p-6 text-sm text-text-secondary">
          No challenges found for this filter.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            detailsHref={`/challenges/${challenge.id}`}
            editHref={`/challenges/edit/${challenge.id}`}
          />
        ))}
      </div>

      {totalCountLabel ? (
        <p className="text-sm text-text-muted">{totalCountLabel}</p>
      ) : null}

      {pagination?.hasNextPage ? (
        <div>
          <Button
            variant="secondary"
            disabled={challengesQuery.isFetchingNextPage}
            onClick={() => void fetchMoreChallenges()}
          >
            {challengesQuery.isFetchingNextPage
              ? "Loading more..."
              : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
