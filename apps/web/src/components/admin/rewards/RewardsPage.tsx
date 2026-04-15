"use client";

import { useMemo, useState } from "react";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useGetRewardsByTripAdminQuery } from "@mirai-app/graphql-client/urql";
import { RewardCard } from "./RewardCard";
import { useTrip } from "../../../contexts/TripContext";

const PAGE_SIZE = 30;

export function RewardsPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const [currentOffset, setCurrentOffset] = useState(0);

  const [{ data, fetching, error }] = useGetRewardsByTripAdminQuery({
    variables: {
      tripId,
      limit: PAGE_SIZE,
      offset: currentOffset,
    },
    pause: !tripId,
    requestPolicy: "cache-and-network",
  });

  const rewards = useMemo(() => {
    const allRewards = data?.rewardsByTripAdmin?.rewards ?? [];
    if (!searchTerm.trim()) {
      return allRewards;
    }
    const normalized = searchTerm.toLowerCase();
    return allRewards.filter(
      (reward) =>
        reward.name.toLowerCase().includes(normalized) ||
        reward.description.toLowerCase().includes(normalized),
    );
  }, [data?.rewardsByTripAdmin?.rewards, searchTerm]);

  const pagination = data?.rewardsByTripAdmin?.pagination;
  const totalCountLabel = useMemo(() => {
    const total = pagination?.total;
    if (typeof total !== "number") {
      return null;
    }
    return `${rewards.length} / ${total} rewards`;
  }, [rewards.length, pagination?.total]);

  const hasNextPage = pagination?.hasMore ?? false;

  const fetchMoreRewards = () => {
    if (hasNextPage && pagination) {
      setCurrentOffset(pagination.offset + pagination.limit);
    }
  };

  if (!tripId) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-text-primary">Rewards</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage reward catalog for this trip.
        </p>
        <a
          href="/rewards/new"
          className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition hover:brightness-110"
        >
          Create reward
        </a>
      </header>

      <div className="rounded-lg border border-border-subtle bg-card p-4">
        <Input
          label="Search rewards"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name or description"
        />
      </div>

      {fetching && !data ? <LoadingSpinner label="Loading rewards..." /> : null}

      {!fetching && error ? (
        <ErrorMessage message="Could not load rewards. Please try again." />
      ) : null}

      {!fetching && !error && rewards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-text-secondary">
          No rewards found for this trip.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            editHref={`/rewards/${reward.id}/edit`}
          />
        ))}
      </div>

      {totalCountLabel ? (
        <p className="text-sm text-text-tertiary">{totalCountLabel}</p>
      ) : null}

      {hasNextPage ? (
        <div>
          <Button
            variant="secondary"
            disabled={fetching}
            onClick={() => void fetchMoreRewards()}
          >
            {fetching ? "Loading more..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
