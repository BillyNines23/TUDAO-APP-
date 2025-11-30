import { 
  type User, 
  type InsertUser,
  type ScopeSession,
  type InsertScopeSession,
  type UploadedAsset,
  type InsertUploadedAsset,
  type DynamicQuestion,
  type InsertDynamicQuestion,
  type CompletedJob,
  type InsertCompletedJob,
  type QuickbooksConnection,
  type InsertQuickbooksConnection,
  type ProductionStandard,
  type InsertProductionStandard,
  users,
  scopeSessions,
  sessionStates,
  uploadedAssets,
  dynamicQuestions,
  completedJobs,
  quickbooksConnections,
  productionStandards
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, desc, sql as drizzleSql } from "drizzle-orm";
import ws from "ws";

// Configure WebSocket for Node.js (required for Neon serverless in Node.js v21 and below)
neonConfig.webSocketConstructor = ws;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersCount(): Promise<number>;
  
  createScopeSession(session: InsertScopeSession): Promise<ScopeSession>;
  getScopeSession(id: string): Promise<ScopeSession | undefined>;
  updateScopeSession(id: string, updates: Partial<ScopeSession>): Promise<ScopeSession | undefined>;
  
  createUploadedAsset(asset: InsertUploadedAsset): Promise<UploadedAsset>;
  getAssetsBySessionId(sessionId: string): Promise<UploadedAsset[]>;
  
  createDynamicQuestion(question: InsertDynamicQuestion): Promise<DynamicQuestion>;
  getQuestionsBySessionId(sessionId: string): Promise<DynamicQuestion[]>;
  updateQuestionAnswer(id: string, answer: string): Promise<DynamicQuestion | undefined>;
  
  createCompletedJob(job: InsertCompletedJob): Promise<CompletedJob>;
  getAllCompletedJobs(): Promise<CompletedJob[]>;
  getCompletedJobsByServiceType(serviceType: string, limit?: number): Promise<CompletedJob[]>;
  findSimilarJobs(serviceType: string, description: string, limit?: number, propertyType?: string): Promise<CompletedJob[]>;
  getCompletedJobsCount(): Promise<number>;
  
  createQuickbooksConnection(connection: InsertQuickbooksConnection): Promise<QuickbooksConnection>;
  getQuickbooksConnectionByUserId(userId: string): Promise<QuickbooksConnection | undefined>;
  updateQuickbooksConnection(id: string, updates: Partial<QuickbooksConnection>): Promise<QuickbooksConnection | undefined>;
  deleteQuickbooksConnection(id: string): Promise<void>;
  
  createProductionStandard(standard: InsertProductionStandard): Promise<ProductionStandard>;
  getAllProductionStandards(): Promise<ProductionStandard[]>;
  getProductionStandardsByService(serviceType: string, subcategory?: string): Promise<ProductionStandard[]>;
  updateProductionStandard(id: string, updates: Partial<ProductionStandard>): Promise<ProductionStandard | undefined>;
  deleteProductionStandard(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scopeSessions: Map<string, ScopeSession>;
  private uploadedAssets: Map<string, UploadedAsset>;
  private dynamicQuestions: Map<string, DynamicQuestion>;
  private completedJobs: Map<string, CompletedJob>;
  private quickbooksConnections: Map<string, QuickbooksConnection>;
  private productionStandards: Map<string, ProductionStandard>;

  constructor() {
    this.users = new Map();
    this.scopeSessions = new Map();
    this.uploadedAssets = new Map();
    this.dynamicQuestions = new Map();
    this.completedJobs = new Map();
    this.quickbooksConnections = new Map();
    this.productionStandards = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, role: insertUser.role || "user" };
    this.users.set(id, user);
    return user;
  }

  async getUsersCount(): Promise<number> {
    return this.users.size;
  }

  async createScopeSession(insertSession: InsertScopeSession): Promise<ScopeSession> {
    const id = randomUUID();
    const session: ScopeSession = {
      ...insertSession,
      id,
      serviceIntent: insertSession.serviceIntent ?? null,
      propertyType: insertSession.propertyType ?? null,
      detectedServiceType: insertSession.detectedServiceType ?? null,
      recommendedProviderType: insertSession.recommendedProviderType ?? null,
      structuredScope: insertSession.structuredScope ?? null,
      zipCode: insertSession.zipCode ?? null,
      currentQuestionIndex: 0,
      status: "active",
      aiAnalysis: insertSession.aiAnalysis ?? null,
      answers: {},
      generatedScope: insertSession.generatedScope ?? null,
      isUrgent: insertSession.isUrgent ?? 0,
      urgentFeePercent: insertSession.urgentFeePercent ?? 25,
      createdAt: new Date(),
    };
    this.scopeSessions.set(id, session);
    return session;
  }

  async getScopeSession(id: string): Promise<ScopeSession | undefined> {
    return this.scopeSessions.get(id);
  }

  async updateScopeSession(id: string, updates: Partial<ScopeSession>): Promise<ScopeSession | undefined> {
    const session = this.scopeSessions.get(id);
    if (!session) return undefined;
    
    const updated = { ...session, ...updates };
    this.scopeSessions.set(id, updated);
    return updated;
  }

  async createUploadedAsset(insertAsset: InsertUploadedAsset): Promise<UploadedAsset> {
    const id = randomUUID();
    const asset: UploadedAsset = {
      ...insertAsset,
      id,
      analysisResult: insertAsset.analysisResult ?? null,
      createdAt: new Date(),
    };
    this.uploadedAssets.set(id, asset);
    return asset;
  }

  async getAssetsBySessionId(sessionId: string): Promise<UploadedAsset[]> {
    return Array.from(this.uploadedAssets.values())
      .filter(asset => asset.sessionId === sessionId);
  }

  async createDynamicQuestion(insertQuestion: InsertDynamicQuestion): Promise<DynamicQuestion> {
    const id = randomUUID();
    const question: DynamicQuestion = {
      ...insertQuestion,
      id,
      options: insertQuestion.options ?? null,
      answer: insertQuestion.answer ?? null,
      aiRationale: insertQuestion.aiRationale ?? null,
      createdAt: new Date(),
    };
    this.dynamicQuestions.set(id, question);
    return question;
  }

  async getQuestionsBySessionId(sessionId: string): Promise<DynamicQuestion[]> {
    return Array.from(this.dynamicQuestions.values())
      .filter(q => q.sessionId === sessionId)
      .sort((a, b) => a.questionIndex - b.questionIndex);
  }

  async updateQuestionAnswer(id: string, answer: string): Promise<DynamicQuestion | undefined> {
    const question = this.dynamicQuestions.get(id);
    if (!question) return undefined;
    
    const updated = { ...question, answer };
    this.dynamicQuestions.set(id, updated);
    return updated;
  }

  async createCompletedJob(insertJob: InsertCompletedJob): Promise<CompletedJob> {
    const id = randomUUID();
    const job: CompletedJob = {
      ...insertJob,
      id,
      subcategory: insertJob.subcategory ?? null,
      rating: insertJob.rating ?? null,
      propertyType: insertJob.propertyType ?? null,
      providerType: insertJob.providerType ?? null,
      actualManHours: insertJob.actualManHours ?? null,
      actualCost: insertJob.actualCost ?? null,
      materialsUsed: insertJob.materialsUsed ?? null,
      customerRating: insertJob.customerRating ?? null,
      vendorId: insertJob.vendorId ?? null,
      notes: insertJob.notes ?? null,
      completedAt: insertJob.completedAt ?? null,
      questionAnswers: insertJob.questionAnswers ?? null,
      vendorQuestions: insertJob.vendorQuestions ?? null,
      materialCalculations: insertJob.materialCalculations ?? null,
      // NEW LEARNING FIELDS
      estimatedManHours: insertJob.estimatedManHours ?? null,
      estimatedCost: insertJob.estimatedCost ?? null,
      accuracyScore: insertJob.accuracyScore ?? null,
      customerFeedback: insertJob.customerFeedback ?? null,
      vendorFeedback: insertJob.vendorFeedback ?? null,
      issuesEncountered: insertJob.issuesEncountered ?? null,
      dataSource: insertJob.dataSource ?? "actual_completion",
      isTrainingExample: insertJob.isTrainingExample ?? 0,
      tags: insertJob.tags ?? null,
    };
    this.completedJobs.set(id, job);
    return job;
  }

  async getAllCompletedJobs(): Promise<CompletedJob[]> {
    return Array.from(this.completedJobs.values());
  }

  async getCompletedJobsByServiceType(serviceType: string, limit: number = 10): Promise<CompletedJob[]> {
    return Array.from(this.completedJobs.values())
      .filter(job => job.serviceType === serviceType)
      .slice(0, limit);
  }

  async findSimilarJobs(serviceType: string, description: string, limit: number = 5, propertyType?: string): Promise<CompletedJob[]> {
    const keywords = description.toLowerCase().split(' ').filter(w => w.length > 3);
    
    const jobs = Array.from(this.completedJobs.values())
      .filter(job => {
        // Filter by service type
        if (job.serviceType !== serviceType) return false;
        // Filter by property type if provided (null matches both)
        if (propertyType && job.propertyType && job.propertyType !== propertyType) return false;
        return true;
      });

    const scored = jobs.map(job => {
      const jobDesc = job.serviceDescription.toLowerCase();
      const matchCount = keywords.filter(kw => jobDesc.includes(kw)).length;
      return { job, score: matchCount };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.job);
  }

  async getCompletedJobsCount(): Promise<number> {
    return this.completedJobs.size;
  }

  async createQuickbooksConnection(insertConnection: InsertQuickbooksConnection): Promise<QuickbooksConnection> {
    const id = randomUUID();
    const connection: QuickbooksConnection = {
      ...insertConnection,
      id,
      companyName: insertConnection.companyName ?? null,
      syncEnabled: insertConnection.syncEnabled ?? 1,
      lastSyncAt: insertConnection.lastSyncAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.quickbooksConnections.set(id, connection);
    return connection;
  }

  async getQuickbooksConnectionByUserId(userId: string): Promise<QuickbooksConnection | undefined> {
    return Array.from(this.quickbooksConnections.values()).find(
      (conn) => conn.userId === userId
    );
  }

  async updateQuickbooksConnection(id: string, updates: Partial<QuickbooksConnection>): Promise<QuickbooksConnection | undefined> {
    const connection = this.quickbooksConnections.get(id);
    if (!connection) return undefined;
    
    const updated = { ...connection, ...updates, updatedAt: new Date() };
    this.quickbooksConnections.set(id, updated);
    return updated;
  }

  async deleteQuickbooksConnection(id: string): Promise<void> {
    this.quickbooksConnections.delete(id);
  }

  async createProductionStandard(insertStandard: InsertProductionStandard): Promise<ProductionStandard> {
    const id = randomUUID();
    const standard: ProductionStandard = {
      ...insertStandard,
      id,
      propertyType: insertStandard.propertyType ?? null,
      qualityTier: insertStandard.qualityTier ?? null,
      subcategory: insertStandard.subcategory ?? null,
      laborHoursPerUnit: insertStandard.laborHoursPerUnit ?? null,
      materialCostPerUnit: insertStandard.materialCostPerUnit ?? null,
      notes: insertStandard.notes ?? null,
      source: insertStandard.source ?? null,
      isActive: insertStandard.isActive ?? 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.productionStandards.set(id, standard);
    return standard;
  }

  async getAllProductionStandards(): Promise<ProductionStandard[]> {
    return Array.from(this.productionStandards.values())
      .filter(std => std.isActive === 1);
  }

  async getProductionStandardsByService(serviceType: string, subcategory?: string): Promise<ProductionStandard[]> {
    // Production standards with subcategory=NULL apply to ALL subcategories of that service type
    return Array.from(this.productionStandards.values())
      .filter(std => 
        std.isActive === 1 && 
        std.serviceType === serviceType &&
        (!subcategory || !std.subcategory || std.subcategory?.toLowerCase() === subcategory.toLowerCase())
      );
  }

  async updateProductionStandard(id: string, updates: Partial<ProductionStandard>): Promise<ProductionStandard | undefined> {
    const standard = this.productionStandards.get(id);
    if (!standard) return undefined;
    
    const updated = { ...standard, ...updates, updatedAt: new Date() };
    this.productionStandards.set(id, updated);
    return updated;
  }

  async deleteProductionStandard(id: string): Promise<void> {
    this.productionStandards.delete(id);
  }
}

export class DbStorage implements IStorage {
  private db;
  
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getUsersCount(): Promise<number> {
    const result = await this.db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(users);
    return Number(result[0]?.count || 0);
  }

  async createScopeSession(insertSession: InsertScopeSession): Promise<ScopeSession> {
    const result = await this.db.insert(scopeSessions).values(insertSession).returning();
    return result[0];
  }

  async getScopeSession(id: string): Promise<ScopeSession | undefined> {
    // Check new sessionStates table first (new session system)
    const newSession = await this.db.select().from(sessionStates).where(eq(sessionStates.id, id));
    if (newSession[0]) {
      // Convert sessionStates format to ScopeSession format for compatibility
      const ns = newSession[0];
      return {
        id: ns.id,
        serviceDescription: ns.initialMessage, // initialMessage → serviceDescription
        serviceIntent: ns.serviceIntent,
        detectedServiceType: ns.serviceType, // serviceType → detectedServiceType
        subcategory: ns.subcategory, // Include subcategory for RAG matching
        propertyType: null, // sessionStates doesn't have propertyType yet
        recommendedProviderType: null,
        currentQuestionIndex: 0,
        status: ns.status,
        aiAnalysis: ns.aiAnalysis,
        answers: ns.answers,
        generatedScope: null,
        structuredScope: null,
        zipCode: null, // sessionStates doesn't have zipCode
        isUrgent: 0,
        urgentFeePercent: 25,
        createdAt: ns.createdAt
      } as ScopeSession;
    }
    
    // Fall back to legacy scopeSessions table if not found in new table
    const result = await this.db.select().from(scopeSessions).where(eq(scopeSessions.id, id));
    return result[0];
  }

  async updateScopeSession(id: string, updates: Partial<ScopeSession>): Promise<ScopeSession | undefined> {
    const result = await this.db
      .update(scopeSessions)
      .set(updates)
      .where(eq(scopeSessions.id, id))
      .returning();
    return result[0];
  }

  async createUploadedAsset(insertAsset: InsertUploadedAsset): Promise<UploadedAsset> {
    const result = await this.db.insert(uploadedAssets).values(insertAsset).returning();
    return result[0];
  }

  async getAssetsBySessionId(sessionId: string): Promise<UploadedAsset[]> {
    return this.db.select().from(uploadedAssets).where(eq(uploadedAssets.sessionId, sessionId));
  }

  async createDynamicQuestion(insertQuestion: InsertDynamicQuestion): Promise<DynamicQuestion> {
    const result = await this.db.insert(dynamicQuestions).values(insertQuestion).returning();
    return result[0];
  }

  async getQuestionsBySessionId(sessionId: string): Promise<DynamicQuestion[]> {
    return this.db
      .select()
      .from(dynamicQuestions)
      .where(eq(dynamicQuestions.sessionId, sessionId))
      .orderBy(dynamicQuestions.questionIndex);
  }

  async updateQuestionAnswer(id: string, answer: string): Promise<DynamicQuestion | undefined> {
    const result = await this.db
      .update(dynamicQuestions)
      .set({ answer })
      .where(eq(dynamicQuestions.id, id))
      .returning();
    return result[0];
  }

  async createCompletedJob(insertJob: InsertCompletedJob): Promise<CompletedJob> {
    const result = await this.db.insert(completedJobs).values(insertJob).returning();
    return result[0];
  }

  async getAllCompletedJobs(): Promise<CompletedJob[]> {
    return this.db
      .select()
      .from(completedJobs)
      .orderBy(desc(completedJobs.completedAt));
  }

  async getCompletedJobsByServiceType(serviceType: string, limit: number = 10): Promise<CompletedJob[]> {
    return this.db
      .select()
      .from(completedJobs)
      .where(eq(completedJobs.serviceType, serviceType))
      .orderBy(desc(completedJobs.completedAt))
      .limit(limit);
  }

  async findSimilarJobs(serviceType: string, description: string, limit: number = 5, propertyType?: string): Promise<CompletedJob[]> {
    // Enhanced similarity search with quality prioritization
    // Prioritizes: 1) training examples, 2) high accuracy, 3) keyword match, 4) recency
    // Now also filters by property type (residential vs. commercial)
    if (!description) return []; // Handle undefined/null description
    const keywords = description.toLowerCase().split(' ').filter(w => w.length > 3);
    
    // Extract key nouns from serviceType for fuzzy matching
    // Exclude generic words like "installation", "service", "repair", "new"
    const genericWords = ['the', 'and', 'for', 'with', 'from', 'into', 'this', 'that', 'installation', 'install', 'service', 'repair', 'new', 'replacement', 'replace'];
    const serviceKeywords = serviceType.toLowerCase()
      .split(' ')
      .filter(w => w.length > 3 && !genericWords.includes(w));
    
    // Get more candidates for fuzzy filtering
    // Use NULLS FIRST to prioritize training examples (which have NULL completedAt)
    let jobs = await this.db
      .select()
      .from(completedJobs)
      .orderBy(drizzleSql`${completedJobs.completedAt} DESC NULLS FIRST`)
      .limit(100); // Increased to get better coverage
    
    // PRIORITIZE EXACT MATCHES FIRST, then fall back to fuzzy
    const exactMatches = jobs.filter(job => 
      job.serviceType.toLowerCase() === serviceType.toLowerCase()
    );
    
    const fuzzyMatches = jobs.filter(job => {
      const jobServiceType = job.serviceType.toLowerCase();
      const isExactMatch = jobServiceType === serviceType.toLowerCase();
      if (isExactMatch) return false; // Skip exact matches (already included)
      
      // Fuzzy match: at least one non-generic keyword must match
      return serviceKeywords.length > 0 && 
             serviceKeywords.some(keyword => jobServiceType.includes(keyword));
    });
    
    // Combine: exact matches first, then fuzzy matches
    jobs = [...exactMatches, ...fuzzyMatches].slice(0, 30);
    
    // Filter by property type if provided (jobs with null propertyType match both)
    if (propertyType) {
      jobs = jobs.filter(job => !job.propertyType || job.propertyType === propertyType);
    }

    // Score each job by multiple factors (BALANCED scoring to avoid swamping relevance)
    const scored = jobs.map(job => {
      const jobDesc = job.serviceDescription.toLowerCase();
      
      // 1. Keyword match score (0-100 points) - PRIMARY relevance factor
      const keywordMatchCount = keywords.filter(kw => jobDesc.includes(kw)).length;
      const keywordCoverage = keywords.length > 0 ? keywordMatchCount / keywords.length : 0;
      const keywordScore = keywordCoverage * 100; // 0-100 based on % of keywords matched
      
      // Only apply quality bonuses if there's SOME keyword relevance (score > 0)
      if (keywordScore === 0) {
        return { job, score: 0 }; // No keyword match = irrelevant, skip quality bonuses
      }
      
      // 2. Training example multiplier (1.5x boost for curated examples)
      const trainingMultiplier = job.isTrainingExample === 1 ? 1.5 : 1.0;
      
      // 3. Accuracy boost (+0-20 points based on accuracy score)
      const accuracyBonus = job.accuracyScore ? job.accuracyScore * 20 : 0;
      
      // 4. High rating boost (+10 points for 4-5 stars)
      const ratingBonus = job.customerRating && job.customerRating >= 4 ? 10 : 0;
      
      // 5. Completed jobs boost (+5 points if job is actually completed)
      const completedBonus = job.completedAt ? 5 : 0;
      
      // 6. Recency decay (jobs older than 6 months get gradual penalty)
      let recencyFactor = 1.0;
      if (job.completedAt) {
        const ageInDays = (Date.now() - new Date(job.completedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > 180) { // Older than 6 months
          recencyFactor = Math.max(0.7, 1 - ((ageInDays - 180) / 365) * 0.3); // 30% penalty over 1 year
        }
      }
      
      // Total score: Keyword relevance is PRIMARY, quality factors boost relevant matches
      const qualityBonus = accuracyBonus + ratingBonus + completedBonus;
      const totalScore = (keywordScore + qualityBonus) * trainingMultiplier * recencyFactor;
      
      return { job, score: totalScore };
    });

    // Sort by total score (prioritizes quality over recency)
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.job);
  }

  async getCompletedJobsCount(): Promise<number> {
    const result = await this.db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(completedJobs);
    return Number(result[0]?.count || 0);
  }

  async createQuickbooksConnection(insertConnection: InsertQuickbooksConnection): Promise<QuickbooksConnection> {
    const result = await this.db.insert(quickbooksConnections).values(insertConnection).returning();
    return result[0];
  }

  async getQuickbooksConnectionByUserId(userId: string): Promise<QuickbooksConnection | undefined> {
    const result = await this.db
      .select()
      .from(quickbooksConnections)
      .where(eq(quickbooksConnections.userId, userId));
    return result[0];
  }

  async updateQuickbooksConnection(id: string, updates: Partial<QuickbooksConnection>): Promise<QuickbooksConnection | undefined> {
    const result = await this.db
      .update(quickbooksConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quickbooksConnections.id, id))
      .returning();
    return result[0];
  }

  async deleteQuickbooksConnection(id: string): Promise<void> {
    await this.db
      .delete(quickbooksConnections)
      .where(eq(quickbooksConnections.id, id));
  }

  async createProductionStandard(insertStandard: InsertProductionStandard): Promise<ProductionStandard> {
    const result = await this.db.insert(productionStandards).values(insertStandard).returning();
    return result[0];
  }

  async getAllProductionStandards(): Promise<ProductionStandard[]> {
    return this.db
      .select()
      .from(productionStandards)
      .where(eq(productionStandards.isActive, 1))
      .orderBy(productionStandards.serviceType, productionStandards.subcategory);
  }

  async getProductionStandardsByService(serviceType: string, subcategory?: string): Promise<ProductionStandard[]> {
    // Production standards with subcategory=NULL apply to ALL subcategories of that service type
    // This allows universal deck building standards to apply to "new deck", "deck repair", "replace deck", etc.
    if (subcategory) {
      return this.db
        .select()
        .from(productionStandards)
        .where(
          drizzleSql`${productionStandards.isActive} = 1 
            AND ${productionStandards.serviceType} = ${serviceType} 
            AND (${productionStandards.subcategory} IS NULL OR LOWER(${productionStandards.subcategory}) = LOWER(${subcategory}))`
        );
    } else {
      return this.db
        .select()
        .from(productionStandards)
        .where(
          drizzleSql`${productionStandards.isActive} = 1 AND ${productionStandards.serviceType} = ${serviceType}`
        );
    }
  }

  async updateProductionStandard(id: string, updates: Partial<ProductionStandard>): Promise<ProductionStandard | undefined> {
    const result = await this.db
      .update(productionStandards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productionStandards.id, id))
      .returning();
    return result[0];
  }

  async deleteProductionStandard(id: string): Promise<void> {
    await this.db
      .delete(productionStandards)
      .where(eq(productionStandards.id, id));
  }
}

export const storage = new DbStorage();
