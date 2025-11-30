import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Node tiers enum
export enum NodeTier {
  FOUNDING = "founding",
  PROFESSIONAL = "professional",
  VERIFIER = "verifier"
}

// Node status enum
export enum NodeStatus {
  GREEN = "green",
  AMBER = "amber",
  RED = "red"
}

// Verification task status enum
export enum TaskStatus {
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  COMPLETED = "completed",
  UPHELD = "upheld",
  OVERTURNED = "overturned"
}

// Nodes table
export const nodes = pgTable("nodes", {
  nodeId: varchar("node_id").primaryKey().default(sql`gen_random_uuid()`),
  licenseId: varchar("license_id").notNull().unique(),
  identityId: varchar("identity_id").notNull(),
  tier: varchar("tier").notNull(),
  ownerWallet: varchar("owner_wallet").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertNodeSchema = createInsertSchema(nodes).omit({
  nodeId: true,
  createdAt: true
});

export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = typeof nodes.$inferSelect;

// Telemetry heartbeat table
export const telemetryHeartbeat = pgTable("telemetry_heartbeat", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseId: varchar("license_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const insertTelemetryHeartbeatSchema = createInsertSchema(telemetryHeartbeat).omit({
  id: true,
  timestamp: true
});

export type InsertTelemetryHeartbeat = z.infer<typeof insertTelemetryHeartbeatSchema>;
export type TelemetryHeartbeat = typeof telemetryHeartbeat.$inferSelect;

// Telemetry summary table
export const telemetrySummary = pgTable("telemetry_summary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseId: varchar("license_id").notNull().unique(),
  uptime24h: real("uptime_24h").notNull(),
  slaPass: boolean("sla_pass").notNull(),
  status: varchar("status").notNull(),
  lastUpdate: timestamp("last_update").defaultNow().notNull()
});

export const insertTelemetrySummarySchema = createInsertSchema(telemetrySummary).omit({
  id: true,
  lastUpdate: true
});

export type InsertTelemetrySummary = z.infer<typeof insertTelemetrySummarySchema>;
export type TelemetrySummary = typeof telemetrySummary.$inferSelect;

// Verification tasks table
export const verificationTasks = pgTable("verification_tasks", {
  taskId: varchar("task_id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  assignedTo: varchar("assigned_to").notNull(),
  weight: integer("weight").notNull(),
  status: varchar("status").notNull(),
  accuracyScore: real("accuracy_score"),
  bountyAmount: real("bounty_amount"),
  evidence: text("evidence"),
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});

export const insertVerificationTaskSchema = createInsertSchema(verificationTasks).omit({
  taskId: true,
  createdAt: true,
  completedAt: true
});

export type InsertVerificationTask = z.infer<typeof insertVerificationTaskSchema>;
export type VerificationTask = typeof verificationTasks.$inferSelect;

// Bounty records table
export const bountyRecords = pgTable("bounty_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull(),
  wallet: varchar("wallet").notNull(),
  amount: real("amount").notNull(),
  epochDate: varchar("epoch_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertBountyRecordSchema = createInsertSchema(bountyRecords).omit({
  id: true,
  createdAt: true
});

export type InsertBountyRecord = z.infer<typeof insertBountyRecordSchema>;
export type BountyRecord = typeof bountyRecords.$inferSelect;

// Rewards ledger table
export const rewardsLedger = pgTable("rewards_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  epoch: varchar("epoch").notNull(),
  nodeId: varchar("node_id").notNull(),
  feuUsed: real("feu_used").notNull(),
  baseReward: real("base_reward").notNull(),
  bountyReward: real("bounty_reward").notNull(),
  totalReward: real("total_reward").notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  txHash: varchar("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertRewardsLedgerSchema = createInsertSchema(rewardsLedger).omit({
  id: true,
  createdAt: true
});

export type InsertRewardsLedger = z.infer<typeof insertRewardsLedgerSchema>;
export type RewardsLedger = typeof rewardsLedger.$inferSelect;

// Governance parameters table
export const governanceParams = pgTable("governance_params", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nrp: real("nrp").notNull(),
  feuF: real("feu_f").notNull(),
  feuP: real("feu_p").notNull(),
  feuV: real("feu_v").notNull(),
  slaFounder: real("sla_founder").notNull(),
  slaProfessional: real("sla_professional").notNull(),
  slaVerifier: real("sla_verifier").notNull(),
  baseBountyRate: real("base_bounty_rate").notNull(),
  jobWeights: jsonb("job_weights").notNull(),
  dampenerTable: jsonb("dampener_table").notNull(),
  epochLength: integer("epoch_length").notNull(),
  maxEpochSpend: real("max_epoch_spend").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertGovernanceParamsSchema = createInsertSchema(governanceParams).omit({
  id: true,
  updatedAt: true
});

export type InsertGovernanceParams = z.infer<typeof insertGovernanceParamsSchema>;
export type GovernanceParams = typeof governanceParams.$inferSelect;

// Alert records table
export const alertRecords = pgTable("alert_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertType: varchar("alert_type").notNull(),
  severity: varchar("severity").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertAlertRecordSchema = createInsertSchema(alertRecords).omit({
  id: true,
  createdAt: true
});

export type InsertAlertRecord = z.infer<typeof insertAlertRecordSchema>;
export type AlertRecord = typeof alertRecords.$inferSelect;

// Type definitions for API responses and business logic

export interface NodeWithSummary extends Node {
  summary?: TelemetrySummary;
  effectiveFeu?: number;
}

export interface WhaleIdentity {
  identityId: string;
  nodeCount: number;
  rawFeu: number;
  effectiveFeu: number;
  dampenerApplied: number;
  nodes: Node[];
}

export interface KPIOverview {
  activeNodes: {
    total: number;
    byTier: {
      founding: number;
      professional: number;
      verifier: number;
    };
  };
  slaPassRate: number;
  nrpUtilization: number;
  pendingTasks: number;
  verificationsToday: {
    assigned: number;
    completed: number;
    upheldPercent: number;
  };
  emissionsToday: {
    total: number;
    byTier: {
      founding: number;
      professional: number;
      verifier: number;
    };
  };
  bountyPayouts: {
    today: number;
    week: number;
    month: number;
  };
}

export interface EmissionCalculation {
  epoch: string;
  totalFeu: number;
  rewardPerFeu: number;
  nodeRewards: {
    nodeId: string;
    feuUsed: number;
    baseReward: number;
    bountyReward: number;
    totalReward: number;
  }[];
  merkleRoot: string;
}

export interface ClaimProof {
  nodeId: string;
  epoch: string;
  totalReward: number;
  proof: string[];
  merkleRoot: string;
}
