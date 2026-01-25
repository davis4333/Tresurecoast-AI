# Backup & Restore Runbook

**Version**: 1.0  
**Last Updated**: 2026-01-25  
**Owner**: DevOps / Platform Team

---

## Overview

This runbook provides step-by-step procedures for:
1. Creating database backups
2. Verifying backup integrity
3. Restoring from backups
4. Rolling back database migrations
5. Emergency recovery procedures

---

## Prerequisites

- **Database Access**: Admin credentials for PostgreSQL
- **CLI Tools**: `pg_dump`, `pg_restore`, `psql`
- **Permissions**: SUPERUSER or DATABASE OWNER role
- **Storage**: Sufficient space for backup files (estimate: 2x current DB size)

---

## 1. DATABASE BACKUPS

### 1.1 Automated Backups (Recommended)

#### Neon (Managed PostgreSQL)

**Point-in-Time Recovery (PITR)**:
- Automatic backups every 24 hours
- Retention: 7 days (Free), 30 days (Pro)
- No manual intervention required

**Verify Backups**:
```bash
# Via Neon Console
1. Go to https://console.neon.tech/app/projects
2. Select your project
3. Click "Backups" tab
4. Verify last backup timestamp

# Via Neon API
curl -X GET 'https://console.neon.tech/api/v2/projects/{project_id}/branches' \
  -H "Authorization: Bearer ${NEON_API_KEY}"
```

**Create On-Demand Backup**:
```bash
# Create a branch (acts as snapshot)
neonctl branches create --project-id ${PROJECT_ID} --name backup-$(date +%Y%m%d-%H%M%S)
```

#### Supabase (Managed PostgreSQL)

**Daily Backups**:
- Automatic daily backups
- Retention: 7 days (Free), 30 days (Pro), 90 days (Enterprise)

**Verify Backups**:
```bash
# Via Supabase Dashboard
1. Go to https://app.supabase.com/project/{ref}/settings/database
2. Check "Backups" section
3. Verify last backup date

# Via Supabase CLI
supabase db dump --project-ref ${PROJECT_REF} > backup.sql
```

**Create On-Demand Backup**:
```bash
# Via CLI
supabase db dump --project-ref ${PROJECT_REF} > backup-$(date +%Y%m%d-%H%M%S).sql
```

### 1.2 Manual Backups

#### Full Database Dump

```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Create backup directory
mkdir -p backups
cd backups

# Dump entire database (schema + data)
pg_dump ${DATABASE_URL} -F c -b -v -f "full-backup-$(date +%Y%m%d-%H%M%S).dump"

# Verify backup file created
ls -lh full-backup-*.dump
```

**Explanation**:
- `-F c`: Custom format (compressed, supports selective restore)
- `-b`: Include large objects
- `-v`: Verbose mode
- `-f`: Output file

#### Schema-Only Backup

```bash
pg_dump ${DATABASE_URL} --schema-only -F c -f "schema-backup-$(date +%Y%m%d-%H%M%S).dump"
```

#### Data-Only Backup

```bash
pg_dump ${DATABASE_URL} --data-only -F c -f "data-backup-$(date +%Y%m%d-%H%M%S).dump"
```

#### SQL Format (Human-Readable)

```bash
pg_dump ${DATABASE_URL} -F p -f "backup-$(date +%Y%m%d-%H%M%S).sql"
```

### 1.3 Backup Specific Tables

```bash
# Backup critical tables only
pg_dump ${DATABASE_URL} -F c \
  -t Organization \
  -t OrganizationMember \
  -t Bot \
  -t Lead \
  -t Conversation \
  -f "critical-tables-$(date +%Y%m%d-%H%M%S).dump"
```

### 1.4 Backup Verification

```bash
# Verify backup file integrity
pg_restore --list backup.dump | head -20

# Expected output: Table of contents with schema objects
```

---

## 2. RESTORE FROM BACKUP

### 2.1 Full Database Restore

⚠️ **WARNING**: This will **drop and recreate** the database. All current data will be lost.

```bash
# 1. Create a safety backup first
pg_dump ${DATABASE_URL} -F c -f "pre-restore-backup-$(date +%Y%m%d-%H%M%S).dump"

# 2. Drop existing database (WARNING: DATA LOSS)
psql ${DATABASE_URL} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 3. Restore from backup
pg_restore -d ${DATABASE_URL} -v backup.dump

# 4. Verify restoration
psql ${DATABASE_URL} -c "SELECT count(*) FROM \"Organization\";"
psql ${DATABASE_URL} -c "SELECT count(*) FROM \"Lead\";"
```

### 2.2 Selective Table Restore

```bash
# Restore specific tables only (preserves other data)
pg_restore -d ${DATABASE_URL} -v -t Organization -t Bot backup.dump
```

### 2.3 Restore from SQL File

```bash
psql ${DATABASE_URL} -f backup.sql
```

### 2.4 Neon Restore (Point-in-Time)

```bash
# Via Neon Console
1. Go to https://console.neon.tech/app/projects
2. Select your project
3. Click "Branches" → "Create branch"
4. Select "From a backup"
5. Choose timestamp
6. Click "Create"

# Via Neon CLI
neonctl branches restore --project-id ${PROJECT_ID} --branch main --timestamp "2026-01-25T10:00:00Z"
```

### 2.5 Supabase Restore

```bash
# Via Supabase Dashboard
1. Settings → Database → Backups
2. Click "Restore" on desired backup
3. Confirm restoration

# Via CLI (from backup file)
psql ${DATABASE_URL} < backup.sql
```

---

## 3. MIGRATION ROLLBACK

### 3.1 Check Migration Status

```bash
# View applied migrations
pnpm prisma migrate status

# Expected output:
# ✔ Database is up to date
# OR
# ⚠ Pending migrations: ...
```

### 3.2 Rollback Last Migration

⚠️ **WARNING**: Prisma doesn't support automatic rollback. Must be done manually.

```bash
# 1. Identify last migration
ls -lt prisma/migrations/ | head -5

# Example: 20260120122457_add_booking_flow_event_type

# 2. Create rollback SQL (manually)
# Find migration file:
cat prisma/migrations/20260120122457_add_booking_flow_event_type/migration.sql

# Example migration:
# ALTER TABLE "Lead" ADD COLUMN "eventType" TEXT;

# Create rollback (inverse):
cat > rollback.sql << 'SQL'
ALTER TABLE "Lead" DROP COLUMN IF EXISTS "eventType";
SQL

# 3. Apply rollback
psql ${DATABASE_URL} -f rollback.sql

# 4. Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back 20260120122457_add_booking_flow_event_type

# 5. Verify
pnpm prisma migrate status
```

### 3.3 Reset Database to Specific Migration

```bash
# 1. Backup current state
pg_dump ${DATABASE_URL} -F c -f "pre-reset-backup-$(date +%Y%m%d-%H%M%S).dump"

# 2. Reset to clean state
pnpm prisma migrate reset --force

# 3. Apply migrations up to specific point
# (Manually comment out unwanted migrations in prisma/migrations/)

# 4. Re-apply migrations
pnpm prisma migrate deploy

# 5. Restore data (if needed)
pg_restore -d ${DATABASE_URL} --data-only backup.dump
```

---

## 4. EMERGENCY RECOVERY

### 4.1 Database Corruption

**Symptoms**:
- Query errors: "could not open file", "invalid page header"
- Connection failures
- Data inconsistencies

**Recovery Steps**:

```bash
# 1. Stop application immediately
# (In Vercel: pause deployments)

# 2. Attempt integrity check
psql ${DATABASE_URL} -c "SELECT * FROM pg_stat_database;"

# 3. If accessible, create emergency backup
pg_dump ${DATABASE_URL} -F c -f "emergency-backup-$(date +%Y%m%d-%H%M%S).dump"

# 4. Contact database provider support
# Neon: support@neon.tech
# Supabase: support@supabase.com

# 5. If self-hosted, attempt VACUUM
psql ${DATABASE_URL} -c "VACUUM FULL ANALYZE;"

# 6. Restore from last known good backup (see Section 2.1)
```

### 4.2 Accidental Data Deletion

**Example**: `DELETE FROM "Organization" WHERE ...` without `WHERE` clause

**Recovery Steps**:

```bash
# 1. DO NOT execute any more queries

# 2. Check if point-in-time recovery available (Neon/Supabase)
# Restore to timestamp BEFORE deletion (see Section 2.4/2.5)

# 3. If no PITR, restore from latest backup
pg_restore -d ${DATABASE_URL} backup.dump

# 4. If backup is old, manually recover deleted rows
# (Check audit logs, application logs for deleted data)

# 5. Verify data integrity
psql ${DATABASE_URL} -c "SELECT count(*) FROM \"Organization\";"
```

### 4.3 Failed Migration

**Symptoms**:
- `pnpm prisma migrate deploy` fails mid-migration
- Database in inconsistent state

**Recovery Steps**:

```bash
# 1. Check migration status
pnpm prisma migrate status

# 2. If migration partially applied, check logs
pnpm prisma migrate deploy --verbose

# 3. Mark as rolled back
pnpm prisma migrate resolve --rolled-back {migration_name}

# 4. Fix migration SQL
# Edit: prisma/migrations/{migration_name}/migration.sql

# 5. Re-apply manually
psql ${DATABASE_URL} -f prisma/migrations/{migration_name}/migration.sql

# 6. Mark as applied
pnpm prisma migrate resolve --applied {migration_name}

# 7. Verify
pnpm prisma migrate status
```

---

## 5. BACKUP SCHEDULE

### 5.1 Recommended Schedule

| Environment | Frequency | Retention | Method |
|-------------|-----------|-----------|--------|
| **Production** | Every 6 hours | 30 days | Automated (Neon/Supabase PITR) |
| **Production** | Daily | 90 days | Manual dump to S3/GCS |
| **Staging** | Daily | 7 days | Automated |
| **Development** | Weekly | 7 days | Manual (optional) |

### 5.2 Backup Automation (Cron)

```bash
# Add to crontab (server or CI/CD)
# Run daily at 2 AM UTC
0 2 * * * /path/to/backup-script.sh

# backup-script.sh
#!/bin/bash
set -e

export DATABASE_URL="postgresql://..."
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup
pg_dump ${DATABASE_URL} -F c -f "${BACKUP_DIR}/daily-${DATE}.dump"

# Upload to S3 (optional)
aws s3 cp "${BACKUP_DIR}/daily-${DATE}.dump" s3://my-backups/treasure-coast/

# Delete backups older than 30 days
find ${BACKUP_DIR} -name "daily-*.dump" -mtime +30 -delete

echo "Backup completed: daily-${DATE}.dump"
```

---

## 6. DISASTER RECOVERY

### 6.1 Recovery Time Objective (RTO)

**Target**: 2 hours from incident detection to full service restoration

### 6.2 Recovery Point Objective (RPO)

**Target**: Maximum 6 hours of data loss

### 6.3 DR Runbook

**Scenario**: Complete database loss (provider outage, data center failure)

**Steps**:

1. **Incident Detection** (0 min)
   - Monitor alerts: database unreachable
   - Confirm outage with provider status page

2. **Initial Response** (5 min)
   - Notify team via Slack/PagerDuty
   - Put application in maintenance mode
   - Display status page to users

3. **Assess Situation** (15 min)
   - Contact provider support
   - Estimate downtime (ETA from provider)
   - Decide: wait or failover

4. **Failover Decision** (30 min)
   - If ETA > 2 hours: proceed with failover
   - If ETA < 2 hours: wait for provider

5. **Failover Execution** (60 min)
   - Provision new database (Neon/Supabase)
   - Restore from latest backup (see Section 2.1)
   - Update `DATABASE_URL` in Vercel
   - Run migrations: `pnpm prisma migrate deploy`
   - Verify data integrity (spot checks)

6. **Service Restoration** (90 min)
   - Remove maintenance mode
   - Monitor error rates
   - Verify critical flows (auth, chat, lead capture)

7. **Post-Incident** (120 min)
   - Document incident timeline
   - Update backup procedures
   - Schedule post-mortem meeting

---

## 7. VERIFICATION CHECKLIST

After any backup/restore operation:

- [ ] **Database accessible**: `psql ${DATABASE_URL} -c "SELECT 1"`
- [ ] **Schema matches**: `pnpm prisma migrate status` (should be "up to date")
- [ ] **Row counts match**: Compare with pre-backup counts
- [ ] **Application starts**: `pnpm build && pnpm start` (no errors)
- [ ] **Authentication works**: Sign in with test account
- [ ] **Critical data intact**: Spot-check 5-10 organizations
- [ ] **Foreign keys valid**: No orphaned records
- [ ] **Indexes present**: `psql -c "\di" | wc -l` (expect ~15-20 indexes)

---

## 8. CONTACTS

| Role | Contact | Escalation |
|------|---------|-----------|
| **Database Provider** | Neon: support@neon.tech | https://status.neon.tech |
| **Database Provider** | Supabase: support@supabase.com | https://status.supabase.com |
| **On-Call Engineer** | [Your team contact] | [PagerDuty/Opsgenie] |
| **Platform Lead** | [Your team lead] | [Email/Slack] |

---

## 9. TESTING

**Test backup/restore procedures quarterly**:

1. Restore to staging environment
2. Verify data integrity
3. Run full test suite
4. Document any issues
5. Update runbook if needed

**Last Tested**: [Date]  
**Next Test Due**: [Date + 3 months]

---

## Appendix A: Common psql Commands

```bash
# Connect to database
psql ${DATABASE_URL}

# List databases
\l

# List tables
\dt

# Describe table
\d "Organization"

# Show table row count
SELECT count(*) FROM "Organization";

# Show disk usage
\l+

# Quit
\q
```

## Appendix B: Backup File Naming Convention

Format: `{type}-{environment}-{date}-{time}.{ext}`

Examples:
- `full-production-20260125-020000.dump`
- `schema-staging-20260125-120000.dump`
- `critical-tables-production-20260125-153000.dump`

---

**END OF RUNBOOK**
