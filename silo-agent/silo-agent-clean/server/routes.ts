import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { scopeOrchestrator } from "./ai/scopeOrchestrator";
import { z } from "zod";
import multer from "multer";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import passport from "passport";
import bcrypt from "bcryptjs";
import { insertUserSchema, serviceQuestions } from "@shared/schema";
import { assembleScope } from "./services/scopeAssembler";

// NEW: Import session-based routes
import sessionRoutes from "./routes/session";
import scopeRoutes from "./routes/scope";
import learningRoutes from "./routes/learning";

// Configure multer for photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Schema for creating a new scope session
const createSessionSchema = z.object({
  serviceDescription: z.string().min(1, "Service description is required"),
  isUrgent: z.number().optional().default(0),
});

// Schema for submitting an answer
const submitAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
});

// Authentication middleware
export function requireAuth(req: Request, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

export function requireAdmin(req: Request, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Admin access required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user (first user becomes admin)
      const userCount = await storage.getUsersCount();
      const role = userCount === 0 ? "admin" : "user";
      
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role,
      });

      // Log the user in
      req.login({ id: user.id, username: user.username, role: user.role }, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to login after registration" });
        }
        res.json({ user: { id: user.id, username: user.username, role: user.role } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({ user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });
  
  // NEW: Register session-based routes
  app.use("/api/session", sessionRoutes);
  app.use("/api/scope", scopeRoutes);
  app.use("/api/learning", learningRoutes);
  
  // POST /api/scope-sessions - Initialize a new scope session (legacy)
  app.post("/api/scope-sessions", async (req, res) => {
    try {
      const { serviceDescription, isUrgent } = createSessionSchema.parse(req.body);
      
      const session = await storage.createScopeSession({
        serviceDescription,
        detectedServiceType: null,
        aiAnalysis: null,
        answers: {},
        generatedScope: null,
        isUrgent,
      });

      res.json(session);
    } catch (error) {
      console.error("Error creating scope session:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // GET /api/scope-sessions/:id - Get a scope session by ID
  app.get("/api/scope-sessions/:id", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getScopeSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error getting scope session:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // PATCH /api/scope-sessions/:id - Update a scope session
  app.patch("/api/scope-sessions/:id", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getScopeSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const updated = await storage.updateScopeSession(sessionId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating scope session:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // POST /api/scope-sessions/:id/photos - Upload photos to a session
  app.post("/api/scope-sessions/:id/photos", upload.array('photos', 10), async (req: Request, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getScopeSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Ensure uploads directory exists
      const uploadsDir = join(process.cwd(), 'uploads', sessionId);
      await mkdir(uploadsDir, { recursive: true });

      // Save files and create asset records with base64 data for AI analysis
      const uploadedAssets = await Promise.all(
        files.map(async (file) => {
          const filename = `${randomUUID()}-${file.originalname}`;
          const filepath = join(uploadsDir, filename);
          await writeFile(filepath, file.buffer);

          // Create base64 data URI for AI vision analysis
          const base64 = file.buffer.toString('base64');
          const dataUri = `data:${file.mimetype};base64,${base64}`;

          return storage.createUploadedAsset({
            sessionId,
            fileUrl: dataUri,
            fileName: file.originalname,
            fileType: file.mimetype,
            analysisResult: null,
          });
        })
      );

      // Analyze photos with AI vision using base64 data URIs
      const analysis = await scopeOrchestrator.analyzePhotos(sessionId, uploadedAssets);

      res.json({
        assets: uploadedAssets,
        analysis,
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  // POST /api/scope-sessions/:id/classify-intent - Classify service intent (Master Router)
  app.post("/api/scope-sessions/:id/classify-intent", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getScopeSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Get uploaded photos
      const photos = await storage.getAssetsBySessionId(sessionId);

      // Use enhanced orchestrator for full classification (text + photo-aware)
      const classification = await scopeOrchestrator.classifyIntent(
        session.serviceDescription,
        photos.length > 0 ? photos : undefined
      );

      // NULL-SAFE: Only persist valid classification data
      if (classification.serviceType && classification.subcategory) {
        await storage.updateScopeSession(sessionId, {
          serviceIntent: classification.intent || 'service',
          detectedServiceType: classification.serviceType,
          subcategory: classification.subcategory
        });
        console.log(`[Classify Intent] Persisted: serviceType='${classification.serviceType}', subcategory='${classification.subcategory}', intent='${classification.intent}'`);
      } else {
        console.warn(`[Classify Intent] Skipped persistence - missing serviceType or subcategory`);
      }

      // Return complete classification (API contract preserved)
      res.json({
        intent: classification.intent || 'service',
        confidence: classification.confidence || 0.5,
        reasoning: classification.reasoning || 'Classification completed',
        suggestedClarification: classification.suggestedClarification || undefined
      });
    } catch (error) {
      console.error("Error classifying intent:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Classification failed" });
    }
  });

  // GET /api/scope-sessions/:id/questions/next - Get the next question
  app.get("/api/scope-sessions/:id/questions/next", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getScopeSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const existingQuestions = await storage.getQuestionsBySessionId(sessionId);
      const unansweredQuestion = existingQuestions.find(q => !q.answer);

      if (unansweredQuestion) {
        return res.json(unansweredQuestion);
      }

      // Generate next question
      const questionPlan = await scopeOrchestrator.generateNextQuestion(
        sessionId,
        session.answers as Record<string, string>
      );

      if (!questionPlan) {
        // No more questions needed, generate final scope
        return res.json({ completed: true });
      }

      // Store the question
      const question = await storage.createDynamicQuestion({
        sessionId,
        questionIndex: existingQuestions.length,
        questionText: questionPlan.question,
        questionType: questionPlan.type,
        options: questionPlan.options || null,
        answer: null,
        aiRationale: questionPlan.rationale,
      });

      res.json(question);
    } catch (error) {
      console.error("Error getting next question:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get question" });
    }
  });

  // POST /api/scope-sessions/:id/answers - Submit an answer
  app.post("/api/scope-sessions/:id/answers", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const { questionId, answer } = submitAnswerSchema.parse(req.body);
      
      const session = await storage.getScopeSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Update the question with the answer
      const updatedQuestion = await storage.updateQuestionAnswer(questionId, answer);
      if (!updatedQuestion) {
        return res.status(404).json({ error: "Question not found" });
      }

      // Update session answers
      const updatedAnswers = {
        ...(session.answers as Record<string, string>),
        [questionId]: answer
      };
      
      await storage.updateScopeSession(sessionId, {
        answers: updatedAnswers,
        currentQuestionIndex: session.currentQuestionIndex + 1,
      });

      res.json({ success: true, question: updatedQuestion });
    } catch (error) {
      console.error("Error submitting answer:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // GET /api/scope-sessions/:id/scope - Get the final generated scope
  app.get("/api/scope-sessions/:id/scope", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getScopeSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // If scope already generated, parse and return it
      if (session.generatedScope) {
        try {
          const parsedScope = JSON.parse(session.generatedScope);
          return res.json({ 
            scope: parsedScope, // Structured object
            summary: parsedScope.summary || "Scope previously generated" // Extract summary if available
          });
        } catch (e) {
          // If parsing fails, generatedScope might be a legacy string format - regenerate
          console.log(`[Scope Generation] Failed to parse generatedScope for session ${sessionId}, regenerating...`);
        }
      }

      // Extract subcategory from first answer (like session route does)
      const currentAnswers = (session.answers as Record<string, any>) || {};
      const firstAnswer = Object.values(currentAnswers)[0];
      const specificSubcategory = typeof firstAnswer === 'object' && firstAnswer.answer 
        ? firstAnswer.answer 
        : (typeof firstAnswer === 'string' ? firstAnswer : session.detectedServiceType || "Unknown");
      
      console.log(`[Final Scope] Using assembleScope with subcategory: "${specificSubcategory}"`);

      // 🎯 FIX: Use assembleScope() instead of generateFinalScope() to get deterministic deck calculations
      const { scope, summary } = await assembleScope({
        serviceType: session.detectedServiceType || "Unknown",
        subcategory: specificSubcategory,
        answers: currentAnswers,
        serviceDescription: session.serviceDescription,
        storage // Pass storage for production standards and material calculations
      });

      // Embed summary in the structured scope for consistent caching
      const scopeWithSummary = { ...scope, summary };

      // CRITICAL: Save the structured scope with embedded summary
      await storage.updateScopeSession(sessionId, {
        generatedScope: JSON.stringify(scopeWithSummary), // Full structured JSON with summary
        structuredScope: scopeWithSummary as any, // Also save in structuredScope field
      });
      console.log(`[Scope Generation] Saved assembleScope output to session ${sessionId} with ${scope.details?.deck_line_items ? 'deck material calculations' : 'baseline estimates'}`);

      // Return structured scope (backward compatible) with summary
      res.json({ 
        scope: scope, // Structured object without summary field (for backward compatibility)
        summary: summary // Human-readable summary as separate field
      });
    } catch (error) {
      console.error("Error generating scope:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate scope" });
    }
  });

  // POST /api/scope-sessions/:id/accept - Accept a scope and create a draft job for RAG
  app.post("/api/scope-sessions/:id/accept", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session = await storage.getScopeSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (!session.generatedScope) {
        return res.status(400).json({ error: "No scope generated yet" });
      }

      // Create a draft job record for future RAG training
      // When the job is completed (vendor finishes work), this record should be updated
      // with actual outcomes: actualManHours, actualCost, materialsUsed, customerRating
      // completedAt is left null to indicate this is a draft/pending job
      const draftJob = await storage.createCompletedJob({
        sessionId,
        serviceType: session.detectedServiceType || "Unknown",
        serviceDescription: session.serviceDescription,
        originalScope: session.generatedScope,
        actualManHours: null,
        actualCost: null,
        materialsUsed: null,
        customerRating: null,
        vendorId: null,
        completedAt: null,
        notes: "Draft job - awaiting completion",
      });

      console.log(`Draft job created for RAG: ${draftJob.id} - will be updated when job completes`);

      // Update session status to accepted
      await storage.updateScopeSession(sessionId, {
        status: "accepted",
      });

      res.json({ success: true, job: draftJob });
    } catch (error) {
      console.error("Error accepting scope:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to accept scope" });
    }
  });

  // POST /api/completed-jobs - Record a completed job for RAG learning (ADMIN ONLY)
  app.post("/api/completed-jobs", requireAdmin, async (req, res) => {
    try {
      const jobData = req.body; // Should match InsertCompletedJob schema
      
      const completedJob = await storage.createCompletedJob(jobData);
      
      console.log(`Completed job recorded: ${completedJob.id} - ${completedJob.serviceType}`);
      
      res.json({ success: true, job: completedJob });
    } catch (error) {
      console.error("Error recording completed job:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to record job" });
    }
  });

  // GET /api/completed-jobs - Get completed jobs (ADMIN ONLY)
  app.get("/api/completed-jobs", requireAdmin, async (req, res) => {
    try {
      const serviceType = req.query.serviceType as string;
      
      if (serviceType) {
        const jobs = await storage.getCompletedJobsByServiceType(serviceType);
        res.json(jobs); // Return array directly
      } else {
        // Return all jobs when no filter specified
        const jobs = await storage.getAllCompletedJobs();
        res.json(jobs); // Return array directly
      }
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch jobs" });
    }
  });

  // GET /api/completed-jobs/count - Get count of all completed jobs (ADMIN ONLY)
  app.get("/api/completed-jobs/count", requireAdmin, async (req, res) => {
    try {
      const count = await storage.getCompletedJobsCount();
      res.json({ count });
    } catch (error) {
      console.error("Error counting completed jobs:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to count jobs" });
    }
  });

  // Configure multer for invoice uploads (all document types)
  const uploadInvoice = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
      // Accept all common document types
      const allowedTypes = [
        'image/',                                                          // All image types
        'application/pdf',                                                 // PDF
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel .xlsx
        'application/vnd.ms-excel',                                        // Excel .xls
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word .docx
        'application/msword',                                              // Word .doc
        'text/plain',                                                      // Text files
        'text/csv',                                                        // CSV
        'application/vnd.oasis.opendocument.spreadsheet',                 // ODS
        'application/vnd.oasis.opendocument.text',                        // ODT
      ];
      
      const isAllowed = allowedTypes.some(type => 
        type.endsWith('/') ? file.mimetype.startsWith(type) : file.mimetype === type
      );
      
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error('File type not supported. Please upload images, PDFs, Excel, Word, or text documents.'));
      }
    }
  });

  // Helper function to normalize numbers from invoices with locale-agnostic parsing
  function normalizeInvoiceNumber(val: any): number | null {
    if (val === null || val === undefined || val === "") return null;
    
    // Remove currency symbols and trim
    let str = String(val)
      .replace(/[$€£¥₹]/g, '')
      .trim();
    
    // Count separators
    const periodCount = (str.match(/\./g) || []).length;
    const commaCount = (str.match(/,/g) || []).length;
    const lastComma = str.lastIndexOf(',');
    const lastPeriod = str.lastIndexOf('.');
    
    // Special case: Single separator followed by exactly 3 digits = thousands separator
    // Examples: "1.234" (EU), "2,500" (US/EU), "12.345" (EU)
    if (periodCount === 1 && commaCount === 0 && /\.\d{3}$/.test(str)) {
      // Single period with exactly 3 trailing digits = EU thousands
      str = str.replace('.', '');
    } else if (commaCount === 1 && periodCount === 0 && /,\d{3}$/.test(str)) {
      // Single comma with exactly 3 trailing digits = thousands
      str = str.replace(',', '');
    } else if (lastComma > lastPeriod) {
      // European format: 1.250,50 or 1 250,50
      // Period and space are thousands separators, comma is decimal
      str = str.replace(/[\s.]/g, '').replace(',', '.');
    } else if (lastPeriod > lastComma) {
      // US format: 1,250.50 or 1 250.50
      // Comma and space are thousands separators, period is decimal
      str = str.replace(/[\s,]/g, '');
    } else {
      // No separator or only spaces: 1250 or 1 250
      str = str.replace(/\s/g, '');
    }
    
    const num = parseFloat(str);
    return isNaN(num) || num < 0 ? null : num;
  }

  // POST /api/parse-invoice - Parse invoice using GPT-4o Vision (ADMIN ONLY)
  app.post("/api/parse-invoice", requireAdmin, (req, res) => {
    uploadInvoice.single("invoice")(req, res, async (err) => {
      if (err) {
        // Handle Multer errors (file type, size, etc.)
        return res.status(400).json({ error: err.message });
      }
      
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No invoice file provided" });
        }

        console.log(`Parsing invoice: ${req.file.originalname} (${req.file.mimetype})`);

        // Parse the invoice using AI (handles images, PDFs, Excel, Word, etc.)
        const extractedData = await scopeOrchestrator.parseInvoice(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );

      // Server-side validation and normalization
      const validatedData = {
        serviceType: extractedData.serviceType?.trim() || null,
        serviceDescription: extractedData.serviceDescription?.trim() || null,
        originalScope: extractedData.originalScope?.trim() || null,
        providerType: extractedData.providerType?.trim() || null,
        actualManHours: normalizeInvoiceNumber(extractedData.actualManHours),
        actualCost: normalizeInvoiceNumber(extractedData.actualCost),
        materialsUsed: extractedData.materialsUsed?.trim() || null,
        customerRating: (() => {
          const rating = parseInt(String(extractedData.customerRating || "").replace(/[^\d]/g, ''));
          return isNaN(rating) || rating < 1 || rating > 5 ? null : rating;
        })(),
        notes: extractedData.notes?.trim() || null,
      };

        console.log("Invoice parsed and validated:", validatedData);

        res.json(validatedData);
      } catch (error) {
        console.error("Error parsing invoice:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to parse invoice" });
      }
    });
  });

  // POST /api/parse-proposal-text - Parse pasted proposal text using AI (ADMIN ONLY)
  app.post("/api/parse-proposal-text", requireAdmin, async (req, res) => {
    try {
      const { proposalText } = req.body;
      
      if (!proposalText || typeof proposalText !== 'string') {
        return res.status(400).json({ error: "No proposal text provided" });
      }

      console.log(`Parsing pasted proposal text (${proposalText.length} characters)`);

      // Use the existing parseInvoiceFromText method in scopeOrchestrator
      const extractedData = await (scopeOrchestrator as any).parseInvoiceFromText(proposalText, "pasted-proposal");

      // Server-side validation and normalization
      const validatedData = {
        serviceType: extractedData.serviceType?.trim() || null,
        serviceDescription: extractedData.serviceDescription?.trim() || null,
        originalScope: extractedData.originalScope?.trim() || null,
        providerType: extractedData.providerType?.trim() || null,
        actualManHours: normalizeInvoiceNumber(extractedData.actualManHours),
        actualCost: normalizeInvoiceNumber(extractedData.actualCost),
        materialsUsed: extractedData.materialsUsed?.trim() || null,
        customerRating: (() => {
          const rating = parseInt(String(extractedData.customerRating || "").replace(/[^\d]/g, ''));
          return isNaN(rating) || rating < 1 || rating > 5 ? null : rating;
        })(),
        notes: extractedData.notes?.trim() || null,
      };

      console.log("Proposal parsed and validated:", validatedData);

      res.json(validatedData);
    } catch (error) {
      console.error("Error parsing proposal text:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to parse proposal text" });
    }
  });

  // POST /api/parse-guide - Parse troubleshooting guide to generate question flows (ADMIN ONLY)
  app.post("/api/parse-guide", requireAdmin, (req, res) => {
    uploadInvoice.single("guide")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No guide file provided" });
        }

        console.log(`Parsing guide: ${req.file.originalname} (${req.file.mimetype})`);

        // Parse the guide using AI to extract question flows
        const extractedData = await scopeOrchestrator.parseGuideToQuestions(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );

        console.log(`Extracted ${extractedData.questions?.length || 0} questions from guide`);

        res.json(extractedData);
      } catch (error) {
        console.error("Error parsing guide:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to parse guide" });
      }
    });
  });

  // POST /api/service-questions/bulk - Bulk insert service questions (ADMIN ONLY)
  app.post("/api/service-questions/bulk", requireAdmin, async (req, res) => {
    try {
      const { questions } = req.body;
      
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "No questions provided" });
      }

      console.log(`Bulk inserting ${questions.length} questions...`);

      // Insert all questions into the database
      const inserted = [];
      for (const q of questions) {
        const [result] = await db
          .insert(serviceQuestions)
          .values({
            serviceType: q.serviceType,
            subcategory: q.subcategory || null,
            questionText: q.questionText,
            responseType: q.responseType,
            options: q.options || null,
            requiredForScope: q.requiredForScope || 1,
            conditionalTag: q.conditionalTag || null,
            sequence: q.sequence,
          })
          .returning();
        
        inserted.push(result);
      }

      console.log(`✅ Successfully inserted ${inserted.length} questions`);

      res.json({ 
        success: true, 
        count: inserted.length,
        questions: inserted 
      });
    } catch (error) {
      console.error("Error bulk inserting questions:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to insert questions" });
    }
  });

  // Production Standards routes (ADMIN ONLY)
  
  // GET /api/production-standards - Get all production standards
  app.get("/api/production-standards", requireAdmin, async (req, res) => {
    try {
      const standards = await storage.getAllProductionStandards();
      res.json(standards);
    } catch (error) {
      console.error("Error fetching production standards:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch production standards" });
    }
  });

  // GET /api/production-standards/:serviceType - Get production standards by service type
  app.get("/api/production-standards/:serviceType", requireAdmin, async (req, res) => {
    try {
      const { serviceType } = req.params;
      const { subcategory } = req.query;
      const standards = await storage.getProductionStandardsByService(
        serviceType, 
        subcategory as string | undefined
      );
      res.json(standards);
    } catch (error) {
      console.error("Error fetching production standards by service:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch production standards" });
    }
  });

  // POST /api/production-standards - Create a new production standard
  app.post("/api/production-standards", requireAdmin, async (req, res) => {
    try {
      const standardData = req.body;
      const newStandard = await storage.createProductionStandard({
        ...standardData,
        source: standardData.source || 'manual',
      });
      res.status(201).json(newStandard);
    } catch (error) {
      console.error("Error creating production standard:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create production standard" });
    }
  });

  // PUT /api/production-standards/:id - Update a production standard
  app.put("/api/production-standards/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedStandard = await storage.updateProductionStandard(id, updates);
      if (!updatedStandard) {
        return res.status(404).json({ error: "Production standard not found" });
      }
      res.json(updatedStandard);
    } catch (error) {
      console.error("Error updating production standard:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update production standard" });
    }
  });

  // DELETE /api/production-standards/:id - Delete a production standard
  app.delete("/api/production-standards/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProductionStandard(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting production standard:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete production standard" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);

  return httpServer;
}
