# Better Auth Migration Runbook

This runbook provides step-by-step procedures for deploying the Better Auth migration to production.

## Overview

This runbook covers the production deployment of the Better Auth authentication system, migrating from Supabase Auth. The migration uses a **Strangler Fig Pattern** with dual-run capability for zero-downtime transition.

## Prerequisites

Before starting production deployment:

- [ ] Staging environment tested and validated
- [ ] Security audit passed (see Step 4.3)
- [ ] Performance tests passed (p95 < 500ms)
- [ ] Database backups created
- [ ] Rollback procedures tested in staging
- [ ] Monitoring and alerting configured
- [ ] Team notified of deployment window

## Deployment Phases

### Phase 0: Pre-Deployment (Day -1)

#### Database Preparation

```bash
# 1. Create database backup
pg_dump $DATABASE_URL > backups/pre-auth-migration-$(date +%Y%m%d).sql

# 2. Verify backup integrity
pg_restore --list backups/pre-auth-migration-$(date +%Y%m%d).sql | head -20

# 3. Apply Better Auth schema migrations
cd packages/frameworks
npx drizzle-kit migrate
```

#### Environment Configuration

Verify production environment variables:

```bash
# Required variables
BETTER_AUTH_SECRET=<32-char-secret-from-vault>
BETTER_AUTH_URL=https://api.mirai.app
USE_BETTER_AUTH=false  # Start with Supabase Auth
SUPABASE_URL=<existing-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<existing-key>
```

**Important**: `USE_BETTER_AUTH=false` initially to ensure safe rollout.

#### Feature Flag Setup

Configure feature flag in your flag service (e.g., LaunchDarkly, Unleash):

```json
{
  "flag": "use-better-auth",
  "default": false,
  "environments": {
    "production": {
      "enabled": false,
      "targeting": []
    }
  }
}
```

---

### Phase 1: Deploy Better Auth Infrastructure (Day 1)

#### 1.1 Deploy New Code

```bash
# Deploy backend with Better Auth support (but disabled)
git checkout main
git pull origin main
git tag deploy-better-auth-phase1-$(date +%Y%m%d)
git push origin deploy-better-auth-phase1-$(date +%Y%m%d)

# Deploy to production
./scripts/deploy-production.sh
```

#### 1.2 Verify Deployment

```bash
# Health check
curl https://api.mirai.app/health

# Verify Better Auth endpoints exist (but not active)
curl https://api.mirai.app/api/auth/get-session
# Expected: 401 or empty session (not 404)

# Verify GraphQL endpoint moved
curl -X POST https://api.mirai.app/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

#### 1.3 Monitoring Setup

Verify these dashboards are active:

1. **Auth Endpoint Latency**: p95 response times for `/api/auth/*`
2. **Auth Error Rate**: 4xx/5xx responses from auth endpoints
3. **Session Validation**: Success/failure rates for session checks
4. **Database Connections**: Pool usage for Better Auth tables

Set alerts for:
- Auth error rate > 0.1%
- p95 latency > 500ms
- Database connection pool > 80% utilization

---

### Phase 2: Gradual Rollout (Days 2-7)

#### 2.1 Enable for Internal Users (Day 2)

```bash
# Enable for team members only
curl -X PATCH https://api.mirai.app/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "flag": "use-better-auth",
    "targeting": {
      "users": ["team-member-1@mirai.app", "team-member-2@mirai.app"]
    }
  }'
```

#### 2.2 Monitor and Validate (Days 2-3)

Check these metrics every 2 hours:

| Metric | Check Command | Threshold |
|--------|---------------|-----------|
| Error Rate | `sum(rate(auth_errors[5m])) / sum(rate(auth_requests[5m]))` | < 0.1% |
| Latency | `histogram_quantile(0.95, rate(auth_latency[5m]))` | < 500ms |
| Session Validations | `rate(session_validation_success[5m])` | > 99.9% |

**Decision Gate**: If metrics exceed thresholds for > 10 minutes, proceed to [Rollback Procedure](#rollback-procedure).

#### 2.3 Expand to Beta Users (Day 4)

```bash
# Enable for 5% of users
curl -X PATCH https://api.mirai.app/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "flag": "use-better-auth",
    "percentage": 5,
    "targeting": {
      "exclude": ["high-risk-users@mirai.app"]
    }
  }'
```

#### 2.4 Monitor Beta (Days 4-5)

Watch for:
- User complaints about auth issues
- Failed login attempts
- Migration flow completion rates

#### 2.5 Gradual Expansion (Days 5-7)

Increase rollout percentage:

| Day | Percentage | Users |
|-----|------------|-------|
| 5   | 10%        | ~1,000 |
| 6   | 25%        | ~2,500 |
| 7   | 50%        | ~5,000 |

Between each increase, monitor for 4 hours minimum before next step.

---

### Phase 3: User Migration (Days 8-21)

#### 3.1 Migration Trigger

Users are automatically migrated when they:
1. Log in with existing Supabase credentials
2. Request password reset
3. Trigger OTP sign-in

#### 3.2 Monitor Migration Progress

```sql
-- Query migration status
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN auth_provider = 'better-auth' THEN 1 END) as migrated,
  COUNT(CASE WHEN auth_provider = 'supabase' THEN 1 END) as pending
FROM user_migration_status;
```

Target: 100% migration within 14 days.

#### 3.3 Handle Migration Failures

If a user fails migration:

```bash
# Check logs for specific user
grep "migration_failed" /var/log/mirai/auth.log | grep "user@example.com"

# Manual retry via admin API
curl -X POST https://api.mirai.app/admin/migration/retry \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"email": "user@example.com"}'
```

---

### Phase 4: Full Cutover (Day 22+)

#### 4.1 Verify 100% Migration

```sql
-- Confirm all users migrated
SELECT 
  (COUNT(CASE WHEN auth_provider = 'better-auth' THEN 1 END) * 100.0 / COUNT(*)) as migration_percentage
FROM user_migration_status;
```

Result must be 100% before proceeding.

#### 4.2 Enable 100% Better Auth

```bash
# Remove feature flag (all traffic to Better Auth)
curl -X PATCH https://api.mirai.app/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "flag": "use-better-auth",
    "percentage": 100,
    "targeting": {}
  }'
```

#### 4.3 Disable Supabase Auth Routes

Update environment:

```bash
# Remove Supabase Auth routes from active handling
# (Keep Supabase client for database - storage now uses SeaweedFS, realtime uses Redis)
SUPABASE_AUTH_ENABLED=false
```

#### 4.4 Monitor for 48 Hours

Watch closely:
- Auth success rate (target: > 99.9%)
- Session validation failures (target: < 0.1%)
- User support tickets related to auth

---

## Rollback Procedure

### Immediate Rollback (Emergency)

If critical issues arise:

```bash
# Step 1: Disable Better Auth (instant)
curl -X PATCH https://api.mirai.app/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "use-better-auth", "enabled": false}'

# Step 2: Verify rollback
# All new auth requests should route to Supabase Auth
# Check logs for "supabase_auth" entries resuming

# Step 3: Communicate
curl -X POST https://hooks.slack.com/services/... \
  -d '{"text": "Auth rollback completed. Investigating issues."}'
```

**Rollback is instant** - no data loss, no user impact beyond momentary auth preference.

### Gradual Rollback (Non-Emergency)

If metrics degrade but service is functional:

1. Reduce rollout percentage: 50% → 25% → 10% → 5%
2. Monitor at each step for 2 hours
3. Identify and fix root cause
4. Resume rollout when ready

### Post-Rollback Investigation

```bash
# Collect diagnostic data
./scripts/collect-auth-diagnostics.sh

# Check Better Auth logs
tail -n 10000 /var/log/mirai/better-auth.log | grep ERROR

# Check session validation failures
psql $DATABASE_URL -c "
  SELECT error_type, COUNT(*) 
  FROM auth_errors 
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY error_type;
"
```

---

## Post-Migration Cleanup (After 30 Days)

### 1. Remove Supabase Auth Dependencies

```bash
# Remove from package.json
npm uninstall @supabase/auth-helpers-react @supabase/auth-helpers-nextjs

# Remove SupabaseAuthGateway
rm packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts

# Update DI wiring (remove feature flag)
# See Step 4.5 in migration spec
```

### 2. Database Cleanup

```sql
-- After confirming no issues for 30 days
-- Archive old Supabase auth tables (don't delete immediately)
ALTER TABLE auth.users RENAME TO auth.users_archive;
ALTER TABLE auth.sessions RENAME TO auth.sessions_archive;
```

### 3. Documentation Updates

- [ ] Update API documentation
- [ ] Update developer guides
- [ ] Update incident response playbooks

---

## Monitoring Checklist

### Daily (During Rollout)

- [ ] Auth error rate < 0.1%
- [ ] p95 latency < 500ms
- [ ] Migration progress (target: 5-10% per day)
- [ ] Zero user complaints about auth

### Weekly

- [ ] Session validation success rate > 99.9%
- [ ] Database connection pool health
- [ ] Cookie/session expiration working correctly
- [ ] Mobile auth functioning

### Monthly (Post-Migration)

- [ ] Overall auth success rate trend
- [ ] Performance comparison with Supabase baseline
- [ ] Security audit of auth endpoints
- [ ] Cost analysis (if applicable)

---

## Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | PagerDuty | +15 min |
| Backend Lead | Slack: @backend-lead | +30 min |
| Security Lead | Slack: @security | +1 hour |
| VP Engineering | Phone | +2 hours |

## References

- [Architecture Decision Record](./adr/001-better-auth-migration.md)
- [Developer Setup Guide](./better-auth-setup.md)
- [Better Auth Documentation](https://www.better-auth.com/)
- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars
