import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uuid, integer, jsonb, numeric, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ownerUserId: uuid("owner_user_id"),
  ownerWallet: text("owner_wallet"),
  legalName: text("legal_name").notNull(),
  dba: text("dba"),
  ein: text("ein").notNull(),
  entityType: text("entity_type").notNull(),
  foundedYear: integer("founded_year"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  regions: jsonb("regions").notNull(),
  trades: jsonb("trades").notNull(),
  specialties: jsonb("specialties"),
  capacity: jsonb("capacity"),
  payoutMethod: text("payout_method"),
  payoutDetails: jsonb("payout_details"),
  status: text("status").notNull().default("draft"),
  tier: text("tier"),
  riskScore: numeric("risk_score"),
  searchable: boolean("searchable").default(false),
  verifierEligible: boolean("verifier_eligible").default(false),
  notes: text("notes"),
});

export const vendorDocuments = pgTable("vendor_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  type: text("type").notNull(),
  fileUrl: text("file_url").notNull(),
  sha256: text("sha256").notNull(),
  number: text("number"),
  state: text("state"),
  issuer: text("issuer"),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  verified: boolean("verified").default(false),
  verificationNotes: text("verification_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const legalAgreements = pgTable("legal_agreements", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  type: text("type").notNull().default("MPA"),
  version: text("version").notNull(),
  signedAt: timestamp("signed_at").notNull(),
  signerName: text("signer_name").notNull(),
  signerIp: text("signer_ip").notNull(),
  signerWallet: text("signer_wallet").notNull(),
  docHash: text("doc_hash").notNull(),
  fileUrl: text("file_url"),
  accepted: boolean("accepted").default(false),
});

export const vendorFlags = pgTable("vendor_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  flag: text("flag").notNull(),
  severity: text("severity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
});

export const vendorReviews = pgTable("vendor_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  reviewerUserId: uuid("reviewer_user_id").notNull(),
  decision: text("decision").notNull(),
  reasons: jsonb("reasons"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id"),
  payload: jsonb("payload"),
  ts: timestamp("ts").defaultNow().notNull(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorDocumentSchema = createInsertSchema(vendorDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertLegalAgreementSchema = createInsertSchema(legalAgreements).omit({
  id: true,
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendorDocument = z.infer<typeof insertVendorDocumentSchema>;
export type VendorDocument = typeof vendorDocuments.$inferSelect;
export type InsertLegalAgreement = z.infer<typeof insertLegalAgreementSchema>;
export type LegalAgreement = typeof legalAgreements.$inferSelect;
export type VendorFlag = typeof vendorFlags.$inferSelect;
export type VendorReview = typeof vendorReviews.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  clientName: text("client_name").notNull(),
  clientLocation: text("client_location").notNull(),
  budgetMin: numeric("budget_min"),
  budgetMax: numeric("budget_max"),
  status: text("status").notNull().default("open"),
  category: text("category").notNull(),
  postedAt: timestamp("posted_at").defaultNow().notNull(),
});

export const vendorJobs = pgTable("vendor_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  jobId: uuid("job_id").notNull(),
  status: text("status").notNull().default("bidding"),
  bidAmount: numeric("bid_amount"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  escrowAmount: numeric("escrow_amount"),
  escrowStatus: text("escrow_status"),
  fundingType: text("funding_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobMilestones = pgTable("job_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorJobId: uuid("vendor_job_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  amount: numeric("amount"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vendorEarnings = pgTable("vendor_earnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  vendorJobId: uuid("vendor_job_id"),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("pending"),
  type: text("type").notNull(),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vendorTrustScore = pgTable("vendor_trust_score", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().unique(),
  score: numeric("score").notNull().default("0"),
  daoRating: text("dao_rating"),
  totalJobs: integer("total_jobs").default(0),
  completedJobs: integer("completed_jobs").default(0),
  lifetimeTokens: integer("lifetime_tokens").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorJobSchema = createInsertSchema(vendorJobs).omit({
  id: true,
  createdAt: true,
});

export const insertJobMilestoneSchema = createInsertSchema(jobMilestones).omit({
  id: true,
  createdAt: true,
});

export const insertVendorEarningSchema = createInsertSchema(vendorEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertVendorTrustScoreSchema = createInsertSchema(vendorTrustScore).omit({
  id: true,
  updatedAt: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertVendorJob = z.infer<typeof insertVendorJobSchema>;
export type VendorJob = typeof vendorJobs.$inferSelect;
export type InsertJobMilestone = z.infer<typeof insertJobMilestoneSchema>;
export type JobMilestone = typeof jobMilestones.$inferSelect;
export type InsertVendorEarning = z.infer<typeof insertVendorEarningSchema>;
export type VendorEarning = typeof vendorEarnings.$inferSelect;
export type InsertVendorTrustScore = z.infer<typeof insertVendorTrustScoreSchema>;
export type VendorTrustScore = typeof vendorTrustScore.$inferSelect;
