import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Buyer records table for TUDAO Node Pass purchases
// Optimized for production with strategic indexes for common query patterns
export const buyers = pgTable("buyers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  email: text("email"),
  name: text("name"),
  wallet: text("wallet").notNull(),
  tier: text("tier", { enum: ["Verifier", "Professional", "Founder"] }).notNull(),
  priceUsd: integer("price_usd").notNull(),
  paymentMethod: text("payment_method", { enum: ["card", "ach", "crypto", "wire", "test", "founding_team"] }).notNull(),
  status: text("status", { enum: ["pending_wire", "active", "refunded"] }).notNull().default("active"),
  licenseId: text("license_id").notNull(),
  txHash: text("tx_hash"),
  nextStep: text("next_step", { enum: ["self", "managed", "cloud"] }),
  receiptSent: boolean("receipt_sent").default(false).notNull(),
  foundingTeamRole: text("founding_team_role", { enum: ["Architect", "Regent", "Councilor", "Guardian", "Oracle"] }),
}, (table) => ({
  // Unique constraint: Each license ID must be unique
  licenseIdIdx: uniqueIndex("buyers_license_id_idx").on(table.licenseId),
  
  // Performance indexes for common query patterns:
  // 1. Dashboard lookup by wallet (most common query)
  walletIdx: index("buyers_wallet_idx").on(table.wallet),
  
  // 2. Admin queries filtering by tier (analytics, cap enforcement)
  tierIdx: index("buyers_tier_idx").on(table.tier),
  
  // 3. Admin queries filtering by status (pending wires, refunds)
  statusIdx: index("buyers_status_idx").on(table.status),
  
  // 4. Chronological sorting and time-based queries
  createdAtIdx: index("buyers_created_at_idx").on(table.createdAt),
  
  // 5. Composite index for wallet + status (dashboard active licenses)
  walletStatusIdx: index("buyers_wallet_status_idx").on(table.wallet, table.status),
}));

export const insertBuyerSchema = createInsertSchema(buyers).omit({
  id: true,
  createdAt: true,
});

export const updateBuyerSchema = z.object({
  nextStep: z.enum(["self", "managed", "cloud"]).optional(),
  status: z.enum(["pending_wire", "active", "refunded"]).optional(),
  wallet: z.string().optional(), // Allow wallet updates for embedded wallet integration
  txHash: z.string().nullable().optional(), // Allow tx hash updates when NFT is minted
});

export type InsertBuyer = z.infer<typeof insertBuyerSchema>;
export type UpdateBuyer = z.infer<typeof updateBuyerSchema>;
export type Buyer = typeof buyers.$inferSelect;

// Tier configuration type
export type TierName = "Verifier" | "Professional" | "Founder";

export interface TierConfig {
  name: TierName;
  price: number;
  features: string[];
  recommended?: boolean;
}
