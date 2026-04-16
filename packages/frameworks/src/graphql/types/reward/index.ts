// Reward domain module - exports and side-effect registration
// Importing this module registers all Reward types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./mutations.js";

// Re-export all types and helpers for use in other modules
export {
  RewardStatusEnum,
  PurchaseStatusEnum,
  RewardType,
  RewardEdgeType,
  RewardConnectionType,
  RewardPurchaseType,
  RewardPurchaseEdgeType,
  RewardPurchaseConnectionType,
  encodeRewardCursor,
  encodeRewardPurchaseCursor,
  buildRewardConnection,
  buildRewardPurchaseConnection,
} from "./types.js";
