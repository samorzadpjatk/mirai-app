"use client";

import { useMemo, useState } from "react";
import { GraphQLClient } from "graphql-request";
import { Input } from "../../ui/Input";
import { Card } from "../../ui/Card";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useTrip } from "../../../contexts/TripContext";
import { useGetGroupsByTripQuery } from "@mirai-app/graphql-types";
import { env } from "../../../lib/env";

const createGraphQLClient = (): GraphQLClient => {
  const getAuthToken = (): string | null => {
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) =>
      c.trim().startsWith("sb-access-token="),
    );
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  return new GraphQLClient(env.graphqlUrl, {
    headers: () => {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return headers;
    },
  });
};

export function CoinsOverviewPage() {
  const { selectedTrip, isLoading: tripsLoading } = useTrip();
  const selectedTripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");

  const client = useMemo(() => createGraphQLClient(), []);

  const { data, isLoading: groupsLoading } = useGetGroupsByTripQuery(
    client,
    {
      tripId: selectedTripId,
    },
    {
      enabled: Boolean(selectedTripId),
      staleTime: 30000,
    },
  );

  const groups = useMemo(() => {
    return data?.groupsByTrip?.groups ?? [];
  }, [data]);

  const filteredGroups = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return groups;
    }

    return groups.filter((group) => {
      return group.name.toLowerCase().includes(normalized);
    });
  }, [groups, searchTerm]);

  const stats = useMemo(() => {
    const totalCoins = groups.reduce((sum, group) => sum + group.coins, 0);
    const totalGroups = groups.length;
    const avgCoinsPerGroup =
      totalGroups > 0 ? Math.round(totalCoins / totalGroups) : 0;

    return {
      totalCoins,
      totalGroups,
      avgCoinsPerGroup,
    };
  }, [groups]);

  if (tripsLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-text-primary">
          Coins Management
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage group balances and adjust coins.
        </p>
      </header>

      <div className="rounded-xl border border-border-subtle bg-card p-4">
        <Input
          label="Search groups"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by group name"
          disabled={!selectedTripId}
        />
      </div>

      {!selectedTripId ? (
        <ErrorMessage message="Select a trip from the navbar to manage coins." />
      ) : null}

      {selectedTripId ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <p className="text-sm text-text-muted">Total Coins</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {stats.totalCoins}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-text-muted">Total Groups</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {stats.totalGroups}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-text-muted">Avg Coins / Group</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {stats.avgCoinsPerGroup}
            </p>
          </Card>
        </div>
      ) : null}

      {selectedTripId && groupsLoading ? (
        <LoadingSpinner label="Loading groups..." />
      ) : null}

      {selectedTripId && !groupsLoading && filteredGroups.length === 0 ? (
        <ErrorMessage message="No groups found for this trip/filter." />
      ) : null}

      {selectedTripId && filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => {
            const addHref = `/coins/operation?mode=add&groupId=${encodeURIComponent(group.id)}`;
            const removeHref = `/coins/operation?mode=remove&groupId=${encodeURIComponent(group.id)}`;

            return (
              <Card key={group.id} className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {group.name}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Code: {group.code}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">
                    {group.coins} coins
                  </span>
                </div>
                <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <a
                    href={addHref}
                    className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-card-elevated px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-card"
                  >
                    Add Coins
                  </a>
                  <a
                    href={removeHref}
                    className="inline-flex items-center justify-center rounded-lg border border-danger/50 bg-danger/10 px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger/20"
                  >
                    Remove Coins
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
