---
title: Fix rate limiting and reduce HTTP requests from native app
---

## Initial User Prompt

Right now, the backend for the app is rate-limiting the connections, throttling even on one user on one device using the Expo app - alanyse the backend and Expo native app to investigate and find ways of reducing HTTP requests to the backend - search the web and official docs for best practicies - also consider increasing /imporving / removing the rate-limiter on the backend server

## Design Document

.specs/plans/rate-limiting-reduction.design.md

## Description

The backend returns HTTP 429 to a single Expo user on a single device because the native app generates too many requests and the backend limiter is too coarse.

Root causes:

- `apps/native/src/services/background/backgroundLocationTask.ts` created a new HTTP+WS `oRPC` client on every GPS update.
- `packages/orpc/src/client/vanilia.ts` retried failed requests up to 5 times independently of TanStack Query's 3 retries.
- TanStack Query defaulted `refetchOnMount` to `true` and most hooks inherited 60s `staleTime`.
- The backend limiter was IP-only, fixed-window, and counted every `/api/orpc` call together.

This task implements the design in `.specs/plans/rate-limiting-reduction.design.md`.

## Definition of Done (Task Level)

- [x] `nx run-many -t typecheck` passes for backend-server, orpc and native.
- [x] `nx run-many -t test` passes for backend-server and orpc.
- [x] `cd apps/native && bun run test` passes.
- [x] No `as any`, `@ts-ignore`, `@ts-expect-error` added.
- [x] Design doc `.specs/plans/rate-limiting-reduction.design.md` reflects final implementation.
- [ ] Branch `feature/rate-limiting-request-reduction` pushed (pending explicit push request).
