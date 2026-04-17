// CoinTransaction domain module - exports and side-effect registration
// Importing this module registers all CoinTransaction types with the Pothos builder

// Side-effect imports for type registration
import "./types.js";
import "./queries.js";
import "./mutations.js";

// Re-export all types and helpers for use in other modules
export {
  CoinTransactionType,
  CoinTransactionConnectionType,
  CoinTransactionEdgeType,
  CoinTransactionGroupType,
  CoinTransactionAdminType,
  encodeCoinTransactionCursor,
  buildCoinTransactionConnection,
} from "./types.js";
