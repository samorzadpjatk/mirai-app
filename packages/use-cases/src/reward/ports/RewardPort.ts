import { Context } from "effect";
import type { IRewardPort } from "@mirai-app/domain";

/**
 * Reward Port - Context.Tag for Effect DI
 */
export class RewardPortTag extends Context.Tag("RewardPort")<
  RewardPortTag,
  IRewardPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IRewardPort };

/**
 * @deprecated Use RewardPortTag instead. Kept for backward compatibility.
 */
export const RewardPort = RewardPortTag;

/**
 * @deprecated Use IRewardPort instead. Kept for backward compatibility.
 */
export type RewardPort = typeof RewardPortTag;
