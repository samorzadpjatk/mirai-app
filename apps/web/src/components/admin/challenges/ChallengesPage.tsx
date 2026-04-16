"use client";

import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import {
  GetChallengesByTripDocument,
  ChallengeFilterStatus,
  ChallengeSortBy,
  type ChallengeStatus,
} from "@mirai-app/frameworks";
import { ChallengeCard } from "./ChallengeCard";
import { useTrip } from "../../../contexts/TripContext";

const statusOptions: { value: ChallengeFilterStatus; label: string }[] = [
  { value: ChallengeFilterStatus.All, label: "All statuses" },
  { value: ChallengeFilterStatus.Hidden, label: "Draft" },
  { value: ChallengeFilterStatus.Visible, label: "Visible" },
  { value: ChallengeFilterStatus.Active, label: "Active" },
  { value: ChallengeFilterStatus.Completed, label: "Completed" },
  { value: ChallengeFilterStatus.Cancelled, label: "Cancelled" },
];

const sortOptions: { value: ChallengeSortBy; label: string }[] = [
  { value: ChallengeSortBy.NameAsc, label: "Name (A-Z)" },
  { value: ChallengeSortBy.NameDesc, label: "Name (Z-A)" },
  { value: ChallengeSortBy.CreatedAtDesc, label: "Newest first" },
  { value: ChallengeSortBy.CreatedAtAsc, label: "Oldest first" },
  { value: ChallengeSortBy.StatusAsc, label: "Status (A-Z)" },
  { value: ChallengeSortBy.StatusDesc, label: "Status (Z-A)" },
  { value: ChallengeSortBy.BasePointsDesc, label: "Points (High-Low)" },
  { value: ChallengeSortBy.BasePointsAsc, label: "Points (Low-High)" },
];

const isStatusOption = (value: string): value is ChallengeFilterStatus =>
  statusOptions.some((option) => option.value === value);

const isSortOption = (value: string): value is ChallengeSortBy =>
  sortOptions.some((option) => option.value === value);

const PAGE_SIZE = 20;

export function ChallengesPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChallengeFilterStatus>(
    ChallengeFilterStatus.All,
  );
  const [sortBy, setSortBy] = useState<ChallengeSortBy>(
    ChallengeSortBy.CreatedAtDesc,
  );
  const [offset, setOffset] = useState(0);

  const [result] = useQuery({
    query: GetChallengesByTripDocument,
    variables: {
      tripId,
      limit: PAGE_SIZE,
      offset,
    },
    pause: !tripId,
  });

  const { data, fetching, error } = result;

  // Filter and sort challenges client-side (since the schema supports filtering/sorting)
  const challenges = useMemo(() => {
    const allChallenges = data?.challengesByTrip?.challenges ?? [];

    // Filter by search term
    let filtered = allChallenges;
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = allChallenges.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.description?.toLowerCase().includes(search) ?? false),
      );
    }

    // Filter by status (client-side for now - could be moved to query)
    if (statusFilter !== ChallengeFilterStatus.All) {
      const statusMap: Record<ChallengeFilterStatus, ChallengeStatus> = {
        [ChallengeFilterStatus.All]: "ACTIVE" as ChallengeStatus,
        [ChallengeFilterStatus.Active]: "ACTIVE" as ChallengeStatus,
        [ChallengeFilterStatus.Visible]: "VISIBLE" as ChallengeStatus,
        [ChallengeFilterStatus.Hidden]: "HIDDEN" as ChallengeStatus,
        [ChallengeFilterStatus.Completed]: "COMPLETED" as ChallengeStatus,
        [ChallengeFilterStatus.Cancelled]: "CANCELLED" as ChallengeStatus,
      };
      const targetStatus = statusMap[statusFilter];
      filtered = filtered.filter((c) => c.status === targetStatus);
    }

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case ChallengeSortBy.NameAsc:
          return a.name.localeCompare(b.name);
        case ChallengeSortBy.NameDesc:
          return b.name.localeCompare(a.name);
        case ChallengeSortBy.CreatedAtAsc:
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case ChallengeSortBy.CreatedAtDesc:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case ChallengeSortBy.StatusAsc:
          return a.status.localeCompare(b.status);
        case ChallengeSortBy.StatusDesc:
          return b.status.localeCompare(a.status);
        case ChallengeSortBy.BasePointsAsc:
          return a.basePoints - b.basePoints;
        case ChallengeSortBy.BasePointsDesc:
          return b.basePoints - a.basePoints;
        default:
          return 0;
      }
    });
  }, [data?.challengesByTrip?.challenges, searchTerm, statusFilter, sortBy]);

  const pagination = data?.challengesByTrip?.pagination;
  const allChallengesCount = pagination?.total ?? 0;

  const statusCounts = useMemo(() => {
    const allChallenges = data?.challengesByTrip?.challenges ?? [];
    const counts = {
      ALL: allChallengesCount,
      HIDDEN: 0,
      VISIBLE: 0,
      ACTIVE: 0,
      VOTING_PHASE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    allChallenges.forEach((c) => {
      if (c.status && counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [data?.challengesByTrip?.challenges, allChallengesCount]);

  const totalCountLabel = useMemo(() => {
    const total = allChallengesCount;
    if (typeof total !== "number") {
      return null;
    }

    return `${challenges.length} / ${total} challenges`;
  }, [challenges.length, allChallengesCount]);

  const loadMore = () => {
    if (pagination?.hasMore) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  };

  if (!tripId) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  if (error) {
    return (
      <ErrorMessage message={`Error loading challenges: ${error.message}`} />
    );
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
              setOffset(0); // Reset pagination on filter change
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
          <span className="font-medium text-text-primary">Visible:</span>{" "}
          {statusCounts.VISIBLE}
        </p>
      </div>

      {fetching && challenges.length === 0 ? (
        <LoadingSpinner label="Loading challenges..." />
      ) : null}

      {!fetching && challenges.length === 0 ? (
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

      {pagination?.hasMore ? (
        <div>
          <Button
            variant="secondary"
            disabled={fetching}
            onClick={() => void loadMore()}
          >
            {fetching ? "Loading more..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
