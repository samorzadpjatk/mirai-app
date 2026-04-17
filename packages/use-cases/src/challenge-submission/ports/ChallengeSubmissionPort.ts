import { Context } from "effect";
import type { IChallengeSubmissionPort, ChallengeSubmission } from "@mirai-app/domain";

/**
 * ChallengeSubmission Port - Context.Tag for Effect DI
 */
export class ChallengeSubmissionPortTag extends Context.Tag(
  "ChallengeSubmissionPort",
)<ChallengeSubmissionPortTag, IChallengeSubmissionPort>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IChallengeSubmissionPort, ChallengeSubmission };

/**
 * @deprecated Use ChallengeSubmissionPortTag instead. Kept for backward compatibility.
 */
export const ChallengeSubmissionPort = ChallengeSubmissionPortTag;

/**
 * @deprecated Use IChallengeSubmissionPort instead. Kept for backward compatibility.
 */
export type ChallengeSubmissionPort = typeof ChallengeSubmissionPortTag;
