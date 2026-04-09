# Microservices Migration: Strangler Fig + GraphQL Federation Design

**Status:** Validated  
**Approach:** Strangler Fig pattern with GraphQL Federation  
**Gateway:** Hive Gateway (self-hosted, Node.js/Bun runtime)  
**Migration Timeline:** 9-12 months

> **Note:** We specifically chose [Hive Gateway](https://the-guild.dev/graphql/hive/docs/gateway) (Node.js/Bun-based with TypeScript plugins) over [Hive Router](https://the-guild.dev/graphql/hive/docs/router) (Rust-based). Gateway fits our Bun/TypeScript stack and allows our team to write custom plugins in TypeScript. Use Router only if you need maximum Rust performance (10k+ req/sec).

---

## Executive Summary

This design outlines a gradual migration from the Mirai App monorepo to a microservices architecture using the **Strangler Fig pattern** combined with **GraphQL Federation**. Instead of a risky big-bang rewrite, we extract services incrementally, with each extraction validating patterns for the next.

**Why this approach:**

- Teams are already domain-aligned — each can own their service extraction
- Weekly deployment pain — extracted services deploy independently
- Uncertain rapid growth — we extract only what's needed, when needed
- Technology flexibility — new services can use different stacks

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│      Hive Gateway (self-hosted)         │
│  + Hive Schema Registry (self-hosted)   │
│                                         │
│  Routing: /graphql → composed schema    │
│  Auth: Token validation at gateway      │
└─────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌────────┐   ┌──────────┐   ┌─────────────┐
│ tRPC   │   │ Activity │   │  Reward     │
│Monolith│   │ Subgraph │   │  Subgraph   │
│Subgraph│   │          │   │             │
└────────┘   └──────────┘   └─────────────┘
   (now)       (Month 2)       (Month 4)
```

**Principle:** The monolith starts as the only subgraph. As services extract, the gateway composes them into a unified schema. Clients see one endpoint throughout.

---

## Extraction Sequence

Extract from least to most risk. Each extraction teaches patterns for the next.

| Priority | Service       | Domain Entities                                                                             | Owner              | Timeline     |
| -------- | ------------- | ------------------------------------------------------------------------------------------- | ------------------ | ------------ |
| 1        | notifications | NotificationPush, NotificationDelivery, NotificationSchedule, NotificationScheduleExecution | Notifications Team | Month 1-2    |
| 2        | activity      | ActivityFeed, ActivityReaction, RankChangeActivity, UserPost, ChallengeActivity             | Activity Team      | Month 3-4    |
| 3        | rewards       | Reward, RewardPurchase, CoinTransaction                                                     | Rewards Team       | Month 5-6    |
| 4        | challenges    | Challenge, ChallengeVote, ChallengeSubmission, SubmissionReport, SubmissionActivity         | Challenges Team    | Month 7-9    |
| 5        | users         | User, UserAgent, AuthContext                                                                | Users/Auth Team    | Month 10-12  |
| 6        | trips         | Trip, TripParticipant, TripSponsor, TripInsurance, TripResource, Location                   | Trips Team         | Post-rewards |

**Why this order:**

- Notifications: already separate, teaches the mechanics
- Activity: read-heavy, eventually consistent, good for async patterns
- Rewards: transactional but bounded, teaches data consistency
- Challenges: complex business rules, save until patterns are solid
- Users: core dependency for everything, extract last

---

## Migration Phases (Per Service)

Each service follows the same four-phase pattern.

### Phase 1: Shadow (Weeks 1-2)

New service runs parallel, reads from monolith, validates, does not write.

**Goals:**

- Validate schema design
- Test data access patterns
- Build operational confidence

**State:**

- Monolith: Owns reads and writes
- New service: Shadow mode (reads, validates, no writes)
- Gateway: Single subgraph (monolith)

### Phase 2: Dual-Write (Weeks 3-5)

Both systems write. New service is source of truth for its own reads.

**Goals:**

- Ensure data consistency
- Build event publishing
- Test failure scenarios

**State:**

- Monolith: Still owns writes (emits events)
- New service: Receives events, writes to own database
- Gateway: Monolith subgraph + new stub

**Event flow:**

```
Mutation → Monolith → PostgreSQL Outbox
                              ↓
                         Polling Worker
                              ↓
                        Redis Streams
                              ↓
                         New Service (consumes, writes)
```

### Phase 3: Cutover (Week 6)

Route reads to new service. Monolith remains write path temporarily.

**Goals:**

- Validate query performance
- Test client compatibility
- Monitor error rates

**State:**

- Gateway: Routes queries to new service
- Monolith: Write path, emits events
- New service: Read path, handles queries

### Phase 4: Strangle (Weeks 7+)

Remove monolith code once stable.

**Goals:**

- Delete legacy code
- Document new patterns
- Share learnings

**State:**

- Monolith: Schema removed
- New service: Full ownership
- Gateway: New subgraph only

---

## Event Infrastructure

Start simple. Add complexity only when justified.

### Phase 1: PostgreSQL Outbox (Month 1-2)

Use existing PostgreSQL infrastructure.

**Outbox table:**

```sql
CREATE TABLE event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  aggregate_id VARCHAR(255) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  error_message TEXT
);
```

**Producer (in monolith):**

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: {...} });

  await tx.eventOutbox.create({
    data: {
      type: 'UserCreated',
      payload: { userId: user.id, email: user.email },
      aggregateId: user.id,
    }
  });
});
```

**Consumer (polling worker):**

```typescript
// Polls every 1s, publishes to Redis Streams
const events = await prisma.eventOutbox.findMany({
  where: { processedAt: null, retryCount: { lt: 3 } },
  take: 100,
});

for (const event of events) {
  await redis.xadd(`events:${event.type}`, "*", "data", JSON.stringify(event));
  await prisma.eventOutbox.update({
    where: { id: event.id },
    data: { processedAt: new Date() },
  });
}
```

### Phase 2: Redis Streams (Month 3+)

Add Redis for real-time consumption.

**Migration path:**

- Producer: unchanged (still outbox)
- Polling worker: pushes to Redis instead of direct delivery
- Consumers: read from Redis Streams

**Why:** Decouples polling frequency from consumption. Multiple services can consume same event.

### Future: Kafka/NATS (Year 2, if needed)

Consider when:

- Throughput exceeds 1000 events/second
- Need message replay capabilities
- Cross-region replication required

---

## Hive Gateway Configuration

> **Clarification:** Hive Gateway (this section) is the **Node.js/Bun-based** federation gateway. It differs from [Hive Router](https://the-guild.dev/graphql/hive/docs/router) which is Rust-based. We chose Gateway because:
>
> - Runs natively on Bun (matches our stack)
> - TypeScript plugins (our team can write them)
> - Built-in features: subscriptions, caching, auth, rate limiting

### Infrastructure

**Components:**

1. `hive-gateway` — The GraphQL federation gateway (Node.js/Bun runtime)
2. `hive-schema` — Schema registry (PostgreSQL + Redis)
3. `hive-cli` — CI/CD tooling for schema checks

**Deployment:**

```yaml
# docker-compose.yml (initial local dev)
services:
  hive-gateway:
    image: ghcr.io/graphql-hive/gateway:latest
    environment:
      - HIVE_REGISTRY_TOKEN=${HIVE_TOKEN}
      - HIVE_CDN_ENDPOINT=${HIVE_CDN_URL}
    ports:
      - "4000:4000"

  hive-schema:
    image: ghcr.io/graphql-hive/schema:latest
    environment:
      - POSTGRES_URL=postgresql://...
      - REDIS_URL=redis://...
    ports:
      - "8080:8080"
```

**Subgraph configuration:**

```yaml
# gateway.config.ts
import { defineConfig } from '@graphql-hive/gateway';

export default defineConfig({
  supergraph: './supergraph.graphql', // or Hive CDN
  port: 4000,

  plugins: [
    // Auth plugin
    {
      onRequest({ request }) {
        const token = request.headers.get('authorization');
        // Validate, attach to context
      }
    },

    // Metrics plugin
    useHiveMonitoring({
      token: process.env.HIVE_TOKEN,
      endpoint: process.env.HIVE_ENDPOINT,
    }),
  ]
});
```

### Subgraph Schema Definition

**Monolith (initial):**

```graphql
# monolith/schema.graphql
type User @key(fields: "id") {
  id: ID!
  email: String!
  createdAt: DateTime!
  # ... other fields
}

type Query {
  user(id: ID!): User
  me: User
}

type Mutation {
  createUser(input: CreateUserInput!): User
}
```

**Activity service (extracted):**

```graphql
# activity/schema.graphql
type ActivityFeed @key(fields: "id") {
  id: ID!
  userId: ID! @external
  user: User! @requires(fields: "userId")
  activities: [Activity!]!
  createdAt: DateTime!
}

type Activity {
  id: ID!
  type: ActivityType!
  actor: User!
  target: ActivityTarget
  occurredAt: DateTime!
}

enum ActivityType {
  RANK_CHANGE
  CHALLENGE_COMPLETED
  POST_CREATED
}

type Query {
  activityFeed(userId: ID!): ActivityFeed
}

type Mutation {
  recordActivity(input: RecordActivityInput!): Activity
}
```

---

## Testing Strategy

### 1. Contract Testing (Pact)

Verify subgraphs honor schema contracts before deployment.

```typescript
// Activity service publishes pact
const provider = new PactV3({
  consumer: 'activity-subgraph',
  provider: 'hive-gateway',
  pactBrokerUrl: process.env.PACT_BROKER_URL,
});

await provider.executeTest(async (mockserver) => {
  await provider
    .addInteraction()
    .uponReceiving('query activity feed')
    .withRequest({ method: 'POST', path: '/graphql', ... })
    .willRespondWith({ status: 200, body: {...} });

  const result = await queryActivityFeed(mockserver.url);
  expect(result).toMatchSchema(expectedSchema);
});
```

### 2. Shadow Testing

Compare monolith vs. new service results during dual-write phase.

```typescript
// In gateway or client
async function shadowQuery(request, userId) {
  const monolithResult = await queryMonolith(request);
  const serviceResult = await queryActivityService(request);

  if (!deepEqual(monolithResult, serviceResult)) {
    logger.warn("Shadow mismatch", {
      request,
      diff: compare(monolithResult, serviceResult),
      userId,
    });
  }

  // Return monolith (source of truth) during shadow phase
  return monolithResult;
}
```

### 3. Feature Flags for Cutover

Control traffic percentage per user.

```typescript
// Using Unleash, LaunchDarkly, or custom
if (flags.isEnabled("activity-service-cutover", userId)) {
  return queryActivityService(request);
} else {
  return queryMonolith(request);
}
```

### 4. Test Layers

| Type        | What                    | Where               |
| ----------- | ----------------------- | ------------------- |
| Unit        | Resolver logic          | Each service repo   |
| Integration | Database + events       | Each service repo   |
| Contract    | Schema compatibility    | CI/CD (Pact)        |
| Gateway     | Full schema composition | Separate test suite |
| E2E Smoke   | Critical user flows     | Staging environment |

**Principle:** Each subgraph tests itself. Gateway tests the composition. Monolith tests what it still owns.

---

## Error Handling & Observability

### Error Handling

```typescript
// Gateway handles partial failures gracefully
const result = await gateway.execute({
  query: USER_WITH_ACTIVITY,
  errorPolicy: "all", // Return data + errors, don't fail entirely
});

// Subgraph errors bubble up with @shareable/@inaccessible directives
```

### Observability (Must-Have from Day 1)

1. **Distributed Tracing** (OpenTelemetry)
   - Trace across monolith → gateway → subgraph
   - Identify latency sources

2. **Schema Registry** (Hive)
   - Track schema changes
   - Detect breaking changes in CI/CD
   - Schema evolution history

3. **Query Performance Metrics**
   - Which subgraph is slow?
   - Which queries are expensive?
   - N+1 detection

4. **Event Monitoring**
   - Outbox queue depth
   - Consumer lag
   - Dead letter queue

### Rollback Strategy

| Phase         | Rollback                 | Recovery Time          |
| ------------- | ------------------------ | ---------------------- |
| Shadow        | Stop shadow service      | Minutes                |
| Dual-write    | Switch reads to monolith | Minutes (feature flag) |
| Cutover       | Revert gateway routing   | Minutes                |
| Post-strangle | Restore monolith code    | Hours (worst case)     |

**Key Rule:** Never lose data. Dual-write writes to both. Only switch reads when confident.

---

## Security & Authentication

**Authentication at Gateway:**

```typescript
// Hive Gateway plugin
{
  onRequest({ request, context }) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const token = authHeader.replace('Bearer ', '');
    const user = await validateToken(token);

    context.userId = user.id;
    context.role = user.role;
  }
}
```

**Authorization in Subgraphs:**

- Gateway passes AuthContext to subgraphs via headers
- Each subgraph enforces its own authorization rules
- Use `@auth` directives in schema where possible

---

## Timeline & Milestones

**Month 1: Infrastructure**

- [ ] Deploy Hive Gateway (local dev)
- [ ] Deploy Hive Schema Registry (self-hosted)
- [ ] Create outbox table in PostgreSQL
- [ ] Build polling worker
- [ ] Monolith exposes GraphQL schema (or tRPC bridge)

**Month 2: Notifications (First Extraction)**

- [ ] Formalize notification-sender as subgraph
- [ ] Complete shadow → dual-write → cutover → strangle
- [ ] Document patterns learned
- [ ] Update team playbooks

**Months 3-4: Activity Service**

- [ ] Schema design in Hive
- [ ] Service implementation
- [ ] Shadow testing
- [ ] Cutover with feature flags

**Months 5-6: Rewards Service**

- [ ] Extract rewards domain
- [ ] Handle transactional complexity
- [ ] Event-driven consistency

**Months 7-9: Challenges Service**

- [ ] Complex business rules migration
- [ ] Voting/reporting logic
- [ ] Submission workflows

**Months 10-12: Users Service (Final)**

- [ ] Core dependency extraction
- [ ] Auth system migration
- [ ] Full system operation

**Post-12: Optimization**

- [ ] Evaluate Redis Streams → Kafka migration
- [ ] Performance tuning
- [ ] Cross-region deployment (if needed)

---

## Risks & Mitigations

| Risk                                 | Likelihood | Impact | Mitigation                                              |
| ------------------------------------ | ---------- | ------ | ------------------------------------------------------- |
| Data inconsistency during dual-write | Medium     | High   | Outbox pattern + idempotent consumers + monitoring      |
| Subgraph schema conflicts            | Medium     | High   | Hive schema registry + CI/CD validation                 |
| Team capacity constraints            | High       | Medium | One service at a time, extract least-risk first         |
| Client breaking changes              | Low        | High   | Gateway abstraction, no client changes during migration |
| Performance degradation              | Medium     | Medium | Shadow testing, gradual cutover, feature flags          |
| Operational complexity               | High       | Medium | Start with one gateway, add observability early         |

---

## Success Criteria

**Technical:**

- [ ] All services deploy independently
- [ ] Zero-downtime migrations per service
- [ ] <100ms p95 latency increase (vs. monolith)
- [ ] 99.9% availability during migration

**Organizational:**

- [ ] Each domain team owns their service
- [ ] Reduced coordination overhead for deployments
- [ ] Technology flexibility demonstrated (one service uses different stack)
- [ ] Team autonomy increased

**Business:**

- [ ] Deployment frequency: weekly → daily
- [ ] Feature lead time reduced by 30%
- [ ] No critical incidents during migration

---

## Decision Log

| Date       | Decision                                                                  | Rationale                                                                         |
| ---------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 2026-04-10 | Use Strangler Fig pattern                                                 | Gradual migration reduces risk, fits domain-aligned teams                         |
| 2026-04-10 | GraphQL Federation with Hive Gateway (Node.js/Bun)                        | TypeScript plugins, runs on Bun, built-in features (auth, caching, rate limiting) |
| 2026-04-10 | PostgreSQL Outbox start                                                   | Zero new infrastructure, atomic event publishing                                  |
| 2026-04-10 | Redis Streams phase 2                                                     | Simple addition to existing stack, good for <1000 msg/sec                         |
| 2026-04-10 | Extraction order: notifications → activity → rewards → challenges → users | Risk-based: least complex first, core dependencies last                           |
| 2026-04-10 | Self-host Hive                                                            | Control, cost predictability, data sovereignty                                    |

---

## References

- [GraphQL Federation Specification](https://www.apollographql.com/docs/federation/)
- [Hive Gateway Documentation](https://the-guild.dev/graphql/hive/docs/gateway) — Node.js/Bun-based gateway (our choice)
- [Hive Router Documentation](https://the-guild.dev/graphql/hive/docs/router) — Rust-based alternative (for high throughput)
- [Strangler Fig Pattern (Martin Fowler)](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [PostgreSQL Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Pact Contract Testing](https://pact.io/)

---

## Next Steps

1. **Review this design** with domain team leads
2. **Set up Hive Gateway** in local development
3. **Create proof of concept** with notification-sender extraction
4. **Establish team rituals** (weekly migration sync, incident retrospectives)
5. **Document decisions** in this file as migration progresses

**Ready to start implementation?** Use `/sdd:add-task` to create the first task: "Set up Hive Gateway infrastructure for local development."
