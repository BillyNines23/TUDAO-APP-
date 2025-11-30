# TUDAO Node Pass - Checkout & Dashboard

A Web3 NFT checkout and dashboard application for selling TUDAO Node Licenses with three tiers (Verifier, Professional, Founder). Built with React, Thirdweb for NFT minting on Base blockchain, and Supabase for buyer records.

## Features

- **Three-Tier Node Licenses**: Verifier ($500), Professional ($5,000), Founder ($10,000)
- **Multiple Payment Methods**: Crypto (USDC on Base), Card on-ramp, Bank/Wire transfer
- **NFT Minting**: Automatic NFT claiming via Thirdweb after payment
- **Buyer Dashboard**: View license details, download badges, select operator setup
- **Environment-Driven**: Switch between Base Sepolia (test) and Base (mainnet) via env vars
- **Mobile-First**: Fully responsive design optimized for all devices

## Quick Start

### Prerequisites

- Node.js 20+
- Thirdweb account with client ID
- Supabase project
- (Optional) Deployed NFT Drop contracts on Base Sepolia/Base

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in required environment variables:
   ```env
   # Required
   VITE_THIRDWEB_CLIENT_ID=your_client_id
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   
   # Contract addresses (get these from Thirdweb dashboard)
   VITE_CONTRACT_VERIFIER=0x...
   VITE_CONTRACT_PROFESSIONAL=0x...
   VITE_CONTRACT_FOUNDER=0x...
   ```

### Running Locally

```bash
# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

## Environment Variables Reference

### Network Configuration

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `VITE_CHAIN_ID` | `84532` \| `8453` | `84532` | 84532 = Base Sepolia, 8453 = Base mainnet |
| `VITE_NETWORK_NAME` | `base-sepolia` \| `base` | `base-sepolia` | Network display name |

### Feature Flags

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `VITE_DISABLE_CARD_ONRAMP` | `true` \| `false` | `true` | Hide card payment button (use true for test mode) |
| `VITE_EMAIL_DISABLED` | `true` \| `false` | `true` | Skip email receipt sending |

### Tier Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_TIER_VERIFIER_PRICE_USD` | `500` | Verifier tier price |
| `VITE_TIER_PROFESSIONAL_PRICE_USD` | `5000` | Professional tier price |
| `VITE_TIER_FOUNDER_PRICE_USD` | `10000` | Founder tier price |
| `VITE_INVENTORY_CAP_VERIFIER` | `0` | Max Verifier licenses (0 = unlimited) |
| `VITE_INVENTORY_CAP_PROFESSIONAL` | `0` | Max Professional licenses |
| `VITE_INVENTORY_CAP_FOUNDER` | `300` | Max Founder licenses |

### Integration Keys

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_THIRDWEB_CLIENT_ID` | ✅ Yes | Thirdweb client ID from dashboard |
| `VITE_CONTRACT_VERIFIER` | ✅ Yes | Verifier tier NFT contract address |
| `VITE_CONTRACT_PROFESSIONAL` | ✅ Yes | Professional tier NFT contract address |
| `VITE_CONTRACT_FOUNDER` | ✅ Yes | Founder tier NFT contract address |
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_KEY` | ✅ Yes | Supabase service role key (server-side only) |

### Asset URLs

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_ASSETS_BADGE_VERIFIER_URL` | No | S3/CloudFront URL for Verifier badge PNG |
| `VITE_ASSETS_BADGE_PROFESSIONAL_URL` | No | Professional badge PNG URL |
| `VITE_ASSETS_BADGE_FOUNDER_URL` | No | Founder badge PNG URL |
| `VITE_ASSETS_SETUP_PDF_URL` | No | Setup guide PDF URL |

## Switching from Test to Mainnet

To switch from Base Sepolia (test) to Base (mainnet):

1. Update environment variables:
   ```env
   VITE_CHAIN_ID=8453
   VITE_NETWORK_NAME=base
   VITE_DISABLE_CARD_ONRAMP=false
   
   # Update contract addresses to mainnet deployments
   VITE_CONTRACT_VERIFIER=0x_mainnet_address
   VITE_CONTRACT_PROFESSIONAL=0x_mainnet_address
   VITE_CONTRACT_FOUNDER=0x_mainnet_address
   ```

2. No code changes required - the app automatically adapts!

3. Restart the application:
   ```bash
   npm run dev
   ```

## Pages

### `/checkout?tier=Verifier|Professional|Founder`

Main purchase page where users:
- Select a tier (via URL parameter)
- View tier details, pricing, and features
- Choose payment method (Crypto, Card, or Wire)
- Complete purchase and mint NFT

**Test Mode**: Shows banner when on Base Sepolia, hides card payment option

### `/success`

Post-purchase confirmation page showing:
- License ID (with copy button)
- Tier badge
- Wallet address
- Purchase date
- Links to dashboard, badge download, setup PDF

### `/dashboard`

Owner dashboard displaying:
- License status and details
- Quick actions (download badge, setup PDF, contact support)
- Operator setup selection (Self, Managed, Cloud)
- Pending wire transfer status (if applicable)

## Supabase Schema

Create this table in your Supabase project:

```sql
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email TEXT,
  name TEXT,
  wallet TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('Verifier', 'Professional', 'Founder')),
  price_usd INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'crypto', 'wire', 'test')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending_wire', 'active', 'refunded')),
  license_id TEXT NOT NULL,
  tx_hash TEXT,
  next_step TEXT CHECK (next_step IN ('self', 'managed', 'cloud')),
  receipt_sent BOOLEAN NOT NULL DEFAULT false
);

-- Index for faster wallet lookups
CREATE INDEX buyers_wallet_idx ON buyers(wallet);
```

## Wire Payment Workflow

For bank/wire transfers:

1. **User Submits**: User fills form with name, email, wallet → creates `buyers` row with `status='pending_wire'`
2. **Backend Sends Instructions**: Email with wire transfer details sent to user
3. **Manual Verification**: Operator checks Supabase console for incoming payments
4. **Activate License**: In Supabase, update row: `status='active'` → triggers NFT mint + receipt email

**To mark a wire payment as paid:**

1. Open Supabase dashboard → Table Editor → `buyers`
2. Find the row with matching email/wallet
3. Update `status` from `pending_wire` to `active`
4. Update `tx_hash` with the NFT mint transaction hash
5. Save changes

## Deployment on AWS Amplify

1. **Connect Repository**:
   - Go to AWS Amplify console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository

2. **Build Settings** (auto-detected):
   ```yaml
   version: 1
   frontend:
     phases:
       build:
         commands:
           - npm ci
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
   ```

3. **Environment Variables**:
   - In Amplify console, go to "Environment variables"
   - Add all `VITE_*` variables and `SUPABASE_SERVICE_KEY`
   - Ensure no quotes around values

4. **Deploy**:
   - Click "Save and deploy"
   - Amplify will build and deploy automatically
   - Use the provided URL or add custom domain

## Architecture

```
Frontend (React + Vite)
├── Thirdweb SDK → Wallet connection, NFT claiming
├── Supabase Client → Buyer records, dashboard data
└── Environment Config → Feature flags, network switching

Backend (Express)
├── Supabase Server Client → Database operations
├── Thirdweb SDK → Server-side NFT operations
└── API Routes → Payment processing, record creation
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Web3**: Thirdweb SDK v5, Base blockchain
- **Database**: Supabase (PostgreSQL)
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query (React Query)
- **Routing**: Wouter

## Support

For issues or questions:
- Email: support@tradeuniondao.com
- Check Supabase console for transaction logs
- Review browser console for client-side errors
- Check server logs for API issues

## License

Proprietary - TUDAO Project
