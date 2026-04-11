---
title: Fix adapters package mapper type alignment (Phase 4)
depends_on: ["fix-adapters-phase3-controllers.chore.md"]
---

## Initial User Prompt

Fix Phase 4 of adapters package type errors - align mapper outputs with controller DTO expectations (~45 errors)

## Description

This maintenance task addresses approximately 45 TypeScript type errors in the adapters package where mapper function outputs don't align with controller DTO type expectations. Mappers in the adapters layer convert domain entities to DTOs that controllers consume. When these type contracts are misaligned, TypeScript compilation fails and type safety guarantees are lost.

The goal is to achieve complete type alignment between mapper outputs and DTO definitions while maintaining zero runtime behavior changes. This work is part of a phased adapters package cleanup, depending on Phase 3 controller DTO fixes.

Key considerations:
- Follow existing CEK Five Pillars architecture patterns
- Maintain backward compatibility (type-only changes)
- Align with DTO definitions from use-cases package
- Ensure build passes with strict TypeScript settings

**Scope**:
- **Included**: All mapper type alignment fixes in adapters package (~45 errors)
- **Excluded**: Runtime logic changes, new features, controller changes (handled in Phase 3)

**User Scenarios**:
1. **Primary Flow**: Developer runs TypeScript compiler → Zero type errors in mappers → Build completes successfully → All tests pass
2. **Error Handling**: For each type mismatch → Align property types between mapper and DTO → Verify with compiler

**Business Value**: Type safety prevents runtime errors, provides clear contracts between layers, improves developer experience with proper IntelliSense, and enables successful CI/CD builds.

## Acceptance Criteria

### Functional Requirements

- [ ] **Type Error Resolution**: All ~45 TypeScript type errors in adapters mappers are resolved
  - Given: Adapters package has mapper type mismatches
  - When: TypeScript compiler runs
  - Then: Zero type errors reported in mapper files

- [ ] **Mapper-DTO Alignment**: Mapper function return types match DTO definitions exactly
  - Given: A mapper function returning a DTO
  - When: Type checking occurs
  - Then: Return type matches the DTO type definition

- [ ] **Build Success**: Project builds successfully with strict TypeScript settings
  - Given: Strict TypeScript configuration
  - When: Build command executes
  - Then: Compilation completes without errors

### Non-Functional Requirements

- [ ] **Zero Runtime Changes**: No behavioral changes to runtime code
  - Given: Existing runtime behavior
  - When: Type fixes are applied
  - Then: All existing tests pass without modification

- [ ] **Architecture Compliance**: Follows CEK Five Pillars patterns
  - Given: CEK architecture conventions
  - When: Type alignment is implemented
  - Then: Patterns align with established conventions

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] TypeScript compiler reports zero errors in adapters mappers
- [ ] All existing tests pass
- [ ] Code reviewed and approved
- [ ] Build succeeds in CI/CD

## Architecture Overview

// To be filled in Phase 3: Architecture Synthesis

## Implementation Process

// To be filled in Phase 4: Decomposition

## Verification

// To be filled in Phase 6: Verifications
