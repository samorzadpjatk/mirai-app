import { Effect } from "effect";
import { ValidationError } from "../../system/errors";

/**
 * ReportReason - Value object representing a report reason
 *
 * Standard report reasons include:
 * - INAPPROPRIATE: Content is offensive or inappropriate
 * - CHEATING: User is cheating or violating rules
 * - SPAM: Content is spam or promotional
 * - WRONG_SUBMISSION: Submission doesn't match challenge requirements
 * - OTHER: Other reason
 */
export class ReportReason {
  private constructor(public readonly value: string) {}

  /**
   * Standard report reasons
   */
  static readonly INAPPROPRIATE = "INAPPROPRIATE";
  static readonly CHEATING = "CHEATING";
  static readonly SPAM = "SPAM";
  static readonly WRONG_SUBMISSION = "WRONG_SUBMISSION";
  static readonly OTHER = "OTHER";

  /**
   * All valid report reasons
   */
  static readonly VALID_REASONS = [
    ReportReason.INAPPROPRIATE,
    ReportReason.CHEATING,
    ReportReason.SPAM,
    ReportReason.WRONG_SUBMISSION,
    ReportReason.OTHER,
  ] as const;

  /**
   * Create a ReportReason from a string
   */
  static create(
    reason: string,
  ): Effect.Effect<ReportReason, ValidationError, never> {
    return Effect.gen(function* () {
      if (!reason || reason.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            message: "Report reason is required",
            field: "reason",
          }),
        );
      }

      const trimmed = reason.trim().toUpperCase();

      // Allow custom reasons but suggest standard ones
      if (
        !ReportReason.VALID_REASONS.includes(
          trimmed as (typeof ReportReason.VALID_REASONS)[number],
        )
      ) {
        // Custom reasons are allowed but must be at least 3 characters
        if (trimmed.length < 3) {
          return yield* Effect.fail(
            new ValidationError({
              message: "Report reason must be at least 3 characters",
              field: "reason",
            }),
          );
        }
      }

      return new ReportReason(trimmed);
    });
  }

  /**
   * Create without validation (use carefully)
   */
  static unsafeCreate(reason: string): ReportReason {
    return new ReportReason(reason.trim().toUpperCase());
  }

  /**
   * Create a standard INAPPROPRIATE reason
   */
  static inappropriate(): ReportReason {
    return new ReportReason(ReportReason.INAPPROPRIATE);
  }

  /**
   * Create a standard CHEATING reason
   */
  static cheating(): ReportReason {
    return new ReportReason(ReportReason.CHEATING);
  }

  /**
   * Create a standard SPAM reason
   */
  static spam(): ReportReason {
    return new ReportReason(ReportReason.SPAM);
  }

  /**
   * Create a standard WRONG_SUBMISSION reason
   */
  static wrongSubmission(): ReportReason {
    return new ReportReason(ReportReason.WRONG_SUBMISSION);
  }

  /**
   * Create a standard OTHER reason
   */
  static other(): ReportReason {
    return new ReportReason(ReportReason.OTHER);
  }

  /**
   * Check if this is the INAPPROPRIATE reason
   */
  isInappropriate(): boolean {
    return this.value === ReportReason.INAPPROPRIATE;
  }

  /**
   * Check if this is the CHEATING reason
   */
  isCheating(): boolean {
    return this.value === ReportReason.CHEATING;
  }

  /**
   * Check if this is the SPAM reason
   */
  isSpam(): boolean {
    return this.value === ReportReason.SPAM;
  }

  /**
   * Check if this is the WRONG_SUBMISSION reason
   */
  isWrongSubmission(): boolean {
    return this.value === ReportReason.WRONG_SUBMISSION;
  }

  /**
   * Check if this is the OTHER reason
   */
  isOther(): boolean {
    return this.value === ReportReason.OTHER;
  }

  /**
   * Check if this is a standard reason
   */
  isStandardReason(): boolean {
    return ReportReason.VALID_REASONS.includes(
      this.value as (typeof ReportReason.VALID_REASONS)[number],
    );
  }

  /**
   * Get human-readable display text for this reason
   */
  getDisplayText(): string {
    const displayMap: Record<string, string> = {
      [ReportReason.INAPPROPRIATE]: "Inappropriate Content",
      [ReportReason.CHEATING]: "Cheating",
      [ReportReason.SPAM]: "Spam",
      [ReportReason.WRONG_SUBMISSION]: "Wrong Submission",
      [ReportReason.OTHER]: "Other",
    };

    return displayMap[this.value] ?? this.value;
  }

  /**
   * Compare two reasons
   */
  equals(other: ReportReason): boolean {
    return this.value === other.value;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.value;
  }
}
