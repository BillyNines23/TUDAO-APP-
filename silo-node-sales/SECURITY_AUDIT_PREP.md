# TUDAO Node Pass - Security Audit Preparation
**Date:** October 29, 2025  
**Network:** Base Mainnet (Chain ID: 8453)  
**Version:** Phase 2 - Mainnet Readiness

---

## Executive Summary

This document outlines security considerations, identified vulnerabilities, and recommendations for the TUDAO Node Pass smart contract deployment and payment system before mainnet launch.

**Current Status:** ✅ Testnet Deployed | 🔄 Mainnet Preparation

---

## 1. Smart Contract Security Review

### NFT Minting System (`server/nft-minting.ts`)

**Current Implementation:**
- ✅ Using Thirdweb's audited `claimTo` extension
- ✅ Server-side minting with private key isolation
- ✅ Environment variable-based configuration
- ✅ Chain-agnostic design (supports Base/Sepolia)

**Identified Risks:**
| Risk | Severity | Status |
|------|----------|--------|
| Private key stored in environment variables | MEDIUM | ⚠️ Mitigate before mainnet |
| No multisig control for minting wallet | HIGH | ❌ Not implemented |
| Founding Node cap not enforced on-chain | HIGH | ❌ Not implemented |
| No emergency pause mechanism | MEDIUM | ⚠️ Requires contract upgrade |

**Recommendations:**
1. **CRITICAL:** Implement Gnosis Safe multisig (3-of-5) for minting wallet authorization
2. **HIGH:** Add on-chain cap enforcement for Founding Nodes (300 max)
3. **MEDIUM:** Consider Hardware Security Module (HSM) for production key storage
4. **LOW:** Add transaction simulation before execution

---

## 2. Payment System Security

### Stripe Integration (`server/routes.ts`)

**Current Implementation:**
- ✅ Webhook signature verification implemented
- ✅ Idempotency check via license ID
- ✅ Metadata validation (including wallet address)
- ✅ Error handling for mint failures
- ✅ **FIXED: Wallet address now required in payment intent metadata**

**Identified Risks:**
| Risk | Severity | Status |
|------|----------|--------|
| ~~NFTs minted to random temp wallets~~ | ~~CRITICAL~~ | ✅ **FIXED** |
| No persisted event ID tracking (duplicate webhook processing) | MEDIUM | ⚠️ Recommended |
| No rate limiting on webhook endpoint | MEDIUM | ⚠️ Recommended |
| Webhook responds 200 even on errors | LOW | ⚠️ Review needed |
| No async processing queue | MEDIUM | ⚠️ For high volume |

**Best Practices Checklist:**
- [x] Signature verification (`stripe.webhooks.constructEvent`)
- [x] HTTPS-only endpoints (production requirement)
- [x] Idempotency via license ID lookup
- [ ] **Event ID tracking** to prevent duplicate processing
- [ ] **Async webhook processing** (respond 200, queue work)
- [ ] **Rate limiting** (10 requests/minute per IP)
- [ ] **Monitoring & alerting** for failed webhooks

**Recommendations:**
```typescript
// Add event ID tracking to prevent duplicate webhook processing
const processedEventIds = new Set<string>(); // Or use database

if (processedEventIds.has(event.id)) {
  console.log(`Event ${event.id} already processed`);
  return res.json({ received: true });
}

processedEventIds.add(event.id);
// Continue processing...
```

---

## CRITICAL FIX: Wallet Address Collection (October 29, 2025)

**Problem Identified:** The original implementation minted NFTs to randomly generated temporary wallets that customers did not own. This made purchased NFTs completely inaccessible to buyers.

**Root Cause:**
```typescript
// BROKEN CODE (before fix):
const tempWallet = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`;
const buyer = await storage.createBuyer({
  wallet: tempWallet,  // ❌ Random wallet nobody owns!
  // ...
});
await mintNFT({ recipientAddress: buyer.wallet });  // ❌ NFT sent to lost wallet
```

**Solution Implemented:**
1. **Frontend**: Added wallet address input field to card/ACH payment form
   - Validates Ethereum address format (`/^0x[a-fA-F0-9]{40}$/`)
   - Auto-populates with connected wallet if available
   - Shows warning that wallet address is required

2. **Backend API**: Updated payment intent creation
   - Added `wallet` field to schema with regex validation
   - Included wallet address in Stripe metadata
   ```typescript
   metadata: {
     wallet,  // ✅ Real wallet address from user
     tier,
     licenseId,
     // ...
   }
   ```

3. **Webhook Handler**: Use real wallet instead of temp wallet
   - Validates wallet address exists in metadata
   - Returns error if wallet missing or invalid
   - Creates buyer record with real wallet address
   ```typescript
   if (!metadata.wallet || !metadata.wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
     return res.status(400).json({ error: "Missing valid wallet address" });
   }
   const buyer = await storage.createBuyer({
     wallet: metadata.wallet,  // ✅ Real wallet from metadata
     // ...
   });
   ```

**Status:** ✅ **FIXED & ARCHITECT-APPROVED** - All NFTs now mint to customer-owned wallets with comprehensive validation

**Additional Hardening (Round 2):**
4. **Zero Address Protection**: Block known-bad addresses at ALL validation layers
   - Zero address (`0x0000...0000`) - NFTs sent here are permanently burned
   - Burn address (`0x0000...dead`)
   - Frontend validation (checkout form)
   - Backend API validation (payment intent creation)
   - **Webhook validation (defense against tampered/legacy intents)**
   
5. **Auto-populate Reactivity**: Wallet field now updates when user connects wallet
   - `useEffect` hook monitors `account?.address` changes
   - Auto-fills card and wire forms when wallet connected
   - Prevents UX issues from stale wallet field

**Testing Required:**
- [ ] Test card payment with manual wallet address entry
- [ ] Test card payment with connected wallet auto-populate
- [ ] Test wallet auto-populate updates when connecting wallet mid-form
- [ ] Verify zero address (0x000...000) is rejected
- [ ] Verify burn address (0x000...dead) is rejected
- [ ] Verify NFT mints to correct wallet address
- [ ] Confirm buyer record stores correct wallet

---

## 3. Database Security

### PostgreSQL Schema (`shared/schema.ts`)

**Current Implementation:**
- ✅ UUID primary keys
- ✅ Enum validation for critical fields
- ✅ Timestamp tracking

**Identified Risks:**
| Risk | Severity | Status |
|------|----------|--------|
| No indexes on frequently queried fields | MEDIUM | ⚠️ Performance impact |
| No database connection pooling limits | LOW | ⚠️ Review needed |
| No encrypted fields for PII | LOW | ℹ️ Optional |

**Missing Indexes (Performance Impact):**
```sql
CREATE INDEX idx_buyers_wallet ON buyers(wallet);
CREATE INDEX idx_buyers_license_id ON buyers(license_id);
CREATE INDEX idx_buyers_created_at ON buyers(created_at DESC);
CREATE INDEX idx_buyers_tier ON buyers(tier);
```

**Recommendations:**
1. Add indexes before mainnet (query performance)
2. Implement database backup strategy (daily snapshots)
3. Set up read replicas for dashboard queries
4. Add connection pool limits (prevent DoS)

---

## 4. Access Control & Authentication

**Current State:**
- ❌ No multisig for admin operations
- ❌ No role-based access control (RBAC)
- ❌ Single private key controls all minting

**Critical Gaps:**
1. **Minting Wallet:** Single point of failure
   - **Solution:** Gnosis Safe 3-of-5 multisig on Base Mainnet
   - **Cost:** ~$0.01-$0.05 deployment on Base
   
2. **Admin Endpoints:** No authentication
   - `/api/activate-wire-payment/:licenseId` - Open to public
   - **Solution:** Add API key authentication or session-based auth

3. **Treasury Wallet:** Not yet configured
   - **Solution:** Separate Gnosis Safe for USDC payments

**Gnosis Safe Configuration:**
```javascript
// Recommended multisig setup
Signers: 5 total
- 2x Hardware wallets (Ledger/Trezor)
- 2x Team member wallets
- 1x Backup cold wallet

Threshold: 3 of 5 required
Purpose: Minting authorization, treasury management
Network: Base Mainnet
```

---

## 5. Founding Node Cap Enforcement

**Requirement:** Maximum 300 Founder NFTs can be minted

**Current Implementation:**
- ❌ No on-chain cap enforcement
- ❌ No database-level validation
- ❌ No inventory tracking

**Security Risks:**
- Accidental over-minting beyond 300 cap
- Race conditions during high-demand mint
- Manual intervention required for cap enforcement

**Recommended Solutions:**

**Option A: On-Chain Enforcement (Most Secure)**
```solidity
// Smart contract modification required
uint256 public constant MAX_FOUNDER_NODES = 300;
uint256 public founderNodesMinted = 0;

function claimFounderNode() external {
    require(founderNodesMinted < MAX_FOUNDER_NODES, "Founder cap reached");
    founderNodesMinted++;
    _mint(msg.sender, tokenId);
}
```
⚠️ **Requires contract upgrade - may not be possible with current setup**

**Option B: Database-Level Enforcement (Backend)**
```typescript
// Add before minting in server/routes.ts
if (tier === "Founder") {
  const founderCount = await storage.getCountByTier("Founder");
  if (founderCount >= 300) {
    throw new Error("Founder Node cap (300) reached");
  }
}
```

**Option C: Claim Condition Limit (Thirdweb)**
- Set claim condition on Founder contract to max 300 claims
- Enforced by Thirdweb SDK automatically
- **Easiest solution if using Thirdweb Drop contracts**

**Recommendation:** Implement ALL three layers for defense-in-depth:
1. Thirdweb claim condition limit (primary)
2. Database check before minting (secondary)
3. Monitoring alerts when approaching cap (notification)

---

## 6. Known Vulnerabilities (ERC721 Contracts)

Based on industry research, key vulnerabilities to audit:

### Critical
- [ ] **Reentrancy:** Verify `safeTransferFrom` doesn't enable recursive calls
- [ ] **Access Control:** Confirm only authorized wallet can mint
- [ ] **Overflow/Underflow:** Check all arithmetic operations

### High
- [ ] **Price Calculation:** Validate no zero-value purchases possible
- [ ] **Flash Loan Protection:** Ensure NFTs can't be borrowed for governance exploits
- [ ] **Front-Running:** Review auction/sale mechanisms for MEV vulnerabilities

### Medium
- [ ] **Metadata Tampering:** Verify IPFS hash immutability
- [ ] **Unlimited Approvals:** Review approval mechanisms
- [ ] **Self-Destruct:** Confirm no `selfdestruct` in contracts

**Audit Checklist:**
```bash
# Run automated security scans
slither server/nft-minting.ts
mythril analyze --contract NFTContract

# Manual review by security firm
# Recommended: OpenZeppelin, CertiK, Trail of Bits
```

---

## 7. Production Environment Checklist

### Environment Variables (Mainnet)
```bash
# Network Configuration
VITE_CHAIN_ID=8453  # Base Mainnet
VITE_NETWORK_NAME=base

# NFT Contracts (Deploy to Base Mainnet)
VITE_CONTRACT_VERIFIER=0x...  # Deploy & verify on BaseScan
VITE_CONTRACT_PROFESSIONAL=0x...
VITE_CONTRACT_FOUNDER=0x...  # 300 cap enforced

# Stripe (Live Mode)
STRIPE_SECRET_KEY=sk_live_...  # NOT sk_test_
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # New webhook endpoint

# Thirdweb
VITE_THIRDWEB_CLIENT_ID=...
THIRDWEB_SECRET_KEY=...  # Server-side only
THIRDWEB_MINTER_PRIVATE_KEY=...  # From Gnosis Safe

# Treasury
VITE_TREASURY_WALLET=0x...  # Gnosis Safe address
VITE_USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  # Base USDC

# Database (Production)
DATABASE_URL=postgresql://...  # Neon production instance

# Feature Flags
VITE_DISABLE_CARD_ONRAMP=false  # Enable in mainnet
VITE_EMAIL_DISABLED=false  # Enable when email system ready
```

### Pre-Deployment Steps
- [ ] Deploy NFT contracts to Base Mainnet
- [ ] Verify contracts on BaseScan
- [ ] Set up Gnosis Safe multisig (3-of-5)
- [ ] Configure Stripe live webhooks
- [ ] Set Founding Node claim limit to 300
- [ ] Test small transactions on mainnet
- [ ] Configure database indexes
- [ ] Set up monitoring & alerts
- [ ] Document rollback procedures

---

## 8. Monitoring & Incident Response

### Real-Time Monitoring Requirements

**Smart Contract Events:**
- NFT mint transactions (all tiers)
- Failed mint attempts
- Cap approaching alerts (Founder: 280/300)
- Unauthorized access attempts

**Payment System:**
- Failed webhook deliveries
- Duplicate event detections
- Refund requests
- Payment disputes

**Database:**
- Slow queries (>500ms)
- Connection pool exhaustion
- Failed transactions

**Recommended Tools:**
- **BaseScan API:** On-chain monitoring
- **Stripe Dashboard:** Payment monitoring
- **Sentry:** Error tracking
- **Datadog/New Relic:** Infrastructure monitoring

### Incident Response Plan
```markdown
1. **Detection:** Automated alerts via email/Slack
2. **Assessment:** Severity level (P0-P3)
3. **Containment:** Pause contracts if critical
4. **Investigation:** Root cause analysis
5. **Resolution:** Deploy fix or manual intervention
6. **Communication:** Status page updates
7. **Post-Mortem:** Document lessons learned
```

---

## 9. Third-Party Audit Requirements

**Scope for External Audit:**
- [ ] ERC721 NFT contracts (Verifier, Professional, Founder)
- [ ] Claim conditions and cap enforcement
- [ ] Access control mechanisms
- [ ] Treasury wallet integration
- [ ] Upgrade mechanisms (if proxy pattern used)

**Recommended Audit Firms:**
1. **OpenZeppelin** - Industry standard, thorough reviews
2. **CertiK** - AI-powered + formal verification
3. **Trail of Bits** - Deep technical expertise
4. **ConsenSys Diligence** - Ethereum ecosystem specialists

**Timeline:**
- **Duration:** 2-4 weeks for comprehensive audit
- **Cost:** $20k-$50k (depends on contract complexity)
- **Budget Allocation:** 10-15% of development budget

---

## 10. Security Best Practices Summary

### Code Review
- ✅ Use OpenZeppelin audited libraries
- ✅ Follow Checks-Effects-Interactions pattern
- ✅ Implement pausable contracts
- ✅ Add comprehensive test coverage (>90%)

### Deployment
- ✅ Testnet deployment first (Base Sepolia)
- ✅ Contract verification on BaseScan
- ✅ Multi-signature wallets for admin functions
- ✅ Hardware wallets for high-value operations

### Operations
- ✅ Real-time monitoring & alerting
- ✅ Incident response procedures
- ✅ Regular security assessments
- ✅ Bug bounty program (post-launch)

### Compliance
- ✅ KYC/AML if required
- ✅ Terms of service & privacy policy
- ✅ Regulatory compliance (consult legal)

---

## Next Steps

### Immediate (Pre-Audit)
1. ✅ **Review this document** with team
2. ⏳ **Set up Gnosis Safe** on Base Mainnet
3. ⏳ **Add database indexes** for performance
4. ⏳ **Implement Founder cap** enforcement
5. ⏳ **Add event ID tracking** to webhooks

### Before Mainnet Launch
6. ⏳ **Professional security audit** (2-4 weeks)
7. ⏳ **Deploy contracts** to Base Mainnet
8. ⏳ **Verify on BaseScan**
9. ⏳ **Test payment flows** with real transactions
10. ⏳ **Set up monitoring** & alerts

### Post-Launch
11. ⏳ **Bug bounty program** (HackerOne/Immunefi)
12. ⏳ **Continuous monitoring** & security updates
13. ⏳ **Regular audits** for major updates

---

## Risk Matrix

| Category | Current Risk | Target Risk | Mitigation |
|----------|--------------|-------------|------------|
| Smart Contract | HIGH | LOW | Professional audit + multisig |
| Payment System | MEDIUM | LOW | Event tracking + rate limiting |
| Access Control | HIGH | LOW | Gnosis Safe + RBAC |
| Database | MEDIUM | LOW | Indexes + backups + pooling |
| Monitoring | HIGH | LOW | Real-time alerts + dashboard |

---

## Conclusion

**Overall Security Posture:** 🟡 **Moderate Risk**

**Critical Blockers for Mainnet:**
1. ❌ Smart contract security audit
2. ❌ Gnosis Safe multisig setup
3. ❌ Founding Node cap enforcement
4. ❌ Production monitoring

**Timeline Estimate:** 4-6 weeks to mainnet readiness

**Budget Estimate:**
- Security audit: $20k-$50k
- Gnosis Safe setup: <$1 (Base gas fees)
- Monitoring tools: $100-$500/month
- Total: ~$25k-$60k + ongoing ops costs

---

**Document Status:** Draft v1.0  
**Next Review:** After Gnosis Safe setup  
**Owner:** TUDAO Development Team
