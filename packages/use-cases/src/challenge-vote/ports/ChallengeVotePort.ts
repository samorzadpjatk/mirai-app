import { Context } from "effect";
import type { IChallengeVotePort, ChallengeVote } from "@mirai-app/domain";

/**
 * ChallengeVote Port - Context.Tag for Effect DI
 */
export class ChallengeVotePortTag extends Context.Tag("ChallengeVotePort")<
  ChallengeVotePortTag,
  IChallengeVotePort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IChallengeVotePort, ChallengeVote };

/**
 * @deprecated Use ChallengeVotePortTag instead. Kept for backward compatibility.
 */
export const ChallengeVotePort = ChallengeVotePortTag;

/**
 * @deprecated Use IChallengeVotePort instead. Kept for backward compatibility.
 */
export type ChallengeVotePort = typeof ChallengeVotePortTag;
