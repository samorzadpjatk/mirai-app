"use client";

import { Card } from "../ui/Card";

interface AdminStatsProps {
  stats: {
    activeChallenges: number;
    wintegralChallenges: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <Card>
        <p className="text-sm text-text-secondary">Active</p>
        <p className="mt-1 text-2xl font-bold text-primary">
          {stats.activeChallenges}
        </p>
      </Card>

      <Card>
        <p className="text-sm text-text-secondary">Wintegral</p>
        <p className="mt-1 text-2xl font-bold text-text-primary">
          {stats.wintegralChallenges}
        </p>
      </Card>
    </div>
  );
}
