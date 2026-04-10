"use client";

import { useMemo, useState } from "react";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useGetUsersQuery, type User } from "@mirai-app/graphql-types";
import { graphqlClient } from "../../../lib/graphql-client";
import { UserCard } from "./UserCard";
import { useTrip } from "../../../contexts/TripContext";

type UserSearchField =
  | "firstName"
  | "lastName"
  | "email"
  | "wristNumber"
  | "houseNumber"
  | "groupName";

const searchFieldOptions: { value: UserSearchField; label: string }[] = [
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "email", label: "Email" },
  { value: "wristNumber", label: "Wrist number" },
  { value: "houseNumber", label: "House number" },
  { value: "groupName", label: "Group" },
];

const isSearchField = (value: string): value is UserSearchField =>
  searchFieldOptions.some((option) => option.value === value);

export function UsersPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const [field, setField] = useState<UserSearchField>("firstName");

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    hasNextPage: usersHasNextPage,
    isFetchingNextPage: usersFetchingNextPage,
    fetchNextPage: fetchMoreUsers,
  } = useGetUsersQuery(
    graphqlClient,
    {
      limit: 50,
      offset: 0,
    },
    {
      enabled: Boolean(tripId),
    },
  );

  const users = useMemo(() => {
    let result = usersData?.users ?? [];

    // Client-side filtering based on search term and field
    if (searchTerm.trim()) {
      const normalized = searchTerm.trim().toLowerCase();
      result = result.filter((user: User) => {
        switch (field) {
          case "firstName":
            return user.firstName?.toLowerCase().includes(normalized);
          case "lastName":
            return user.lastName?.toLowerCase().includes(normalized);
          case "email":
            return user.email?.toLowerCase().includes(normalized);
          case "wristNumber":
            return user.wristNumber?.toLowerCase().includes(normalized);
          case "houseNumber":
            return user.houseNumber?.toLowerCase().includes(normalized);
          case "groupName":
            return user.group?.name?.toLowerCase().includes(normalized);
          default:
            return true;
        }
      });
    }

    return result;
  }, [usersData?.users, searchTerm, field]);

  const totalCountLabel = useMemo(() => {
    const totalCount = usersData?.totalCount;
    if (typeof totalCount !== "number") {
      return null;
    }

    return `${users.length} / ${totalCount} users`;
  }, [users.length, usersData?.totalCount]);

  if (!tripId) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-text-primary">Users</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage participants and admin accounts.
        </p>
        <a
          href="/users/new"
          className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Create user
        </a>
      </header>

      <div className="grid gap-3 rounded-xl border border-border-subtle bg-card p-4 md:grid-cols-[2fr_1fr]">
        <Input
          label="Search"
          placeholder="Type to filter users"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <Select
          label="Field"
          value={field}
          onChange={(event) => {
            const next = event.target.value;
            if (isSearchField(next)) {
              setField(next);
            }
          }}
          options={searchFieldOptions}
        />
      </div>

      {usersLoading ? <LoadingSpinner label="Loading users..." /> : null}

      {!usersLoading && usersError ? (
        <ErrorMessage message="Could not load users. Please try again." />
      ) : null}

      {!usersLoading && !usersError && users.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-subtle bg-card p-6 text-sm text-text-secondary">
          No users found for this filter.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {totalCountLabel ? (
        <p className="text-sm text-text-muted">{totalCountLabel}</p>
      ) : null}

      {usersHasNextPage ? (
        <div>
          <Button
            variant="secondary"
            disabled={usersFetchingNextPage}
            onClick={() => void fetchMoreUsers()}
          >
            {usersFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
