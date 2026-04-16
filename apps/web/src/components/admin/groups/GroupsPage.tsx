"use client";

import { useMemo, useState } from "react";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { GroupCard } from "./GroupCard";
import { GroupAssignmentModal } from "./GroupAssignmentModal";
import { useGetGroupsByTripQuery } from "@mirai-app/frameworks/graphql/urql";
import { useTrip } from "../../../contexts/TripContext";

const DEFAULT_PAGE_SIZE = 20;

export function GroupsPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);

  const [{ data: groupsData, fetching }] = useGetGroupsByTripQuery({
    variables: {
      tripId,
      pagination: {
        limit: DEFAULT_PAGE_SIZE,
        offset: pageOffset,
      },
    },
    pause: !tripId,
    requestPolicy: "cache-and-network",
  });

  const groups = useMemo(() => {
    return groupsData?.groupsByTrip?.groups ?? [];
  }, [groupsData]);

  const pagination = useMemo(() => {
    return groupsData?.groupsByTrip?.pagination;
  }, [groupsData]);

  const groupsHasNextPage = pagination?.hasMore ?? false;
  const groupsFetchingNextPage = fetching && pageOffset > 0;

  const totalCountLabel = useMemo(() => {
    const total = pagination?.total;
    if (typeof total !== "number") {
      return null;
    }

    return `${groups.length} / ${total} groups`;
  }, [groups.length, pagination?.total]);

  const fetchMoreGroups = () => {
    if (groupsHasNextPage && pagination) {
      setPageOffset(pagination.offset + pagination.limit);
    }
  };

  if (!tripId) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-text-primary">Groups</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Search and browse groups.
        </p>
        <a
          href="/groups/new"
          className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Create group
        </a>
      </header>

      <div className="rounded-xl border border-border-subtle bg-card p-4">
        <Input
          label="Search groups"
          placeholder="Search by name, organizer, or code"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {fetching && !groupsData ? (
        <LoadingSpinner label="Loading groups..." />
      ) : null}

      {!fetching && groupsData && groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-subtle bg-card p-6 text-sm text-text-secondary">
          No groups found for this filter.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            editHref={`/groups/${group.id}/edit`}
            onAssign={() => {
              setSelectedGroupId(group.id);
              setIsAssignModalOpen(true);
            }}
          />
        ))}
      </div>

      {totalCountLabel ? (
        <p className="text-sm text-text-muted">{totalCountLabel}</p>
      ) : null}

      {groupsHasNextPage ? (
        <div>
          <Button
            variant="secondary"
            disabled={groupsFetchingNextPage}
            onClick={() => void fetchMoreGroups()}
          >
            {groupsFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        </div>
      ) : null}

      <GroupAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        tripId={tripId}
        group={groups.find((g) => g.id === selectedGroupId) ?? null}
      />
    </section>
  );
}
