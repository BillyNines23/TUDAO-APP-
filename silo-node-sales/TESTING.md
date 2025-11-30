# Testing Guide - TUDAO Node Pass

This application includes a **Test Mode** that allows you to test the entire checkout flow without spending real money or using mainnet contracts.

## 🧪 Test Mode vs Production Mode

### Test Mode (TEST_MODE=true)
- **Network:** Base Sepolia Testnet (Chain ID: 84532)
- **Contracts:** Testnet NFT contracts
- **Square:** Sandbox environment (test cards work)
- **Cost:** $0 - Uses test tokens and test payment methods
- **Database:** Same database (you can test end-to-end)

### Production Mode (TEST_MODE=false or unset)
- **Network:** Base Mainnet (Chain ID: 8453)
- **Contracts:** Production NFT contracts (verified on BaseScan)
- **Square:** Production environment (real money)
- **Cost:** Real payments ($500, $5,000, $10,000)
- **Database:** Same database (production sales)

---

## 🚀 How to Switch Between Modes

### Enable Test Mode

1. Go to **Secrets** tab in Replit (🔒 Tools → Secrets)
2. Add a new secret:
   - **Name:** `TEST_MODE`
   - **Value:** `true`
3. Restart the application workflow

### Disable Test Mode (Production)

1. Go to **Secrets** tab in Replit
2. Either:
   - **Option A:** Delete the `TEST_MODE` secret entirely
   - **Option B:** Change `TEST_MODE` value to `false`
3. Restart the application workflow

---

## 🧪 Testing with Test Mode

### Step 1: Enable Test Mode
Add `TEST_MODE=true` to your Replit Secrets and restart.

### Step 2: Verify Test Mode is Active
Check the server logs for:
```
============================================================
🧪 TEST MODE ENABLED - Using Base Sepolia Testnet
============================================================
✅ NFT minting configured:
   Network: Base Sepolia (Testnet)
   Chain ID: 84532
   Verifier: 0x29baE415087f9d521Aa60e055BE86c8edF13a1CC
   Professional: 0x6fc238fC491e1B8a8F5B61FaBD871BD64285f6D7
   Founder: 0xB299F787F6Ec663d2DF34cD62E062919286FDe61
✅ Square client initialized:
   Environment: Sandbox (Test)
```

### Step 3: Test Crypto Payments (USDC on Base Sepolia)

1. **Get Testnet USDC:**
   - Switch your wallet to Base Sepolia network
   - Get testnet ETH from Base Sepolia faucet: https://www.alchemy.com/faucets/base-sepolia
   - You may need testnet USDC - bridge some from other testnets if needed

2. **Make a Test Purchase:**
   - Navigate to `/checkout`
   - Select a tier (Verifier, Professional, or Founder)
   - Connect your wallet (will connect to Base Sepolia)
   - Click "Pay with Crypto"
   - Approve the transaction in your wallet
   - NFT will be minted to your address on testnet

3. **Verify:**
   - Check success page shows correct license info
   - Verify NFT appears in your wallet on Base Sepolia
   - Check admin dashboard at `/admin` to see the purchase

### Step 4: Test Square Card Payments

1. **Use Test Card Numbers:**
   Square Sandbox accepts these test cards:
   - **Success:** `4111 1111 1111 1111`
   - **Decline:** `4000 0000 0000 0002`
   - **CVV:** Any 3 digits (e.g., `123`)
   - **Expiry:** Any future date
   - **ZIP:** Any 5 digits (e.g., `12345`)

2. **Make a Test Purchase:**
   - Navigate to `/checkout`
   - Select a tier
   - Enter your wallet address manually
   - Click "Pay with Card"
   - Use a test card number above
   - Complete the payment

3. **Verify:**
   - Success page shows license details
   - Admin dashboard shows "Active" status
   - NFT minted to the provided address (on testnet)

### Step 5: Test Wire Transfer Flow

1. **Create Pending Wire:**
   - Navigate to `/checkout`
   - Select a tier
   - Enter your wallet address
   - Click "Pay with Wire Transfer"
   - Submit the form

2. **Verify Pending Status:**
   - Check admin dashboard `/admin`
   - License should appear in "Pending Wire Transfers" section
   - Status should be "Pending Payment"

3. **Test Admin Activation:**
   - Click "Activate & Mint NFT" button
   - Verify NFT minting occurs (testnet)
   - License moves to "All Licenses" with "Active" status

---

## 🚀 Production Deployment Checklist

Before going live with real payments:

1. **Disable Test Mode:**
   - Remove or set `TEST_MODE=false` in Replit Secrets
   - Restart the workflow

2. **Verify Production Mode:**
   Check logs for:
   ```
   ============================================================
   🚀 PRODUCTION MODE - Using Base Mainnet
   ============================================================
   ✅ NFT minting configured:
      Network: Base Mainnet (Production)
      Chain ID: 8453
   ✅ Square client initialized:
      Environment: Production
   ```

3. **Fund Minter Wallet:**
   - Minter wallet needs ETH on Base Mainnet for gas fees
   - Send at least 0.01 ETH for NFT minting transactions

4. **Add Admin Authentication:**
   - CRITICAL: `/admin` routes currently have NO authentication
   - Anyone with the URL can view licenses and activate payments
   - Implement authentication before production launch

5. **Test in Production:**
   - Consider making one small real purchase to verify everything works
   - Use Verifier tier ($500) as the lowest-cost test

6. **Monitor:**
   - Watch server logs for any errors
   - Check BaseScan for successful NFT mints
   - Verify payments appear in Square dashboard

---

## 📊 How to Check Current Mode

Look at the server startup logs when the workflow starts:

**Test Mode:**
```
🧪 TEST MODE ENABLED - Using Base Sepolia Testnet
```

**Production Mode:**
```
🚀 PRODUCTION MODE - Using Base Mainnet
```

You can also check:
- NFT contract addresses in logs (testnet vs mainnet addresses)
- Square environment (Sandbox vs Production)
- Chain ID (84532 = testnet, 8453 = mainnet)

---

## 🔧 Troubleshooting

### "Insufficient funds" error when minting
- **Test Mode:** Ensure minter wallet has testnet ETH on Base Sepolia
- **Production:** Ensure minter wallet has real ETH on Base Mainnet

### Square payment fails
- **Test Mode:** Ensure you're using valid test card numbers (see Step 4 above)
- **Production:** Check that `SQUARE_ACCESS_TOKEN` is for production, not sandbox

### Wrong network in wallet
- **Test Mode:** Switch MetaMask/wallet to Base Sepolia network
- **Production:** Switch to Base Mainnet network

### NFT not appearing in wallet
- Check the transaction hash on BaseScan (Sepolia or Mainnet depending on mode)
- Ensure you're viewing the correct network in your wallet
- NFTs may take a minute to appear after minting

---

## 💡 Best Practices

1. **Always test in Test Mode first** before enabling production
2. **Keep test mode enabled during development** to avoid accidental real charges
3. **Document any issues** you find during testing
4. **Use different wallets** for test vs production to avoid confusion
5. **Monitor the admin dashboard** to track all purchases in both modes
