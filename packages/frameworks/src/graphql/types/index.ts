// Domain Types Barrel Export
// Importing this module registers ALL domain types with the Pothos builder
// via side-effect imports in each domain module

// ============================================
// Domain Module Imports (triggers side-effects)
// ============================================
// Each domain module registers its types with Pothos when imported

// User domain
export * from "./user/index.js";

// Event domain
export * from "./event/index.js";

// Sponsor domain
export * from "./sponsor/index.js";

// Notification domain
export * from "./notification/index.js";

// CoinTransaction domain
export * from "./coinTransaction/index.js";

// Location domain
export * from "./location/index.js";

// Challenge domain
export * from "./challenge/index.js";

// Activity domain
export * from "./activity/index.js";

// Group domain
export * from "./group/index.js";

// Reward domain
export * from "./reward/index.js";
