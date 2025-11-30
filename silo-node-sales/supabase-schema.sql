-- TUDAO Node Pass - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the buyers table

-- Create buyers table
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email TEXT,
  name TEXT,
  wallet TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('Verifier', 'Professional', 'Founder')),
  price_usd INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'crypto', 'wire', 'test')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending_wire', 'active', 'refunded')),
  license_id TEXT NOT NULL UNIQUE,
  tx_hash TEXT,
  next_step TEXT CHECK (next_step IN ('self', 'managed', 'cloud')),
  receipt_sent BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS buyers_wallet_idx ON buyers(wallet);
CREATE INDEX IF NOT EXISTS buyers_license_id_idx ON buyers(license_id);
CREATE INDEX IF NOT EXISTS buyers_status_idx ON buyers(status);
CREATE INDEX IF NOT EXISTS buyers_created_at_idx ON buyers(created_at DESC);

-- Add Row Level Security (RLS) policies
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read their own records by wallet
CREATE POLICY "Users can read own records by wallet"
  ON buyers
  FOR SELECT
  USING (wallet = current_setting('request.jwt.claims', true)::json->>'wallet');

-- Policy: Service role can do everything (for backend API)
CREATE POLICY "Service role has full access"
  ON buyers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Optional: Add comments for documentation
COMMENT ON TABLE buyers IS 'TUDAO Node Pass buyer records';
COMMENT ON COLUMN buyers.tier IS 'Node tier: Verifier ($500), Professional ($5k), or Founder ($10k)';
COMMENT ON COLUMN buyers.payment_method IS 'How the user paid: card, crypto (USDC), wire transfer, or test';
COMMENT ON COLUMN buyers.status IS 'License status: pending_wire (awaiting payment), active, or refunded';
COMMENT ON COLUMN buyers.license_id IS 'Unique license identifier shown to user (e.g., NODE-ABC123XY)';
COMMENT ON COLUMN buyers.tx_hash IS 'Blockchain transaction hash from NFT mint';
COMMENT ON COLUMN buyers.next_step IS 'Operator setup preference: self-operated, managed, or cloud waitlist';
