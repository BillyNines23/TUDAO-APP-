# TUDAO Node Pass - Mainnet Deployment Status

**Last Updated**: October 29, 2025  
**Target Network**: Base Mainnet (Chain ID: 8453)  
**Status**: Pre-Deployment Preparation

---

## ✅ Completed Setup

### 1. Treasury Configuration
- **Gnosis Safe Deployed**: ✅ `0x1a994806F4d27Ad0209DBa2489549Dd6252ECb77`
- **Network**: Base Mainnet
- **Status**: Activated and ready to receive USDC payments
- **Next Steps**:
  - [ ] Add 2-4 additional signers to Safe
  - [ ] Set threshold to 3-of-5 (recommended)
  - [ ] Fund Safe with ~$50 ETH for potential gas fees

### 2. Security Hardening
- **Wallet Validation**: ✅ Zero-address and burn-address protection
- **Database Optimization**: ✅ 7 production indexes deployed
- **Atomic Cap Enforcement**: ✅ Founding Node 300-cap with advisory locks
- **Webhook Security**: ✅ Retry storm prevention
- **Double ROLLBACK Bug**: ✅ Fixed and architect-approved

### 3. Documentation
- **Contract Deployment Guide**: ✅ `docs/CONTRACT_DEPLOYMENT_GUIDE.md`
- **Security Audit Prep**: ✅ `docs/SECURITY_AUDIT_PREP.md`
- **Database Production Guide**: ✅ `docs/DATABASE_PRODUCTION_GUIDE.md`
- **Founder Cap Enforcement**: ✅ `docs/FOUNDER_CAP_ENFORCEMENT.md`
- **Mainnet Migration Guide**: ✅ `docs/MAINNET_MIGRATION_GUIDE.md`

---

## 🚧 Pending Pre-Deployment Tasks

### Critical Path (Must Complete Before Launch)

#### 1. Smart Contract Deployment (Estimated: 1-2 hours)
**Prerequisites**:
- [ ] Transfer ~$100 worth of ETH to Base Mainnet
- [ ] Create new deployer wallet in MetaMask (fresh, secure)
- [ ] Create new minting wallet in MetaMask (separate from deployer)

**Deployment Steps**:
- [ ] Deploy Verifier Node Pass contract to Base Mainnet
- [ ] Deploy Professional Node Pass contract to Base Mainnet
- [ ] Deploy Founder Node Pass contract to Base Mainnet (300 cap + transfer lock)
- [ ] Verify all 3 contracts on BaseScan
- [ ] Grant MINTER role to minting wallet on all contracts
- [ ] Transfer contract ownership to Gnosis Safe multisig

**Contract Addresses (To Be Filled After Deployment)**:
```bash
VITE_CONTRACT_VERIFIER=0x...  # Verifier contract on Base Mainnet
VITE_CONTRACT_PROFESSIONAL=0x...  # Professional contract on Base Mainnet
VITE_CONTRACT_FOUNDER=0x...  # Founder contract on Base Mainnet (300 cap)
```

**Reference**: See `docs/CONTRACT_DEPLOYMENT_GUIDE.md` for step-by-step instructions

---

#### 2. Minting Wallet Configuration (Estimated: 30 minutes)
**Prerequisites**:
- [ ] New MetaMask wallet created for minting (never share private key)
- [ ] Minting wallet funded with ~$50 ETH on Base for gas fees

**Configuration**:
- [ ] Export minting wallet private key from MetaMask
- [ ] Add to Replit Secrets as `THIRDWEB_MINTER_PRIVATE_KEY`
- [ ] Verify minting wallet has MINTER role on all 3 contracts
- [ ] Test mint 1 NFT from each tier to confirm setup

**Security Notes**:
- ⚠️ ONLY the minting wallet private key goes in Replit Secrets
- ⚠️ NEVER share deployer wallet or treasury Safe private keys
- ⚠️ This wallet only needs gas fees (~$50), not large amounts

---

#### 3. Stripe Production Setup (Estimated: 1 hour)
**Prerequisites**:
- [ ] Stripe account activated for live payments
- [ ] Business verification completed (if required)

**Live Mode Configuration**:
- [ ] Switch to Live mode in Stripe Dashboard
- [ ] Copy live API keys: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`
- [ ] Create production webhook endpoint
- [ ] Configure webhook URL: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Copy webhook signing secret: `STRIPE_WEBHOOK_SECRET`
- [ ] Add all 3 secrets to Replit Secrets

**Test Live Payments**:
- [ ] Test $1 card payment in production
- [ ] Verify webhook receives event
- [ ] Confirm buyer record created
- [ ] Verify NFT minted successfully

---

#### 4. Environment Variable Configuration (Estimated: 15 minutes)
**Network Settings**:
```bash
VITE_CHAIN_ID=8453  # Base Mainnet
VITE_NETWORK_NAME=base
```

**NFT Contracts** (after deployment):
```bash
VITE_CONTRACT_VERIFIER=0x...
VITE_CONTRACT_PROFESSIONAL=0x...
VITE_CONTRACT_FOUNDER=0x...
```

**Stripe Live Mode**:
```bash
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Thirdweb**:
```bash
VITE_THIRDWEB_CLIENT_ID=<existing_value>  # Already configured ✓
THIRDWEB_SECRET_KEY=<existing_value>  # Already configured ✓
THIRDWEB_MINTER_PRIVATE_KEY=0x...  # Add after minting wallet created
```

**Crypto Payments**:
```bash
VITE_TREASURY_WALLET=0x1a994806F4d27Ad0209DBa2489549Dd6252ECb77  # ✓ CONFIGURED
VITE_USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  # Base USDC (default)
```

**Feature Flags**:
```bash
VITE_DISABLE_CARD_ONRAMP=false  # Enable card payments in production
VITE_EMAIL_DISABLED=true  # Keep disabled until email system ready
```

---

## 📋 Deployment Checklist

### Pre-Launch Validation

**Security**:
- [ ] All private keys stored in Replit Secrets (never in code)
- [ ] Treasury Safe has 3-5 signers with 3-of-5 threshold
- [ ] Minting wallet has minimal ETH (~$50 for gas only)
- [ ] Deployer wallet secured (consider hardware wallet)
- [ ] All contracts verified on BaseScan
- [ ] Contract ownership transferred to Gnosis Safe

**Smart Contracts**:
- [ ] All 3 contracts deployed to Base Mainnet
- [ ] Founder contract has 300 supply cap
- [ ] Founder contract has transfer lock enabled
- [ ] Minting wallet has MINTER role on all contracts
- [ ] Test minting works for all 3 tiers
- [ ] Contract addresses added to environment variables

**Payment Integration**:
- [ ] Stripe live mode keys configured
- [ ] Stripe webhook endpoint created and verified
- [ ] Test card payment succeeds ($1 test)
- [ ] Test crypto payment succeeds (small USDC amount)
- [ ] Wire transfer flow tested (form submission)
- [ ] All payment methods mint NFTs correctly

**Infrastructure**:
- [ ] Production database indexes created
- [ ] Database backup system configured
- [ ] Custom domain configured (e.g., checkout.tradeuniondao.com)
- [ ] SSL/HTTPS enabled
- [ ] Health check endpoint working

**Testing**:
- [ ] End-to-end test: Card → NFT mint → Dashboard display
- [ ] End-to-end test: Crypto → NFT mint → Dashboard display
- [ ] End-to-end test: Wire → Email → Admin activation → NFT mint
- [ ] Founding Node cap enforcement tested (attempt 301st purchase)
- [ ] Test on mobile devices
- [ ] Test wallet connection and network switching

**Monitoring**:
- [ ] Error tracking configured (Sentry or similar)
- [ ] Uptime monitoring configured (UptimeRobot or similar)
- [ ] BaseScan alerts for failed mints
- [ ] Webhook failure alerts
- [ ] Database performance monitoring

---

## 🎯 Deployment Workflow

### Step-by-Step Execution Order

1. **Create Wallets** (30 min)
   - New deployer wallet in MetaMask
   - New minting wallet in MetaMask
   - Transfer ETH to deployer (~$100 on Base)

2. **Deploy Contracts** (1-2 hours)
   - Follow `docs/CONTRACT_DEPLOYMENT_GUIDE.md`
   - Deploy all 3 tier contracts
   - Verify on BaseScan
   - Configure permissions

3. **Configure Environment** (15 min)
   - Add contract addresses to Replit Secrets
   - Add minting wallet private key
   - Update chain ID to 8453
   - Disable test mode flags

4. **Stripe Production** (1 hour)
   - Switch to live mode
   - Create production webhook
   - Add live keys to Replit Secrets
   - Test $1 payment

5. **End-to-End Testing** (2-3 hours)
   - Test each payment method
   - Verify NFT minting
   - Check dashboard display
   - Test cap enforcement
   - Mobile testing

6. **Go Live** 🚀
   - Monitor first transactions closely
   - Be ready to pause if issues detected
   - Collect user feedback

---

## 🔐 Security Considerations

### Wallet Security Best Practices

**Deployer Wallet**:
- Create fresh wallet in MetaMask (never shared before)
- Only use for contract deployment
- Consider hardware wallet (Ledger/Trezor) for extra security
- Transfer ownership to Gnosis Safe immediately after deployment

**Minting Wallet**:
- Separate from deployer and personal wallets
- Private key ONLY in Replit Secrets
- Minimal ETH balance (~$50 for gas)
- Only has MINTER role (cannot modify contracts or steal funds)

**Treasury Safe**:
- Already configured: `0x1a994806F4d27Ad0209DBa2489549Dd6252ECb77`
- Add 2-4 more signers (trusted team members)
- Set 3-of-5 threshold for withdrawals
- Never store private keys for Safe signers in Replit

### Attack Surface Analysis

**Protected**:
- ✅ Founding Node cap enforcement (atomic with advisory locks)
- ✅ Wallet validation (zero-address, burn-address checks)
- ✅ Webhook signature verification
- ✅ Database indexes for performance under load
- ✅ Retry storm prevention

**Potential Risks** (Mitigation Required):
- ⚠️ **Single minting wallet key**: Consider upgrading to Gnosis Safe for minting (Phase 2)
- ⚠️ **No rate limiting**: Add rate limiting to prevent abuse (Phase 2)
- ⚠️ **No email verification**: Wire transfers rely on user honesty (acceptable for MVP)
- ⚠️ **No refund automation**: Manual process via Stripe dashboard (acceptable for MVP)

---

## 📊 Success Metrics

### Week 1 Goals
- Zero critical bugs or security incidents
- All payment methods working reliably
- <5 customer support tickets
- 100% NFT minting success rate
- Dashboard loads <2 seconds

### Month 1 Goals
- Founding Node tier 50% sold (150/300)
- 95%+ payment success rate
- 99.9% uptime
- <10 total support tickets
- Positive user feedback on checkout experience

---

## 🆘 Emergency Procedures

### If Critical Issue Detected

1. **Pause Purchases Immediately**:
   ```bash
   # Add maintenance mode flag
   VITE_MAINTENANCE_MODE=true
   ```

2. **Assess Impact**:
   - How many users affected?
   - Are funds at risk?
   - Can issue be fixed quickly?

3. **Communicate**:
   - Post status update on website
   - Email affected customers
   - Update social media

4. **Fix & Redeploy**:
   - Test fix on Base Sepolia first
   - Deploy to mainnet after verification
   - Monitor closely for 24 hours

5. **Post-Mortem**:
   - Document root cause
   - Update tests to prevent recurrence
   - Share learnings with team

---

## 📞 Support Contacts

**Thirdweb Support**: [discord.gg/thirdweb](https://discord.gg/thirdweb)  
**Base Support**: [discord.gg/buildonbase](https://discord.gg/buildonbase)  
**Stripe Support**: [support.stripe.com](https://support.stripe.com)  
**BaseScan**: [basescan.org](https://basescan.org)

---

## Next Immediate Action

**You are here**: ✨ **Ready to deploy smart contracts**

**Next step**: Follow `docs/CONTRACT_DEPLOYMENT_GUIDE.md` to deploy NFT contracts to Base Mainnet

**Estimated time to production**: 4-6 hours (including testing)

---

**Questions or blockers?** Document them here and discuss with team before proceeding.
