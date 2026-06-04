// Type augmentation to help TypeScript ESLint resolve Bun types
// This file ensures Bun types are properly recognized by type-aware ESLint rules

import type { BunFile as BunFileType } from "bun";

// Re-export BunFile type for explicit type annotations
export type BunFile = BunFileType;

// Make BunFile available globally for type annotations
declare global {
  // biome-ignore lint/suspicious/noRedeclare: Global type augmentation for BunFile
  type BunFile = import("bun").BunFile;
}
