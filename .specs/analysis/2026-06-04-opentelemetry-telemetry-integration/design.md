# Plan: OpenTelemetry Telemetry Integration for MIRAI

## Context

The MIRAI backend currently uses a rudimentary `user_agents` table populated by `mobileAppMiddleware` in `packages/orpc/src/api/trpc.ts`. This table stores raw user-agent strings, platform detection, and endpoint paths with timestamps. It is **not** a telemetry system — it lacks event semantics, metrics, traces, structured logging, and any observability integration.

The user wants to replace this with a proper **OpenTelemetry (OTel)** compatible telemetry pipeline that plugs into **Prometheus** (metrics) and **Grafana** (dashboards/traces). The key insight: **telemetry does not need to be persisted in the application database**. OpenTelemetry is designed to export data to external backends, not to store it in the application DB.

## Objective

Replace the `user_agents` table and `mobileAppMiddleware` telemetry with a full OpenTelemetry stack:

1. **Metrics** — Prometheus-compatible endpoint for Grafana dashboards
2. **Traces** — Distributed tracing across backend and native app
3. **Logs** — Structured logging with correlation IDs
4. **No DB persistence** — All telemetry exported to external backends (Prometheus, Tempo, Loki)

## Architecture Decision

### Primary: Library-Specific OpenTelemetry Instrumentation + Prometheus + Grafana

**Why Library-Specific Instrumentation Instead of Custom SDK:**

| Layer | Existing Library | OTel Package | Notes |
|-------|-----------------|-------------|-------|
| **HTTP/Backend** | Hono 4.12.18 | `@hono/otel` | Official Hono middleware. Auto-traces HTTP requests, routes, status codes. |
| **HTTP/Native** | Expo React Native | `react-native-otel` | Zero native dependencies, Expo-compatible. Traces `fetch`/`XMLHttpRequest`. |
| **Database** | Drizzle ORM 0.45.2 + `postgres` 3.4.9 | `@kubiks/otel-drizzle` | Third-party instrumentation. Since `postgres` driver ≠ `pg`, `@opentelemetry/instrumentation-pg` does NOT work. |
| **Logging** | Pino 9.6.0 | `@opentelemetry/instrumentation-pino` | Auto-correlates `trace_id`/`span_id` in logs, sends to OTLP Logs API. |
| **Runtime** | Bun (not Node.js) | N/A — Bun is not Node.js | `getNodeAutoInstrumentations()` does NOT work on Bun (different HTTP layer). Framework-level instrumentation (Hono, Drizzle) is required. |

**Why Not Custom SDK Setup:**
- `NodeSDK` + `getNodeAutoInstrumentations()` from `@opentelemetry/sdk-node` requires Node.js runtime. Bun uses its own HTTP implementation, so HTTP auto-instrumentation silently fails.
- `instrumentation-pg` patches `pg` module, but Drizzle ORM uses `postgres` (3.4.9) — a different package. Database queries would NOT be traced.
- **Result**: Custom SDK would give the illusion of instrumentation while silently missing HTTP and DB layers. Library-specific packages are the correct approach for Bun.

**Why Not DB-Persisted Telemetry:**
| Concern | DB-Persisted (`user_agents` or `telemetry_events`) | OpenTelemetry |
|---------|-----------------------------------------------------|---------------|
| **Schema evolution** | Requires DB migrations | Zero migrations — purely in-memory export |
| **Query performance** | Full table scans on large tables | Backends optimized for time-series data |
| **Retention** | Manual cleanup, unbounded growth | Automatic TTL, downsampling, aggregation |
| **Correlation** | Hard to correlate with logs/traces | Built-in trace/metric/log correlation via `trace_id` |
| **Tooling** | Custom queries, no visualization | Grafana dashboards, Prometheus alerts, Tempo traces |
| **Cost** | DB storage + compute for queries | Dedicated observability infrastructure (cheaper at scale) |
| **Privacy** | PII in application DB | Configurable filtering/redaction at export time |

**Backend Architecture:**

```
┌──────────────────────────────────┐
│      MIRAI Backend               │  Hono + oRPC + Bun
│     (apps/backend-server)        │
│                                  │
│  ┌──────────────────────────┐     │
│  │  @hono/otel middleware │     │  Traces HTTP requests, routes, headers
│  │  (framework-level)     │     │  Creates spans for each Hono request
│  └──────────┬───────────────┘     │
│             │ spans               │
│  ┌──────────┴───────────────┐     │
│  │  @kubiks/otel-drizzle     │     │  Traces Drizzle ORM queries
│  │  (database-level)         │     │  SQL statements, query duration
│  └──────────┬───────────────┘     │
│             │ spans               │
│  ┌──────────┴───────────────┐     │
│  │  @opentelemetry/sdk-    │     │  Metrics (Counter, UpDownCounter, Histogram)
│  │  metrics + Prometheus   │     │  /metrics endpoint for Prometheus scrape
│  │  exporter               │     │
│  └──────────┬───────────────┘     │
│             │ /metrics            │
│  ┌──────────┴───────────────┐     │
│  │  @opentelemetry/instrument│     │  Log correlation: trace_id, span_id
│  │  -ation-pino              │     │  Pino → OTLP Logs API
│  └──────────┬───────────────┘     │
│             │ OTLP                │
└─────────────┼─────────────────────┘
              │
    ┌─────────┴─────────┐
    │  OpenTelemetry     │  Receives OTLP traces + logs
    │  Collector (otelcol)│  Forwards to backends
    └─────────┬─────────┘
              │
    ┌─────────┴─────────┐
    │  Grafana           │  Dashboards: Metrics (Prometheus), Traces (Tempo), Logs (Loki)
    │  (unified UI)      │
    └───────────────────┘
```

**Native App (Expo React Native):**
- `react-native-otel` — Zero native dependencies, works with Expo. Traces `fetch`/`XMLHttpRequest` calls.
- Trace context propagation via W3C `traceparent` headers.
- Logs sent to backend via existing API, then forwarded through Pino → OTLP.
- Metrics: Lightweight, sent to backend metrics endpoint (or directly to OTel Collector if needed).

---

## Why Not Other Solutions

| Alternative | Why Not |
|-------------|---------|
| **DB-persisted `telemetry_events`** | Violates OTel philosophy. Requires migrations, manual queries, no correlation. |
| **Sentry only** | Sentry is error-focused, not full observability. Good complement, not replacement. |
| **Datadog/NewRelic** | Vendor lock-in. OTel provides vendor neutrality. |
| **Custom metrics endpoint** | Reinventing OTel. No trace correlation, no semantic conventions. |
| **Grafana Cloud Agent** | Requires Grafana Cloud subscription. Self-hosted Prometheus + Grafana is free. |

---

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `packages/db/src/schema/userAgents.ts` | **Drop** table definition entirely |
| 2 | `packages/db/src/schema/relations.ts` | Remove `userAgentsRelations` |
| 3 | `packages/db/src/schema/index.ts` | Remove `userAgents` from exports and `schemaTables` |
| 4 | `packages/db/src/index.ts` | Remove `userAgents` type export |
| 5 | `packages/orpc/src/api/trpc.ts` | Remove `userAgents` import, `mobileAppMiddleware`, `enableUserAgentTelemetry()` |
| 6 | `packages/orpc/src/api/__tests__/trpc.pglite.test.ts` | Remove user-agent telemetry tests |
| 7 | `apps/backend-server/src/server.ts` | Add `@hono/otel` middleware + Prometheus metrics endpoint + `shutdownTelemetry()` |
| 8 | `apps/backend-server/src/instrumentation.ts` | **New file** — `NodeTracerProvider` + `MeterProvider` + `PinoInstrumentation` setup |
| 9 | `apps/backend-server/package.json` | Add OTel dependencies: `@hono/otel`, `@opentelemetry/*`, `@kubiks/otel-drizzle` |
| 10 | `packages/orpc/src/utils/logger.ts` | Add `@opentelemetry/instrumentation-pino` log correlation |
| 11 | `packages/db/src/index.ts` | Add `@kubiks/otel-drizzle` instrumentation to Drizzle client initialization |
| 12 | `apps/native/package.json` | Add `react-native-otel` dependency |
| 13 | `apps/native/src/services/api/client.ts` | Add `react-native-otel` trace context propagation |
| 14 | `apps/backend-server/AGENTS.md` | Document telemetry setup |
| 15 | `packages/db/README.md` | Remove `userAgents` from documentation |

---

## Implementation Details

### 1. Drop `user_agents` Table (Schema Cleanup)

**Step 1.1:** Remove `packages/db/src/schema/userAgents.ts`

**Step 1.2:** Remove `userAgents` from `packages/db/src/schema/index.ts`:
```typescript
// Remove: export { userAgents } from "./userAgents";
// Remove: userAgents from schemaTables array
```

**Step 1.3:** Remove `userAgentsRelations` from `packages/db/src/schema/relations.ts`:
```typescript
// Remove: export const userAgentsRelations = ...
// Remove: import { userAgents } from "./userAgents";
```

**Step 1.4:** Generate migration to drop table:
```bash
cd packages/db && bun run db:generate
# This will generate SQL to DROP TABLE "user_agents"
```

### 2. Add OpenTelemetry Library Instrumentation to Backend

**New file:** `apps/backend-server/src/instrumentation.ts`

```typescript
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PeriodicExportingMetricReader, MeterProvider } from "@opentelemetry/sdk-metrics";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { trace, metrics } from "@opentelemetry/api";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

// Resource identifies this service in telemetry backends
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: "mirai-backend",
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || "dev",
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "development",
});

// Prometheus exporter for metrics (scrape endpoint)
const prometheusExporter = new PrometheusExporter({
  port: 9090, // Prometheus scrapes this endpoint
  endpoint: "/metrics",
});

// OTLP trace exporter (sends to OTel Collector or Tempo/Jaeger)
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
});

// Initialize Trace Provider (Bun-compatible — NOT NodeSDK)
const tracerProvider = new NodeTracerProvider({
  resource,
});
tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter));
tracerProvider.register();

// Initialize Metrics Provider (Bun-compatible)
const metricReader = new PeriodicExportingMetricReader({
  exporter: prometheusExporter,
  exportIntervalMillis: 60000, // Export every 60s
});
const meterProvider = new MeterProvider({ resource, readers: [metricReader] });
metrics.setGlobalMeterProvider(meterProvider);

// Register Pino instrumentation (auto-correlates logs with traces)
registerInstrumentations({
  instrumentations: [
    new PinoInstrumentation(),
  ],
});

// Initialize metrics API
export const meter = metrics.getMeter("mirai-backend");

// Custom metrics for MIRAI-specific telemetry
export const miraiMetrics = {
  // API request counter (replaces user_agents counting)
  apiRequests: meter.createCounter("mirai.api.requests.total", {
    description: "Total API requests",
  }),
  
  // Platform distribution (replaces user_agents platform tracking)
  platformRequests: meter.createCounter("mirai.api.requests.by_platform", {
    description: "API requests by platform",
  }),
  
  // Active location sharers
  activeLocationSharers: meter.createUpDownCounter("mirai.location.active_sharers", {
    description: "Number of users currently sharing location",
  }),
  
  // Challenge submissions
  challengeSubmissions: meter.createCounter("mirai.challenges.submissions.total", {
    description: "Total challenge submissions",
  }),
  
  // Coin transactions
  coinTransactions: meter.createCounter("mirai.economy.transactions.total", {
    description: "Total coin transactions",
  }),
  
  // Notification deliveries
  notificationDeliveries: meter.createCounter("mirai.notifications.delivered.total", {
    description: "Total notifications delivered",
  }),
  
  // Error rate
  errors: meter.createCounter("mirai.errors.total", {
    description: "Total errors",
  }),
};

// Graceful shutdown
export async function shutdownTelemetry() {
  await tracerProvider.shutdown();
  await meterProvider.shutdown();
}
```

**Why `NodeTracerProvider` instead of `NodeSDK`:**
- `NodeSDK` from `@opentelemetry/sdk-node` bundles auto-instrumentations that assume Node.js runtime.
- Bun does not use Node's `http`/`net`/`dns` modules, so HTTP auto-instrumentation silently fails.
- `NodeTracerProvider` + manual `registerInstrumentations()` gives explicit control over what gets instrumented.
- `@hono/otel` handles HTTP layer at the framework level (works on Bun).
- `@kubiks/otel-drizzle` handles database layer (works on Bun).
- `PinoInstrumentation` handles logging correlation (works on Bun).

### 3. Integrate OTel into Backend Server

**File:** `apps/backend-server/src/server.ts`

```typescript
// At the TOP of the file — before any other imports
import { shutdownTelemetry } from "./instrumentation";

// ... rest of imports ...

// Add @hono/otel middleware (replaces mobileAppMiddleware HTTP tracing)
import { otel } from "@hono/otel";
app.use(otel());

// Add Prometheus metrics endpoint
app.get("/metrics", async (c) => {
  // PrometheusExporter has its own HTTP server, but we can also expose via Hono:
  return c.text(await prometheusExporter.getMetrics());
});

// Graceful shutdown
cleanUpOnShutdown(() => {
  shutdownTelemetry().catch((err) => console.error("OTel shutdown error:", err));
});
```

**Why `@hono/otel` middleware:**
- `@hono/otel` is an official Hono package that creates OpenTelemetry spans for each HTTP request.
- It captures route, method, status code, duration, and headers automatically.
- It works on Bun because it hooks into Hono's request lifecycle, not Node's `http` module.
- It replaces the need for `getNodeAutoInstrumentations()` HTTP instrumentation.

### 4. Replace `mobileAppMiddleware` with OTel Metrics + Hono Tracing

**File:** `packages/orpc/src/api/trpc.ts`

```typescript
// Remove: import { userAgents } from "@mirai-app/db";
// Remove: enableUserAgentTelemetry() function
// Remove: _telemetryEnabled flag
// Remove: mobileAppMiddleware entirely

// Replace with OTel-aware middleware (if needed)
// @hono/otel (in server.ts) already captures HTTP request traces automatically.
// Custom metrics can be added inline for business-level telemetry:

import { miraiMetrics } from "@mirai-app/backend-server/instrumentation"; // Or shared utils

// If you want platform-specific metrics, add a lightweight middleware:
const telemetryMiddleware = base.middleware(async ({ context, next, path }) => {
  const userAgent = context.headers.get("user-agent");
  const platform = getPlatformFromUserAgent(userAgent);
  
  if (platform) {
    miraiMetrics.platformRequests.add(1, { platform, endpoint: path.join("/") });
  }
  
  miraiMetrics.apiRequests.add(1, { endpoint: path.join("/") });
  
  return next();
});
```

**Note:** `@hono/otel` middleware (added in `server.ts`) automatically creates OpenTelemetry spans for every HTTP request. It captures:
- HTTP method, route, status code
- Request/response headers (configurable)
- Duration and error status
- Platform info from `user-agent` header (via custom attributes)

This replaces the need for `mobileAppMiddleware` to manually capture HTTP-level telemetry.

### 5. Update Logger for Trace Correlation

**File:** `packages/orpc/src/utils/logger.ts`

```typescript
import { trace } from "@opentelemetry/api";

export const logger = pino({
  // ... existing config ...
  mixin() {
    const span = trace.getActiveSpan();
    if (span) {
      return {
        trace_id: span.spanContext().traceId,
        span_id: span.spanContext().spanId,
      };
    }
    return {};
  },
});
```

**Why `@opentelemetry/instrumentation-pino`:**
- `PinoInstrumentation` (registered in `instrumentation.ts`) automatically patches Pino to inject `trace_id`, `span_id`, and `trace_flags` into every log record.
- This works on Bun because it patches the Pino module itself (not Node.js internals).
- The `mixin()` approach above is a manual fallback if you need custom attributes beyond the auto-injected ones.
- Both approaches can coexist — `PinoInstrumentation` provides the baseline, `mixin()` adds app-specific fields.

### 6. Update Native App for Trace Propagation

**Install:** `react-native-otel` (zero native dependencies, Expo-compatible)

**File:** `apps/native/src/services/api/client.ts` (or similar)

```typescript
// Option A: Use react-native-otel for automatic instrumentation
import { initOpenTelemetry } from "react-native-otel";

initOpenTelemetry({
  serviceName: "mirai-native",
  serviceVersion: process.env.APP_VERSION || "dev",
  // Sends traces to backend endpoint or directly to OTel Collector
  traceExporter: {
    url: `${process.env.EXPO_PUBLIC_API_URL}/traces`,
  },
  // Auto-instruments fetch() and XMLHttpRequest
  instrumentations: {
    fetch: true,
    xhr: true,
  },
});

// Option B: Manual traceparent header injection (if not using react-native-otel)
import { trace } from "@opentelemetry/api";

export const apiClient = createClient({
  // ... existing config ...
  headers: () => {
    const span = trace.getActiveSpan();
    const headers: Record<string, string> = {};
    
    if (span) {
      // W3C Trace Context propagation
      headers["traceparent"] = `00-${span.spanContext().traceId}-${span.spanContext().spanId}-01`;
    }
    
    return headers;
  },
});
```

**Why `react-native-otel`:**
- Zero native dependencies — works with Expo without ejecting or custom native modules.
- Auto-instruments `fetch()` and `XMLHttpRequest` (used by React Native's networking layer).
- Propagates W3C `traceparent` headers automatically to backend requests.
- Lightweight — minimal impact on bundle size (important for OTA updates).
- **Note:** If `react-native-otel` is not available or unmaintained, Option B (manual injection) is sufficient for trace propagation.

**Metrics from Native:**
- Native metrics are NOT sent directly to Prometheus.
- Instead, report to backend via a lightweight endpoint (e.g., `POST /api/metrics/batch`), which then forwards to OTel Collector.
- This avoids exposing Prometheus to the public internet and reduces native app complexity.

---

## Deployment Architecture

### Option A: Self-Hosted (Recommended for Cost Control)

```yaml
# docker-compose.yml (observability stack)
version: "3"
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  tempo:
    image: grafana/tempo
    ports:
      - "3200:3200"  # Tempo query
      - "4317:4317"  # OTLP gRPC
      - "4318:4318"  # OTLP HTTP

  loki:
    image: grafana/loki
    ports:
      - "3100:3100"
```

### Option B: Grafana Cloud (SaaS)
- Use Grafana Cloud Agent for Prometheus metrics
- Use Grafana Cloud Tempo for traces
- Use Grafana Cloud Loki for logs
- No infrastructure to manage

### Option C: Prometheus Only (Minimal)
- Just run Prometheus for metrics
- Skip traces and logs initially
- Grafana for dashboards
- Cheapest option, still valuable

---

## Grafana Dashboards

### Dashboard 1: API Overview
- **Request Rate** (`rate(mirai_api_requests_total[5m])`)
- **Error Rate** (`rate(mirai_errors_total[5m])`)
- **Platform Distribution** (`mirai_api_requests_by_platform`)
- **P95 Latency** (from auto-instrumentation)

### Dashboard 2: Location Sharing
- **Active Sharers** (`mirai_location_active_sharers`)
- **Location Updates/min** (from HTTP auto-instrumentation)
- **Sharing Requests** (custom metric)

### Dashboard 3: Challenge & Economy
- **Submissions/min** (`rate(mirai_challenges_submissions_total[5m])`)
- **Coin Transactions** (`rate(mirai_economy_transactions_total[5m])`)
- **Active Challenges** (custom metric)

### Dashboard 4: Traces
- **Trace Search** — Tempo integration
- **Slow Requests** — Top 10 slowest traces
- **Error Traces** — Filter by error status

---

## Migration Strategy

### Phase 1: Remove `user_agents` (Immediate)
1. Drop `user_agents` from schema
2. Remove `mobileAppMiddleware` from `trpc.ts`
3. Remove `enableUserAgentTelemetry()` call from backend
4. Generate and run migration

### Phase 2: Add Library Instrumentation (Next Sprint)
1. Add OTel dependencies to `apps/backend-server/package.json`:
   - `@hono/otel` — Hono HTTP tracing
   - `@opentelemetry/sdk-trace-node` — Bun-compatible trace provider
   - `@opentelemetry/sdk-metrics` — Metrics provider
   - `@opentelemetry/exporter-prometheus` — Prometheus endpoint
   - `@opentelemetry/exporter-trace-otlp-http` — OTLP trace export
   - `@opentelemetry/instrumentation-pino` — Pino log correlation
   - `@opentelemetry/instrumentation` — Instrumentation registration
   - `@kubiks/otel-drizzle` — Drizzle ORM tracing
2. Create `instrumentation.ts` with `NodeTracerProvider` + `MeterProvider` setup
3. Add `@hono/otel` middleware to `server.ts`
4. Register `@kubiks/otel-drizzle` in `packages/db/src/index.ts`
5. Add `/metrics` endpoint
6. Verify Prometheus can scrape metrics

### Phase 3: Custom Metrics (Next Sprint)
1. Add MIRAI-specific metrics (platform, location, challenges, economy)
2. Replace manual counting with OTel counters
3. Add business-level metrics (active trips, user engagement)

### Phase 4: Traces & Logs (Next Quarter)
1. Add OTLP trace exporter
2. Configure `react-native-otel` in native app for trace propagation
3. Add trace IDs to Pino logs (via `@opentelemetry/instrumentation-pino`)
4. Set up Tempo/Jaeger for trace storage

### Phase 5: Grafana Dashboards (Next Quarter)
1. Create dashboard JSON files in `docs/monitoring/` or `monitoring/` directory
2. Document telemetry setup in `apps/backend-server/AGENTS.md`
3. Add alerting rules (Prometheus Alertmanager)

---

## Test Plan

### Unit Tests
| Test | Expected Result |
|------|---------------|
| OTel trace provider initializes without errors | `NodeTracerProvider.register()` completes successfully |
| OTel metrics provider initializes without errors | `MeterProvider` registers with Prometheus reader |
| Prometheus endpoint returns metrics | `GET /metrics` returns valid Prometheus text |
| Custom metrics increment correctly | `miraiMetrics.apiRequests.add(1)` increases counter |
| Trace context propagates | `traceparent` header present in outgoing requests |
| Bun compatibility | No Node.js-specific errors (e.g., `http` module auto-instrumentation failures) |

### Integration Tests
| Test | Expected Result |
|------|---------------|
| Prometheus scrapes metrics | `curl localhost:9090/metrics` returns non-empty |
| `@hono/otel` captures HTTP traces | Spans created for Hono requests with route, method, status |
| `@kubiks/otel-drizzle` captures DB traces | Spans created for Drizzle ORM queries with SQL statement |
| Pino logs include trace_id | JSON logs contain `trace_id` field (via `@opentelemetry/instrumentation-pino`) |
| Backend shutdown flushes OTel | `shutdownTelemetry()` called on SIGTERM, completes without errors |
| Bun-specific: No HTTP auto-instrumentation failures | `getNodeAutoInstrumentations()` is NOT used, so no Bun HTTP layer errors |

### End-to-End Tests
| Test | Expected Result |
|------|---------------|
| Grafana shows API request rate | Dashboard displays `mirai_api_requests_total` |
| Platform distribution visible | Pie chart shows iOS vs Android split |
| Trace search works | Tempo returns traces for slow requests |
| No `user_agents` table in DB | `SELECT * FROM user_agents` returns empty or table missing |
| Native trace propagation | Traces from `react-native-otel` appear in Tempo with backend correlation |

---

## Expected Impact

| Metric | Expected Improvement |
|--------|---------------------|
| **Observability** | Full metrics, traces, and logs in Grafana |
| **Performance** | No DB writes for telemetry (faster requests) |
| **Storage** | Zero DB storage for telemetry (external backends) |
| **Correlatability** | Trace IDs link logs, metrics, and traces |
| **Alerting** | Prometheus rules for error rate, latency thresholds |
| **Debugging** | Distributed traces show request flow across services |
| **Cost** | Self-hosted stack is free; Grafana Cloud has free tier |

---

## Rollback Plan

If OTel causes issues:

1. **Immediate**: Disable `@hono/otel` middleware and `shutdownTelemetry()` call in `server.ts` — backend reverts to no telemetry
2. **Short-term**: Remove OTel middleware but keep Prometheus endpoint (if you still want metrics)
3. **Nuclear**: Revert all changes, restore `user_agents` table (keep migration file for rollback)

---

## Additional Notes

- **No database changes** — This is the key difference from the previous plan. No `telemetry_events` table, no DB migrations for telemetry.
- **Pino already exists** — We add `@opentelemetry/instrumentation-pino` for automatic trace correlation. The `mixin()` approach is a manual fallback.
- **Environment variables** — Add `OTEL_EXPORTER_OTLP_ENDPOINT`, `APP_VERSION`, `OTEL_ENABLED` to `.env` files.
- **Docker** — The observability stack (Prometheus, Grafana, Tempo, Loki) should be in a separate `docker-compose.monitoring.yml` or part of the dev environment.
- **Security** — The `/metrics` endpoint should not be exposed publicly. Use a firewall or reverse proxy to restrict access.
- **Resource usage** — OTel SDK has minimal overhead. Metrics are aggregated in-memory and exported periodically.
- **Bun-specific warning** — Do NOT use `@opentelemetry/sdk-node` or `getNodeAutoInstrumentations()`. Bun's HTTP layer is different from Node.js, so HTTP auto-instrumentation silently fails. Use `@hono/otel` (framework-level) and `@kubiks/otel-drizzle` (database-level) instead.
- **Drizzle driver note** — Drizzle ORM uses `postgres` (3.4.9), NOT `pg`. `@opentelemetry/instrumentation-pg` patches `pg` module, so it does NOT work with `postgres` driver. `@kubiks/otel-drizzle` is required for database tracing.
- **Native app bundle size** — `react-native-otel` is lightweight, but verify bundle size impact before release. If it exceeds budget, use manual `traceparent` injection (Option B in Step 6).

---

## Decision Matrix

| If you need to... | Change this file |
|-------------------|------------------|
| Add a new metric | `apps/backend-server/src/instrumentation.ts` — add to `miraiMetrics` object |
| Change Prometheus port | `instrumentation.ts` — edit `PrometheusExporter` config |
| Change OTLP endpoint | `instrumentation.ts` — edit `OTLPTraceExporter` config |
| Disable telemetry | `server.ts` — remove `@hono/otel` middleware and `shutdownTelemetry()` call |
| Add trace to log | `packages/orpc/src/utils/logger.ts` — add `mixin` (or rely on `PinoInstrumentation`) |
| Add Grafana dashboard | `monitoring/dashboards/` — create new JSON file |
| Instrument a new database query | `packages/db/src/index.ts` — ensure `@kubiks/otel-drizzle` is registered |
| Add native trace propagation | `apps/native/src/services/api/client.ts` — configure `react-native-otel` or manual `traceparent` |

---

*Plan created: 2026-06-04*
*Plan revised: 2026-06-04*
*Status: Ready for implementation*
