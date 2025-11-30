# Database Production Guide

## Overview

This guide covers production database configuration, optimization, backup strategy, and disaster recovery for the TUDAO Node Pass application.

## Database Provider

**Provider**: Neon (Serverless PostgreSQL)  
**Connection**: Via `@neondatabase/serverless` driver with Drizzle ORM  
**Environment Variable**: `DATABASE_URL`

## Schema Optimization

### Indexes (Production-Ready ✅)

The `buyers` table has been optimized with strategic indexes for common query patterns:

```sql
-- 1. Primary Key (auto-generated)
CREATE UNIQUE INDEX buyers_pkey ON buyers (id);

-- 2. Unique License ID (prevents duplicates)
CREATE UNIQUE INDEX buyers_license_id_idx ON buyers (license_id);

-- 3. Wallet Lookup (dashboard queries)
CREATE INDEX buyers_wallet_idx ON buyers (wallet);

-- 4. Tier Filtering (analytics, cap enforcement)
CREATE INDEX buyers_tier_idx ON buyers (tier);

-- 5. Status Filtering (pending wires, refunds)
CREATE INDEX buyers_status_idx ON buyers (status);

-- 6. Chronological Sorting
CREATE INDEX buyers_created_at_idx ON buyers (created_at);

-- 7. Composite Index (dashboard active licenses)
CREATE INDEX buyers_wallet_status_idx ON buyers (wallet, status);
```

### Query Performance

| Query Pattern | Index Used | Performance |
|---------------|------------|-------------|
| `WHERE wallet = ?` | `buyers_wallet_idx` | O(log n) |
| `WHERE license_id = ?` | `buyers_license_id_idx` | O(log n) |
| `WHERE tier = ?` | `buyers_tier_idx` | O(log n) |
| `WHERE status = ?` | `buyers_status_idx` | O(log n) |
| `WHERE wallet = ? AND status = ?` | `buyers_wallet_status_idx` | O(log n) |
| `ORDER BY created_at` | `buyers_created_at_idx` | O(n log n) |

## Connection Pooling

### Neon Serverless Configuration

Neon automatically handles connection pooling via PgBouncer. No additional configuration required for basic usage.

**Default Connection Limits:**
- Free Tier: 100 concurrent connections
- Pro Tier: 1000 concurrent connections
- Business Tier: 10,000 concurrent connections

### Production Recommendations

For high-traffic production deployments:

```typescript
// server/db.ts (if needed for custom pooling)
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool (adjust based on tier)
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Timeout for new connections
});
```

**Current Setup**: Using Drizzle ORM with Neon HTTP driver (no pooling needed - HTTP is stateless).

## Backup Strategy

### Neon Managed Backups

Neon provides automatic backups with point-in-time recovery (PITR):

**Free Tier:**
- 7-day retention
- Daily backups
- No PITR

**Pro Tier:**
- 30-day retention
- Continuous backups (every 10 minutes)
- Point-in-time recovery to any second

**Business Tier:**
- 90-day retention
- Continuous backups (every 10 minutes)
- Point-in-time recovery to any second
- Branch snapshots for staging/testing

### Recommended Production Tier

**Minimum**: Pro Tier ($20/month)
- 30-day retention ensures we can recover from any data loss incident
- PITR allows precise recovery to moments before incidents
- Continuous backups prevent data loss between backup windows

### Manual Backup Script

For additional safety, create manual backups before major changes:

```bash
# Export buyers table to CSV (run from Neon SQL editor)
COPY (SELECT * FROM buyers ORDER BY created_at) TO STDOUT WITH CSV HEADER;

# Or use pg_dump for full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup Testing Schedule

**Monthly**: Test point-in-time recovery on development database  
**Quarterly**: Full disaster recovery drill (restore to new environment)  
**Before mainnet deployment**: Create snapshot backup

## Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

**Recovery Steps:**
1. Identify exact timestamp of deletion from application logs
2. Access Neon Dashboard → Backups → Point-in-Time Recovery
3. Restore to 1 minute before deletion
4. Verify restored data in new branch
5. Promote branch to production

**RTO (Recovery Time Objective)**: < 15 minutes  
**RPO (Recovery Point Objective)**: < 10 minutes

### Scenario 2: Database Corruption

**Recovery Steps:**
1. Identify last known good timestamp
2. Create new Neon branch from backup
3. Test application against new branch
4. Update `DATABASE_URL` to point to new branch
5. Monitor for issues

**RTO**: < 30 minutes  
**RPO**: < 10 minutes

### Scenario 3: Complete Neon Outage

**Recovery Steps:**
1. Export latest backup to local PostgreSQL
2. Spin up temporary database (Railway, Supabase, or self-hosted)
3. Restore backup to temporary database
4. Update `DATABASE_URL` environment variable
5. Monitor Neon status page for restoration
6. Migrate back to Neon when available

**RTO**: < 2 hours  
**RPO**: Depends on last manual backup (recommend hourly exports during high-traffic periods)

### Scenario 4: Smart Contract Minting Failure

**Issue**: Payment processed but NFT mint failed (txHash is null)

**Recovery Steps:**
1. Query buyers with NULL txHash:
   ```sql
   SELECT * FROM buyers 
   WHERE tx_hash IS NULL 
   AND status = 'active' 
   ORDER BY created_at;
   ```
2. Use admin activation endpoint to retry minting:
   ```bash
   POST /api/activate-wire
   { "licenseId": "NODE-XXXXX" }
   ```
3. Verify txHash is updated in database
4. Notify customer of successful NFT delivery

**Prevention**: Webhook retry logic + monitoring

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Database Size**
   - Alert threshold: > 80% of plan limit
   - Action: Upgrade tier or archive old data

2. **Connection Count**
   - Alert threshold: > 80% of max connections
   - Action: Optimize queries or upgrade tier

3. **Query Performance**
   - Alert threshold: Queries taking > 1 second
   - Action: Add indexes or optimize queries

4. **Null txHash Records**
   - Alert threshold: Any record with NULL txHash and status='active'
   - Action: Retry NFT minting

### Recommended Monitoring Tools

- **Neon Dashboard**: Built-in metrics (connections, storage, performance)
- **Sentry**: Application error tracking (query failures, timeouts)
- **Uptime Robot**: Database connectivity monitoring
- **Custom Script**: Daily txHash validation

## Schema Migration Workflow

### Development → Production

1. **Test Schema Changes Locally**
   ```bash
   npm run db:push
   ```

2. **Review Migration Plan**
   ```bash
   drizzle-kit generate:pg
   ```

3. **Backup Production Database**
   - Create Neon branch snapshot
   - Export manual backup

4. **Apply Changes to Production**
   ```bash
   npm run db:push --force
   ```

5. **Verify Indexes**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'buyers';
   ```

6. **Test Critical Queries**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM buyers WHERE wallet = '0x...';
   ```

### Rollback Plan

If schema migration fails:

1. Restore from Neon branch snapshot
2. Update `DATABASE_URL` to pre-migration database
3. Revert code changes
4. Investigate migration failure
5. Fix schema issues in development
6. Retry migration

## Data Retention Policy

### Active Records
- **Buyers with status='active'**: Retain indefinitely
- **Buyers with status='pending_wire'**: Review after 30 days (auto-expire or manual activation)
- **Buyers with status='refunded'**: Retain for 7 years (financial compliance)

### Archival Strategy (Future)

When database exceeds 10,000 records:

1. Create `buyers_archive` table for refunded/expired records
2. Move records older than 2 years to archive
3. Maintain indexes on archive table for compliance queries

## Security Hardening

### Database Access Control

**Production**:
- Use separate database user for application (not root)
- Grant only required permissions: `SELECT`, `INSERT`, `UPDATE` on `buyers` table
- No `DELETE` permission in production (soft delete with status='refunded')

**Development**:
- Full permissions on development database
- Never connect production database to development environment

### SQL Injection Prevention

All queries use Drizzle ORM parameterized queries:

```typescript
// ✅ Safe (parameterized)
await db.select().from(buyers).where(eq(buyers.wallet, userWallet));

// ❌ Never do this (SQL injection risk)
await db.execute(sql`SELECT * FROM buyers WHERE wallet = '${userWallet}'`);
```

### Encryption

- **In-Transit**: TLS/SSL enforced by Neon (all connections encrypted)
- **At-Rest**: AES-256 encryption (managed by Neon)
- **Sensitive Fields**: Email/name are optional (minimize PII collection)

## Cost Optimization

### Free Tier Limitations
- 0.5 GB storage
- 100 concurrent connections
- 7-day backups

**Recommendation**: Upgrade to Pro before mainnet launch.

### Pro Tier ($20/month)
- 10 GB storage (sufficient for ~50,000 buyers)
- 1000 concurrent connections
- 30-day PITR backups

### Cost Projections

| Buyers | Storage | Tier | Monthly Cost |
|--------|---------|------|--------------|
| 0-10,000 | < 1 GB | Free | $0 |
| 10,000-50,000 | < 10 GB | Pro | $20 |
| 50,000-100,000 | < 20 GB | Pro + Storage | $30 |
| 100,000+ | Custom | Business | Custom |

**Current MVP**: Free tier acceptable for initial testing  
**Mainnet Launch**: Pro tier required for PITR and compliance

## Maintenance Schedule

### Daily
- Monitor null txHash records
- Check connection count
- Review error logs

### Weekly
- Analyze slow queries
- Review database size growth
- Check backup status

### Monthly
- Test point-in-time recovery
- Review and optimize indexes
- Audit database security settings

### Quarterly
- Full disaster recovery drill
- Review data retention policy
- Optimize archived data

## Production Checklist

Before mainnet deployment:

- [x] Database indexes optimized
- [x] Unique constraint on license_id
- [ ] Upgrade to Neon Pro tier
- [ ] Configure backup monitoring
- [ ] Set up database alerts (Sentry + custom)
- [ ] Test point-in-time recovery
- [ ] Document emergency contact procedures
- [ ] Create manual backup script
- [ ] Schedule weekly backup verification
- [ ] Implement txHash monitoring

## Emergency Contacts

**Neon Support**: support@neon.tech (Pro tier gets priority)  
**Database Admin**: [TODO: Add contact]  
**On-Call Engineer**: [TODO: Add contact]

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Database Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
