import { Context } from "effect";
import type { IRewardPurchasePort, RewardPurchase } from "@mirai-app/domain";

/**
 * RewardPurchase Port - Context.Tag for Effect DI
 */
export class RewardPurchasePortTag extends Context.Tag("RewardPurchasePort")<
  RewardPurchasePortTag,
  IRewardPurchasePort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { IRewardPurchasePort, RewardPurchase };

/**
 * @deprecated Use RewardPurchasePortTag instead. Kept for backward compatibility.
 */
export const RewardPurchasePort = RewardPurchasePortTag;

/**
 * @deprecated Use IRewardPurchasePort instead. Kept for backward compatibility.
 */
export type RewardPurchasePort = typeof RewardPurchasePortTag;
