---
title: Migrate inline GraphQL queries to Pothos schema
---

## Initial User Prompt

There are still inline GQL queries in apps - move them into Pothos schema

## Description

Migrate 30+ inline GraphQL queries scattered across apps/web/, apps/native/, and apps/seed/ into the proper Pothos schema workflow. Currently these queries bypass the type-safe codegen process.

## Business Requirements

- Zero inline query or mutation strings in all apps (web + native + seed)
- All operations must be available as generated hooks from @mirai-app/graphql-client
- Maintain existing functionality with no behavioral changes
- Enable compile-time type safety for all GraphQL operations

## Acceptance Criteria

**AC1:** Given the migration is complete, when searching for GraphQL query/mutation strings in apps/, then zero inline query or mutation strings should exist in all apps (web + native + seed).

**AC2:** Given a client developer needs GraphQL operations, when they import from @mirai-app/graphql-client, then all operations must be available as generated hooks.

**AC3:** Given the migration is complete, when comparing before and after behavior, then all existing functionality must work with no behavioral changes.

**AC4:** Given a schema change occurs, when the project is compiled, then compile-time type errors should surface for any query mismatches.
