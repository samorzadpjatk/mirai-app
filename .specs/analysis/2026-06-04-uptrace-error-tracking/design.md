# Design: Self-Hosted Error Tracking with Uptrace for MIRAI

> **Status**: Design document for Uptrace integration with MIRAI native app
> **Date**: 2026-06-04
> **Compatibility**: Aligns with `observability-gdpr-compliance.md` and `opentelemetry-telemetry-integration.md` plans
> **Replaces**: Rustrak/Moneat designs — Uptrace is OpenTelemetry-native and integrates with Grafana as the unified view

---

## Overview

Uptrace is an **OpenTelemetry-native APM** that provides **Sentry-compatible error tracking** with native Grafana integration. It stores traces, metrics, and logs in ClickHouse, and serves as a **Prometheus/Tempo data source** for Grafana — making it ideal for teams that want a unified observability view in Grafana without maintaining separate error-tracking UIs.

**Why Uptrace for MIRAI:**
- **OpenTelemetry Native**: Designed for OTLP from the ground up — no translation layers
- **Sentry SDK Compatible**: Works with `@sentry/react-native` using a modified DSN
- **Grafana Integration**: Acts as Prometheus + Tempo data source — no separate UI needed
- **Unified View**: Errors, traces, metrics, and logs all in Grafana
- **Trace Correlation**: Every error carries `trace_id` for cross-referencing with distributed traces
- **GDPR Friendly**: Self-hosted, EU data residency, data stays in your infrastructure
- **Cost Efficient**: Free community edition, unlimited data, 10x lower cost than SaaS alternatives
- **Simple Architecture**: Single Go binary + ClickHouse + PostgreSQL (no microservices)

---

## Architecture

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MIRAI Native App                          │
│  (Expo React Native, iOS/Android)                             │
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │  @sentry/react-native SDK                    │            │
│  │  - ErrorBoundary for render errors           │            │
│  │  - Global handlers for uncaught errors       │            │
│  │  - Manual capture via Sentry.captureException()│          │
│  │  - Automatic breadcrumbs (navigation, fetch) │            │
│  │  - Source maps for symbolicated stacks       │            │
│  └──────────────────┬────────────────────────────┘            │
│                     │                                        │
│                     │ Sentry Envelope Protocol                │
│                     │ (Modified DSN for Uptrace)             │
│                     │ https://key@uptrace.mirai.app/1         │
│                     ▼                                        │
├─────────────────────────────────────────────────────────────┤
│                  Uptrace Server                              │
│  (Single Go binary, self-hosted)                              │
│                                                              │
│  ┌─────────────────────────────────────────────┐           │
│  │  OTLP Native Ingestion                       │           │
│  │  - /v1/traces (OTLP gRPC/HTTP)              │           │
│  │  - /v1/metrics (OTLP gRPC/HTTP)             │           │
│  │  - /v1/logs (OTLP gRPC/HTTP)                │           │
│  │  - /api/envelope/ (Sentry SDK format)        │           │
│  └──────────────────┬────────────────────────────┘           │
│                     │                                        │
│  ┌──────────────────┴────────────────────────────┐           │
│  │  Error Processing                              │           │
│  │  - Fingerprinting & grouping                 │           │
│  │  - Stack trace + source map resolution         │           │
│  │  - Trace ID extraction & correlation           │           │
│  │  - PII scrubbing (GDPR)                        │           │
│  └──────────────────┬────────────────────────────┘           │
│                     │                                        │
│  ┌──────────────────┴────────────────────────────┐           │
│  │  ClickHouse (events, spans, metrics, logs)       │           │
│  │  - High-volume storage with compression          │           │
│  │  - Fast analytical queries                       │           │
│  │  - 30-90 day configurable retention              │           │
│  └────────────────────────────────────────────────┘           │
│  ┌────────────────────────────────────────────────┐           │
│  │  PostgreSQL (metadata)                         │           │
│  │  - Projects, users, dashboards, alerts           │           │
│  │  - DSN authentication                          │           │
│  └────────────────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  Grafana API (Prometheus + Tempo compatible) │           │
│  │  - /api/prometheus/metrics (PromQL queries)  │           │
│  │  - /api/tempo/traces (trace lookup by ID)    │           │
│  │  - /api/tempo/search (trace search)          │           │
│  └──────────────────┬────────────────────────────┘           │
│                     │                                        │
│                     │ Prometheus + Tempo protocol           │
│                     │ (No separate UI needed)              │
│                     ▼                                        │
├─────────────────────────────────────────────────────────────┤
│                    Grafana (Unified View)                   │
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │  Datasources:                                │            │
│  │  - Uptrace (Prometheus) → Error metrics      │            │
│  │  - Uptrace (Tempo) → Traces                  │            │
│  │  - Loki → Logs (via OTel Collector)          │            │
│  │  - Prometheus → Infrastructure metrics       │            │
│  └────────────────────────────────────────────────┘            │
│                                                              │
│  Dashboards:                                                 │
│  - Error rate, latency, top errors                          │
│  - Trace-error correlation (click trace_id → see error)        │
│  - Service dependency map                                     │
│  - Log search with trace linking                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Error occurs in native app** → `@sentry/react-native` captures it
2. **SDK serializes** → Error envelope with stack trace, breadcrumbs, device info, trace_id
3. **POST to Uptrace** → `/api/envelope/` endpoint via modified DSN
4. **Uptrace processes** → Fingerprinting, grouping, trace ID extraction, PII scrubbing
5. **Store in ClickHouse** → Events, spans, metrics with trace_id correlation
6. **Query via Grafana** → Prometheus API for metrics, Tempo API for traces
7. **View in Grafana** → Unified dashboard with error-to-trace correlation

---

## DSN Configuration

Uptrace uses a slightly different DSN format than Sentry. To make it work with Sentry SDKs:

### Original Uptrace DSN
```
https://<secret>@api.uptrace.dev?grpc=4317
```

### Modified DSN for Sentry SDK
```
https://<secret>@api.uptrace.dev/1
```

**Changes needed:**
1. Add a **project ID** as a path component (e.g., `/1`)
2. Remove the `grpc=4317` parameter (optional, Sentry ignores it anyway)

---

## Expo React Native Integration

### SDK Installation

```bash
# In apps/native directory
cd apps/native
npx expo install @sentry/react-native
```

### Configuration

**File**: `apps/native/src/services/errorReporting.ts` (New)

```typescript
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import { trace } from "@opentelemetry/api";

// Initialize Sentry with Uptrace DSN
// Note: Uptrace DSN needs project ID path: https://<secret>@<host>/<project_id>
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_UPTRACE_DSN,
  
  // Environment
  environment: __DEV__ ? "development" : "production",
  
  // Performance monitoring
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  
  // Session replay (disabled in Expo Go)
  replaysOnErrorSampleRate: isRunningInExpoGo() ? 0 : 1.0,
  replaysSessionSampleRate: isRunningInExpoGo() ? 0 : 0.1,
  
  // Native crash tracking (disabled in Expo Go)
  enableNativeFramesTracking: !isRunningInExpoGo(),
  
  // Attachments and context
  beforeSend: (event) => {
    // Add trace ID for OpenTelemetry correlation
    const span = trace.getActiveSpan();
    if (span) {
      const { traceId, spanId } = span.spanContext();
      event.contexts = {
        ...event.contexts,
        trace: {
          trace_id: traceId,
          span_id: spanId,
        },
      };
      event.tags = {
        ...event.tags,
        trace_id: traceId,
      };
    }
    
    // GDPR: Redact PII before sending
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.name;
    }
    
    // Strip query params from request URL
    if (event.request?.url) {
      event.request.url = event.request.url.split("?")[0];
    }
    
    return event;
  },
  
  // Integration with Expo Router
  integrations: [
    Sentry.reactNavigationIntegration({
      enableTimeToInitialDisplay: !isRunningInExpoGo(),
    }),
  ],
});

// Set user context (hashed ID only, no PII)
export function setErrorReportingUser(userId: string | null) {
  if (userId) {
    Sentry.setUser({
      id: userId, // Already hashed by auth layer
    });
  } else {
    Sentry.setUser(null);
  }
}

// Manual error capture with trace context
export function captureError(error: Error, context?: Record<string, unknown>) {
  addTraceContext(); // Ensure trace ID is attached
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

// Add breadcrumb for user actions
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

// Helper: Add trace ID to Sentry context
function addTraceContext() {
  const span = trace.getActiveSpan();
  if (span) {
    const { traceId } = span.spanContext();
    Sentry.setTag("trace_id", traceId);
  }
}
```

### Root Layout Integration

**File**: `apps/native/src/app/_layout.tsx` (Modified)

```typescript
import { Slot } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react-native";
import "@/services/errorReporting"; // Initialize Sentry

// Expo Router ErrorBoundary export
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  // Auto-report to Uptrace
  Sentry.captureException(error);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        Our team has been notified. Please try again.
      </Text>
      <TouchableOpacity style={styles.button} onPress={retry}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <Slot />
    </Sentry.ErrorBoundary>
  );
}
```

### Metro Configuration

**File**: `apps/native/metro.config.js` (Modified)

```javascript
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// Sentry-enhanced Metro config for source maps
const config = getSentryExpoConfig(__dirname);

module.exports = config;
```

### App Configuration

**File**: `apps/native/app.json` (Modified)

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "url": "https://uptrace.mirai.app",
          "project": "mirai-native",
          "organization": "mirai"
        }
      ]
    ]
  }
}
```

### Environment Variables

**File**: `environment/.env.dev` (Add)

```bash
# Uptrace Error Tracking
# Note: DSN must include project ID path: https://<secret>@<host>/<project_id>
EXPO_PUBLIC_UPTRACE_DSN=https://public@uptrace.localhost/1
UPTRACE_SERVER_URL=http://localhost:14318

# OpenTelemetry Collector (for direct OTLP export)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

**File**: `environment/.env.prod` (Add)

```bash
# Uptrace Error Tracking (Production)
EXPO_PUBLIC_UPTRACE_DSN=https://public@uptrace.mirai.app/1
UPTRACE_SERVER_URL=https://uptrace.mirai.app

# OpenTelemetry Collector (Production)
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.mirai.app:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_HEADERS=uptrace-dsn=${UPTRACE_DSN}
```

---

## Uptrace Deployment

### Docker Compose (Development)

**File**: `environment/docker-compose.uptrace.yml` (New)

```yaml
version: "3.8"

services:
  uptrace:
    image: uptrace/uptrace:1.7
    container_name: mirai-uptrace
    restart: on-failure
    ports:
      - "14318:14318"   # Web UI and OTLP HTTP
      - "14317:14317"   # OTLP gRPC
    volumes:
      - ./uptrace.yml:/etc/uptrace/uptrace.yml
    environment:
      - UPTRACE_LISTEN_HTTP_ADDR=:14318
      - UPTRACE_LISTEN_GRPC_ADDR=:14317
    depends_on:
      clickhouse:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - mirai-network

  clickhouse:
    image: clickhouse/clickhouse-server:latest
    container_name: mirai-clickhouse
    ports:
      - "8123:8123"
      - "9000:9000"
    environment:
      - CLICKHOUSE_DB=uptrace
      - CLICKHOUSE_USER=${CLICKHOUSE_USER:-uptrace}
      - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-uptrace}
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8123/ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - mirai-network

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: mirai-otel-collector
    command: ["--config=/etc/otel-collector-config.yml"]
    ports:
      - "4317:4317"  # OTLP gRPC
      - "4318:4318"  # OTLP HTTP
    volumes:
      - ./otel-collector-config.yml:/etc/otel-collector-config.yml
    depends_on:
      - uptrace
    restart: unless-stopped
    networks:
      - mirai-network

volumes:
  clickhouse_data:

networks:
  mirai-network:
    external: true
```

### Uptrace Configuration

**File**: `environment/uptrace.yml` (New)

```yaml
# Uptrace configuration

listen:
  http:
    addr: :14318
  grpc:
    addr: :14317

# ClickHouse storage
ch:
  addr: clickhouse:9000
  user: uptrace
  password: uptrace
  database: uptrace

# PostgreSQL metadata
pg:
  addr: postgres:5432
  user: ${POSTGRES_USER}
  password: ${POSTGRES_PASSWORD}
  database: uptrace

# Projects and DSNs
projects:
  - id: 1
    name: mirai-native
    token: ${UPTRACE_PROJECT_TOKEN}
    pinned:
      - service.name
      - host.name
      - deployment.environment

# Sentry ingestion
sentry:
  enabled: true
  addr: :14318
  # DSN format: https://<token>@<host>/<project_id>

# Retention
retention:
  traces: 30d
  metrics: 30d
  logs: 7d
```

### OpenTelemetry Collector Configuration

**File**: `environment/otel-collector-config.yml` (New)

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  
  memory_limiter:
    limit_mib: 512
    spike_limit_mib: 128
    check_interval: 5s

exporters:
  otlp/uptrace:
    endpoint: uptrace:14317
    tls:
      insecure: true
    headers:
      # Uptrace DSN for authentication
      # Format: http://<token>@<host>:<port>/<project_id>
      uptrace-dsn: "http://${UPTRACE_PROJECT_TOKEN}@uptrace:14317/1"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/uptrace]
    
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/uptrace]
    
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/uptrace]
```

### Nginx Reverse Proxy (Production)

**File**: `environment/nginx/uptrace.conf` (New)

```nginx
server {
    listen 443 ssl http2;
    server_name uptrace.mirai.app;

    ssl_certificate /etc/letsencrypt/live/mirai.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mirai.app/privkey.pem;

    # Uptrace web UI + API
    location / {
        proxy_pass http://uptrace:14318;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Allow large payloads for source maps
        client_max_body_size 50M;
        
        # Timeout for trace queries
        proxy_read_timeout 300s;
    }
}

# OTLP gRPC endpoint
server {
    listen 14317 ssl http2;
    server_name otel.mirai.app;

    ssl_certificate /etc/letsencrypt/live/mirai.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mirai.app/privkey.pem;

    location / {
        grpc_pass grpc://uptrace:14317;
        grpc_set_header Host $host;
    }
}
```

---

## Grafana Integration

### Datasource Configuration

**File**: `environment/grafana/datasources.yml` (New)

```yaml
apiVersion: 1

datasources:
  # Uptrace as Prometheus data source
  - name: Uptrace
    type: prometheus
    url: http://uptrace:14318/api/prometheus
    access: proxy
    isDefault: false
    jsonData:
      httpMethod: POST
      customQueryParameters: "uptrace-dsn=${UPTRACE_GRAFANA_DSN}"

  # Uptrace as Tempo data source for traces
  - name: Uptrace-Tempo
    type: tempo
    url: http://uptrace:14318/api/tempo
    access: proxy
    isDefault: false
    jsonData:
      httpMethod: GET
      customQueryParameters: "uptrace-dsn=${UPTRACE_GRAFANA_DSN}"
      traceToLogs:
        datasourceUid: "loki"
        tags: ["trace_id", "service.name"]
        spanStartTimeShift: "1h"
        spanEndTimeShift: "1h"
        filterByTraceID: true
        filterBySpanID: false

  # Loki for logs
  - name: Loki
    type: loki
    url: http://loki:3100
    access: proxy
    isDefault: false
    jsonData:
      derivedFields:
        - name: "trace_id"
          matcherRegex: "trace_id=(\w+)"
          url: "$$tempo/explore?left=%7B%22queries%22:%5B%7B%22refId%22:%22A%22,%22queryType%22:%22traceql%22,%22query%22:%22$${__value.raw}%22%7D%5D%7D"
          datasourceUid: "uptrace-tempo"

  # Prometheus for infrastructure metrics
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true
```

### Error Tracking Dashboard

**File**: `environment/grafana/dashboards/error-tracking.json` (New)

```json
{
  "title": "MIRAI Error Tracking",
  "tags": ["uptrace", "errors", "mirai"],
  "panels": [
    {
      "title": "Error Rate",
      "type": "timeseries",
      "datasource": "Uptrace",
      "targets": [
        {
          "expr": "rate(uptrace_tracing_events{service_name=\"mirai-native\",level=\"error\"}[5m])"
        }
      ]
    },
    {
      "title": "Errors by Platform",
      "type": "pie",
      "datasource": "Uptrace",
      "targets": [
        {
          "expr": "uptrace_tracing_events{service_name=\"mirai-native\",level=\"error\"}"
        }
      ]
    },
    {
      "title": "Error Traces",
      "type": "traces",
      "datasource": "Uptrace-Tempo",
      "targets": [
        {
          "query": "{service.name=\"mirai-native\"} | select(status, error=true)"
        }
      ]
    },
    {
      "title": "Error Logs",
      "type": "logs",
      "datasource": "Loki",
      "targets": [
        {
          "expr": "{service_name=\"mirai-native\"} | json | level=\"error\""
        }
      ]
    },
    {
      "title": "Top Error Messages",
      "type": "table",
      "datasource": "Uptrace",
      "targets": [
        {
          "expr": "topk(10, sum by (message) (uptrace_tracing_events{service_name=\"mirai-native\",level=\"error\"}))"
        }
      ]
    }
  ]
}
```

---

## GDPR Compliance Integration

This design aligns with `observability-gdpr-compliance.md`:

### Data Minimization

| Field | Sentry Default | Uptrace Config | GDPR Status |
|-------|---------------|----------------|-------------|
| User IP | Collected | Stripped | ✅ Not collected |
| User Email | Collected | Stripped | ✅ Not collected |
| Device ID | Collected | Hashed | ✅ Pseudonymized |
| User Agent | Full string | Parsed (OS, device) | ✅ Minimized |
| Stack Trace | Full | Full (necessary) | ✅ Legitimate interest |
| Breadcrumbs | Navigation, console | Navigation, console | ✅ Legitimate interest |
| Trace ID | Collected | Preserved (for correlation) | ✅ Legitimate interest |
| Session Replay | Optional | Disabled by default | ✅ Explicit opt-in required |

### Consent UI

**File**: `apps/native/src/components/PrivacySettings.tsx` (New)

```typescript
// Privacy settings screen for GDPR consent
export function PrivacySettings() {
  const [crashReporting, setCrashReporting] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  
  const savePreferences = async () => {
    await AsyncStorage.setItem("privacy_crash_reporting", crashReporting ? "1" : "0");
    await AsyncStorage.setItem("privacy_analytics", analytics ? "1" : "0");
    
    // Update Sentry enabled state
    if (!crashReporting) {
      Sentry.close(); // Disable SDK
    }
  };
  
  return (
    <View>
      <Text>Privacy Settings</Text>
      
      <Switch
        label="Error Reporting (Recommended)"
        description="Anonymous crash reports to help fix bugs"
        value={crashReporting}
        onValueChange={setCrashReporting}
      />
      
      <Switch
        label="Usage Analytics"
        description="Help us understand feature usage"
        value={analytics}
        onValueChange={setAnalytics}
      />
      
      <Button title="Save Preferences" onPress={savePreferences} />
    </View>
  );
}
```

### Retention Policy

Uptrace handles retention automatically via the `retention` config in `uptrace.yml`:

```yaml
retention:
  traces: 30d
  metrics: 30d
  logs: 7d
```

For GDPR compliance:
- **Error traces**: 30 days (sufficient for debugging)
- **Metrics**: 30 days (for trend analysis)
- **Logs**: 7 days (minimal retention)

---

## Source Maps

### EAS Build Integration

**File**: `apps/native/eas.json` (Modified)

```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}",
        "UPTRACE_URL": "https://uptrace.mirai.app"
      }
    }
  }
}
```

### Source Map Upload Script

**File**: `apps/native/scripts/upload-sourcemaps.sh` (New)

```bash
#!/bin/bash
# Upload source maps to Uptrace after EAS build

# Configure sentry-cli for Uptrace
export SENTRY_URL=https://uptrace.mirai.app
export SENTRY_AUTH_TOKEN=$UPTRACE_AUTH_TOKEN

sentry-cli releases new "mirai-native@$1"
sentry-cli releases files "mirai-native@$1" upload-sourcemaps ./dist
sentry-cli releases finalize "mirai-native@$1"
```

---

## Testing & Verification

### Test Plan

| Test | Expected Result |
|------|----------------|
| SDK initialization | `Sentry.init()` completes without errors |
| Error capture | Error appears in Uptrace within 30s |
| Source maps | Stack trace shows original source, not minified |
| Breadcrumbs | Navigation and console logs attached to error |
| GDPR redaction | No PII (email, IP) in Uptrace database |
| Offline queue | Errors queued when offline, sent on reconnect |
| Native crashes | Native crash reported in Uptrace (dev builds) |
| Trace correlation | `trace_id` present in error context |
| **Grafana metrics** | Error rate visible in Grafana dashboard |
| **Grafana traces** | Click trace_id → jump to trace in Grafana |
| **Grafana logs** | Error logs searchable in Grafana |

### Verification Commands

```bash
# 1. Start Uptrace
docker compose -f environment/docker-compose.uptrace.yml up -d

# 2. Verify Uptrace is running
curl http://localhost:14318/health

# 3. Test OTLP ingestion
curl -X POST http://localhost:14318/v1/traces \
  -H "Content-Type: application/json" \
  -H "uptrace-dsn: http://project1_secret_token@localhost:14317/1" \
  -d '{"resourceSpans":[]}'

# 4. Test Sentry error ingestion
curl -X POST http://localhost:14318/api/envelope/ \
  -H "Content-Type: application/x-sentry-envelope" \
  -d '{"dsn":"http://project1_secret_token@localhost:14318/1","event_id":"test123"}'

# 5. Check Grafana dashboards
# Open http://localhost:3000
# - Verify Uptrace Prometheus data source
# - Query: uptrace_tracing_events{service_name="mirai-native"}

# 6. Test trace correlation
# Send error with trace_id in context
# Verify trace appears in Grafana Tempo view
```

---

## Implementation Plan

### Phase 1: SDK Integration (1-2 days)
1. Install `@sentry/react-native` in `apps/native`
2. Create `errorReporting.ts` service with trace correlation
3. Integrate with root layout and error boundaries
4. Add environment variables (note DSN format with project ID)

### Phase 2: Uptrace Deployment (1 day)
1. Add Docker Compose files to `environment/`
2. Configure `uptrace.yml` with ClickHouse + PostgreSQL
3. Set up OpenTelemetry Collector
4. Test local deployment

### Phase 3: Grafana Integration (1 day)
1. Add Uptrace as Prometheus data source in Grafana
2. Add Uptrace as Tempo data source for traces
3. Create error tracking dashboard
4. Test trace-error correlation

### Phase 4: GDPR Compliance (1 day)
1. Add privacy settings screen
2. Implement PII redaction in `beforeSend`
3. Add consent storage in AsyncStorage
4. Configure retention in `uptrace.yml`

### Phase 5: Source Maps (1 day)
1. Configure Metro for Sentry
2. Set up EAS build secrets
3. Create source map upload script
4. Test symbolicated stack traces

### Phase 6: Production Deployment (1 day)
1. Deploy Uptrace to production server
2. Configure ClickHouse + PostgreSQL backend
3. Set up SSL and DNS
4. Test end-to-end error flow
5. Verify Grafana correlation

---

## Rollback Plan

If issues arise:
1. **Immediate**: Set `enabled: false` in Sentry.init() to disable SDK
2. **Short-term**: Remove `@sentry/react-native` from `app.json` plugins
3. **Full**: Revert all changes, restore original `_layout.tsx`

---

## Additional Considerations

### Bundle Size Impact
- `@sentry/react-native`: ~403KB minified
- Uptrace is backend-only, no SDK bundle impact
- Consider tree-shaking unused Sentry features

### Performance Impact
- Error capture: Negligible (~1ms)
- Event upload: Async, non-blocking
- Session replay: Resource-intensive (disable in Expo Go)
- Breadcrumbs: Minimal overhead
- OTLP export: Background batch, no user impact

### Security
- DSN is public-safe (only ingestion, no admin access)
- Use `beforeSend` to sanitize all events
- Rotate Uptrace project tokens periodically
- Encrypt OTLP traffic with TLS in production
- Restrict Uptrace UI access to VPN/internal network

### Uptrace Limitations
- Sentry SDK support is newer (improving based on feedback)
- Some advanced Sentry features may not be available
- Uptrace's own UI is available but optional (use Grafana)

---

## References

1. **Uptrace Documentation**: https://uptrace.dev
2. **Uptrace GitHub**: https://github.com/uptrace/uptrace
3. **Sentry SDK for Uptrace**: https://uptrace.dev/ingest/sentry
4. **Uptrace Grafana Integration**: https://uptrace.dev/features/grafana
5. **Sentry React Native**: https://docs.sentry.io/platforms/react-native/
6. **Expo Sentry Guide**: https://docs.expo.dev/guides/using-sentry/
7. **GDPR Compliance Plan**: `.specs/plans/observability-gdpr-compliance.md`
8. **OpenTelemetry Plan**: `.specs/plans/opentelemetry-telemetry-integration.md`
9. **OpenTelemetry Collector**: https://opentelemetry.io/docs/collector/
10. **Grafana Tempo**: https://grafana.com/docs/tempo/
11. **Grafana Loki**: https://grafana.com/docs/loki/

---

*Design created: 2026-06-04*
*Updated: 2026-06-04 — Switched to Uptrace for Grafana-native unified observability*
*Status: Ready for implementation*
