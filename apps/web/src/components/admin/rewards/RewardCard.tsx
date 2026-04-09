"use client";

import { Card } from "../../ui/Card";
import type { Reward } from "@repo/frameworks/trpc/hooks";

interface RewardCardProps {
  reward: Reward;
  editHref?: string;
}

export function RewardCard({ reward, editHref }: RewardCardProps) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-text-primary">
            {reward.name}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
            {reward.description}
          </p>
        </div>
        {reward.isHidden ? (
          <span className="rounded-full bg-danger/20 px-3 py-1 text-xs font-semibold text-danger">
            Hidden
          </span>
        ) : (
          <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-semibold text-success">
            Visible
          </span>
        )}
      </div>

      {reward.signedImageUrl || reward.image ? (
        <img
          src={reward.signedImageUrl ?? reward.image ?? undefined}
          alt={reward.name}
          className="h-48 w-full rounded-lg border border-border-subtle object-cover"
        />
      ) : null}

      <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
        <p>
          <span className="font-medium text-text-primary">Price:</span>{" "}
          {reward.coinCost} coins
        </p>
        <p>
          <span className="font-medium text-text-primary">Quantity:</span>{" "}
          {reward.availableQuantity}
        </p>
        <p>
          <span className="font-medium text-text-primary">Purchased:</span>{" "}
          {reward.purchasedCount}
        </p>
        <p>
          <span className="font-medium text-text-primary">Created by:</span>{" "}
          {reward.createdByName}
        </p>
      </div>

      <div className="text-xs text-text-muted">
        Created {new Date(reward.createdAt).toLocaleDateString()}
      </div>

      {editHref ? (
        <div className="mt-auto grid grid-cols-1 gap-2">
          <a
            href={editHref}
            className="inline-flex w-full items-center justify-center rounded-lg border border-border-subtle bg-card-elevated px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-card"
          >
            Edit
          </a>
        </div>
      ) : null}
    </Card>
  );
}
