// Export public API
export {
  GroupRankingType,
  TripRankingsType,
  BatchRankingsResultType,
  UserAvatarUrlType,
  BatchAvatarUrlsResultType,
} from "./types.js";

// Side-effect: Register types and queries with builder on import
import "./types.js";
import "./queries.js";
