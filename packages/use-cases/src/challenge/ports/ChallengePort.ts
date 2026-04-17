import { Context } from "effect";
import type { IChallengePort } from "@mirai-app/domain";

/**
 * Challenge Port - Context.Tag for Effect DI
 */
export class ChallengePortTag extends Context.Tag("ChallengePort")<
  ChallengePortTag,
  IChallengePort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IChallengePort };

/**
 * @deprecated Use ChallengePortTag instead. Kept for backward compatibility.
 */
export const ChallengePort = ChallengePortTag;

/**
 * @deprecated Use IChallengePort instead. Kept for backward compatibility.
 */
export type ChallengePort = typeof ChallengePortTag;
