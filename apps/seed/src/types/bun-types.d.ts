// Type augmentation to help TypeScript ESLint resolve Bun types
// This file ensures Bun types are properly recognized by type-aware ESLint rules

declare global {
  type BunFile = import("bun").BunFile;
}
