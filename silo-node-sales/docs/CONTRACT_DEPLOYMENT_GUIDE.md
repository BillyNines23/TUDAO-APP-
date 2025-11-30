# Smart Contract Deployment Guide - Base Mainnet

## Overview

This guide covers deploying three ERC721 NFT contracts for TUDAO Node Pass tiers (Verifier, Professional, Founder) to Base Mainnet using Thirdweb.

## Prerequisites

### Required Assets
- ✅ **Ethereum Wallet**: MetaMask or Coinbase Wallet
- ⚠️ **ETH on Base Mainnet**: ~$50-100 for deploying 3 contracts
- ✅ **Thirdweb Account**: Already configured (VITE_THIRDWEB_CLIENT_ID exists)
- ⚠️ **NFT Metadata/Images**: Badge images for each tier

### Get ETH on Base

**Option 1: Bridge from Ethereum**
1. Visit [bridge.base.org](https://bridge.base.org)
2. Connect your wallet
3. Bridge 0.05 ETH minimum (~$150 at current prices)
4. Wait 5-10 minutes for confirmation

**Option 2: Buy Directly on Base** (Recommended if you use Coinbase)
1. Buy ETH on Coinbase
2. Withdraw to "Base" network (not Ethereum mainnet)
3. Much cheaper than bridging

### Verify Your Thirdweb Setup

Check that you have:
```bash
# In your .env or Replit Secrets
VITE_THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key  # For server-side minting
```

If missing `THIRDWEB_SECRET_KEY`:
1. Go to [thirdweb.com/dashboard](https://thirdweb.com/dashboard)
2. Click "Settings" → "API Keys"
3. Create new secret key
4. Add to Replit Secrets as `THIRDWEB_SECRET_KEY`

## Contract Specifications

Deploy three separate ERC721 contracts with these specs:

### 1. Verifier Node Pass Contract

**Contract Type**: ERC721 (NFT Drop or Edition Drop)
- **Name**: TUDAO Verifier Node Pass
- **Symbol**: TUDAO-VERIFIER
- **Description**: Grants access to verify trade union compliance data on the TUDAO network
- **Network**: Base (Chain ID: 8453)
- **Supply**: Unlimited (no cap)
- **Transferability**: Transferable
- **Royalties**: 0% (or 2.5% to DAO treasury if desired)

**Metadata**:
```json
{
  "name": "TUDAO Verifier Node Pass",
  "description": "This NFT grants the holder the right to operate a Verifier Node on the TUDAO network. Verifier nodes validate trade union compliance data and earn rewards for their participation.",
  "image": "ipfs://YOUR_VERIFIER_BADGE_IPFS_HASH",
  "attributes": [
    {"trait_type": "Tier", "value": "Verifier"},
    {"trait_type": "Price", "value": "$500"},
    {"trait_type": "Transferable", "value": "Yes"}
  ]
}
```

### 2. Professional Node Pass Contract

**Contract Type**: ERC721 (NFT Drop or Edition Drop)
- **Name**: TUDAO Professional Node Pass
- **Symbol**: TUDAO-PROFESSIONAL
- **Description**: Grants enhanced access to process trade union data and compliance verification
- **Network**: Base (Chain ID: 8453)
- **Supply**: Unlimited (no cap)
- **Transferability**: Transferable
- **Royalties**: 0% (or 2.5% to DAO treasury)

**Metadata**:
```json
{
  "name": "TUDAO Professional Node Pass",
  "description": "This NFT grants the holder the right to operate a Professional Node on the TUDAO network. Professional nodes have enhanced processing capabilities and earn higher rewards for data validation and compliance verification.",
  "image": "ipfs://YOUR_PROFESSIONAL_BADGE_IPFS_HASH",
  "attributes": [
    {"trait_type": "Tier", "value": "Professional"},
    {"trait_type": "Price", "value": "$5,000"},
    {"trait_type": "Transferable", "value": "Yes"}
  ]
}
```

### 3. Founding Node Pass Contract ⚠️ SPECIAL

**Contract Type**: ERC721 (NFT Drop with Extensions)
- **Name**: TUDAO Founding Node Pass
- **Symbol**: TUDAO-FOUNDER
- **Description**: Limited to 300 founding members with special governance rights
- **Network**: Base (Chain ID: 8453)
- **Supply**: **CRITICAL - Set max supply to 300**
- **Transferability**: **CRITICAL - Non-transferable until MVP unlock vote**
- **Royalties**: 0% (no secondary sales until unlocked)

**Metadata**:
```json
{
  "name": "TUDAO Founding Node Pass",
  "description": "This NFT grants the holder founding member status in the TUDAO network. Limited to 300 founding nodes with enhanced governance rights and rewards. Non-transferable until MVP unlock vote.",
  "image": "ipfs://YOUR_FOUNDER_BADGE_IPFS_HASH",
  "attributes": [
    {"trait_type": "Tier", "value": "Founder"},
    {"trait_type": "Price", "value": "$10,000"},
    {"trait_type": "Supply", "value": "300"},
    {"trait_type": "Transferable", "value": "No (until MVP unlock)"},
    {"trait_type": "Founding Member", "value": "True"}
  ]
}
```

## Deployment Steps (Thirdweb Dashboard)

### Step 1: Prepare Badge Images

1. Upload your tier badge images to IPFS:
   - Verifier badge: `attached_assets/verifier-badge.png`
   - Professional badge: `attached_assets/professional-badge.png`
   - Founder badge: `attached_assets/founder-badge.png`

2. Use Thirdweb Storage or Pinata:
   - **Thirdweb**: Go to [thirdweb.com/dashboard/storage](https://thirdweb.com/dashboard/storage)
   - Click "Upload" → Select badge image
   - Copy IPFS hash (e.g., `ipfs://QmXXXXX...`)

### Step 2: Deploy Verifier Contract

1. Go to [thirdweb.com/explore](https://thirdweb.com/explore)
2. Search "NFT Drop" or "Edition Drop"
3. Click "Deploy Now"
4. Fill in contract details:
   - **Name**: TUDAO Verifier Node Pass
   - **Symbol**: TUDAO-VERIFIER
   - **Description**: (See specs above)
   - **Image**: Upload Verifier badge
   - **Network**: Select "Base" (not Base Sepolia)
   - **Primary Sale Recipient**: Your treasury wallet
   - **Royalty Recipient**: Treasury wallet (optional)
   - **Royalty BPS**: 0 (or 250 for 2.5%)
5. Click "Deploy Contract"
6. **Approve transaction in MetaMask** (~$15-30 gas fee)
7. Wait for deployment (30-60 seconds)
8. **Copy contract address** (e.g., `0x1234...5678`)

### Step 3: Deploy Professional Contract

Repeat Step 2 with Professional specifications:
- Name: TUDAO Professional Node Pass
- Symbol: TUDAO-PROFESSIONAL
- Image: Professional badge
- All other settings same as Verifier

### Step 4: Deploy Founder Contract ⚠️

**CRITICAL - Special Settings Required**

1. Deploy using "NFT Drop" contract
2. Fill in Founder specifications
3. **IMPORTANT**: After deployment, configure extensions:

#### A. Set Max Supply to 300

```typescript
// Via Thirdweb Dashboard:
// 1. Go to contract → "Extensions" tab
// 2. Find "Drop" extension
// 3. Set "Max Claimable Supply" = 300
// 4. Click "Update"
```

#### B. Disable Transfers (Until MVP Unlock)

**Option 1: Via Thirdweb Dashboard** (Easiest)
1. Go to contract → "Permissions" tab
2. Find "Transfer" permission
3. Set to "Admin Only" or "Disabled"
4. Update contract

**Option 2: Custom Smart Contract** (More Control)
Deploy custom ERC721 with transfer restriction:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Drop.sol";

contract TUDAOFounderNodePass is ERC721Drop {
    bool public transfersEnabled = false;
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _royaltyRecipient,
        uint128 _royaltyBps,
        address _primarySaleRecipient
    )
        ERC721Drop(
            _name,
            _symbol,
            _royaltyRecipient,
            _royaltyBps,
            _primarySaleRecipient
        )
    {}
    
    // Override transfer functions to enforce lock
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        // Allow minting (from == address(0))
        // Allow burning (to == address(0))
        // Block transfers unless enabled
        require(
            from == address(0) || to == address(0) || transfersEnabled,
            "Transfers locked until MVP unlock vote"
        );
        super._beforeTokenTransfer(from, to, tokenId);
    }
    
    // DAO can enable transfers via governance vote
    function enableTransfers() external onlyOwner {
        transfersEnabled = true;
    }
}
```

If using custom contract:
1. Go to [thirdweb.com/contracts](https://thirdweb.com/contracts)
2. Click "Deploy Custom Contract"
3. Upload Solidity code above
4. Deploy to Base mainnet

### Step 5: Configure Minting Permissions

For each contract:

1. Go to contract → "Permissions" tab
2. Add your **server minting wallet** as "Minter":
   - This is the wallet whose private key is stored in `THIRDWEB_MINTER_PRIVATE_KEY`
   - Click "Add Wallet" → Enter address → Select "MINTER" role
3. Save changes

**Generate Server Minting Wallet** (if you don't have one):
```bash
# Option 1: Use MetaMask
# Create new account → Export private key → Add to THIRDWEB_MINTER_PRIVATE_KEY

# Option 2: Generate new wallet
npx thirdweb generate wallet
# Copy private key → Add to THIRDWEB_MINTER_PRIVATE_KEY
# Copy address → Grant MINTER role on each contract
```

⚠️ **IMPORTANT**: The minting wallet needs a small amount of ETH (~$10) on Base to pay gas fees for minting NFTs.

## Step 6: Verify Contracts on BaseScan

After deployment, verify each contract's source code:

### Via Thirdweb (Automatic)

Thirdweb usually auto-verifies. Check at:
- `https://basescan.org/address/YOUR_CONTRACT_ADDRESS`
- Look for green checkmark ✅ next to "Contract"

### Manual Verification (If Needed)

1. Go to [basescan.org](https://basescan.org)
2. Search your contract address
3. Click "Contract" tab → "Verify and Publish"
4. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.x (check Thirdweb dashboard)
   - License: MIT
5. Paste contract source code from Thirdweb
6. Submit verification

## Step 7: Update Environment Variables

Add contract addresses to your `.env.production`:

```bash
# NFT Contract Addresses (Base Mainnet)
VITE_CONTRACT_VERIFIER=0xYOUR_VERIFIER_CONTRACT_ADDRESS
VITE_CONTRACT_PROFESSIONAL=0xYOUR_PROFESSIONAL_CONTRACT_ADDRESS
VITE_CONTRACT_FOUNDER=0xYOUR_FOUNDER_CONTRACT_ADDRESS

# Thirdweb Configuration
VITE_THIRDWEB_CLIENT_ID=your_existing_client_id
THIRDWEB_SECRET_KEY=your_secret_key
THIRDWEB_MINTER_PRIVATE_KEY=0xYOUR_MINTING_WALLET_PRIVATE_KEY

# Network Configuration
VITE_CHAIN_ID=8453
VITE_NETWORK_NAME=base
```

In Replit:
1. Go to "Tools" → "Secrets"
2. Add each variable above
3. Restart your application

## Step 8: Test Minting

Test that server-side minting works:

```bash
# Test endpoint (use admin access or create test endpoint)
curl -X POST https://your-app.replit.app/api/test-mint \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "Verifier",
    "recipientAddress": "0xYOUR_TEST_WALLET",
    "licenseId": "NODE-TEST123"
  }'

# Expected response:
# {
#   "success": true,
#   "txHash": "0xabcdef...",
#   "contractAddress": "0x..."
# }
```

Verify the NFT:
1. Go to [basescan.org/address/YOUR_WALLET_ADDRESS](https://basescan.org)
2. Click "NFT" tab
3. You should see the minted Node Pass

## Step 9: Contract Admin Setup

### Gnosis Safe Multisig (Recommended)

Transfer contract ownership to Gnosis Safe for security:

1. **Create Gnosis Safe on Base**:
   - Go to [app.safe.global](https://app.safe.global)
   - Click "Create New Safe"
   - Select "Base" network
   - Add 3-5 signers (DAO founders/core team)
   - Set threshold: 3-of-5 recommended
   - Deploy Safe (~$5-10 gas)

2. **Transfer Contract Ownership**:
   For each contract:
   - Go to Thirdweb dashboard → Contract → "Permissions"
   - Find "Owner" role
   - Click "Transfer Ownership"
   - Enter Gnosis Safe address
   - Approve transaction

3. **Test Multisig Execution**:
   - Try updating contract metadata via Safe
   - Requires 3 signatures before execution

### Single Owner (Development/Testing Only)

Keep your personal wallet as owner during testing, but **transfer to Gnosis Safe before mainnet launch**.

## Production Checklist

Before going live with real payments:

### Contract Deployment
- [ ] All 3 contracts deployed to Base mainnet
- [ ] Contract addresses added to environment variables
- [ ] Contracts verified on BaseScan (green checkmark)
- [ ] Badge metadata uploaded to IPFS (immutable)
- [ ] Founder contract has max supply = 300
- [ ] Founder contract transfers disabled

### Permissions & Security
- [ ] Server minting wallet granted MINTER role on all contracts
- [ ] Server minting wallet has ~$50 ETH on Base for gas
- [ ] Contract ownership transferred to Gnosis Safe multisig
- [ ] Gnosis Safe has 3-5 signers with 3-of-5 threshold
- [ ] Private keys stored securely (Replit Secrets, not in code)

### Testing
- [ ] Test minting works for all 3 tiers
- [ ] Verify NFTs appear in recipient wallets on BaseScan
- [ ] Confirm transaction hashes are stored in database
- [ ] Test Founder cap enforcement (attempt to mint 301st)
- [ ] Verify Founder NFTs cannot be transferred

### Monitoring
- [ ] Set up BaseScan alerts for contract events
- [ ] Monitor gas prices (mint when Base gas is low)
- [ ] Track total supply for each tier
- [ ] Alert when Founder approaches 290/300

## Cost Breakdown

**One-Time Deployment**:
- Deploy 3 contracts: ~$45-90 (3 × $15-30 each)
- Verify contracts: Free
- Create Gnosis Safe: ~$5-10
- **Total**: ~$50-100

**Ongoing Costs**:
- Minting gas per NFT: ~$0.50-2 (Base is cheap!)
- Estimated for 300 Founders: ~$150-600
- Estimated for 1000 total nodes: ~$500-2000

**Cost Optimization**:
- Mint during low gas periods (weekends/early morning UTC)
- Consider lazy minting (claim from contract vs server mint)
- Batch minting reduces gas per NFT

## Troubleshooting

### "Insufficient funds" error
- Ensure deployer wallet has enough ETH on Base
- Need ~$100 to deploy all contracts + buffer

### "Network mismatch" error
- Confirm you selected "Base" not "Base Sepolia"
- Chain ID should be 8453 (not 84532)

### Minting fails with "Unauthorized"
- Check minting wallet has MINTER role
- Verify THIRDWEB_MINTER_PRIVATE_KEY is correct
- Ensure minting wallet has ETH for gas

### NFT doesn't appear in wallet
- Wait 1-2 minutes for indexing
- Check BaseScan directly: basescan.org/address/WALLET
- Verify transaction succeeded (green checkmark)

### Founder transfers not blocked
- Check contract has transfer lock enabled
- May need custom contract with _beforeTokenTransfer override
- Test transfer attempt - should revert with error message

## Post-Deployment Actions

After successful deployment:

1. **Update Documentation**:
   - Add contract addresses to README
   - Document admin procedures
   - Create runbook for common tasks

2. **Notify Stakeholders**:
   - Share contract addresses with DAO
   - Publish on social media (optional)
   - Add to website/docs

3. **Monitor Launch**:
   - Watch BaseScan for first mints
   - Track gas costs per mint
   - Monitor for any errors

4. **Backup Everything**:
   - Export ABI files from Thirdweb
   - Save deployment transaction hashes
   - Document all contract addresses
   - Back up Gnosis Safe recovery info

## Support Resources

- **Thirdweb Docs**: [portal.thirdweb.com](https://portal.thirdweb.com)
- **Base Docs**: [docs.base.org](https://docs.base.org)
- **BaseScan**: [basescan.org](https://basescan.org)
- **Thirdweb Discord**: [discord.gg/thirdweb](https://discord.gg/thirdweb)
- **Base Discord**: [discord.gg/buildonbase](https://discord.gg/buildonbase)

---

**Ready to Deploy?** 

Follow the steps above in order, and you'll have production-ready NFT contracts on Base Mainnet within an hour! 

Remember: Test everything on Base Sepolia first if you want to practice without spending real ETH.
