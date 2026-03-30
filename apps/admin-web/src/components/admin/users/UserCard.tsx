"use client";

import type { AdminUser } from "@mirai-app/admin-hooks";
import { Card } from "../../ui/Card";

interface UserCardProps {
  user: AdminUser;
}

export function UserCard({ user }: UserCardProps) {
  const userName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "Unknown user";
  const groupName = user.group?.name ?? "Not selected";
  const bannedUntilLabel = user.bannedUntil
    ? new Date(user.bannedUntil).toLocaleString()
    : null;

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-text-primary">{userName}</p>
          <p className="text-sm text-text-secondary">
            {user.email ?? "No email"}
          </p>
          {user.isBanned && bannedUntilLabel ? (
            <p className="mt-1 text-sm font-medium text-red-400">
              Banned until {bannedUntilLabel}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-primary">Group: {groupName}</p>
        </div>

        {user.role === "ADMIN" ? (
          <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
            Admin
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-text-muted">Wrist #</p>
          <p className="font-medium text-text-primary">
            {user.wristNumber ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-text-muted">House #</p>
          <p className="font-medium text-text-primary">
            {user.houseNumber ?? "-"}
          </p>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-1 gap-2">
        <a
          href={`/users/${encodeURIComponent(user.id)}/edit`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border-subtle bg-card-elevated px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-card"
        >
          Edit
        </a>
      </div>
    </Card>
  );
}
