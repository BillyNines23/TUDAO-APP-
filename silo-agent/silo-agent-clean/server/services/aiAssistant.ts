/**
 * AI Scope Assistant - Hybrid Wizard + AI Intelligence
 * 
 * This service enriches wizard answers with AI interpretation:
 * - Extracts structured scope details from natural language
 * - Provides friendly, adaptive advice based on user expertise
 * - Never changes the wizard flow order (wizard controls the sequence)
 */

import OpenAI from "openai";
import type {
  AiAssistantRequest,
  AiAssistantResponse,
  ScopeDetail
} from "../types/ai-scope";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

/**
 * System prompt for the AI Scope Assistant (Hybrid Mode)
 * 
 * This prompt is specifically designed for the hybrid wizard + AI approach:
 * - Wizard controls the question order
 * - AI enriches each answer with interpretation and advice
 * - AI never asks follow-up questions (Phase 1 - advice only)
 */
const HYBRID_SYSTEM_PROMPT = `You are the TUDAO Scope Assistant, an adaptive AI that helps homeowners understand their service needs and builds accurate scopes of work.

**Your Role in the Hybrid System:**
- The wizard controls the question order (you don't decide which question comes next)
- Your job is to ENRICH each wizard answer with:
  1. Structured data extraction (scope fields)
  2. Friendly, helpful advice
  3. Detection of user expertise level

**What You Receive:**
You'll get a JSON object with:
- stepKey: the wizard question ID
- questionText: the exact question the wizard asked
- userAnswer: what the user typed/selected
- currentScope: the scope fields collected so far
- allAnswers: all previous wizard answers

**What You Output:**
You must output JSON in this EXACT format:
{
  "advice": "A single friendly tip (1-2 sentences) to help the user understand their choice",
  "enrichedFields": {
    "serviceType": "mowing",
    "dimensions": "approximately 3000 sq ft",
    "materials": ["natural hardwood mulch"]
  },
  "knowledgeLevel": "novice | intermediate | expert",
  "scopePreview": "A brief human-readable summary of what we know so far"
}

**Rules:**
1. NEVER ask follow-up questions (this is Phase 1 - advice only)
2. ALWAYS provide advice that helps novices understand what their choices mean
3. Extract ANY scope details you can infer from the answer (even if partial/approximate)
4. Detect expertise:
   - "novice": uses casual language, unsure, asks for help
   - "intermediate": provides basic details, knows some terminology
   - "expert": uses industry jargon, very specific measurements/materials
5. Keep advice friendly, non-technical, and confidence-building
6. Use RAG snippets (if provided) to give accurate material/code guidance
7. NEVER contradict previous scope fields - only add or refine

**Expertise Adaptation Examples:**

Novice answer: "I think it's kinda big, maybe like a backyard?"
→ advice: "No problem! For a typical backyard, we usually estimate around 5,000-8,000 sq ft. If you have a photo or rough dimensions, that helps too."
→ enrichedFields: { "dimensions": "large backyard, approximately 5000-8000 sq ft" }

Expert answer: "18x24 composite deck, Trex Transcend in Gravel Path, 36" height"
→ advice: "Perfect - you've got all the details we need! Transcend is a great choice for durability."
→ enrichedFields: { "serviceType": "deck_installation", "dimensions": "18x24 feet", "materials": ["Trex Transcend composite, Gravel Path color"], "deckHeight": "36 inches" }

Intermediate answer: "Medium size lawn, some trees and flower beds around the edges"
→ advice: "Got it! The trees and flower beds will need some trimming and edging work to keep everything looking sharp."
→ enrichedFields: { "dimensions": "medium lawn, approximately 3000-5000 sq ft", "obstacles": ["trees", "flower beds"], "riskFlags": ["requires edge trimming"] }

**Remember:**
- You're enhancing the wizard, not replacing it
- Advice should make users feel confident, not overwhelmed
- Extract as much structured data as possible from each answer
- Be friendly, helpful, and adaptive to their knowledge level`;

/**
 * Call AI Scope Assistant to enrich a wizard answer
 */
export async function enrichWizardAnswer(
  request: AiAssistantRequest
): Promise<AiAssistantResponse> {
  try {
    console.log(`[AI Assistant] Enriching answer for step: ${request.stepKey}`);
    
    // Build the user message with all context
    const userMessage = buildUserMessage(request);
    
    // Call AI with the hybrid system prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: HYBRID_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });
    
    // Parse the AI response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }
    
    const aiOutput = parseAiResponse(content);
    
    console.log(`[AI Assistant] Enriched fields:`, aiOutput.enrichedFields);
    console.log(`[AI Assistant] Knowledge level: ${aiOutput.knowledgeLevel}`);
    
    return aiOutput;
    
  } catch (error) {
    console.error("[AI Assistant] Error enriching answer:", error);
    
    // Graceful fallback - return minimal enrichment
    return {
      advice: "Got it! We'll use that information for your scope.",
      enrichedFields: {},
      knowledgeLevel: "intermediate",
      scopePreview: buildScopePreview(request.currentScope)
    };
  }
}

/**
 * Build the user message with all context for the AI
 */
function buildUserMessage(request: AiAssistantRequest): string {
  const ragContext = request.ragSnippets && request.ragSnippets.length > 0
    ? `\n\nRelevant technical information:\n${request.ragSnippets.join("\n\n")}`
    : "";
  
  return `{
  "stepKey": "${request.stepKey}",
  "questionText": "${request.questionText}",
  "userAnswer": "${request.userAnswer}",
  "currentScope": ${JSON.stringify(request.currentScope, null, 2)},
  "allAnswers": ${JSON.stringify(request.allAnswers, null, 2)}
}${ragContext}

Please enrich this wizard answer with structured scope fields and helpful advice.`;
}

/**
 * Parse AI response JSON
 */
function parseAiResponse(text: string): AiAssistantResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      advice: parsed.advice || "Thank you for that information!",
      enrichedFields: parsed.enrichedFields || {},
      knowledgeLevel: parsed.knowledgeLevel || "intermediate",
      scopePreview: parsed.scopePreview || "Building your scope..."
    };
  } catch (error) {
    console.error("[AI Assistant] Failed to parse AI response:", error);
    console.error("[AI Assistant] Raw response:", text);
    throw error;
  }
}

/**
 * Build a human-readable scope preview from current fields
 */
function buildScopePreview(scope: ScopeDetail): string {
  const parts: string[] = [];
  
  if (scope.serviceType) {
    parts.push(`Service: ${scope.serviceType}`);
  }
  if (scope.dimensions) {
    parts.push(`Size: ${scope.dimensions}`);
  }
  if (scope.materials && scope.materials.length > 0) {
    parts.push(`Materials: ${scope.materials.join(", ")}`);
  }
  if (scope.locationDescription) {
    parts.push(`Location: ${scope.locationDescription}`);
  }
  if (scope.schedulePreference) {
    parts.push(`Timeline: ${scope.schedulePreference}`);
  }
  
  return parts.length > 0
    ? parts.join(" • ")
    : "Building your scope...";
}
