import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "user" or "admin"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
}).extend({
  role: z.enum(["user", "admin"]).default("user"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const scopeSessions = pgTable("scope_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceDescription: text("service_description").notNull(),
  serviceIntent: text("service_intent"), // "service" (fix/maintain) or "installation" (add/install/new)
  propertyType: text("property_type"), // "residential" or "commercial" - TUDAO serves both with professional standards
  detectedServiceType: text("detected_service_type"),
  subcategory: text("subcategory"), // More specific service category (e.g., "Build deck" under "Carpentry")
  recommendedProviderType: text("recommended_provider_type"),
  currentQuestionIndex: integer("current_question_index").default(0).notNull(),
  status: text("status").notNull().default("active"),
  aiAnalysis: jsonb("ai_analysis"),
  answers: jsonb("answers").default(sql`'{}'::jsonb`).notNull(),
  generatedScope: text("generated_scope"),
  structuredScope: jsonb("structured_scope"), // New: Structured scope with line_items, materials, labor, permits, etc.
  aiInteractions: jsonb("ai_interactions").default(sql`'[]'::jsonb`).notNull(), // AI assistant advice/enrichment history
  zipCode: text("zip_code"), // New: ZIP code for permit/jurisdiction lookup
  isUrgent: integer("is_urgent").default(0).notNull(),
  urgentFeePercent: integer("urgent_fee_percent").default(25).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScopeSessionSchema = createInsertSchema(scopeSessions).omit({
  id: true,
  createdAt: true,
}).extend({
  propertyType: z.string().nullable().optional(),
});

export type InsertScopeSession = z.infer<typeof insertScopeSessionSchema>;
export type ScopeSession = typeof scopeSessions.$inferSelect;

export const uploadedAssets = pgTable("uploaded_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  analysisResult: jsonb("analysis_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUploadedAssetSchema = createInsertSchema(uploadedAssets).omit({
  id: true,
  createdAt: true,
});

export type InsertUploadedAsset = z.infer<typeof insertUploadedAssetSchema>;
export type UploadedAsset = typeof uploadedAssets.$inferSelect;

export const dynamicQuestions = pgTable("dynamic_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  options: jsonb("options"),
  answer: text("answer"),
  aiRationale: text("ai_rationale"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDynamicQuestionSchema = createInsertSchema(dynamicQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertDynamicQuestion = z.infer<typeof insertDynamicQuestionSchema>;
export type DynamicQuestion = typeof dynamicQuestions.$inferSelect;

export const completedJobs = pgTable("completed_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  serviceType: text("service_type").notNull(),
  subcategory: text("subcategory"), // More specific service category (e.g., "Door Installation" under "Carpentry")
  propertyType: text("property_type"), // "residential" or "commercial" - helps AI match similar jobs
  serviceDescription: text("service_description").notNull(),
  originalScope: text("original_scope").notNull(),
  providerType: text("provider_type"),
  rating: text("rating"), // "training" (curated examples) or actual star rating for completed jobs
  
  // ACTUAL OUTCOMES (ground truth from completed job)
  actualManHours: real("actual_man_hours"),
  actualCost: integer("actual_cost"), // in cents
  materialsUsed: text("materials_used"),
  customerRating: integer("customer_rating"), // 1-5 stars
  
  // ESTIMATED VALUES (what AI predicted)
  estimatedManHours: real("estimated_man_hours"),
  estimatedCost: integer("estimated_cost"), // in cents
  
  // LEARNING METRICS
  accuracyScore: real("accuracy_score"), // 0.0-1.0, calculated from (estimated vs actual)
  
  // FEEDBACK LOOPS
  customerFeedback: text("customer_feedback"), // Open-ended text from customer
  vendorFeedback: text("vendor_feedback"), // Vendor's experience and suggestions
  issuesEncountered: text("issues_encountered"), // Problems during job (helps AI learn edge cases)
  
  // DATA QUALITY & CLASSIFICATION
  dataSource: text("data_source").notNull().default("actual_completion"), // 'actual_completion' or 'admin_seed'
  isTrainingExample: integer("is_training_example").default(0).notNull(), // 1 = curated high-quality example
  tags: jsonb("tags"), // ["quick_fix", "complex", "weather_delay"] for better matching
  
  vendorId: varchar("vendor_id"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  
  // RAG LEARNING: Store questions asked during scope generation
  // Format: [{ question: "...", answer: "..." }]
  questionAnswers: jsonb("question_answers"),
  
  // VENDOR FEEDBACK LOOP: Vendor clarifying questions that should have been asked upfront
  // Format: [{ question: "...", answer: "...", askedAt: "2025-01-15T..." }]
  vendorQuestions: jsonb("vendor_questions"),
  
  // MATERIAL CALCULATION FORMULAS: Store calculation rules that convert answers to line-item costs
  // Format: { categories: [{ name: "Framing", items: [{ name: "Joists", formula: "sqft / 1.33", unit: "boards", unitPrice: 12.50 }] }] }
  materialCalculations: jsonb("material_calculations"),
  
  // NARRATIVE SCOPE (for dispute prevention and RAG learning)
  narrativeExistingConditions: text("narrative_existing_conditions"),
  narrativeProjectDescription: text("narrative_project_description"),
  narrativeScopeOfWork: jsonb("narrative_scope_of_work"), // Array of step-by-step procedures
  
  // FORMATTED PROPOSAL (client-facing TUDAO proposal document)
  formattedProposal: text("formatted_proposal"), // Professional formatted proposal using TUDAO template
});

export const insertCompletedJobSchema = createInsertSchema(completedJobs).omit({
  id: true,
}).extend({
  propertyType: z.string().nullable().optional(),
});

export type InsertCompletedJob = z.infer<typeof insertCompletedJobSchema>;
export type CompletedJob = typeof completedJobs.$inferSelect;

// NEW: Question Library System
export const serviceQuestions = pgTable("service_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: text("service_type").notNull(),
  propertyType: text("property_type"), // null = both, "residential", "commercial" - question applies to which property type
  subcategory: text("subcategory"),
  questionText: text("question_text").notNull(),
  responseType: text("response_type").notNull(), // 'text', 'choice', 'file', 'date'
  options: jsonb("options"), // for multiple choice
  requiredForScope: integer("required_for_scope").default(1).notNull(), // 1 = true, 0 = false
  conditionalTag: text("conditional_tag"), // e.g., "if leak_point = 'Faucet head'"
  sequence: integer("sequence").notNull(), // display order
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceQuestionSchema = createInsertSchema(serviceQuestions).omit({
  id: true,
  createdAt: true,
}).extend({
  propertyType: z.string().nullable().optional(),
});

export type InsertServiceQuestion = z.infer<typeof insertServiceQuestionSchema>;
export type ServiceQuestion = typeof serviceQuestions.$inferSelect;

// NEW: Session State Tracking
export const sessionStates = pgTable("session_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // optional
  serviceIntent: text("service_intent"), // NEW: "service" (labor-only) or "installation" (materials + labor)
  serviceType: text("service_type").notNull(),
  subcategory: text("subcategory"),
  confidence: integer("confidence").notNull(), // 0-100 (0.0-1.0 * 100)
  initialMessage: text("initial_message").notNull(),
  answers: jsonb("answers").default(sql`'{}'::jsonb`).notNull(), // { question_id: answer }
  aiAnalysis: jsonb("ai_analysis"), // GPT-4o Vision analysis of uploaded photos
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSessionStateSchema = createInsertSchema(sessionStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSessionState = z.infer<typeof insertSessionStateSchema>;
export type SessionState = typeof sessionStates.$inferSelect;

// NEW: Generated Scopes
export const scopesGenerated = pgTable("scopes_generated", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  details: jsonb("details").notNull(), // structured data from answers
  estimatedHours: integer("estimated_hours"), // in tenths (15 = 1.5 hours)
  materialsNeeded: jsonb("materials_needed"), // array of materials
  complexity: text("complexity"), // 'Low', 'Medium', 'High'
  vendorType: text("vendor_type"),
  summary: text("summary"), // human-readable summary
  addOnFees: jsonb("add_on_fees").default(sql`'[]'::jsonb`), // [{name: "Satellite measurement", amount: 199}]
  totalAddOnFees: integer("total_add_on_fees").default(0), // Total in cents
  hourlyRate: integer("hourly_rate"), // in cents (e.g., 7500 = $75/hr)
  estimatedLaborCost: integer("estimated_labor_cost"), // in cents
  estimatedMaterialCost: integer("estimated_material_cost"), // in cents
  estimatedTotalCost: integer("estimated_total_cost"), // in cents (labor + materials + add-ons)
  status: text("status").notNull().default("unmatched"), // 'unmatched', 'matched', 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScopeGeneratedSchema = createInsertSchema(scopesGenerated).omit({
  id: true,
  createdAt: true,
});

export type InsertScopeGenerated = z.infer<typeof insertScopeGeneratedSchema>;
export type ScopeGenerated = typeof scopesGenerated.$inferSelect;

// Human Corrections for Continuous Learning
export const humanCorrections = pgTable("human_corrections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  scopeId: varchar("scope_id"), // Reference to scopesGenerated if applicable
  correctedField: text("corrected_field").notNull(), // e.g., "vision_material", "estimated_hours", "subcategory"
  oldValue: text("old_value"), // AI's original value
  newValue: text("new_value").notNull(), // Corrected value
  correctedBy: text("corrected_by").notNull(), // "vendor", "customer", "admin"
  agentResponsible: text("agent_responsible"), // "vision", "rag", "sow", "cost_estimator"
  correctionReason: text("correction_reason"), // Optional explanation
  jobDataSnapshot: jsonb("job_data_snapshot"), // Full sessionStates data at time of correction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHumanCorrectionSchema = createInsertSchema(humanCorrections).omit({
  id: true,
  createdAt: true,
});

export type InsertHumanCorrection = z.infer<typeof insertHumanCorrectionSchema>;
export type HumanCorrection = typeof humanCorrections.$inferSelect;

export const quickbooksConnections = pgTable("quickbooks_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  realmId: text("realm_id").notNull(),
  companyName: text("company_name"),
  expiresAt: timestamp("expires_at").notNull(),
  syncEnabled: integer("sync_enabled").default(1).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuickbooksConnectionSchema = createInsertSchema(quickbooksConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuickbooksConnection = z.infer<typeof insertQuickbooksConnectionSchema>;
export type QuickbooksConnection = typeof quickbooksConnections.$inferSelect;

// NEW: Production Standards for accurate time and cost estimation
export const productionStandards = pgTable("production_standards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: text("service_type").notNull(), // 'HVAC', 'Plumbing', 'Landscaping', etc.
  propertyType: text("property_type"), // null = both, "residential", "commercial" - standard applies to which property type
  qualityTier: text("quality_tier"), // "tudao_standard" = TUDAO professional standard, "industry_baseline", "premium"
  subcategory: text("subcategory"), // 'Fence Installation', 'Lawn Maintenance', etc.
  itemDescription: text("item_description").notNull(), // 'Vinyl fence installation', '6ft wood privacy fence', etc.
  unitOfMeasure: text("unit_of_measure").notNull(), // 'linear_feet', 'square_feet', 'each', 'hour', etc.
  laborHoursPerUnit: real("labor_hours_per_unit"), // e.g., 0.125 hours per linear foot (8 ft/hour)
  materialCostPerUnit: integer("material_cost_per_unit"), // in cents, e.g., 1500 = $15/ft
  notes: text("notes"), // Additional context, e.g., "Includes concrete setting time"
  source: text("source"), // 'manual', 'completed_job', 'quickbooks', 'uploaded'
  isActive: integer("is_active").default(1).notNull(), // 1 = active, 0 = archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductionStandardSchema = createInsertSchema(productionStandards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  propertyType: z.string().nullable().optional(),
  qualityTier: z.string().nullable().optional(),
});

export type InsertProductionStandard = z.infer<typeof insertProductionStandardSchema>;
export type ProductionStandard = typeof productionStandards.$inferSelect;
