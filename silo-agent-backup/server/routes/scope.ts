/**
 * Scope Routes
 * Handles scope finalization and completion
 */

import { Router } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { sessionStates, scopesGenerated, completedJobs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { assembleScope } from "../services/scopeAssembler";
import { formatScopeProposal } from "../services/scopeFormatter";

const router = Router();

/**
 * POST /api/scope/complete
 * Finalize a session and generate the complete scope
 */
router.post("/complete", async (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "session_id is required" }
      });
    }
    
    // 🎯 IDEMPOTENCY GUARD: Check if scope already exists for this session
    const existingScope = await db
      .select()
      .from(scopesGenerated)
      .where(eq(scopesGenerated.sessionId, session_id))
      .limit(1);
    
    if (existingScope.length > 0) {
      console.log(`✅ [Idempotency] Returning cached scope for session ${session_id} (avoiding duplicate Claude call)`);
      
      // Fetch formatted proposal from completedJobs if available
      let cachedFormattedProposal: string | null = null;
      try {
        const [completedJob] = await db
          .select()
          .from(completedJobs)
          .where(eq(completedJobs.sessionId, session_id))
          .limit(1);
        
        if (completedJob?.formattedProposal) {
          cachedFormattedProposal = completedJob.formattedProposal;
          console.log(`✅ [Idempotency] Retrieved cached formatted proposal`);
        }
      } catch (proposalError) {
        console.error('[Idempotency] Failed to retrieve cached proposal (non-fatal):', proposalError);
      }
      
      // Return the existing scope immediately without calling Claude again
      const cached = existingScope[0];
      return res.json({
        scope_id: cached.id,
        scope_data: {
          category: cached.category,
          subcategory: cached.subcategory,
          details: cached.details,
          estimated_hours: (cached.estimatedHours || 0) / 10, // Convert back from tenths
          materials_needed: cached.materialsNeeded,
          complexity: cached.complexity,
          vendor_type: cached.vendorType
        },
        summary: cached.summary,
        formatted_proposal: cachedFormattedProposal, // Include cached formatted proposal
        next: "Ready for vendor matching / escrow."
      });
    }
    
    // Get session (only if we need to generate a new scope)
    const [session] = await db
      .select()
      .from(sessionStates)
      .where(eq(sessionStates.id, session_id));
    
    if (!session) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Session not found" }
      });
    }
    
    // Assemble scope with RAG-enhanced pricing and deck calculations
    const { scope, summary } = await assembleScope({
      serviceType: session.serviceType,
      subcategory: session.subcategory || "",
      answers: (session.answers as Record<string, any>) || {},
      serviceDescription: session.initialMessage, // Use initialMessage from old schema
      storage // 🎯 FIX: Pass storage to enable production standards and deck material calculations
    });
    
    // Save to scopes_generated
    const [generatedScope] = await db
      .insert(scopesGenerated)
      .values({
        sessionId: session_id,
        category: scope.category,
        subcategory: scope.subcategory || null,
        details: scope.details,
        estimatedHours: Math.round(scope.estimatedHours * 10), // Store as tenths (15 = 1.5 hours)
        materialsNeeded: scope.materialsNeeded,
        complexity: scope.complexity,
        vendorType: scope.vendorType,
        summary,
        status: "unmatched"
      })
      .returning();
    
    // 🎯 AUTOMATIC RAG LEARNING: Save this scope as draft completed job
    // This will be updated with actual outcomes (hours, cost, rating) when job completes
    try {
      const answers = (session.answers as Record<string, any>) || {};
      
      // Convert answers object to question/answer array for RAG
      // Note: Session stores question text as "questionText" (not "question")
      const questionAnswers = Object.values(answers).map((qa: any) => ({
        question: qa.questionText || qa.question || "Question not stored",
        answer: qa.answer || qa
      }));
      
      // Only save if we have meaningful question/answer data
      if (questionAnswers.length > 0) {
        // 🆕 Generate formatted TUDAO proposal
        let formattedProposal: string | null = null;
        try {
          console.log('[ScopeFormatter] Generating TUDAO proposal...');
          formattedProposal = await formatScopeProposal({
            scopeJson: scope,
            scopeId: generatedScope.id,
            clientName: undefined, // Could add user info later
            vendorName: undefined, // Could add vendor matching later
          });
          console.log('[ScopeFormatter] ✅ Proposal generated successfully');
        } catch (formatterError) {
          console.error('[ScopeFormatter] ❌ Failed to format proposal (non-fatal):', formatterError);
          // Continue without formatted proposal if formatter fails
        }
        
        await db.insert(completedJobs).values({
          sessionId: session_id,
          serviceType: session.serviceType,
          serviceDescription: session.initialMessage,
          originalScope: summary,
          providerType: scope.vendorType,
          
          // SAVE ESTIMATES (for comparison when actual data comes in)
          estimatedManHours: scope.estimatedHours,
          estimatedCost: scope.estimatedTotalCost || null, // in cents
          
          // ACTUAL outcomes (null until job completes)
          actualManHours: null,
          actualCost: null,
          materialsUsed: scope.materialsNeeded ? JSON.stringify(scope.materialsNeeded) : null,
          customerRating: null,
          
          // METADATA
          completedAt: null, // Not completed yet
          dataSource: "actual_completion", // Real customer data (vs admin_seed)
          isTrainingExample: 0, // Not curated yet
          notes: `Scope generated. Complexity: ${scope.complexity}. ${scope.subcategory ? `Subcategory: ${scope.subcategory}` : ''}. Awaiting job completion for actual outcomes.`,
          questionAnswers: questionAnswers as any,
          
          // 🆕 FORMATTED PROPOSAL
          formattedProposal: formattedProposal || null,
        });
        
        console.log(`✅ Saved draft completed job for learning: ${questionAnswers.length} questions for ${session.serviceType}`);
      }
    } catch (ragError) {
      console.error("Failed to save draft to learning system (non-fatal):", ragError);
      // Don't fail the scope completion if RAG save fails
    }
    
    // Update session status
    await db
      .update(sessionStates)
      .set({
        status: "completed",
        updatedAt: new Date()
      })
      .where(eq(sessionStates.id, session_id));
    
    // Generate formatted proposal for response (even if not saved to DB)
    let responseFormattedProposal: string | null = null;
    try {
      responseFormattedProposal = await formatScopeProposal({
        scopeJson: scope,
        scopeId: generatedScope.id,
        clientName: undefined,
        vendorName: undefined,
      });
    } catch (formatterError) {
      console.error('[ScopeFormatter] Failed to format proposal for response (non-fatal):', formatterError);
    }
    
    res.json({
      scope_id: generatedScope.id,
      scope_data: {
        category: scope.category,
        subcategory: scope.subcategory,
        details: scope.details,
        estimated_hours: scope.estimatedHours,
        materials_needed: scope.materialsNeeded,
        complexity: scope.complexity,
        vendor_type: scope.vendorType
      },
      summary,
      formatted_proposal: responseFormattedProposal, // 🆕 Include formatted proposal in response
      next: "Ready for vendor matching / escrow."
    });
    
  } catch (error) {
    console.error("Error completing scope:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to complete scope" }
    });
  }
});

export default router;
