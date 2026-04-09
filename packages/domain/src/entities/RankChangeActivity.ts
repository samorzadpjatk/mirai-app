import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * RankChangeActivity entity - represents group rank changes in activity feed
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class RankChangeActivity {
  private constructor(
    public readonly activityId: string,
    public readonly groupId: string,
    public readonly newRank: number,
    public readonly totalCoins: number,
    public readonly coinsGained: number,
  ) {}

  /**
   * Factory method to create a new RankChangeActivity
   * Validates all input data
   */
  static create(props: {
    activityId: string;
    groupId: string;
    newRank: number;
    totalCoins: number;
    coinsGained: number;
  }): Result<RankChangeActivity, string> {
    // Validate activityId
    if (!props.activityId || props.activityId.trim() === "") {
      return err("activityId is required");
    }

    // Validate groupId
    if (!props.groupId || props.groupId.trim() === "") {
      return err("groupId is required");
    }

    // Validate newRank
    if (props.newRank < 1) {
      return err("newRank must be at least 1");
    }

    // Validate totalCoins
    if (props.totalCoins < 0) {
      return err("totalCoins must be non-negative");
    }

    return ok(
      new RankChangeActivity(
        props.activityId.trim(),
        props.groupId.trim(),
        props.newRank,
        props.totalCoins,
        props.coinsGained,
      ),
    );
  }

  /**
   * Check if rank improved (decreased in number, e.g., 5 -> 3)
   */
  isImprovement(): boolean {
    // If coinsGained is positive, typically means rank improved
    return this.coinsGained > 0;
  }

  /**
   * Check if rank declined
   */
  isDecline(): boolean {
    return this.coinsGained < 0;
  }

  /**
   * Check if rank stayed the same
   */
  isNoChange(): boolean {
    return this.coinsGained === 0;
  }

  /**
   * Check if this is top 3 ranking
   */
  isTopThree(): boolean {
    return this.newRank <= 3;
  }

  /**
   * Check if this is top ranking
   */
  isFirstPlace(): boolean {
    return this.newRank === 1;
  }

  /**
   * Get rank change as a positive number (for display)
   */
  getRankChangeDisplay(): string {
    const change = Math.abs(this.coinsGained);
    if (this.coinsGained > 0) {
      return `+${change} coins`;
    } else if (this.coinsGained < 0) {
      return `-${change} coins`;
    }
    return "No change";
  }

  /**
   * Get formatted rank with suffix (1st, 2nd, 3rd, etc.)
   */
  getRankWithSuffix(): string {
    const rank = this.newRank;
    // Special case: 11, 12, 13 always use "th"
    const lastTwo = rank % 100;
    if (lastTwo >= 11 && lastTwo <= 13) {
      return `${rank}th`;
    }
    // All other cases: check last digit
    const lastDigit = rank % 10;
    const suffix =
      lastDigit === 1
        ? "st"
        : lastDigit === 2
          ? "nd"
          : lastDigit === 3
            ? "rd"
            : "th";
    return `${rank}${suffix}`;
  }

  /**
   * Get activity summary
   */
  getSummary(): string {
    const rankText = this.getRankWithSuffix();
    const changeText = this.getRankChangeDisplay();
    return `Moved to ${rankText} place with ${changeText}`;
  }
}
