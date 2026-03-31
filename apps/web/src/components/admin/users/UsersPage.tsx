"use client";

import { useMemo, useState } from "react";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useAdminUsers, type UserSearchField } from "@mirai-app/shared/hooks";
import { UserCard } from "./UserCard";
import { useTrip } from "../../../contexts/TripContext";

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
    users,
    usersLoading,
    usersError,
    usersHasNextPage,
    usersFetchingNextPage,
    fetchMoreUsers,
    usersPagination,
  } = useAdminUsers(tripId, searchTerm, field);

  const totalCountLabel = useMemo(() => {
    const totalCount = usersPagination?.totalCount;
    if (typeof totalCount !== "number") {
      return null;
    }

    return `${users.length} / ${totalCount} users`;
  }, [users.length, usersPagination?.totalCount]);

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
