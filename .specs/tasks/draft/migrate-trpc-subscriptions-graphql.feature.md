---
title: Migrate tRPC Subscriptions to GraphQL with urql and Code Generation
depends_on: []
---

## Description

Migrate all remaining tRPC subscriptions to GraphQL subscriptions. This involves:

1. Backend: Implement GraphQL subscriptions in Pothos with Bun WebSocket support
2. Frontend: Replace TanStack Query with urql in both web and native apps
3. Codegen: Update to generate urql hooks and graphql-request types
4. Backend apps: Migrate seed and notification-sender to typed graphql-request

**Real-time features to support:**

- **B) Activity feed updates** - New posts appear instantly in trip feeds
- **D) Live location sharing** - Real-time location updates during trips
- **E) Live challenges/voting** - Real-time updates during active challenges

## Acceptance Criteria

### Backend

- [ ] Bun native server with Hono WebSocket helper (`hono/bun`)
- [ ] GraphQL subscriptions implemented for: activityFeedUpdated, locationUpdated, challengeVotingUpdated
- [ ] PubSubService port defined in use-cases layer
- [ ] WebSocket authentication via http-only cookies (same-domain)
- [ ] All subscription resolvers tested

### Frontend (Web)

- [ ] urql client configured with cacheExchange and subscriptionExchange
- [ ] SSR support with ssrExchange
- [ ] WebSocket endpoint uses same-domain cookies for auth
- [ ] All TanStack Query hooks replaced with generated urql hooks
- [ ] Activity feed subscriptions working

### Frontend (Native)

- [ ] urql client configured with cacheExchange and subscriptionExchange
- [ ] SecureStore integration for auth token
- [ ] All TanStack Query hooks replaced with generated urql hooks
- [ ] Activity feed, location, and voting subscriptions working

### Code Generation

- [ ] typescript-urql plugin added to codegen
- [ ] typescript-graphql-request plugin added to codegen
- [ ] Subscription .graphql operation files created
- [ ] Both urql and graphql-request types generated

### Backend Apps

- [ ] apps/seed uses graphql-request SDK (no direct DB access)
- [ ] apps/notification-sender uses graphql-request SDK (migrated from custom fetch)
- [ ] Service-to-service authentication configured

## Architecture Overview

### Clean Architecture Compliance

All apps use the same GraphQL API - no backend bypass:

- apps/web → urql (React hooks + SSR)
- apps/native → urql (React hooks)
- apps/seed → graphql-request (typed SDK)
- apps/notification-sender → graphql-request (typed SDK)

### Technology Stack

- **Backend**: Bun + Hono + Pothos + graphql-ws
- **Web**: Next.js + urql + @urql/exchange-graphcache
- **Native**: Expo + urql + @urql/exchange-graphcache
- **Shared**: GraphQL Code Generator (typescript-urql, typescript-graphql-request)

### Key Decisions

1. **Bun native server** instead of @hono/node-server for WebSocket support
2. **Same-domain cookies** for WebSocket authentication (no localStorage)
3. **urql over Apollo** for smaller bundle size and cleaner API
4. **graphql-request for backend apps** - no UI/cache needs
5. **All clients must use API** - no direct DB access in seed/notification-sender
