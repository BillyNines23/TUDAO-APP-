/**
 * Session Routes
 * Handles session creation and question answering
 */

import { Router } from "express";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { db } from "../db";
import { sessionStates, scopesGenerated, uploadedAssets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { nextQuestion, isCompletionConditionMet, getProgress } from "../services/questionSelector";
import { assembleScope } from "../services/scopeAssembler";
import { storage } from "../storage";
import { ScopeOrchestrator } from "../ai/scopeOrchestrator";
import { enrichWizardAnswer } from "../services/aiAssistant";
import type { ScopeDetail, AiInteraction } from "../types/ai-scope";

const router = Router();
const scopeOrchestrator = new ScopeOrchestrator();

// Configure Multer for photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    console.log('[Multer] Received file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Accept if MIME type is image, or if file extension is image-like
    const isImageMimetype = file.mimetype && file.mimetype.startsWith('image/');
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.heic', '.heif'];
    const hasImageExtension = imageExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (isImageMimetype || hasImageExtension) {
      cb(null, true);
    } else {
      console.error('[Multer] Rejected file - not an image:', file.originalname, file.mimetype);
      cb(new Error(`Only image files are allowed. Received: ${file.mimetype || 'unknown type'}`));
    }
  }
});

/**
 * POST /api/session/start
 * Start a new scope session (supports both JSON and multipart/form-data with photos)
 */
router.post("/start", upload.array('photos', 10), async (req, res) => {
  try {
    const { user_id, initial_message, force_service_type, force_subcategory } = req.body;
    const files = req.files as Express.Multer.File[] || [];
    
    if (!initial_message) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "initial_message is required" }
      });
    }
    
    // Classify intent using AI Master Router with normalization
    let classification;
    if (force_service_type && force_subcategory) {
      classification = {
        intent: "service", // Default for forced types
        serviceType: force_service_type,
        subcategory: force_subcategory,
        confidence: 1.0
      };
    } else {
      // CRITICAL FIX: Use orchestrator.classifyIntent() which includes normalization
      // This ensures "Deck Building" → "Carpentry" and "Build new deck" → "Build deck"
      classification = await scopeOrchestrator.classifyIntent(initial_message);
    }
    
    const serviceIntent = classification.intent || 'service';
    const { serviceType, confidence } = classification;
    let subcategory = classification.subcategory; // Use 'let' so we can reassign if needed
    const clarifier = classification.suggestedClarification;
    
    // Create session with AI Master Router classification
    const [session] = await db
      .insert(sessionStates)
      .values({
        userId: user_id || null,
        serviceIntent, // NEW: "service" or "installation"
        serviceType,
        subcategory: subcategory || null,
        confidence: Math.round(confidence * 100), // Store as 0-100
        initialMessage: initial_message,
        answers: {},
        status: "in_progress"
      })
      .returning();
    
    // If photos were uploaded, process them with GPT-4o Vision
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      const assets = await Promise.all(
        files.map(async (file) => {
          const filename = `${Date.now()}-${file.originalname}`;
          const filepath = path.join(uploadDir, filename);
          
          // Compress image using sharp to avoid 413 Payload Too Large errors
          // Resize to max 1024px on longest side, convert to JPEG with 80% quality
          let processedBuffer: Buffer;
          try {
            processedBuffer = await sharp(file.buffer)
              .resize(1024, 1024, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .jpeg({ quality: 80 })
              .toBuffer();
            
            console.log(`[Image Processing] ${file.originalname}: ${file.buffer.length} bytes → ${processedBuffer.length} bytes (${Math.round((1 - processedBuffer.length / file.buffer.length) * 100)}% reduction)`);
          } catch (compressionError) {
            console.error(`[Image Processing] Failed to compress ${file.originalname}, using original:`, compressionError);
            processedBuffer = file.buffer;
          }
          
          // Save compressed version to disk
          await fs.writeFile(filepath, processedBuffer);

          // Convert compressed image to base64 data URI for vision analysis
          const base64Image = processedBuffer.toString('base64');
          const dataUri = `data:image/jpeg;base64,${base64Image}`;

          const [asset] = await db
            .insert(uploadedAssets)
            .values({
              sessionId: session.id,
              fileName: file.originalname,
              fileUrl: dataUri, // Store compressed base64 data URI
              fileType: 'image/jpeg', // Always JPEG after compression
            })
            .returning();

          return asset;
        })
      );

      // Analyze photos with GPT-4o Vision
      try {
        const visionAnalysis = await scopeOrchestrator.analyzePhotos(session.id, assets);
        
        // Update session with vision analysis
        await db
          .update(sessionStates)
          .set({
            aiAnalysis: visionAnalysis,
            updatedAt: new Date()
          })
          .where(eq(sessionStates.id, session.id));
        
        console.log(`Vision analysis for session ${session.id}:`, visionAnalysis.detectedServiceType);
      } catch (visionError) {
        console.error("Vision analysis failed:", visionError);
        // Continue without vision analysis - don't fail the entire request
      }
    }
    
    // If confidence is too low, ask clarifier first
    if (confidence < 0.8 && clarifier) {
      return res.json({
        session_id: session.id,
        service_type: serviceType,
        subcategory: subcategory || null,
        confidence,
        question: {
          id: "clarifier",
          text: clarifier,
          responseType: "text",
          options: null
        }
      });
    }
    
    // Use GPT-5 to generate first question dynamically with production standards
    const firstQuestion = await scopeOrchestrator.generateNextQuestion(session.id, {});
    
    if (!firstQuestion) {
      return res.status(500).json({
        error: { code: "NO_QUESTIONS", message: "Failed to generate first question" }
      });
    }
    
    // CRITICAL FIX: Persist resolvedSubcategory from first question immediately
    // This ensures canonical subcategory is saved even in single-question flows
    if (firstQuestion.resolvedSubcategory && firstQuestion.resolvedSubcategory !== subcategory) {
      console.log(`[Session Start] 🔄 Persisting resolved subcategory: "${subcategory}" → "${firstQuestion.resolvedSubcategory}"`);
      await db
        .update(sessionStates)
        .set({
          subcategory: firstQuestion.resolvedSubcategory,
          updatedAt: new Date()
        })
        .where(eq(sessionStates.id, session.id));
      
      // Update for response
      subcategory = firstQuestion.resolvedSubcategory;
    }
    
    // PROPER FIX: Use database ID from question, not generated client ID
    // firstQuestion.id should be the UUID from serviceQuestions table
    res.json({
      session_id: session.id,
      service_intent: serviceIntent,
      service_type: serviceType,
      subcategory: subcategory || null,
      confidence,
      question: {
        id: firstQuestion.id, // Use database UUID instead of generating
        text: firstQuestion.question,
        responseType: firstQuestion.type,
        options: firstQuestion.options || null,
        phase: firstQuestion.phase || null,
        phaseLabel: firstQuestion.phaseLabel || null,
        guidance: firstQuestion.guidance || null, // Consultant-style warm explanation
        aiRationale: firstQuestion.rationale || null // Technical reasoning
      }
    });
    
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to start session" }
    });
  }
});

/**
 * POST /api/session/answer
 * Record an answer and get the next question
 */
router.post("/answer", async (req, res) => {
  try {
    const { session_id, question_id, question_text, answer, phase, phaseLabel } = req.body;
    
    if (!session_id || !question_id || answer === undefined) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "session_id, question_id, and answer are required" }
      });
    }
    
    // Get session
    const [session] = await db
      .select()
      .from(sessionStates)
      .where(eq(sessionStates.id, session_id));
    
    if (!session) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Session not found" }
      });
    }
    
    // Update answers - store question, answer, and phase metadata (if provided)
    // MIGRATION: Support both legacy client-generated IDs (q_123...) and new database UUIDs
    const currentAnswers = (session.answers as Record<string, any>) || {};
    
    const isLegacyId = question_id.startsWith('q_');
    if (isLegacyId) {
      console.log(`[MIGRATION WARNING] Received legacy question ID: ${question_id}. Client should use database UUID.`);
    }
    
    currentAnswers[question_id] = {
      questionText: question_text || "Unknown question", // Renamed from 'question' for clarity
      answer: answer,
      ...(phase && { phase, phaseLabel }) // Include phase metadata if provided
    };
    
    // Store answers (subcategory may be updated below if it resolves during nextQuestion)
    await db
      .update(sessionStates)
      .set({
        answers: currentAnswers,
        updatedAt: new Date()
      })
      .where(eq(sessionStates.id, session_id));
    
    // 🆕 AI ASSISTANT: Enrich the wizard answer with intelligent interpretation
    let aiAdvice: string | undefined;
    let aiEnrichedScope: Partial<ScopeDetail> = {};
    
    try {
      const currentScope = (session.structuredScope as ScopeDetail) || {};
      const aiResponse = await enrichWizardAnswer({
        sessionId: session_id,
        stepKey: question_id,
        questionText: question_text || "Unknown question",
        userAnswer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        currentScope,
        allAnswers: currentAnswers
      });
      
      aiAdvice = aiResponse.advice;
      aiEnrichedScope = aiResponse.enrichedFields;
      
      // Save AI interaction and enriched scope to session
      const currentInteractions = (session.aiInteractions as AiInteraction[]) || [];
      const newInteraction: AiInteraction = {
        stepKey: question_id,
        questionText: question_text || "Unknown question",
        userMessage: typeof answer === 'string' ? answer : JSON.stringify(answer),
        aiAdvice: aiResponse.advice,
        aiInferredFields: aiResponse.enrichedFields,
        knowledgeLevel: aiResponse.knowledgeLevel,
        timestamp: new Date().toISOString()
      };
      
      // Merge enriched fields into structured scope
      const updatedScope: ScopeDetail = {
        ...currentScope,
        ...aiEnrichedScope
      };
      
      await db
        .update(sessionStates)
        .set({
          structuredScope: updatedScope as any,
          aiInteractions: [...currentInteractions, newInteraction] as any,
          updatedAt: new Date()
        })
        .where(eq(sessionStates.id, session_id));
      
      console.log(`[AI Assistant] Enriched scope with fields:`, Object.keys(aiEnrichedScope));
      console.log(`[AI Assistant] Advice: ${aiAdvice}`);
      
    } catch (error) {
      console.error("[AI Assistant] Error enriching answer:", error);
      // Continue without AI enrichment if it fails (graceful degradation)
    }
    
    // Check if we have enough to complete
    const isComplete = await isCompletionConditionMet({
      serviceType: session.serviceType,
      subcategory: session.subcategory || "",
      answers: currentAnswers
    });
    
    if (isComplete) {
      // Use the normalized subcategory from session (e.g., "Build deck")
      // Don't extract from first answer - that could be dimensions or other non-category data
      console.log(`[Scope Preview] Using subcategory: "${session.subcategory}" from session classification`);
      
      // Generate scope preview
      const { scope } = await assembleScope({
        serviceType: session.serviceType,
        subcategory: session.subcategory || "",
        answers: currentAnswers,
        serviceDescription: session.initialMessage, // Pass original service description for mulch detection
        storage // Pass storage for production standards and RAG
      });
      
      return res.json({
        session_id: session.id,
        status: "ready_to_finalize",
        scope_preview: {
          category: scope.category,
          subcategory: scope.subcategory,
          details: scope.details,
          estimated_hours: scope.estimatedHours,
          materials_needed: scope.materialsNeeded,
          complexity: scope.complexity,
          vendor_type: scope.vendorType,
          add_on_fees: scope.addOnFees,
          total_add_on_fees: scope.totalAddOnFees,
          hourly_rate: scope.hourlyRate,
          estimated_labor_cost: scope.estimatedLaborCost,
          estimated_material_cost: scope.estimatedMaterialCost,
          estimated_total_cost: scope.estimatedTotalCost,
          regional_info: scope.regionalInfo,
          material_calculation: scope.materialCalculation
        }
      });
    }
    
    // Use GPT-5 to generate next question dynamically with production standards
    const next = await scopeOrchestrator.generateNextQuestion(session_id, currentAnswers);
    
    console.log(`[Session Answer] Next question: ${next ? next.question : 'null'}, type: ${next?.type}, has options: ${!!next?.options}`);
    
    // CRITICAL FIX: Persist resolvedSubcategory when questionSelector does flexible matching
    // This prevents the "20 x 20" bug where scope assembly gets user answers instead of canonical subcategory
    if (next?.resolvedSubcategory && next.resolvedSubcategory !== session.subcategory) {
      console.log(`[Session Answer] 🔄 Updating session subcategory: "${session.subcategory}" → "${next.resolvedSubcategory}"`);
      await db
        .update(sessionStates)
        .set({
          subcategory: next.resolvedSubcategory,
          updatedAt: new Date()
        })
        .where(eq(sessionStates.id, session_id));
      
      // Update local session object for immediate use
      session.subcategory = next.resolvedSubcategory;
    }
    
    if (!next) {
      // Use the normalized subcategory from session (e.g., "Build deck")
      console.log(`[Scope Preview - No Next] Using subcategory: "${session.subcategory}" from session classification`);
      
      // No more questions, but completion condition not met - still return preview
      const { scope } = await assembleScope({
        serviceType: session.serviceType,
        subcategory: session.subcategory || "",
        answers: currentAnswers,
        serviceDescription: session.initialMessage, // Pass original service description for mulch detection
        storage // Pass storage for production standards and RAG
      });
      
      return res.json({
        session_id: session.id,
        status: "ready_to_finalize",
        scope_preview: {
          category: scope.category,
          subcategory: scope.subcategory,
          details: scope.details,
          estimated_hours: scope.estimatedHours,
          materials_needed: scope.materialsNeeded,
          complexity: scope.complexity,
          vendor_type: scope.vendorType,
          add_on_fees: scope.addOnFees,
          total_add_on_fees: scope.totalAddOnFees,
          hourly_rate: scope.hourlyRate,
          estimated_labor_cost: scope.estimatedLaborCost,
          estimated_material_cost: scope.estimatedMaterialCost,
          estimated_total_cost: scope.estimatedTotalCost,
          regional_info: scope.regionalInfo,
          material_calculation: scope.materialCalculation
        }
      });
    }
    
    // PROPER FIX: Use database ID from question, not generated client ID
    res.json({
      session_id: session.id,
      next_question: {
        id: next.id, // Use database UUID from question
        text: next.question,
        responseType: next.type,
        options: next.options || null,
        phase: next.phase || null,
        phaseLabel: next.phaseLabel || null,
        guidance: next.guidance || null, // Consultant-style warm explanation
        aiRationale: next.rationale || null // Technical reasoning
      },
      aiAdvice: aiAdvice, // 🆕 AI Assistant advice for the user's answer
      progress: {
        requiredAnswered: Object.keys(currentAnswers).length,
        requiredTotal: 5 // GPT-5 adaptive, max 5 questions
      }
    });
    
  } catch (error) {
    console.error("Error recording answer:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to record answer" }
    });
  }
});

export default router;
