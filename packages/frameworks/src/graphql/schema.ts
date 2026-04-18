// =============================================================================
// GraphQL Schema Assembly
// =============================================================================

import { builder } from "./builder.js";

// =============================================================================
// Import Domain Modules (Side-Effect Registration)
// =============================================================================

// Import all domain modules to register their types with Pothos
import "./types/user/index.js";
import "./types/trip/index.js";
import "./types/group/index.js";
import "./types/challenge/index.js";
import "./types/challengeSubmission/index.js";
import "./types/challengeVote/index.js";
import "./types/coin/index.js";
import "./types/notification/index.js";
import "./types/reward/index.js";
import "./types/sponsor/index.js";
import "./types/activityFeed/index.js";
import "./types/storage/index.js";
import "./types/location/index.js";
import "./types/subscriptions/index.js";

// =============================================================================
// Build Schema
// =============================================================================

/**
 * GraphQL Schema
 *
 * Unified schema built from all domain modules.
 * Each domain module registers its types via side-effect on import.
 */
export const schema = builder.toSchema();

export default schema;
