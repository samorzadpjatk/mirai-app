"use client";

import { RewardForm } from "./RewardForm";

interface EditRewardContentProps {
  rewardId: string;
}

export function EditRewardContent({ rewardId }: EditRewardContentProps) {
  return <RewardForm mode="edit" rewardId={rewardId} />;
}
