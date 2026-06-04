# Observability & GDPR Compliance Analysis for MIRAI Monorepo

> **Scope:** Cross-stack error/warning correlation and GDPR-compliant telemetry for the MIRAI/PJApp monorepo.
> **Date:** 2026-06-04
> **Sources:** GDPR (EU) 2016/679, EDPB Guidelines 1/2024, 5/2020, 4/2019, 2/2023, OpenTelemetry Docs, CNIL Recommendations

---

## Executive Summary

The MIRAI monorepo currently has **no cross-stack error correlation** and **no GDPR-compliant telemetry**. The legacy `user_agents` table stores raw user agents in the database without consent mechanisms. This document provides a compliance roadmap based on official EU regulatory guidance and OpenTelemetry best practices.

**Key Findings:**
- No correlation IDs, trace IDs, or request IDs exist anywhere in the stack
- No crash reporting (Sentry is commented out as a TODO in native app)
- Raw user agents stored in PostgreSQL without consent or retention policy
- No Legitimate Interests Assessment (LIA) for operational telemetry
- No data processing agreement documentation for telemetry backends

---

## 1. GDPR Requirements for Telemetry

### 1.1 Legal Basis for Operational Telemetry

Under GDPR Article 6, processing telemetry data requires a valid legal basis. For MIRAI, the applicable bases are:

| Telemetry Type | Legal Basis | Justification | User Action Required |
|---------------|-------------|---------------|---------------------|
| **Operational stability** (error tracking, basic performance metrics) | **Legitimate Interest** (Art. 6(1)(f)) | Necessary to ensure the service functions; EDPB Guidelines 1/2024 | Must provide **opt-out** mechanism |
| **Crash reporting** (stack traces, exception types) | **Legitimate Interest** (Art. 6(1)(f)) | Necessary to diagnose critical failures; data minimization applies | Must provide **opt-out** mechanism |
| **User agent / device fingerprinting** | **Consent** (Art. 6(1)(a)) | Not strictly necessary for service delivery; ePrivacy Directive Art. 5(3) | Requires **active opt-in** |
| **Location data in telemetry** | **Consent** (Art. 6(1)(a)) | Location is personal data; ePrivacy Directive requires consent | Requires **active opt-in** |
| **Analytics / behavioral metrics** | **Consent** (Art. 6(1)(a)) | Not necessary for service delivery; EDPB Guidelines 5/2020 | Requires **active opt-in** |

**Critical: EDPB Guidelines 1/2024** establishes a three-part test for legitimate interest:
1. **Purpose test**: Is there a legitimate interest? (Yes: ensuring service reliability)
2. **Necessity test**: Is processing strictly necessary and proportionate? (Yes for basic error tracking; No for user agents)
3. **Balancing test**: Does the controller's interest override the user's rights? (Depends on data minimization)

**For MIRAI specifically**: Raw user agents **cannot** rely on legitimate interest. They are personal data under GDPR Recital 30 and are used for fingerprinting. They must either:
- Be dropped entirely (recommended)
- Be parsed into non-identifying derivatives (browser family, OS, major version)
- Require explicit consent if collected

### 1.2 Data Minimization (GDPR Art. 5(1)(c))

EDPB Guidelines 4/2019 on Data Protection by Design and by Default mandates that data minimization be applied at the **collection stage**.

**What MIRAI currently collects (in `user_agents` table):**
- `userAgent` string (full device fingerprint) — **over-collection**
- `platform` (ios/android) — **acceptable if needed for debugging**
- `endpoint` (API path) — **acceptable if anonymized**
- `userId` (foreign key to users) — **requires consent or legitimate interest assessment**
- `timestamp` — **acceptable**

**What should be collected instead:**
- Parsed device family (e.g., "iPhone", "Android") — not the full user agent
- OS family and major version (e.g., "iOS 17", "Android 14")
- App version (already known)
- API route pattern (e.g., `GET /api/trips/:id`) — not the actual ID
- HTTP status code
- Response duration
- Error type (if applicable)
- **No user ID, no raw user agent, no IP address**

### 1.3 Consent Requirements (EDPB Guidelines 5/2020)

For telemetry that requires consent:

- **Freely given**: App must function if user declines non-essential telemetry
- **Specific**: Granular toggles for different purposes (crash reporting vs. analytics)
- **Informed**: Clear explanation of what data is collected and why
- **Unambiguous**: Active opt-in (no pre-ticked boxes)
- **Demonstrable**: Record consent choices for audit trail
- **Withdrawable**: Must be as easy to withdraw as to give

**Recommended UI for MIRAI Native:**
```
Privacy Settings (accessible from Profile menu)
├── Operational Data (recommended ON)
│   └── [ON] Error reporting & performance metrics
│       "Anonymous data to help us fix bugs and keep the app running smoothly"
├── Analytics (optional)
│   └── [OFF] Usage statistics
│       "Help us understand how features are used to improve the app"
└── [Save Preferences]
```

### 1.4 Data Retention (GDPR Art. 5(1)(e))

| Telemetry Type | Max Retention | Justification |
|---------------|---------------|---------------|
| Detailed traces/logs | 14-30 days | Sufficient for debugging |
| Error traces | 30-90 days | Root-cause analysis |
| Security/audit logs | 6-12 months | Legal obligation for security |
| Aggregated metrics (counts, rates) | Indefinite | Not personal data if anonymized |
| Raw user agents | **Should not be collected** | N/A |

**Implementation**: Automated TTL/deletion via backend scheduler or database cron job.

### 1.5 Anonymization and Pseudonymization

| Technique | Application | GDPR Status |
|-----------|-------------|-------------|
| **Hashing with salt** (HMAC-SHA256) | Replace user IDs in telemetry | Pseudonymization (still personal data) |
| **IP truncation** | Drop last octet or don't collect | Better; may still be personal data |
| **URL sanitization** | Strip query parameters | Data minimization |
| **On-device aggregation** | Send counts, not events | Strongest privacy protection |

**Warning**: Simple hashing of low-entropy values (numeric IDs) is reversible via rainbow tables. Use HMAC with a secret salt.

### 1.6 Data Residency and Third-Party Processors

- If using managed observability SaaS (Datadog, New Relic, Grafana Cloud), ensure **EU data residency** and a **Data Processing Agreement (DPA)**
- Document all subprocessors in the privacy notice (GDPR Art. 13/14)
- If self-hosting (Prometheus, Tempo, Loki), host in EU regions

---

## 2. Current Error/Warning Correlation Gaps

### 2.1 Backend (apps/backend-server)

**File:** `apps/backend-server/src/server.ts`

```typescript
// Current: Pino logger imported, but no trace IDs
const { logger } = await import("@mirai-app/orpc");

// Error handling: logs error, throws generic ORPCError
.onError((error) => {
  logger.error(error, "Internal error in RPC WebSocket handler");
  if (process.env.NODE_ENV === "production") {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { cause: error });
  }
  throw error;
})
```

**Gaps:**
- No `x-request-id` or `trace-id` middleware in Hono
- No correlation ID in oRPC context
- Error logs have no trace ID to correlate with client-side errors

### 2.2 oRPC (packages/orpc)

**Files:** `packages/orpc/src/api/trpc.ts`, `packages/orpc/src/utils/logger.ts`

```typescript
// Current: Auth middleware catches errors, maps to ORPCError
const protectedProcedure = authMiddleware(
  base.procedure.use(mobileAppMiddleware),
);

// Current: Pino logger with name "@mirai-app/orpc", level from LOG_LEVEL env
export const logger = pino({
  name: "@mirai-app/orpc",
  level: process.env.LOG_LEVEL || "info",
  // No trace_id mixin
});
```

**Gaps:**
- No trace ID in oRPC context
- No trace ID in client request headers (HTTP or WebSocket `connectionParams`)
- No trace ID in error responses
- `mobileAppMiddleware` does fire-and-forget user agent INSERT (to be removed)

### 2.3 Native App (apps/native)

**Files:** `apps/native/src/app/_layout.tsx`, `apps/native/src/services/QueryProvider.tsx`

```typescript
// Current: oRPC client with no trace propagation
const client = createORPCClient({
  link: wsLink({
    url: `${EXPO_PUBLIC_API_URL}/api/trpc`,
    connectionParams: { authToken },
    // No traceparent, no trace-id
  }),
});

// Current: TODO comment for Sentry
// TODO: Add Sentry crash reporting for production errors
```

**Gaps:**
- No Sentry installed (only a TODO comment)
- No trace ID generation in native app
- No trace ID passed to backend
- No structured error correlation
- Errors caught and either shown via `Alert.alert()` or silently swallowed

### 2.4 Shared Packages (packages/shared)

**Files:** `packages/shared/src/utils/logger.ts`

```typescript
// Current: Pino logger with no correlation utilities
export const logger = pino({
  name: "@mirai-app/shared",
  level: process.env.LOG_LEVEL || "info",
});
```

**Gaps:**
- No shared correlation ID generation
- No trace ID utilities
- No shared error format with trace context

### 2.5 Auth (packages/auth)

**Files:** `packages/auth/src/authServer.ts`

```typescript
// Current: Auth errors logged with Pino, but no trace context
logger.error(error, "Error occurred while fetching user");

// Current: AuthenticationError and AuthorizationError extend Error
export class AuthenticationError extends Error {
  constructor(message: string = "Authentication failed") {
    super(message);
  }
}
```

**Gaps:**
- Auth errors carry no trace context
- No way to correlate auth failures with client-side errors

### 2.6 Notification Sender (apps/notification-sender)

**Files:** `apps/notification-sender/src/index.ts`

```typescript
// Current: Logs errors with Pino, but no trace IDs
logger.error(error, "Failed to handle notification");
```

**Gaps:**
- No trace ID propagation in service-to-service calls
- No way to correlate notification failures with backend errors

---

## 3. Recommended Cross-Stack Error Correlation

### 3.1 Architecture: Trace ID Propagation

```
Native App (Expo/React Native)
  ├─ Generate trace ID per request/action
  ├─ Include trace ID in:
  │   ├─ HTTP headers: `x-trace-id: <uuid>`
  │   ├─ WebSocket connectionParams: `{ authToken, traceId }`
  │   └─ Error reports: attach trace ID to Sentry/crash reporter
  │
  ↓ Backend Server (Hono)
    ├─ Hono middleware: extract `x-trace-id` from headers
    ├─ Store trace ID in AsyncLocalStorage / Hono context
    ├─ Pino logger: auto-inject trace_id via mixin
    ├─ oRPC context: pass trace ID to all procedures
    ├─ Errors: include trace_id in ORPCError metadata
    │
    ↓ oRPC Routers
      ├─ Database queries: trace ID logged via @kubiks/otel-drizzle
      ├─ Auth errors: trace ID included in error response
      ├─ Business errors: trace ID included in error response
      │
      ↓ Notification Sender
        ├─ Receive trace ID from backend
        ├─ Log notification failures with trace ID
        └─ Correlate with backend traces
```

### 3.2 Implementation Files

| Layer | File | Change |
|-------|------|--------|
| **Shared** | `packages/shared/src/utils/traceId.ts` | **New** — `generateTraceId()`, `getTraceId()`, `setTraceId()` using AsyncLocalStorage |
| **Shared** | `packages/shared/src/utils/correlatedError.ts` | **New** — `CorrelatedError` class with `traceId` field |
| **oRPC Context** | `packages/orpc/src/api/trpc.ts` | Add `traceId` to context; extract from headers/connectionParams |
| **oRPC Client** | `packages/orpc/src/client/vanilia.ts` | Add `x-trace-id` header to HTTP requests; add `traceId` to WebSocket connectionParams |
| **oRPC Logger** | `packages/orpc/src/utils/logger.ts` | Add `trace_id` to Pino mixin via AsyncLocalStorage |
| **Backend Middleware** | `apps/backend-server/src/server.ts` | Add Hono middleware to extract/generate `x-trace-id` |
| **Backend Server** | `apps/backend-server/src/server.ts` | Pass trace ID to oRPC context |
| **Auth** | `packages/auth/src/authServer.ts` | Include `traceId` in `AuthenticationError` and `AuthorizationError` |
| **Native App** | `apps/native/src/services/QueryProvider.tsx` | Generate trace ID per request, pass in headers/connectionParams |
| **Native App** | `apps/native/src/services/errorReporting.ts` | **New** — Sentry init with trace ID correlation (or custom reporter) |

### 3.3 Code Examples

**Trace ID Utilities (packages/shared):**
```typescript
// packages/shared/src/utils/traceId.ts
import { AsyncLocalStorage } from "async_hooks";

const traceIdStorage = new AsyncLocalStorage<string>();

export function generateTraceId(): string {
  return crypto.randomUUID();
}

export function getTraceId(): string | undefined {
  return traceIdStorage.getStore();
}

export function setTraceId<T>(traceId: string, fn: () => T): T {
  return traceIdStorage.run(traceId, fn);
}
```

**Pino Logger with Trace ID (packages/orpc):**
```typescript
// packages/orpc/src/utils/logger.ts
import { getTraceId } from "@mirai-app/shared";

export const logger = pino({
  name: "@mirai-app/orpc",
  level: process.env.LOG_LEVEL || "info",
  mixin() {
    const traceId = getTraceId();
    return traceId ? { trace_id: traceId } : {};
  },
});
```

**Hono Middleware (apps/backend-server):**
```typescript
// apps/backend-server/src/server.ts
import { setTraceId, getTraceId, generateTraceId } from "@mirai-app/shared";

app.use(async (c, next) => {
  const traceId = c.req.header("x-trace-id") || generateTraceId();
  c.set("traceId", traceId);
  await setTraceId(traceId, next);
});
```

**oRPC Context with Trace ID (packages/orpc):**
```typescript
// packages/orpc/src/api/trpc.ts
export const createTRPCContext = async (opts: {
  headers: Headers;
  connectionParams?: { authToken?: string; traceId?: string };
}) => {
  const traceId = opts.connectionParams?.traceId || opts.headers.get("x-trace-id") || generateTraceId();
  // ... rest of context creation
  return { traceId, /* ... */ };
};
```

**Native Client with Trace ID (apps/native):**
```typescript
// apps/native/src/services/QueryProvider.tsx
import { generateTraceId } from "@mirai-app/shared";

const traceId = generateTraceId();

const client = createORPCClient({
  link: wsLink({
    url: `${EXPO_PUBLIC_API_URL}/api/trpc`,
    connectionParams: { authToken, traceId },
  }),
});

// For HTTP requests
const httpClient = createORPCClient({
  link: httpLink({
    url: `${EXPO_PUBLIC_API_URL}/api/trpc`,
    headers: () => ({
      Authorization: `Bearer ${authToken}`,
      "x-trace-id": generateTraceId(),
    }),
  }),
});
```

---

## 4. GDPR-Compliant Telemetry Implementation

### 4.1 Phase 1: Immediate (Compliance Critical)

1. **Document Legitimate Interests Assessment (LIA)**
   - Purpose: Operational stability, error diagnosis, security
   - Necessity: What telemetry is strictly necessary vs. optional
   - Balancing: Why user's rights are not overridden
   - Store in: `docs/compliance/telemetry-lia.md`

2. **Update Privacy Notice**
   - List all telemetry data collected
   - State legal basis for each type
   - Explain retention periods
   - List subprocessors (if any)
   - Describe user rights (opt-out, erasure)

3. **Stop Collecting Raw User Agents**
   - Drop `user_agents` table (DB schema change)
   - Remove `mobileAppMiddleware` from `packages/orpc/src/api/trpc.ts`
   - If user agent data is needed, parse into non-identifying derivatives:
     ```typescript
     // Parse user agent into safe fields
     const { browser, os, device } = parseUserAgent(rawUserAgent);
     // Store only: browser.family, os.family, device.type
     // Drop: rawUserAgent string, browser.version, os.version
     ```

4. **Implement Consent UI**
   - Add "Privacy Settings" screen in native app
   - Granular toggles: crash reporting (default ON), analytics (default OFF)
   - Store consent in AsyncStorage/SecureStore
   - Sync consent state to backend for audit trail

5. **Implement Data Retention**
   - 14-30 days for detailed traces/logs
   - 30-90 days for error traces
   - Indefinite for aggregated metrics (anonymized)
   - Automated deletion via backend scheduler

### 4.2 Phase 2: Short-Term (Observability Foundation)

1. **Add Trace ID Correlation**
   - Implement `packages/shared/src/utils/traceId.ts`
   - Add Hono middleware to extract/generate `x-trace-id`
   - Add `traceId` to oRPC context
   - Pass `traceId` in native app client headers/connectionParams
   - Add `trace_id` to Pino logger output

2. **Add Error Correlation**
   - Include `traceId` in `ORPCError` metadata
   - Include `traceId` in `AuthenticationError` and `AuthorizationError`
   - Return `traceId` in error responses to client
   - Log client-side errors with matching `traceId`

3. **Add PII Redaction**
   - Pino logger: redact `authorization`, `cookie`, `password`, `email` fields
   - oRPC client: strip `traceId` from public error responses
   - Error boundaries: redact user data before crash reporting

### 4.3 Phase 3: Medium-Term (Full Observability)

1. **Implement OpenTelemetry**
   - Add `@hono/otel` middleware for HTTP tracing
   - Add `@kubiks/otel-drizzle` for database query tracing
   - Add `@opentelemetry/instrumentation-pino` for log correlation
   - Use `@opentelemetry/sdk-trace-node` + `@opentelemetry/sdk-metrics` (Bun-compatible)
   - Add `react-native-otel` for native app trace propagation

2. **Add Crash Reporting**
   - Install `@sentry/react-native` (or similar) in native app
   - Configure `beforeSend` to redact PII
   - Include `traceId` in crash reports
   - Set up Sentry backend integration for error correlation

3. **Add Grafana Dashboards**
   - Error rate by endpoint
   - Error rate by platform (iOS vs Android)
   - Trace search by `traceId`
   - Slow request traces
   - PII leakage audit (search for email patterns in logs)

### 4.4 Phase 4: Ongoing (Compliance Maintenance)

1. **Quarterly Audit**
   - Search telemetry data for PII leakage
   - Review ROPA (Record of Processing Activities)
   - Verify retention policies are enforced
   - Check consent withdrawal requests

2. **DSAR Support**
   - Implement endpoint to retrieve all telemetry data for a user by `userId` hash
   - Implement endpoint to delete all telemetry data for a user
   - Document process in privacy notice

---

## 5. Record of Processing Activities (ROPA)

| Field | Entry |
|-------|-------|
| **Purpose** | Operational stability, error diagnosis, security monitoring, performance optimization |
| **Legal basis** | Legitimate Interest (Art. 6(1)(f)) for operational data; Consent (Art. 6(1)(a)) for analytics |
| **Data categories** | Error traces (stack traces, route patterns), performance metrics (duration, status code), parsed device info (browser family, OS family), hashed user IDs |
| **Data subjects** | App users (students participating in integration trips) |
| **Retention period** | Error traces: 30 days; Performance logs: 14 days; Aggregated metrics: indefinite; Security logs: 6 months |
| **Technical measures** | SDK-level redaction, PII hashing, TLS 1.3, encryption at rest, automated TTL deletion |
| **Subprocessors** | Self-hosted: Prometheus, Grafana, Tempo, Loki (EU-hosted) |
| **LIA document** | `docs/compliance/telemetry-lia.md` |

---

## 6. References

1. **GDPR Regulation (EU) 2016/679**: [Official Text](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679)
2. **EDPB Guidelines 1/2024 on Legitimate Interests**: [PDF](https://www.edpb.europa.eu/system/files/2026-03/spe-oss-case-digest-legitimate-interest_en.pdf)
3. **EDPB Guidelines 5/2020 on Consent**: [PDF](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb%5Fguidelines%5F202005%5Fconsent%5Fen.pdf)
4. **EDPB Guidelines 4/2019 on Data Protection by Design and by Default**: [PDF](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_201904_dataprotection_by_design_and_by_default_v2.0_en.pdf)
5. **EDPB Guidelines 2/2023 on ePrivacy Directive Art. 5(3)**: [PDF](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf)
6. **OpenTelemetry: Handling Sensitive Data**: [Docs](https://opentelemetry.io/docs/security/handling-sensitive-data/)
7. **CNIL Recommendations on Mobile Apps**: [PDF](https://cnil.fr/sites/default/files/2025-05/recommendation-mobiles-app.pdf)

---

**Disclaimer**: This document provides technical implementation guidance based on publicly available regulatory requirements. It does not constitute legal advice. For definitive legal interpretation, consult a qualified data protection attorney or your supervisory authority.
