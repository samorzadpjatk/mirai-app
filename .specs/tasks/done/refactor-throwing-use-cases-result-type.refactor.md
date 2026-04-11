---
title: Refactor throwing use cases to return Result<T,E> types
depends_on:
  - fix-use-cases-typescript-errors.chore.md
---

## Initial User Prompt

Determine the best solution:

The adapters package still has ~370 type errors due to:
1. Controllers expecting Result<T,E> types from use cases
2. Use cases actually throwing exceptions instead
3. This requires either:
   - Refactoring all controllers to use try/catch
   - Or refactoring all use cases to return Results

## Description

// Will be filled in future stages by business analyst
