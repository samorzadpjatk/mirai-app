# Data Retention Policies

This document defines how long each table keeps data, when to delete or archive it, and how cleanup jobs should run. All policies are application-level decisions, not database triggers.

## Table-by-Table Retention Rules

| Table | Retention Period | Action | Rationale |
|-------|-----------------|--------|-----------|
| `notification_pushes` | 90 days | Hard delete | Push tokens and delivery metadata are ephemeral. After 90 days they have no operational or debugging value. |
| `activity_feeds` | Until trip end + 1 year | Archive, then delete after 2 years total | Activity feeds are tied to a trip lifecycle. Keep them for one year after the trip ends for user reference, then archive. Delete archived records after a second year. |
| `coin_transactions` | Indefinite | Never delete | Financial records must be preserved for audit, tax, and legal purposes. Deletion is prohibited. |
| `audit_logs` | 2 years | Archive to cold storage | Audit logs support security investigations and compliance. After 2 years, move to append-only cold storage (e.g., S3/Supabase Storage) with read-only access. |

### Detailed Policy Definitions

#### `notification_pushes`

- **Retention**: 90 days from `created_at`.
- **Action**: Hard delete rows older than 90 days.
- **Scope**: Includes both successful and failed push attempts. Expo push receipts may be retained separately by Expo for 30 days; we do not rely on that external retention.
- **GDPR relevance**: Low. Push tokens are not personally identifying on their own, but they link to a device. Deletion within 90 days is well within reasonable bounds.

#### `activity_feeds`

- **Retention**: Active while the trip is ongoing. After `trips.end_date`, keep for 1 additional year.
- **Action**: After 1 year post-trip, set `archived_at = now()` and move to a separate `activity_feeds_archive` table (same schema, no relations). Delete from the archive after another year (2 years total post-trip).
- **Scope**: All feed entries for a trip are treated as a single unit. Do not partially archive a trip's feed.
- **GDPR relevance**: Moderate. Activity feeds may contain user-generated content (text, photos). Users may request deletion under GDPR Article 17. Honor deletion requests immediately, bypassing the retention schedule.

#### `coin_transactions`

- **Retention**: Permanent.
- **Action**: None. Rows are never deleted, updated, or backdated.
- **Scope**: All coin transaction types (earn, spend, transfer, refund).
- **GDPR relevance**: High. Financial data is exempt from erasure requests under GDPR Article 17(3)(b) (legal obligation for compliance with a legal obligation). Document the exemption in the privacy policy.

#### `audit_logs`

- **Retention**: 2 years in the primary database.
- **Action**: After 2 years, export to cold storage (JSONL or Parquet in S3/Supabase Storage) and delete from the primary database. Cold storage is append-only and read-only.
- **Scope**: All audit actions (CREATE, UPDATE, DELETE) across all tables.
- **GDPR relevance**: Low. Audit logs are a legitimate interest for security and compliance (GDPR Article 6(1)(f)). Retention beyond 2 years requires a documented justification.

## Cleanup Job Implementation Notes

### Architecture

Cleanup jobs run as **application-level scheduled functions**, not PostgreSQL triggers or cron expressions inside the database. This keeps the database agnostic of business scheduling and allows the application to handle errors, retries, and observability.

### Recommended Implementation

1. **Scheduled Function in `apps/backend-server`**
   - Use a lightweight scheduler (e.g., `node-cron` or `bree`) inside the Hono server.
   - Run daily at 02:00 UTC (low-traffic window).
   - Each table has its own cleanup function to isolate failures.

2. **Idempotency**
   - Cleanup jobs must be idempotent. Running the same job twice must not cause errors or double-delete.
   - Use `DELETE ... WHERE created_at < NOW() - INTERVAL '...'` with a stable time boundary, not `NOW()` per row.

3. **Batching**
   - Delete or archive in batches of 1,000 rows to avoid long-running transactions and table locks.
   - Sleep 100ms between batches to yield to application traffic.

4. **Observability**
   - Log start, end, and row count for each cleanup job using Pino.
   - Emit a metric (e.g., `cleanup.notification_pushes.deleted_rows`) to your observability stack.
   - Alert if a job fails or if the row count exceeds a threshold (e.g., >50,000 rows in one run indicates a backlog).

5. **Failure Handling**
   - If a batch fails, retry up to 3 times with exponential backoff.
   - If all retries fail, stop the job for that table and alert. Do not proceed to the next table to avoid cross-contamination.

### Example Cleanup Function Skeleton

```typescript
// apps/backend-server/src/jobs/cleanupNotificationPushes.ts
import { db } from "@mirai-app/db";
import { notificationPushes } from "@mirai-app/db/schema";
import { lt } from "drizzle-orm";

const RETENTION_DAYS = 90;
const BATCH_SIZE = 1000;

export async function cleanupNotificationPushes() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  let deleted = 0;
  while (true) {
    const batch = await db
      .delete(notificationPushes)
      .where(lt(notificationPushes.createdAt, cutoff))
      .returning({ id: notificationPushes.id });

    if (batch.length === 0) break;
    deleted += batch.length;
    if (batch.length < BATCH_SIZE) break;
    await sleep(100);
  }

  logger.info({ deleted, table: "notification_pushes" }, "Cleanup complete");
}
```

### Scheduling

```typescript
// apps/backend-server/src/jobs/scheduler.ts
import { schedule } from "node-cron";
import { cleanupNotificationPushes } from "./cleanupNotificationPushes";
import { cleanupActivityFeeds } from "./cleanupActivityFeeds";
import { archiveAuditLogs } from "./archiveAuditLogs";

schedule("0 2 * * *", async () => {
  await cleanupNotificationPushes();
  await cleanupActivityFeeds();
  await archiveAuditLogs();
});
```

## GDPR Compliance Notes

### Right to Erasure (Article 17)

- Users may request deletion of their personal data.
- **Immediate deletion**: `notification_pushes`, `activity_feeds` (unless exempt), `locations`, `location_shares`, `user_sessions`.
- **Exempt from erasure**: `coin_transactions` (legal obligation), `audit_logs` (legitimate interest for security, but redact identifiable fields if required by law).
- **Procedure**: When a deletion request is received, run a manual or automated "right to erasure" job that bypasses the standard retention schedule.

### Data Minimization (Article 5(1)(c))

- Retention periods are set to the minimum necessary for the stated purpose.
- `notification_pushes` at 90 days is sufficient for debugging delivery issues.
- `activity_feeds` at 1 year post-trip balances user experience against storage cost.

### Storage Limitation (Article 5(1)(e))

- Data is not kept longer than necessary. The retention matrix above is the authoritative source.
- Any extension of a retention period requires a documented justification and privacy team approval.

### Transparency

- The privacy policy must list each data category, its retention period, and the reason.
- Users must be informed that financial data is retained indefinitely for legal compliance.

## Audit Trail Preservation Rules

### What Must Never Be Deleted

| Data | Reason |
|------|--------|
| `coin_transactions` | Financial audit, tax compliance, fraud investigation |
| `audit_logs` (cold storage) | Security incident response, compliance audits |
| `users` (soft-delete only) | Referential integrity for financial and audit records |

### Soft Delete for Users

- When a user requests account deletion, do not hard-delete the `users` row.
- Instead, anonymize: set `email = NULL`, `name = 'Deleted User'`, `avatar_url = NULL`, and set `deleted_at = NOW()`.
- Keep the `users.id` UUID to preserve foreign key relationships in `coin_transactions` and `audit_logs`.

### Audit Log Integrity

- Audit logs must be append-only. Never update an existing audit log row.
- After archiving to cold storage, compute a checksum (SHA-256) for each archive file and store it in a separate integrity log.
- Cold storage must be read-only. Use object storage with bucket policies that deny `DELETE` and `PUT` on archived objects.

### Cross-Border Transfer

- If cold storage is in a different jurisdiction (e.g., EU data in US S3), document the transfer mechanism (Standard Contractual Clauses or adequacy decision) in the Data Processing Agreement.

## Review and Updates

- Review this document quarterly or after any schema change that introduces a new table with user data.
- Updates require approval from the privacy team and a corresponding update to the privacy policy.
