/**
 * AI-Enriched Scope Types for Hybrid Wizard + AI Assistant
 * 
 * These types define the structure for AI-enhanced scope generation
 * that enriches wizard answers with intelligent interpretation and advice.
 */

export interface ScopeDetail {
  serviceType?: string;              // "mowing", "mulch", "deck_build", etc.
  locationDescription?: string;      // "front yard + right side"
  dimensions?: string | null;        // "approx 20x20", or null if unknown
  materials?: string[];              // ["hardwood mulch", "PT lumber"]
  accessNotes?: string | null;       // "narrow gate on left", etc.
  riskFlags?: string[];              // ["slope", "near gas line"]
  codeOrPermitFlags?: string[];      // ["permit_likely", "railings_required"]
  schedulePreference?: string | null;
  budgetSensitivity?: "low" | "medium" | "high" | null;
  propertyConditions?: string[];     // ["well maintained", "overgrown", "new construction"]
  urgencyLevel?: string | null;      // "ASAP", "flexible", "within 2 weeks"
  specialRequests?: string[];        // User's specific preferences or requirements
}

export interface AiInteraction {
  stepKey: string;                   // which wizard step triggered it (e.g., "q_1", "landscape.service_type")
  questionText: string;              // the wizard question that was asked
  userMessage: string;               // user's answer from that step
  aiAdvice?: string;                 // advisory line shown in UI
  aiInferredFields: Partial<ScopeDetail>; // what the AI enriched from this answer
  knowledgeLevel?: "novice" | "intermediate" | "expert"; // detected user expertise
  timestamp: string;                 // when this interaction occurred
}

export interface AiAssistantRequest {
  sessionId: string;
  stepKey: string;                   // current wizard step (e.g., "q_123" or "landscape.size")
  questionText: string;              // the wizard question
  userAnswer: string;                // user's raw answer
  currentScope: ScopeDetail;         // current AI-enriched scope
  allAnswers: Record<string, any>;   // all wizard answers so far
  ragSnippets?: string[];            // optional RAG context
}

export interface AiAssistantResponse {
  advice: string;                    // friendly tip to show user
  enrichedFields: Partial<ScopeDetail>; // scope fields AI extracted/inferred
  knowledgeLevel: "novice" | "intermediate" | "expert";
  scopePreview: string;              // human-readable summary of scope so far
}
