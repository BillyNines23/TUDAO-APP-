# Mainnet Migration Guide
**TUDAO Node Pass - Base Sepolia → Base Mainnet**

---

## Overview

This guide walks through migrating the TUDAO Node Pass application from Base Sepolia (testnet) to Base Mainnet for production launch.

**Timeline:** 4-6 weeks  
**Risk Level:** HIGH (involves real money and assets)  
**Prerequisites:** Security audit completed, Gnosis Safe configured

---

## Pre-Migration Checklist

### 1. Security Audit
- [ ] Third-party audit completed (OpenZeppelin/CertiK)
- [ ] All critical/high severity issues resolved
- [ ] Audit report reviewed and approved by team
- [ ] Smart contracts frozen (no code changes post-audit)

### 2. Infrastructure Preparation
- [ ] Production database provisioned (Neon PostgreSQL)
- [ ] Database indexes created (see `migrations/indexes.sql`)
- [ ] Database backup system configured
- [ ] Production secrets vault configured (Replit Secrets)

### 3. Gnosis Safe Setup
- [ ] Gnosis Safe deployed on Base Mainnet
- [ ] 5 signer wallets identified (2 hardware, 3 software)
- [ ] 3-of-5 threshold configured
- [ ] Safe funded with ETH for gas (~$100 worth)
- [ ] All signers tested and can approve transactions

### 4. Testing Environment
- [ ] All payment flows tested on Base Sepolia
- [ ] NFT minting tested for all three tiers
- [ ] Dashboard tested with real wallets
- [ ] Load testing completed (simulate 100+ concurrent purchases)

---

## Migration Steps

### Phase 1: Smart Contract Deployment (Day 1-7)

#### Step 1.1: Deploy NFT Contracts to Base Mainnet

**Using Thirdweb Dashboard:**

1. Go to https://thirdweb.com/dashboard
2. Click "Deploy New Contract"
3. Select "NFT Drop" or "Edition Drop"
4. Configure settings:
   ```
   Name: TUDAO Verifier Node Pass
   Symbol: TUDAO-VERIFIER
   Description: Official TUDAO Verifier Node License
   Network: Base Mainnet (8453)
   ```

5. **CRITICAL:** Set claim conditions:
   - **Verifier**: Unlimited claims, FREE (0 ETH)
   - **Professional**: Unlimited claims, FREE (0 ETH)
   - **Founder**: **Max 300 claims**, FREE (0 ETH)

6. Deploy contract and save address

7. Repeat for Professional and Founder tiers

**Save contract addresses:**
```bash
export VITE_CONTRACT_VERIFIER=0x...
export VITE_CONTRACT_PROFESSIONAL=0x...
export VITE_CONTRACT_FOUNDER=0x...  # Verify 300 cap!
```

#### Step 1.2: Verify Contracts on BaseScan

1. Go to https://basescan.org
2. Search for each contract address
3. Click "Contract" → "Verify and Publish"
4. Upload source code or use Thirdweb auto-verification
5. Confirm "Verified" badge appears

**Verification provides:**
- Transparency for users
- Read/write contract functions on BaseScan
- Trust and credibility

#### Step 1.3: Configure Minting Permissions

**Option A: Single Private Key (Quick but less secure)**
```bash
# Generate new wallet specifically for minting (NOT your personal wallet)
# Fund with ~0.01 ETH for gas
export THIRDWEB_MINTER_PRIVATE_KEY=0x...
```

**Option B: Gnosis Safe Multisig (Recommended)**
```bash
# Use Safe address as minter
# Requires 3-of-5 approvals for each mint
export THIRDWEB_MINTER_PRIVATE_KEY=<Safe_signer_key>
# Configure Thirdweb to use Safe SDK
```

**Grant Minting Permissions:**
For each contract, go to Thirdweb Dashboard:
1. Open contract → Permissions
2. Add minter address (your wallet or Safe)
3. Grant "MINTER_ROLE"
4. Test minting 1 NFT to confirm

---

### Phase 2: Database Migration (Day 8-10)

#### Step 2.1: Set Up Production Database

```bash
# Neon PostgreSQL production instance
# Connection string format:
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

#### Step 2.2: Create Database Schema

```bash
# Push Drizzle schema to production database
npm run db:push --force

# Verify tables created
psql $DATABASE_URL -c "\dt"
# Should show: buyers
```

#### Step 2.3: Add Performance Indexes

Create file: `migrations/001_add_indexes.sql`
```sql
-- Optimize wallet lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_buyers_wallet ON buyers(wallet);

-- Optimize license ID lookups
CREATE INDEX IF NOT EXISTS idx_buyers_license_id ON buyers(license_id);

-- Optimize tier filtering
CREATE INDEX IF NOT EXISTS idx_buyers_tier ON buyers(tier);

-- Optimize date sorting (for admin panel)
CREATE INDEX IF NOT EXISTS idx_buyers_created_at ON buyers(created_at DESC);

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_buyers_wallet_status ON buyers(wallet, status);
```

Run migration:
```bash
psql $DATABASE_URL -f migrations/001_add_indexes.sql
```

Verify indexes:
```bash
psql $DATABASE_URL -c "\di"
```

#### Step 2.4: Configure Backups

```bash
# Neon automatic backups (included)
# Manual backup command:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Set up daily backup cron job (optional)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/tudao_$(date +\%Y\%m\%d).sql.gz
```

---

### Phase 3: Payment Integration (Day 11-15)

#### Step 3.1: Stripe Live Mode Setup

**Switch to Live Keys:**
1. Go to https://dashboard.stripe.com/apikeys
2. Toggle to "Live mode" (top-right)
3. Copy keys:
   ```bash
   export STRIPE_SECRET_KEY=sk_live_...
   export VITE_STRIPE_PUBLIC_KEY=pk_live_...
   ```

**Create Production Webhook:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Save and copy signing secret:
   ```bash
   export STRIPE_WEBHOOK_SECRET=whsec_...
   ```

**Test Webhook:**
```bash
# Use Stripe CLI
stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

#### Step 3.2: Configure Crypto Payments

**Base Mainnet USDC:**
```bash
# Official USDC contract on Base
export VITE_USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

**Treasury Wallet (Gnosis Safe Recommended):**
```bash
# Create separate Safe for treasury
# At https://app.safe.global
export VITE_TREASURY_WALLET=0x...  # Safe address
```

**Test Crypto Payment:**
1. Connect wallet on production site
2. Purchase Verifier tier ($500 USDC)
3. Confirm USDC arrives in treasury Safe
4. Verify NFT minted to buyer wallet

#### Step 3.3: Wire Transfer Setup

**Configure Wire Instructions:**
Update `client/src/lib/config.ts`:
```typescript
export const wireInstructions = {
  bankName: "Your Bank Name",
  accountName: "TUDAO Treasury",
  accountNumber: "...",
  routingNumber: "...",
  swiftCode: "...",
  reference: "Include License ID: {licenseId}",
};
```

**Email Template:**
Create: `server/emails/wire-instructions.html`
```html
<p>Thank you for your purchase!</p>
<p>License ID: {licenseId}</p>
<p>Amount: ${priceUsd} USD</p>

<h3>Wire Transfer Instructions:</h3>
<ul>
  <li>Bank: {bankName}</li>
  <li>Account: {accountNumber}</li>
  <li>Routing: {routingNumber}</li>
  <li>Reference: {licenseId}</li>
</ul>
```

---

### Phase 4: Application Deployment (Day 16-20)

#### Step 4.1: Update Environment Variables

**Copy production template:**
```bash
cp .env.production.template .env.production
```

**Fill in all values:**
- Network: Chain ID 8453, RPC `https://mainnet.base.org`
- Contracts: Deployed mainnet addresses
- Stripe: Live mode keys and webhook secret
- Database: Production connection string
- Treasury: Gnosis Safe address

**Validate configuration:**
```bash
# Check all required vars are set
node scripts/validate-env.js
```

#### Step 4.2: Deploy Application

**Using Replit:**
1. Go to Replit project settings
2. Add all production secrets (from `.env.production`)
3. Update domain: `checkout.tradeuniondao.com`
4. Click "Deploy" → "Production deployment"

**Using Custom Server:**
```bash
# Build production bundle
npm run build

# Start server
NODE_ENV=production npm start

# Or use PM2 for process management
pm2 start npm --name tudao -- start
pm2 save
```

#### Step 4.3: Configure Domain & SSL

**Replit Deployment:**
- Automatic HTTPS via Replit
- Custom domain: `checkout.tradeuniondao.com`
- SSL certificate auto-provisioned

**Custom Server:**
```bash
# Using Let's Encrypt + Certbot
sudo certbot --nginx -d checkout.tradeuniondao.com

# Auto-renewal cron
0 0 1 * * certbot renew --quiet
```

**Update Stripe Webhook URL:**
```
Old (testnet): https://xyz.replit.dev/api/webhooks/stripe
New (mainnet): https://checkout.tradeuniondao.com/api/webhooks/stripe
```

---

### Phase 5: Testing & Validation (Day 21-25)

#### Step 5.1: Smoke Tests

**Test each payment method with real money (small amounts):**

1. **Card Payment ($1 test):**
   ```bash
   # Use Stripe test card in production (if test mode enabled)
   # Or use real card for minimum tier
   ```

2. **Crypto Payment (0.01 USDC):**
   - Connect real wallet
   - Switch to Base Mainnet
   - Send small USDC amount
   - Verify NFT minted

3. **Wire Transfer:**
   - Submit wire form
   - Verify email sent
   - Admin activates via endpoint
   - Verify NFT minted

**Checklist:**
- [ ] Card payment creates buyer record
- [ ] NFT minted to correct wallet
- [ ] Transaction hash stored in database
- [ ] Success page displays license details
- [ ] Dashboard shows purchased license
- [ ] Treasury receives payment

#### Step 5.2: Load Testing

```bash
# Simulate 100 concurrent purchases
npx artillery run load-test.yml

# Monitor for:
# - Database connection pool limits
# - Rate limiting triggers
# - Webhook processing delays
# - NFT minting failures
```

#### Step 5.3: Security Validation

**SSL/HTTPS:**
```bash
# Test SSL configuration
ssllabs.com/ssltest/analyze.html?d=checkout.tradeuniondao.com
# Target: A+ rating
```

**Webhook Security:**
```bash
# Verify signature validation works
curl -X POST https://checkout.tradeuniondao.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"payment_intent.succeeded"}' \
  -v

# Should return 400 (signature verification failed)
```

**Access Control:**
```bash
# Verify admin endpoints require auth
curl https://checkout.tradeuniondao.com/api/activate-wire-payment/NODE-ABC123

# Should return 401 Unauthorized
```

---

### Phase 6: Monitoring Setup (Day 26-28)

#### Step 6.1: Error Tracking (Sentry)

```bash
npm install @sentry/node @sentry/browser

# Configure in server/index.ts
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

# Configure in client/src/main.tsx
import * as Sentry from "@sentry/browser";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

#### Step 6.2: Uptime Monitoring

**Options:**
- **UptimeRobot** (free): Ping every 5 minutes
- **Pingdom**: Advanced monitoring
- **StatusCake**: Multi-region checks

**Configure:**
- URL: `https://checkout.tradeuniondao.com/api/health`
- Interval: 5 minutes
- Alert: Email + Slack when down

#### Step 6.3: Transaction Monitoring

**BaseScan API Alerts:**
```javascript
// scripts/monitor-mints.js
setInterval(async () => {
  const recentMints = await basescan.getContractTransactions(CONTRACT_ADDRESS);
  const failedMints = recentMints.filter(tx => tx.status === '0');
  
  if (failedMints.length > 0) {
    sendAlert(`${failedMints.length} failed NFT mints detected!`);
  }
}, 60000); // Check every minute
```

---

## Post-Migration

### Week 1: Close Monitoring

**Daily Checks:**
- [ ] Check error logs (Sentry)
- [ ] Review failed transactions
- [ ] Monitor gas prices and adjust
- [ ] Check customer support tickets
- [ ] Verify NFT metadata displays correctly

### Week 2-4: Optimization

**Performance Tuning:**
- Analyze slow database queries
- Optimize frontend bundle size
- Add caching where appropriate
- Review and adjust gas limits

**User Feedback:**
- Collect feedback on checkout experience
- Monitor conversion rates
- Track payment method preferences
- Identify UX friction points

---

## Rollback Procedures

**If critical issue discovered:**

### Emergency Rollback Steps

1. **Pause New Purchases:**
   ```typescript
   // Add to server/routes.ts
   app.use('/api/buyers', (req, res) => {
     res.status(503).json({ error: 'Maintenance mode' });
   });
   ```

2. **Revert to Testnet:**
   ```bash
   export VITE_CHAIN_ID=84532
   export VITE_CONTRACT_VERIFIER=<testnet_address>
   # etc...
   npm run build && npm start
   ```

3. **Communicate:**
   - Post status page update
   - Email active buyers
   - Update Discord/social media

4. **Investigate:**
   - Review error logs
   - Identify root cause
   - Develop fix

5. **Re-deploy:**
   - Test fix on testnet
   - Re-run security checks
   - Deploy to mainnet with monitoring

---

## Key Differences: Testnet vs Mainnet

| Feature | Base Sepolia (Testnet) | Base Mainnet |
|---------|----------------------|--------------|
| **Chain ID** | 84532 | 8453 |
| **RPC URL** | https://sepolia.base.org | https://mainnet.base.org |
| **Explorer** | sepolia.basescan.org | basescan.org |
| **USDC Contract** | Custom test ERC20 | 0x833589...02913 |
| **Gas Fees** | Free (testnet ETH) | Real ETH (~$0.01/tx) |
| **Stripe** | Test mode (sk_test_) | Live mode (sk_live_) |
| **NFT Detection** | Unreliable | Works well |
| **Card Payments** | Disabled by default | Enabled |
| **Stakes** | No real money | Real user funds |

---

## Success Criteria

**Mainnet launch is successful when:**

✅ All three tiers can be purchased  
✅ NFTs mint correctly to buyer wallets  
✅ All payment methods work (card, crypto, wire)  
✅ Dashboard displays licenses accurately  
✅ Zero transaction failures in first 24 hours  
✅ Customer support tickets <5 in first week  
✅ No security incidents detected  
✅ Founding Node cap enforcement working  

---

## Support & Resources

**Documentation:**
- Thirdweb: https://portal.thirdweb.com
- Base: https://docs.base.org
- Stripe: https://docs.stripe.com

**Emergency Contacts:**
- Security Audit Firm: audit@firm.com
- Thirdweb Support: support@thirdweb.com
- Stripe Support: https://support.stripe.com

**Team Responsibilities:**
- **Lead Dev:** Overall migration coordination
- **Security:** Audit review, access control
- **DevOps:** Infrastructure, monitoring
- **Support:** Customer communication

---

**Last Updated:** October 29, 2025  
**Next Review:** Before mainnet deployment  
**Status:** Ready for team review
