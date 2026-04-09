import type { Result } from "@mirai-app/domain";
import { ok, err, type RewardId } from "@mirai-app/domain";
import type { RewardRepository } from "../ports/RewardRepository";

/**
 * Input for SetRewardHidden use case
 */
export interface SetRewardHiddenInput {
  rewardId: RewardId;
  isHidden: boolean;
}

/**
 * Output DTO for SetRewardHidden use case
 */
export interface SetRewardHiddenOutput {
  id: string;
  name: string;
  isHidden: boolean;
  updatedAt: Date;
}

/**
 * SetRewardHidden Use Case
 *
 * Sets the hidden status of a reward.
 * Hidden rewards are not visible to users but can still be purchased if known.
 */
export class SetRewardHiddenUseCase {
  constructor(private rewardRepository: RewardRepository) {}

  async execute(
    input: SetRewardHiddenInput,
  ): Promise<Result<SetRewardHiddenOutput, string>> {
    // Find existing reward
    const existing = await this.rewardRepository.findById(input.rewardId);

    if (!existing) {
      return err("Reward not found");
    }

    // Apply hide/unhide
    const updated = input.isHidden ? existing.hide() : existing.unhide();

    // Persist
    const saved = await this.rewardRepository.update(updated);

    return ok({
      id: saved.id,
      name: saved.name,
      isHidden: saved.isHidden,
      updatedAt: saved.updatedAt,
    });
  }
}
