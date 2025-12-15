import OpenAI from "openai";
import { storage } from "../storage";
import type { ScopeSession, UploadedAsset } from "@shared/schema";
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { buildRolePrompt } from "./expertRoles";
import { extractRagDomainLanguage } from "./ragDomainLanguage";
import * as questionSelector from "../services/questionSelector";

const require = createRequire(import.meta.url);

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

interface VisionAnalysisResult {
  detectedServiceType: string;
  confidence: number;
  components: string[];
  condition: string;
  suggestedCategories: string[];
}

interface IntentClassificationResult {
  intent: "service" | "installation" | "unclear";
  confidence: number;
  reasoning: string;
  suggestedClarification?: string;
}

interface QuestionPlan {
  id?: string; // Database UUID for seeded questions, or generated for AI questions
  question: string;
  type: "choice" | "multiple_choice" | "text" | "photo_upload";
  options?: string[];
  rationale: string;
  phase?: 1 | 2 | 3 | 4; // Phase in the conversational flow
  phaseLabel?: string; // Human-readable phase name
  guidance?: string; // Consultant-style explanation to build trust and understanding
  resolvedSubcategory?: string; // Canonical subcategory after flexible matching (e.g., "Deck Building" → "Build deck")
}

export class ScopeOrchestrator {
  /**
   * Analyze uploaded photos using GPT-4o vision to detect service type and components
   */
  async analyzePhotos(sessionId: string, assets: UploadedAsset[]): Promise<VisionAnalysisResult> {
    if (assets.length === 0) {
      throw new Error("No photos provided for analysis");
    }

    // Use base64 data URIs for vision analysis
    const imageContent = assets.map(asset => ({
      type: "image_url" as const,
      image_url: {
        url: asset.fileUrl, // This is now a base64 data URI
      }
    }));

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Using GPT-4o for vision capabilities
        messages: [
          {
            role: "system",
            content: `You are an expert service estimation AI that analyzes photos to identify maintenance, repair, and installation needs.
            
Analyze the provided images and return a JSON object with:
- detectedServiceType: the main service category (e.g., "Door Installation", "Window Installation", "Fence Repair", "Plumbing", "Electrical", "Roofing")
- confidence: your confidence level (0-1)
- components: list of specific components you can identify with technical details
- condition: brief description of the overall condition (damage, wear, age indicators)
- suggestedCategories: work categories that might be needed

SERVICE-SPECIFIC ANALYSIS GUIDELINES:

DOORS - Identify these cost-relevant details:
- Location: Interior or exterior door?
- Style: Solid panel, glass panels, French doors, barn door, pocket door, bifold?
- Material: Wood (solid/composite), fiberglass, steel, aluminum, glass?
- Glass type: Clear, frosted, decorative, built-in blinds?
- Frame condition: Original frame visible? Rot, damage, misalignment?
- Hardware: Existing handles, locks, hinges visible? Condition?
- Size: Standard (36") or custom size? Single or double doors?
- Sidelights or transoms: Additional glass panels beside/above door?
- Storm door: Is there one? Needs replacement?
- Weatherstripping: Visible gaps, wear, damage?
- Paint/finish: Peeling, fading, damage?

WINDOWS:
- Type: Double-hung, casement, slider, bay, picture, awning?
- Material: Vinyl, wood, aluminum, fiberglass frame?
- Glass: Single pane, double pane, Low-E coating visible?
- Condition: Seal failure (fogging), rot, damage, paint condition?
- Size and quantity: Approximate dimensions?

ROOFING:
- Material: Asphalt shingle, tile, metal, flat/TPO?
- Condition: Missing shingles, curling, granule loss, stains?
- Age indicators: Color fading, moss/algae growth?
- Damage: Storm damage, sagging, flashing issues?

FENCING:
- Material: Wood, vinyl, chain link, wrought iron, composite?
- Condition: Rot, leaning, broken panels, rust?
- Height and length: Approximate dimensions?

Be EXTREMELY specific and technical. Call out materials, styles, damage patterns, and anything that affects cost.`
          },
          {
            role: "user",
            content: imageContent
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const analysisText = response.choices[0]?.message?.content || "{}";
      const analysis = JSON.parse(analysisText) as VisionAnalysisResult;

      // Store analysis in session
      await storage.updateScopeSession(sessionId, {
        aiAnalysis: analysis,
        detectedServiceType: analysis.detectedServiceType
      });

      return analysis;
    } catch (error) {
      console.error("Error analyzing photos with AI:", error);
      throw new Error(`Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Normalize AI-generated serviceType to match seeded questions database
   * Example: "Deck Building" → "Carpentry" (seeded questions use Carpentry)
   */
  private normalizeServiceType(serviceType: string): string {
    const normalized = serviceType.toLowerCase();
    
    // DECK BUILDING → CARPENTRY (seeded questions use Carpentry for decks)
    if (normalized.includes('deck')) {
      return 'Carpentry';
    }
    
    // Default: Return original if no normalization needed
    return serviceType;
  }

  /**
   * Normalize AI-generated subcategory to canonical form for seeded question matching
   */
  private normalizeSubcategory(subcategory: string, serviceType: string): string {
    const normalized = subcategory.toLowerCase();
    
    // DECK BUILDING - Map all variations to canonical "Build deck"
    if (normalized.includes('deck') && (normalized.includes('build') || normalized.includes('construct') || normalized.includes('install') || normalized.includes('new'))) {
      return 'Build deck';
    }
    if (normalized.includes('deck') && (normalized.includes('repair') || normalized.includes('maintain') || normalized.includes('stain') || normalized.includes('seal'))) {
      return 'Deck Repair';
    }
    
    // CARPENTRY
    if (normalized.includes('door')) {
      return 'Door Repair';
    }
    if (normalized.includes('cabinet')) {
      return 'Cabinet Repair';
    }
    
    // LANDSCAPING
    if (normalized.includes('lawn') || normalized.includes('mow') || normalized.includes('grass') || normalized.includes('yard')) {
      return 'Lawn Maintenance';
    }
    if (normalized.includes('tree') && normalized.includes('trim')) {
      return 'Tree Trimming';
    }
    if (normalized.includes('fence')) {
      return 'Fence Installation';
    }
    if (normalized.includes('garden')) {
      return 'Garden Maintenance';
    }
    // Default: Generic "landscaping" → Lawn Maintenance (most common homeowner request)
    if (serviceType === 'Landscaping' && (normalized.includes('general') || normalized.includes('landscaping') || normalized === 'landscaping tasks')) {
      return 'Lawn Maintenance';
    }
    
    // PLUMBING
    if (normalized.includes('faucet')) {
      return 'Faucet Repair';
    }
    if (normalized.includes('leak')) {
      return 'Leak Detection';
    }
    if (normalized.includes('drain')) {
      return 'Drain Cleaning';
    }
    if (normalized.includes('toilet')) {
      return 'Toilet Repair';
    }
    
    // HVAC
    if (normalized.includes('ac') || normalized.includes('air conditioning')) {
      return 'AC Repair';
    }
    if (normalized.includes('heat') || normalized.includes('furnace')) {
      return 'Heating Repair';
    }
    if (normalized.includes('thermostat')) {
      return 'Thermostat Installation';
    }
    
    // ELECTRICAL
    if (normalized.includes('outlet') || normalized.includes('socket')) {
      return 'Outlet Repair';
    }
    if (normalized.includes('light') || normalized.includes('fixture')) {
      return 'Light Fixture';
    }
    if (normalized.includes('switch')) {
      return 'Switch Replacement';
    }
    if (normalized.includes('panel') || normalized.includes('breaker')) {
      return 'Panel Upgrade';
    }
    
    // PAINTING
    if (normalized.includes('interior') && normalized.includes('paint')) {
      return 'Interior Painting';
    }
    if (normalized.includes('exterior') && normalized.includes('paint')) {
      return 'Exterior Painting';
    }
    
    // Default: Return original if no match found
    return subcategory;
  }

  /**
   * Classify service intent: Service/Maintenance vs Installation/New
   * This is the Master Router that determines which question flow to use
   * ENHANCED: Integrates text-based classification (serviceType/subcategory) with photo-aware intent
   */
  async classifyIntent(
    description: string,
    photos?: UploadedAsset[]
  ): Promise<IntentClassificationResult & { serviceType?: string; subcategory?: string }> {
    try {
      // STEP 1: Get baseline classification from intentClassifier (text-only, includes serviceType/subcategory)
      const intentClassifierModule = await import('../services/intentClassifier');
      const baselineClassification = await intentClassifierModule.classifyIntent(description);
      
      // NORMALIZE: Convert AI-generated serviceType and subcategory to canonical forms for seeded question matching
      const canonicalServiceType = this.normalizeServiceType(baselineClassification.serviceType);
      const canonicalSubcategory = this.normalizeSubcategory(
        baselineClassification.subcategory, 
        baselineClassification.serviceType
      );
      
      console.log(`[Orchestrator] Baseline classification: ${baselineClassification.serviceType}/${baselineClassification.subcategory} → normalized to '${canonicalServiceType}/${canonicalSubcategory}'`);

      // STEP 2: If photos exist, run photo-aware vision pass for intent refinement
      let photoResult: IntentClassificationResult | null = null;
      if (photos && photos.length > 0) {
        const messages: any[] = [
          {
            role: "system",
            content: `You are a service intent classifier. Analyze the customer's description and photos to determine if they want:

**SERVICE/MAINTENANCE/REPAIR** - Fix, maintain, or service what already exists:
- Keywords: mow, trim, clean, cleanup, maintain, service, repair, fix, patch, tune-up, weekly, monthly, recurring
- Examples: "mow my lawn weekly", "clean gutters", "fix leaky faucet", "repair fence boards", "HVAC maintenance"

**INSTALLATION/REPLACEMENT/NEW BUILD** - Add, install, replace, or build something new:
- Keywords: install, replace, new, add, build, landscape, design, re-do, overhaul, plant
- Examples: "install new sod", "replace front door", "build deck", "landscape backyard", "add irrigation system"

**UNCLEAR** - Not enough information or ambiguous:
- Examples: "need help with yard", "door issues", "landscaping"

Return JSON with:
{
  "intent": "service" | "installation" | "unclear",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation considering photos",
  "suggestedClarification": "Optional question to ask if unclear"
}`
          }
        ];

        const userContent: any[] = [
          { type: "text", text: `Customer description: "${description}"` }
        ];

        photos.forEach(photo => {
          userContent.push({
            type: "image_url",
            image_url: { url: photo.fileUrl }
          });
        });

        messages.push({ role: "user", content: userContent });

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          response_format: { type: "json_object" },
          max_completion_tokens: 500,
        });

        const resultText = response.choices[0]?.message?.content || "{}";
        photoResult = JSON.parse(resultText) as IntentClassificationResult;
        
        console.log(`[Orchestrator] Photo classification: ${photoResult.intent} (confidence: ${photoResult.confidence})`);
      }

      // STEP 3: Merge results - use higher confidence source for intent/reasoning/clarification
      // Always preserve canonical serviceType/subcategory for seeded question matching
      const merged = {
        // From baseline (always use canonical normalized forms)
        serviceType: canonicalServiceType, // Use normalized canonical form!
        subcategory: canonicalSubcategory, // Use normalized canonical form!
        
        // Merge intent/confidence/reasoning - use higher confidence source
        intent: photoResult && photoResult.confidence > baselineClassification.confidence 
          ? photoResult.intent 
          : baselineClassification.serviceIntent,
        confidence: Math.max(photoResult?.confidence || 0, baselineClassification.confidence),
        reasoning: (photoResult && photoResult.confidence > baselineClassification.confidence
          ? photoResult.reasoning
          : baselineClassification.reasoning) || "Classification completed",
        suggestedClarification: photoResult && photoResult.confidence > baselineClassification.confidence
          ? photoResult.suggestedClarification
          : baselineClassification.clarifier
      };

      console.log(`[Orchestrator] Merged result: intent='${merged.intent}', serviceType='${merged.serviceType}', subcategory='${merged.subcategory}' (canonical)`);

      return merged;
    } catch (error) {
      console.error("Error classifying intent:", error);
      return {
        intent: "unclear",
        confidence: 0,
        reasoning: "Classification failed",
        suggestedClarification: "Are you looking to fix/maintain what you have, or add/install something new?"
      };
    }
  }

  /**
   * Generate the next clarifying question based on current context
   * HYBRID APPROACH: Try seeded questions first, fall back to AI generation
   */
  async generateNextQuestion(
    sessionId: string,
    previousAnswers: Record<string, string>
  ): Promise<QuestionPlan | null> {
    const session = await storage.getScopeSession(sessionId);
    if (!session) throw new Error("Session not found");

    const analysis = session.aiAnalysis as VisionAnalysisResult | null;
    
    // NEW SESSION SYSTEM: Use previousAnswers passed from endpoint (sessionStates.answers)
    // answers format: { "q1": { questionText: "...", answer: "..." }, "q2": { questionText: "...", answer: "..." } }
    // Note: Session stores question text as "questionText" (not "question")
    const answeredQuestions = Object.entries(previousAnswers).map(([questionId, qa]: [string, any]) => ({
      questionText: qa.questionText || qa.question || questionId, // Use stored question text (check both field names)
      answer: qa.answer || qa // Handle old format (just string) and new format (object)
    }));

    // 🎯 HYBRID APPROACH: Check for seeded questions FIRST
    // For services with curated question flows (deck, HVAC, etc.), use structured questions
    // This ensures multiple-choice options for semantic extraction
    if (session.detectedServiceType && session.subcategory) {
      try {
        console.log(`[Hybrid] Checking for seeded questions: ${session.detectedServiceType} / ${session.subcategory}`);
        
        const seededQuestion = await questionSelector.nextQuestion({
          serviceType: session.detectedServiceType,
          subcategory: session.subcategory,
          serviceIntent: session.serviceIntent as any,
          answers: previousAnswers
        });

        // CRITICAL FIX: Persist resolvedSubcategory even when no more questions remain
        // This prevents the "20 x 16" bug where terminal flexible matches don't persist canonical subcategory
        if (seededQuestion?.resolvedSubcategory && seededQuestion.resolvedSubcategory !== session.subcategory) {
          console.log(`[Hybrid] 🔄 Persisting resolved subcategory: "${session.subcategory}" → "${seededQuestion.resolvedSubcategory}"`);
          await storage.updateScopeSession(session.id, {
            subcategory: seededQuestion.resolvedSubcategory
          });
          session.subcategory = seededQuestion.resolvedSubcategory;
        }
        
        if (seededQuestion) {
          console.log(`[Hybrid] ✅ Found seeded question: ${seededQuestion.text} (ID: ${seededQuestion.id})`);
          
          // Map seeded question to QuestionPlan format
          return {
            id: seededQuestion.id, // Include database UUID for tracking
            question: seededQuestion.text,
            type: seededQuestion.responseType as any,
            options: seededQuestion.options || undefined,
            rationale: `Seeded question for ${session.detectedServiceType} / ${session.subcategory}`,
            phase: 2,
            phaseLabel: "Core Deliverables",
            resolvedSubcategory: seededQuestion.resolvedSubcategory // Bubble up canonical subcategory
          };
        } else {
          console.log(`[Hybrid] No seeded questions found, falling back to AI generation`);
        }
      } catch (error) {
        console.error(`[Hybrid] Error fetching seeded question:`, error);
        // Fall through to AI generation on error
      }
    }

    // 🔍 DETECT MULTIPLE SERVICE SELECTIONS
    // If the first answer contains multiple services, we need to ask questions for EACH service
    let selectedServices: string[] = [];
    let multiServiceContext = "";
    const firstAnswer = answeredQuestions.length > 0 ? answeredQuestions[0].answer : "";
    const firstQuestion = answeredQuestions.length > 0 ? answeredQuestions[0].questionText : "";
    
    if (firstAnswer && firstQuestion) {
      // Get the options from the first question (if it was a multiple choice question about service types)
      const firstQuestionOptions = this.getFirstQuestionOptions(firstQuestion, session.detectedServiceType || "");
      
      // Parse multiple services from first answer using the actual checkbox options
      selectedServices = this.parseMultipleServices(firstAnswer, firstQuestionOptions);
      
      if (selectedServices.length > 1) {
        multiServiceContext = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MULTI-SERVICE MODE ACTIVATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The customer selected ${selectedServices.length} DISTINCT services:
${selectedServices.map((service, idx) => `${idx + 1}. ${service}`).join('\n')}

**YOUR APPROACH:**
Apply Phase 2 (Core Deliverables) to EACH service individually.
Target: 2-3 questions per service (total: ${Math.ceil(selectedServices.length * 2.5)} questions)

**SERVICE-SPECIFIC QUESTIONING:**
For each service, complete Phase 2:
${selectedServices.map(service => `
- "${service}":
  - Size/quantity specific to this service
  - Materials/specifications (if installation)
  - Frequency (if recurring service)`).join('')}

**LABELING REQUIREMENT:**
Start each question with "For the [service name], ..."
Example: "For the planting work, what types of plants are you looking to install?"
Example: "For the lawn mowing, how large is the area that needs mowing?"

**PROGRESSION:**
Complete Phase 2 for Service 1 → Service 2 → Service 3, then move to Phase 3 if needed.
Don't mix services - finish Phase 2 for one service before starting the next.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        
        console.log(`[Multi-service detected] ${selectedServices.length} services:`, selectedServices);
      }
    }
    
    // Safety valve to prevent infinite questioning (very high limit)
    // The system should rely on completion conditions and RAG guidance to determine when to stop
    // Simple tasks (gutter cleaning) might need 2-3 questions
    // Complex projects (deck building, landscaping) might need 10-15+ questions
    const safetyLimit = 25; // Only to prevent runaway loops, not to artificially cap questions
    
    console.log(`📊 Question planning: ${selectedServices.length || 1} service(s), ${answeredQuestions.length} answered so far`);

    // Safety valve check (very high limit - should rarely trigger)
    if (answeredQuestions.length >= safetyLimit) {
      console.warn(`⚠️ Safety limit reached (${safetyLimit} questions). Ending question flow.`);
      return null;
    }

    // Build context from what we know
    const context = {
      serviceType: session.detectedServiceType || "Unknown",
      serviceIntent: session.serviceIntent || null, // Master Router classification: "service" or "installation"
      serviceDescription: session.serviceDescription,
      photoAnalysis: analysis,
      previousQuestions: answeredQuestions.map(q => ({
        question: q.questionText,
        answer: q.answer
      })),
      answeredCount: answeredQuestions.length,
      selectedServices, // Track which services need questions
      multiServiceMode: selectedServices.length > 1
    };

    // PRODUCTION STANDARDS: Query production standards to guide questions
    let productionStandardsContext = "";
    try {
      const standards = await storage.getProductionStandardsByService(context.serviceType);
      
      if (standards.length > 0) {
        // Group standards by subcategory
        const standardsBySubcategory = standards.reduce((acc: any, std: any) => {
          const subcat = std.subcategory || "General";
          if (!acc[subcat]) acc[subcat] = [];
          acc[subcat].push(std);
          return acc;
        }, {});

        // Build context about units and key factors
        const unitMap: Record<string, string> = {
          'linear_feet': 'linear feet',
          'square_feet': 'square feet',
          'cubic_feet': 'cubic feet',
          'cubic_yards': 'cubic yards',
          'squares': 'squares (1 square = 100 sq ft)',
          'acres': 'acres',
          'each': 'each (count)'
        };

        productionStandardsContext = `\n\n🎯 PRODUCTION STANDARDS GUIDANCE:\nWe have ${standards.length} production standards for ${context.serviceType}. Ask questions to gather quantities and conditions that match these standards:\n\n`;

        for (const [subcat, subcatStandards] of Object.entries(standardsBySubcategory) as any) {
          productionStandardsContext += `${subcat}:\n`;
          (subcatStandards as any[]).forEach((std: any) => {
            const unit = unitMap[std.unitOfMeasure] || std.unitOfMeasure;
            const description = std.itemDescription;
            const notes = std.notes || "";
            
            productionStandardsContext += `  • ${description} - measured in ${unit}\n`;
            if (notes) {
              // Extract key factors from notes
              const factors = [];
              if (notes.toLowerCase().includes('pitch') || notes.toLowerCase().includes('steep')) {
                factors.push('pitch/steepness');
              }
              if (notes.toLowerCase().includes('complex') || notes.toLowerCase().includes('hips') || notes.toLowerCase().includes('valleys')) {
                factors.push('complexity');
              }
              if (notes.toLowerCase().includes('distance')) {
                factors.push('distance from pile/access');
              }
              if (notes.toLowerCase().includes('slope') || notes.toLowerCase().includes('terrain')) {
                factors.push('terrain/slopes');
              }
              if (notes.toLowerCase().includes('layer')) {
                factors.push('number of layers');
              }
              if (notes.toLowerCase().includes('ceiling')) {
                factors.push('ceiling height');
              }
              if (notes.toLowerCase().includes('touchless') || notes.toLowerCase().includes('electronic')) {
                factors.push('faucet type (standard vs touchless)');
              }
              if (notes.toLowerCase().includes('bathtub') || notes.toLowerCase().includes('behind wall')) {
                factors.push('location (sink vs bathtub)');
              }
              
              if (factors.length > 0) {
                productionStandardsContext += `    Key factors: ${factors.join(', ')}\n`;
              }
            }
          });
          productionStandardsContext += '\n';
        }

        productionStandardsContext += `💡 IMPORTANT: Ask for quantities in the units shown above. Also ask about the key factors that affect production rates (complexity, pitch, distance, terrain, layers, etc.).\n`;
        
        console.log(`Production Standards: Found ${standards.length} standards to guide question generation`);
      }
    } catch (error) {
      console.error("Error querying production standards:", error);
      // Continue without production standards guidance if query fails
    }

    // 🎯 RAG-FIRST APPROACH: Try to use proven questions from similar jobs DIRECTLY
    let ragQuestion: QuestionPlan | null = null;
    let similarJobsQuestionContext = "";
    
    try {
      // Build search query using service type and description
      const ragSearchQuery = `${context.serviceType} ${context.serviceDescription}`;
      const ragServiceType = context.serviceType;
      console.log(`🔍 RAG Search: serviceType="${ragServiceType}", query="${ragSearchQuery}"`);
      
      const similarJobs = await storage.findSimilarJobs(
        ragServiceType, // Try subcategory first (more specific), fall back to broad category
        ragSearchQuery,
        5, // Get top 5 similar jobs for better matching
        session.propertyType || undefined // Filter by property type (residential vs. commercial)
      );
      
      console.log(`📚 RAG Found: ${similarJobs.length} similar jobs`);

      if (similarJobs.length > 0) {
        // Extract question patterns from verified training examples (is_training_example = 1) or high-rated jobs
        // IMPORTANT: Use isTrainingExample flag, NOT null customerRating (null just means unrated user session)
        const goodJobs = similarJobs.filter(job => 
          job.isTrainingExample === 1 || // Curated training examples (priority)
          (job.customerRating !== null && job.customerRating >= 4) // Highly-rated completed jobs
        );
        
        console.log(`✅ RAG Good Jobs: ${goodJobs.length}/${similarJobs.length} jobs with isTrainingExample=1 or rating >= 4`);
        
        if (goodJobs.length > 0) {
          const questionPatterns = goodJobs
            .map(job => {
              if (job.questionAnswers && Array.isArray(job.questionAnswers)) {
                console.log(`  📝 Job "${job.serviceDescription}": ${job.questionAnswers.length} questions, rating: ${job.customerRating || 'training'}`);
                return {
                  description: job.serviceDescription,
                  questions: job.questionAnswers as Array<{ question: string; answer: string; phase?: number; phaseLabel?: string; type?: string; options?: string[]; guidance?: string }>
                };
              } else {
                console.log(`  ⚠️ Job "${job.serviceDescription}": NO questionAnswers field (rating: ${job.customerRating || 'training'})`);
              }
              return null;
            })
            .filter(Boolean);

          if (questionPatterns.length > 0) {
            // Try to find the next unanswered question from RAG
            const currentQuestionIndex = answeredQuestions.length;
            
            // Look for a question at this position in similar jobs
            for (const pattern of questionPatterns as any[]) {
              if (pattern.questions.length > currentQuestionIndex) {
                const ragQ = pattern.questions[currentQuestionIndex];
                
                // Skip corrupted questions (missing question text)
                if (!ragQ.question || ragQ.question === "Question not stored" || ragQ.question === "Unknown question") {
                  console.log(`⚠️ RAG question #${currentQuestionIndex + 1} has corrupted text "${ragQ.question}", skipping to next pattern`);
                  continue; // Try next pattern
                }
                
                // Validate RAG question quality before using it
                const questionText = ragQ.question.toLowerCase();
                const needsOptions = questionText.includes('select all') || 
                                   questionText.includes('which of') || 
                                   questionText.includes('choose') ||
                                   ragQ.type === 'choice' ||
                                   ragQ.type === 'multiple';
                
                // Skip if it's a choice question without options
                if (needsOptions && (!ragQ.options || ragQ.options.length === 0)) {
                  console.log(`⚠️ RAG question #${currentQuestionIndex + 1} needs options but has none, skipping to next pattern`);
                  continue; // Try next pattern
                }
                
                // Use this RAG question directly!
                // Generate a stable ID for this RAG question based on its position
                const ragQuestionId = `rag_q${currentQuestionIndex + 1}_${sessionId.substring(0, 8)}`;
                
                ragQuestion = {
                  id: ragQuestionId, // Add ID for frontend tracking
                  question: ragQ.question,
                  type: (ragQ.type as any) || "text", // Default to text if no type specified
                  options: ragQ.options,
                  rationale: ragQ.rationale || `Proven effective from ${goodJobs.length} similar ${context.serviceType} jobs`, // Technical justification
                  phase: ragQ.phase,
                  phaseLabel: ragQ.phaseLabel,
                  guidance: ragQ.guidance // Warm customer-facing explanation
                };
                
                console.log(`✅ RAG-FIRST: Using proven question #${currentQuestionIndex + 1} from similar jobs`);
                console.log(`📝 RAG Question: "${ragQuestion.question}"`);
                console.log(`📝 RAG Guidance: "${ragQuestion.guidance}"`);
                console.log(`📝 RAG Rationale: "${ragQuestion.rationale}"`);
                break; // Found a good question, use it!
              }
            }
            
            // Also build context for GPT-4o fallback (if RAG doesn't have enough questions)
            const phaseGrouped: Record<number, any[]> = {};
            let hasPhaseData = false;
            
            questionPatterns.forEach((pattern: any) => {
              pattern.questions.forEach((qa: any) => {
                if (qa.phase) {
                  hasPhaseData = true;
                  if (!phaseGrouped[qa.phase]) phaseGrouped[qa.phase] = [];
                  phaseGrouped[qa.phase].push({ ...qa, description: pattern.description });
                }
              });
            });
            
            if (hasPhaseData) {
              const phaseNames: Record<number, string> = {
                1: "Project Initiation",
                2: "Core Deliverables",
                3: "Constraints & Context",
                4: "Confirmation"
              };
              
              similarJobsQuestionContext = `\n\n🎯 LEARNING FROM ${goodJobs.length} SIMILAR JOBS:\n`;
              Object.keys(phaseGrouped).sort().forEach(phaseNum => {
                const phase = parseInt(phaseNum);
                const phaseQuestions = phaseGrouped[phase];
                const phaseName = phaseNames[phase] || `Phase ${phase}`;
                similarJobsQuestionContext += `${phaseName}: ${phaseQuestions.slice(0, 2).map((q: any) => q.question).join('; ')}\n`;
              });
              
              console.log(`RAG Context: Found ${Object.keys(phaseGrouped).length} phases from similar jobs`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error querying similar jobs for RAG questions:", error);
      // Continue to GPT-4o fallback if RAG fails
    }
    
    // If RAG found a proven question, return it immediately (skip GPT-4o!)
    if (ragQuestion) {
      // Auto-infer phase if not provided
      if (!ragQuestion.phase) {
        ragQuestion.phase = answeredQuestions.length === 0 ? 1 : 
                           answeredQuestions.length <= 2 ? 2 :
                           answeredQuestions.length <= 4 ? 3 : 4;
        
        const phaseLabels: Record<number, string> = {
          1: "Project Initiation",
          2: "Core Deliverables",
          3: "Constraints & Context",
          4: "Confirmation"
        };
        ragQuestion.phaseLabel = phaseLabels[ragQuestion.phase];
      }
      
      console.log(`🚀 RAG SUCCESS: Returning proven question without calling GPT-4o`);
      return ragQuestion;
    }
    
    // If we get here, RAG didn't have enough questions - log it and continue to GPT-4o
    console.log(`⚠️ RAG has no proven question at position ${answeredQuestions.length}, falling back to GPT-4o`);
  

    // 🎯 DYNAMIC ROLE ASSIGNMENT: Build expert role based on service type and RAG
    let expertRolePrompt = "";
    try {
      // Extract domain language from RAG (learned terminology from completed jobs)
      const ragDomainLanguage = await extractRagDomainLanguage(
        storage,
        context.serviceType,
        session.propertyType
      );
      
      // Build role-specific prompt with RAG context
      expertRolePrompt = buildRolePrompt(
        context.serviceType,
        session.propertyType as "residential" | "commercial" | null,
        ragDomainLanguage
      );
      
      console.log(`🎭 Role Assignment: ${context.serviceType} expert for ${session.propertyType || 'general'} property`);
      if (ragDomainLanguage) {
        console.log(`📚 RAG Domain Context: ${ragDomainLanguage.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error("Error building expert role:", error);
      // Fallback to generic role
      expertRolePrompt = "You are a conversational assistant helping gather information for service estimates.";
    }

    // Build the expert system prompt (to be reused in retries)
    const systemPrompt = `${expertRolePrompt}

**YOUR ROLE AS AN EXPERT PROJECT ESTIMATOR:**
You are a seasoned ${context.serviceType} professional who knows exactly what details matter for accurate estimates. Most customers don't know how to build scopes — that's YOUR expertise.

Ask the questions an expert estimator would ask, including:
- Site conditions that affect labor/cost (access, obstacles, utilities, slopes)
- Details customers wouldn't think are important (soil type, drainage, existing structures)
- Code requirements and permits they may not know about
- Quality standards and material specifications that impact pricing
- Timeline constraints and scheduling factors

**CRITICAL - AVOID DUPLICATE QUESTIONS:**
Before generating a question, CHECK the "Previous questions" section below for semantic duplicates.
❌ DON'T ask similar questions using different words:
   - If you already asked "unusual smells, sounds, or visible issues" → DON'T ask "unusual noises, odors, or signs of damage"
   - If you already asked "what type of material" → DON'T ask "what kind of material do you prefer"
   - If you already asked "how often do you need service" → DON'T ask "what is your service frequency"
✅ DO ask NEW, different questions that gather additional information not covered yet.

**CRITICAL - AVOID TECHNICAL CALCULATIONS:**
NEVER ask customers to calculate or provide technical measurements they wouldn't know:
❌ DON'T ask: "How many posts will you need?" "How many linear feet of railing?" "How many cubic yards?"
✅ DO ask: "Which sides of the deck need railings?" "What are the deck dimensions?" "Deck height from ground?"
YOU do the math based on their simple answers. Customers don't know structural requirements - that's YOUR job to calculate!

**AS A TRUSTED CONSULTANT:**
Use warm, reassuring language to build trust. Explain WHY each question matters using the "guidance" field — show you're the expert helping them through a complex process they don't fully understand.

IMPORTANT: Every response MUST include these required fields: question, type, rationale, and (when helpful) guidance.

**QUESTION TYPE GUIDELINES - MUST FOLLOW:**
ALWAYS prefer "choice" or "multiple_choice" over "text" when possible! Give customers helpful options.

- For "which services?" or "what do you need?" → ALWAYS use type "multiple_choice" with 4-6 options
- For "how often?", "what type?", "which material?" → ALWAYS use type "choice" with 3-5 options  
- ONLY use type "text" for: dimensions, square footage, descriptions that can't be multiple choice

❌ BAD: {"question": "What type of deck material?", "type": "text"}
✅ GOOD: {"question": "What type of deck material?", "type": "choice", "options": ["Pressure-treated wood", "Cedar", "Composite", "Not sure"]}

**GUIDANCE FIELD (REQUIRED for choice questions):**
For any "choice" or "multiple_choice" question, you MUST add a "guidance" field explaining why this matters. Build trust!

Return JSON only. Examples with consultant approach:

{"question": "What type of ${context.serviceType.toLowerCase()} services do you need?", "type": "multiple_choice", "options": ["Service A", "Service B", "Service C", "Other"], "rationale": "Understanding specific services needed helps create accurate scope", "guidance": "I'll help you identify exactly what you need so vendors can provide accurate estimates."}

{"question": "What type of decking surface are you thinking about?", "type": "choice", "options": ["Pressure-treated wood (budget-friendly, needs sealing)", "Cedar/Redwood (natural look, moderate maintenance)", "Composite (low maintenance, modern)", "PVC/Vinyl (ultra low maintenance)", "Not sure — show me options"], "rationale": "Material choice affects cost and maintenance", "guidance": "If you'd like low maintenance and long lifespan, composite or PVC are great. If you prefer the natural look of wood and don't mind staining every few years, pressure-treated or cedar works beautifully."}

{"question": "How often do you need service?", "type": "choice", "options": ["Weekly", "Bi-weekly", "Monthly", "One-time"], "rationale": "Service frequency affects pricing structure", "guidance": "Knowing your schedule helps us match you with vendors who can commit to regular service."}

{"question": "What is the square footage?", "type": "text", "rationale": "Size directly determines labor hours and material costs"}

**STOPPING CRITERIA - When to respond {"done": true}:**

You MUST have ALL of these before saying done:
1. Size/quantity information (sq ft, linear ft, number of units, etc.)
2. Material preferences (for installation projects)
3. Access/logistics details (for labor estimation)
4. Service frequency (for recurring services)

**MINIMUM QUESTION REQUIREMENTS:**
- Simple labor-only tasks: At least 3-4 questions answered
- Medium complexity projects: At least 5-7 questions answered  
- Complex installations: At least 8-12 questions answered
- Multiple services: At least 3 questions PER service

**NEVER say done if:**
- You don't know the size/quantity
- Installation project without material preference
- Recurring service without frequency
- Any critical pricing factor is missing

When you have ALL required information, respond:
{"done": true}

Otherwise, ask your next question. Be thorough - missing details cost the customer money.`;

    // Build the user prompt (to be reused in retries)
    const userPrompt = `Service Type: ${context.serviceType}
Customer said: "${context.serviceDescription}"

${answeredQuestions.length > 0 ? 'Previous questions:\n' + answeredQuestions.map((q, i) => `Q${i + 1}: ${q.questionText}\nA: ${q.answer}`).join('\n\n') : 'This is the first question.'}${productionStandardsContext}${similarJobsQuestionContext}${multiServiceContext}

Questions asked so far: ${answeredQuestions.length}

Ask your next question (JSON only), or respond {"done": true} if you have enough information for an accurate estimate.`;

    // RETRY LOGIC: Try up to 2 times if validation fails
    let plan: QuestionPlan | { done: boolean } | null = null;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Calling AI for next question (attempt ${attempt}/${maxRetries})...`);
        
        // Using GPT-4o for question generation (GPT-5 has compatibility issues with Chat Completions API)
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 300,
        });

        const planText = response.choices[0]?.message?.content || "{}";
        console.log(`GPT-5 question plan response: ${planText}`);
        
        try {
          plan = JSON.parse(planText) as QuestionPlan | { done: boolean };
        } catch (e) {
          console.error("Failed to parse GPT-5 response as JSON:", planText);
          if (attempt < maxRetries) {
            console.log(`↻ Retrying due to JSON parse error...`);
            plan = null;
            continue;
          }
          plan = {} as QuestionPlan;
          break;
        }
        
        // Check if AI says it has enough information (valid response)
        if ('done' in plan && plan.done === true) {
          console.log("✅ AI determined it has enough information to generate scope");
          break;
        }
        
        // VALIDATE the question has required fields
        const isValidQuestion = (
          'question' in plan &&
          'type' in plan &&
          plan.question &&
          plan.type
        );

        if (!isValidQuestion) {
          console.error("❌ GPT-5 returned invalid question (missing question/type fields)");
          if (attempt < maxRetries) {
            console.log(`↻ Retrying due to invalid question structure...`);
            plan = null;
            continue;
          }
          // Final attempt failed validation - will use fallback
          console.error("❌ All retry attempts failed validation, will use fallback question");
          plan = null;
          break;
        }

        // AUTO-INFER phase metadata (always, don't retry for missing phases)
        const inferredPhase = answeredQuestions.length === 0 ? 1 : 
                             answeredQuestions.length <= 2 ? 2 :
                             answeredQuestions.length <= 4 ? 3 : 4;
        
        const phaseLabels: Record<number, string> = {
          1: "Project Initiation",
          2: "Core Deliverables",
          3: "Constraints & Context",
          4: "Confirmation"
        };
        
        (plan as any).phase = inferredPhase;
        (plan as any).phaseLabel = phaseLabels[inferredPhase];
        
        console.log(`✅ Question validated - Phase ${inferredPhase} (${phaseLabels[inferredPhase]})`);
        break;
      } catch (error) {
        console.error(`❌ GPT-5 call failed (attempt ${attempt}/${maxRetries}):`, error);
        if (attempt < maxRetries) {
          console.log(`↻ Retrying...`);
          continue;
        }
        // Final attempt failed, plan remains null
      }
    }

    // Check if GPT-4o says it's done
    if (plan && 'done' in plan && plan.done === true) {
      // Check if we have essential information rather than just counting questions
      const answersText = answeredQuestions.map(q => `${q.questionText}: ${q.answer}`).join(' ').toLowerCase();
      
      // Essential information checklist
      const hasSize = answersText.includes('sq ft') || answersText.includes('square') || answersText.includes('size') || answersText.includes('area') || answersText.includes('800');
      const hasServiceType = answeredQuestions.length >= 2; // At least 2 questions to understand what they need
      const hasFrequencyOrMaterials = answersText.includes('weekly') || answersText.includes('monthly') || answersText.includes('one-time') || answersText.includes('material') || answersText.includes('wood') || answersText.includes('composite');
      
      // For multiple services, need minimum per service
      const minForMultiService = selectedServices.length > 1 && answeredQuestions.length < (selectedServices.length * 2);
      
      // Absolute minimum is 3 questions no matter what
      const hasMinimumQuestions = answeredQuestions.length >= 3;
      
      // Allow "done" if we have essential info OR enough questions
      const hasEssentialInfo = hasSize && hasServiceType && hasFrequencyOrMaterials;
      const canFinish = (hasEssentialInfo && hasMinimumQuestions) || answeredQuestions.length >= 8;
      
      if (!canFinish || minForMultiService) {
        console.warn(`⚠️ GPT-4o said "done" but missing essential info (questions: ${answeredQuestions.length}, size: ${hasSize}, frequency/materials: ${hasFrequencyOrMaterials})`);
        // Force ONE more question to get missing info
        plan = {
          question: "Is there anything else about the size, materials, or timeline that would help us give you an accurate estimate?",
          type: "text" as const,
          rationale: "Ensuring we have complete information for accurate pricing",
          phase: 3,
          phaseLabel: "Final Details",
          guidance: "Any additional details help us provide the most accurate scope and pricing."
        };
      } else {
        console.log(`✅ GPT-4o determined scope is complete (${answeredQuestions.length} questions, essential info: ✓)`);
        return null; // Actually done
      }
    }
    
    // If we got here without a valid plan, all retries failed - use fallback
    if (!plan) {
      console.warn("⚠️ GPT-4o failed to generate question, using fallback");
      
      // Fallback questions based on service type and question count
      if (answeredQuestions.length === 0) {
        // First question: Always ask about the specific service needed
        plan = {
          question: `What specific ${context.serviceType.toLowerCase()} work do you need?`,
          type: "text" as const,
          rationale: "Using fallback question to understand customer needs",
          phase: 1,
          phaseLabel: "Project Initiation"
        };
      } else if (answeredQuestions.length < 3) {
        // Ask about size/scope
        plan = {
          question: "What is the approximate size or quantity?",
          type: "text" as const,
          rationale: "Size/quantity needed for accurate pricing",
          phase: 2,
          phaseLabel: "Core Deliverables",
          guidance: "Knowing the size helps us calculate materials and labor accurately."
        };
      } else {
        // We have minimum questions, proceed to scope generation
        console.log(`✅ Minimum questions answered (${answeredQuestions.length}), proceeding to scope`);
        return null;
      }
    }

    // DEDUPLICATION: Check if this question is too similar to already-answered questions
    const FALLBACK_QUESTION = "Is there anything else about the project that would help us provide an accurate estimate?";
    
    if (plan && 'question' in plan && answeredQuestions.length > 0) {
      // Don't dedupe the fallback question itself
      if (plan.question === FALLBACK_QUESTION) {
        console.log(`[Dedupe] Skipping dedupe for fallback question`);
      } else {
        const newQuestionLower = plan.question.toLowerCase();
        const newQuestionWords = new Set(newQuestionLower.split(/\s+/).filter((w: string) => w.length > 3));
        
        // Skip deduplication if new question has too few keywords
        if (newQuestionWords.size >= 3) {
          let fallbackAlreadyAsked = false;
          
          for (const answered of answeredQuestions) {
            // Check if we've already asked the fallback question
            if (answered.questionText === FALLBACK_QUESTION) {
              console.log(`[Dedupe] Fallback question was already asked in this session`);
              fallbackAlreadyAsked = true;
              continue; // Skip this answered question, check others for duplicates
            }
            
            const answeredQuestionLower = answered.questionText.toLowerCase();
            const answeredQuestionWords = new Set(answeredQuestionLower.split(/\s+/).filter((w: string) => w.length > 3));
            
            // Skip if answered question has too few keywords
            if (answeredQuestionWords.size < 3) continue;
            
            // Calculate word overlap using Jaccard similarity (intersection / union)
            const commonWords = Array.from(newQuestionWords).filter(w => answeredQuestionWords.has(w));
            const unionSize = new Set([...Array.from(newQuestionWords), ...Array.from(answeredQuestionWords)]).size;
            const jaccardSimilarity = unionSize > 0 ? commonWords.length / unionSize : 0;
            
            // If >50% Jaccard similarity, it's likely a duplicate
            if (jaccardSimilarity > 0.5) {
              console.warn(`⚠️ Duplicate question detected! New: "${plan.question}" has ${(jaccardSimilarity*100).toFixed(0)}% Jaccard similarity with: "${answered.questionText}"`);
              
              // Check if we have enough questions to proceed
              if (answeredQuestions.length >= 5) {
                console.log(`✅ Have ${answeredQuestions.length} questions already, proceeding to scope generation`);
                return null; // Enough questions, move to scope
              } else if (fallbackAlreadyAsked) {
                console.log(`⚠️ Fallback already asked and duplicate detected, proceeding to scope`);
                return null; // Can't ask fallback again, move to scope
              } else {
                console.log(`⚠️ Only ${answeredQuestions.length} questions so far, using fallback question`);
                // Force a generic fallback question instead of duplicate (only once)
                plan = {
                  question: FALLBACK_QUESTION,
                  type: "text" as const,
                  rationale: "Gathering additional context after duplicate detection",
                  phase: 3,
                  phaseLabel: "Final Details"
                };
                break; // Use this fallback question
              }
            }
          }
        }
      }
    }
    
    // Plan has been validated inside the retry loop or fallback was used
    // Add ID to GPT-generated question if it doesn't have one
    if (plan && 'question' in plan && !plan.id) {
      const gptQuestionId = `gpt_q${answeredQuestions.length + 1}_${sessionId.substring(0, 8)}`;
      plan.id = gptQuestionId;
    }
    return plan as QuestionPlan;
  }

  /**
   * Generate the final detailed scope based on all gathered information
   * Uses RAG (Retrieval-Augmented Generation) to find similar past jobs
   * Outputs structured JSON per TUDAO Scope Generator specification
   */
  async generateFinalScope(sessionId: string): Promise<string> {
    const session = await storage.getScopeSession(sessionId);
    if (!session) throw new Error("Session not found");

    const questions = await storage.getQuestionsBySessionId(sessionId);
    const answeredQuestions = questions.filter(q => q.answer);
    const analysis = session.aiAnalysis as VisionAnalysisResult | null;
    const assets = await storage.getAssetsBySessionId(sessionId);

    console.log(`Generating TUDAO structured scope for session ${sessionId} with ${answeredQuestions.length} answered questions`);

    // Infer service type from description if not already set
    let serviceType = session.detectedServiceType;
    if (!serviceType || serviceType === 'null' || serviceType === 'Unknown') {
      serviceType = this.inferServiceTypeFromDescription(session.serviceDescription);
      console.log(`Inferred service type for scope generation: ${serviceType}`);
      await storage.updateScopeSession(sessionId, { detectedServiceType: serviceType });
    }
    
    const similarJobs = await storage.findSimilarJobs(serviceType, session.serviceDescription, 5, session.propertyType || undefined);
    console.log(`Found ${similarJobs.length} similar jobs for RAG context (property type: ${session.propertyType || 'any'})`);

    // Build customer_text from description + questions/answers
    const customerText = `${session.serviceDescription}\n\nAdditional Details:\n${answeredQuestions.map(q => `Q: ${q.questionText}\nA: ${q.answer}`).join('\n')}`;
    
    // Build vision_json from analysis
    const visionJson = analysis ? {
      service_category: this.mapToServiceCategory(analysis.detectedServiceType),
      detected_objects: analysis.components?.map((c: string, i: number) => ({ label: c, confidence: i === 0 ? analysis.confidence : 0.8 })) || [],
      estimates: {}
    } : null;

    // Build rag_rules from similar jobs (local regulations, safety, standards)
    const ragRules = this.buildRagRules(similarJobs, session.zipCode || undefined);
    
    // Build rag_skus from similar jobs (materials, labor standards)
    const ragSkus = this.buildRagSkus(similarJobs);

    try {
      // Using GPT-4o for scope generation (GPT-5 has compatibility issues with Chat Completions API)
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are the TUDAO Scope Generator, part of the Trade Union DAO platform.
Your purpose is to produce accurate, professional, and legally safe scopes of work for any residential or commercial service category.

Customers may submit photos, text, or both.
When photos are present, you use visual data to improve recognition and quantity estimates.
When only text is provided, proceed entirely from written input.

🎯 OBJECTIVES

Interpret customer input (text ± photos) to identify service type, components or systems involved, and visible issues or conditions.

Use supplied reference data (rag_rules, rag_skus) for local regulations, materials, and labor standards.

Output a structured JSON scope and a plain-language summary ready for DAO review and smart-contract escrow.

Be conservative with estimates; if uncertain, flag items as "vendor_verify": true.

Ask one concise clarification question only when confidence is low or input ambiguous.

🧱 OUTPUT (JSON ONLY)
{
  "summary": "string",
  "line_items": [
    {"item":"string","qty":0,"unit":"string","notes":"string","vendor_verify":false}
  ],
  "materials":[{"name":"string","qty":0,"unit":"string","notes":"string"}],
  "labor":[{"role":"string","hours":0}],
  "permits":[{"required":true,"note":"string"}],
  "disposal":{"required":true,"notes":"string"},
  "acceptance_criteria":["string"],
  "photos_required_after":["string"],
  "clarifications":["string (0 or 1 total)"],
  "diagnostics":{
    "detected_service":"string|null",
    "detected_issues":["string"],
    "confidence_overall":0.0,
    "data_sources_used":["text","photos","rag_rules","rag_skus"]
  }
}

⚙️ RULES & BEHAVIOR

Optional Photos → if none, rely on text.

Confidence Handling → if any confidence < 0.7 or conflicting data, mark related quantities "vendor_verify": true and add one "clarifications" question.

Permit Logic → derive from zip + rag_rules; if unknown, default to conservative: permit not required but verification advised.

Tone → clear, factual, no prices or timeframes; include safety, cleanup, and measurable acceptance criteria.

Universality → avoid trade-specific jargon unless clearly identified in input or RAG context.

🔄 SERVICE PATTERN DETECTION (CRITICAL):

MAINTENANCE SERVICES (labor-only pricing):
Detected by keywords: "mow", "mowing", "trim", "cleanup", "maintain", "weekly", "monthly", "recurring", "service"
Examples: lawn mowing, pool cleaning, HVAC maintenance, gutter cleaning, snow removal
SCOPE STRUCTURE:
- "materials": [] (EMPTY - no material breakdown)
- "labor": [{"role": "Technician/Worker", "hours": X}]
- Summary should quote as: "Labor rate for recurring service: $X per visit"
- DO NOT itemize gas, trimmer line, cleaning supplies - these are absorbed into labor
PRICING APPROACH: All-in labor rate (e.g., "$50 per weekly mow/edge/blow service")

INSTALLATION/REPAIR SERVICES (materials + labor):
Detected by keywords: "install", "replace", "build", "new", "add", "repair", "broken", "damaged"
Examples: fence install, plant installation, appliance install, sod, pavers, door replacement
SCOPE STRUCTURE:
- "materials": [detailed list with quantities]
- "labor": [{"role": "specific trade", "hours": X}]
- Summary should itemize: "Materials: $X, Labor: $Y"
PRICING APPROACH: Separate material costs from labor costs

Return ONLY the JSON object, no markdown formatting.`
          },
          {
            role: "user",
            content: JSON.stringify({
              customer_text: customerText,
              zip: session.zipCode || "00000",
              photo_urls: assets.map(a => a.fileName),
              vision_json: visionJson,
              rag_rules: ragRules,
              rag_skus: ragSkus
            }, null, 2)
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const structuredScopeText = response.choices[0]?.message?.content?.trim();
      
      if (!structuredScopeText) {
        throw new Error("GPT-5 returned empty structured scope");
      }

      const structuredScope = JSON.parse(structuredScopeText);
      console.log(`Generated structured scope:`, structuredScope);

      // Extract recommended provider type from labor roles
      const recommendedProviderType = structuredScope.labor?.[0]?.role || this.inferProviderTypeFromServiceType(serviceType);
      
      // Create human-readable summary for backwards compatibility
      const humanReadableScope = `${structuredScope.summary}\n\nRecommended Provider: ${recommendedProviderType}`;

      // Store both structured and human-readable versions
      await storage.updateScopeSession(sessionId, {
        generatedScope: humanReadableScope,
        structuredScope: structuredScope,
        recommendedProviderType,
        status: "completed"
      });

      return humanReadableScope;
    } catch (error) {
      console.error("Error generating structured scope:", error);
      
      // Fallback to simple scope
      const defaultProviderType = this.inferProviderTypeFromServiceType(serviceType);
      const fallbackScope = `Recommended Provider: ${defaultProviderType} - Complete ${serviceType.toLowerCase()} work as described: ${session.serviceDescription}.`;
      
      await storage.updateScopeSession(sessionId, {
        generatedScope: fallbackScope,
        recommendedProviderType: defaultProviderType,
        status: "completed"
      });
      
      return fallbackScope;
    }
  }

  /**
   * Map detected service type to TUDAO service category
   */
  private mapToServiceCategory(serviceType: string): string {
    const mapping: Record<string, string> = {
      'Roofing': 'roofing',
      'HVAC': 'hvac',
      'Plumbing': 'plumbing',
      'Landscaping': 'landscaping',
      'Cleaning': 'cleaning',
      'Electrical': 'electrical',
      'Fence Repair': 'landscaping',
      'Door Installation': 'other',
      'Window Installation': 'other'
    };
    return mapping[serviceType] || 'other';
  }

  /**
   * Build RAG rules context from similar jobs
   */
  private buildRagRules(similarJobs: any[], zipCode?: string): string {
    if (similarJobs.length === 0) {
      return "No specific local regulations found. Recommend vendor verify permit requirements.";
    }
    
    const rules: string[] = [];
    if (zipCode) {
      rules.push(`ZIP ${zipCode}: Verify local permit requirements.`);
    }
    
    similarJobs.forEach((job, i) => {
      if (job.notes && job.notes.toLowerCase().includes('permit')) {
        rules.push(`Similar job ${i + 1}: ${job.notes.substring(0, 100)}`);
      }
    });
    
    return rules.join(' ') || "Standard safety practices apply. Verify local codes.";
  }

  /**
   * Build RAG SKUs context from similar jobs
   */
  private buildRagSkus(similarJobs: any[]): string {
    if (similarJobs.length === 0) {
      return "No similar job material data available.";
    }
    
    const skus: string[] = [];
    similarJobs.forEach((job, i) => {
      if (job.materialsUsed) {
        skus.push(`Job ${i + 1}: ${job.materialsUsed}`);
      }
      if (job.actualManHours) {
        skus.push(`Job ${i + 1} labor: ${job.actualManHours} hours`);
      }
    });
    
    return skus.join('; ') || "Standard materials and labor norms apply.";
  }

  /**
   * Infer service type from description text when no photos are available
   */
  inferServiceTypeFromDescription(description: string): string {
    const desc = description.toLowerCase();
    
    // REMOTE/DIGITAL SERVICES (check these first since they're fundamentally different)
    if (desc.includes('software') || desc.includes('app development') || desc.includes('coding') || 
        desc.includes('programming') || desc.includes('developer') || desc.includes('backend') ||
        desc.includes('frontend') || desc.includes('full stack') || desc.includes('mobile app') ||
        desc.includes('website development') || desc.includes('api') || desc.includes('database')) {
      return 'Software Development';
    }
    
    if (desc.includes('web design') || desc.includes('website design') || desc.includes('ui design') ||
        desc.includes('ux design') || desc.includes('user interface') || desc.includes('user experience') ||
        desc.includes('wireframe') || desc.includes('mockup') || desc.includes('figma')) {
      return 'Web/UI Design';
    }
    
    if (desc.includes('graphic design') || desc.includes('logo design') || desc.includes('branding') ||
        desc.includes('illustration') || desc.includes('photoshop') || desc.includes('adobe') ||
        desc.includes('visual design') || desc.includes('banner') || desc.includes('poster')) {
      return 'Graphic Design';
    }
    
    if (desc.includes('writing') || desc.includes('content writing') || desc.includes('copywriting') ||
        desc.includes('blog post') || desc.includes('article') || desc.includes('technical writing') ||
        desc.includes('proofreading') || desc.includes('editing')) {
      return 'Writing & Content';
    }
    
    if (desc.includes('video edit') || desc.includes('video production') || desc.includes('animation') ||
        desc.includes('motion graphics') || desc.includes('after effects') || desc.includes('premiere')) {
      return 'Video Production';
    }
    
    if (desc.includes('consulting') || desc.includes('business consulting') || desc.includes('strategy') ||
        desc.includes('marketing consulting') || desc.includes('advisory') || desc.includes('coach')) {
      return 'Consulting';
    }
    
    if (desc.includes('data analysis') || desc.includes('data science') || desc.includes('analytics') ||
        desc.includes('excel') || desc.includes('spreadsheet') || desc.includes('reporting') ||
        desc.includes('dashboard')) {
      return 'Data & Analytics';
    }
    
    if (desc.includes('seo') || desc.includes('digital marketing') || desc.includes('social media') ||
        desc.includes('ads') || desc.includes('ppc') || desc.includes('email marketing') ||
        desc.includes('content marketing')) {
      return 'Digital Marketing';
    }
    
    // PHYSICAL/ON-SITE SERVICES
    if (desc.includes('plumb') || desc.includes('faucet') || desc.includes('leak') || 
        desc.includes('drain') || desc.includes('pipe') || desc.includes('toilet') ||
        desc.includes('sink') || desc.includes('water heater')) {
      return 'Plumbing';
    }
    
    if (desc.includes('electric') || desc.includes('outlet') || desc.includes('switch') || 
        desc.includes('light') || desc.includes('wiring') || desc.includes('breaker') ||
        desc.includes('panel')) {
      return 'Electrical';
    }
    
    if (desc.includes('hvac') || desc.includes('heating') || desc.includes('cooling') || 
        desc.includes('air condition') || desc.includes('a/c') || desc.includes('furnace') ||
        desc.includes('thermostat') || desc.includes('heat pump') || desc.includes('heater') ||
        desc.match(/\bac\b/) || desc.match(/\bac unit\b/)) {
      return 'HVAC';
    }
    
    if (desc.includes('landscap') || desc.includes('lawn') || desc.includes('garden') || 
        desc.includes('yard') || desc.includes('grass') || desc.includes('tree') ||
        desc.includes('plant') || desc.includes('mow') || desc.includes('trim')) {
      return 'Landscaping';
    }
    
    if (desc.includes('paint') || desc.includes('repaint')) {
      return 'Painting';
    }
    
    if (desc.includes('roof') || desc.includes('shingle') || desc.includes('gutter')) {
      return 'Roofing';
    }
    
    if (desc.includes('fence') || desc.includes('deck') || desc.includes('drywall') ||
        desc.includes('door') || desc.includes('window') || desc.includes('cabinet')) {
      return 'Carpentry';
    }
    
    if (desc.includes('floor') || desc.includes('tile') || desc.includes('carpet')) {
      return 'Flooring';
    }
    
    // Default to general service
    return 'General Service';
  }

  /**
   * Get service-type-specific contextual questions
   */
  private getServiceSpecificQuestions(serviceType: string, description: string, isSimple: boolean): QuestionPlan[] {
    // If service type is unknown or general, try to infer from description
    let type = serviceType.toLowerCase();
    if (type === 'unknown' || type === 'general service' || !serviceType || serviceType === 'null') {
      const inferredType = this.inferServiceTypeFromDescription(description);
      console.log(`Inferred service type from description: ${inferredType}`);
      type = inferredType.toLowerCase();
    }
    
    const desc = description.toLowerCase();
    
    // ============ REMOTE/DIGITAL SERVICE QUESTIONS ============
    
    // SOFTWARE DEVELOPMENT QUESTIONS
    if (type.includes('software') || type.includes('app development') || type.includes('developer')) {
      return [
        {
          question: "What type of software project do you need?",
          type: "choice",
          options: ["Website/web app", "Mobile app (iOS/Android)", "Desktop application", "API/backend service", "Database work", "Other custom software"],
          rationale: "Project type determines tech stack and approach"
        },
        {
          question: "What's your timeline for completion?",
          type: "choice",
          options: ["ASAP (under 2 weeks)", "1-2 months", "2-4 months", "Ongoing/flexible"],
          rationale: "Timeline affects planning and pricing"
        },
        {
          question: "Do you have existing designs or technical specifications?",
          type: "choice",
          options: ["Yes, detailed specs ready", "Partial specs/wireframes", "Just ideas, need help planning", "Not sure"],
          rationale: "Spec completeness affects scope definition"
        },
        {
          question: "Please describe the main features or functionality needed",
          type: "text",
          rationale: "Feature details help estimate complexity"
        }
      ];
    }
    
    // WEB/UI DESIGN QUESTIONS
    if (type.includes('design') && (type.includes('web') || type.includes('ui') || type.includes('ux'))) {
      return [
        {
          question: "What type of design work do you need?",
          type: "choice",
          options: ["Complete website design", "UI/UX for app", "Landing page", "Redesign existing site", "Wireframes/prototypes", "Other design work"],
          rationale: "Design scope determines deliverables"
        },
        {
          question: "How many pages or screens?",
          type: "choice",
          options: ["1-3 pages/screens", "4-10 pages/screens", "11-20 pages/screens", "20+ pages/screens"],
          rationale: "Page count affects time and pricing"
        },
        {
          question: "What's your timeline?",
          type: "choice",
          options: ["ASAP (under 1 week)", "1-2 weeks", "2-4 weeks", "Flexible"],
          rationale: "Timeline affects scheduling"
        },
        {
          question: "Any specific design preferences or examples?",
          type: "text",
          rationale: "Style preferences guide design direction"
        }
      ];
    }
    
    // GRAPHIC DESIGN QUESTIONS
    if (type.includes('graphic') && type.includes('design')) {
      return [
        {
          question: "What type of graphic design do you need?",
          type: "choice",
          options: ["Logo design", "Marketing materials (flyers, brochures)", "Social media graphics", "Branding package", "Illustrations", "Other graphics"],
          rationale: "Design type determines approach"
        },
        {
          question: "How many design pieces/variations?",
          type: "choice",
          options: ["1-3 pieces", "4-10 pieces", "11-20 pieces", "20+ pieces"],
          rationale: "Quantity affects scope"
        },
        {
          question: "Timeline?",
          type: "choice",
          options: ["ASAP (under 3 days)", "Within a week", "1-2 weeks", "Flexible"],
          rationale: "Timeline affects scheduling"
        },
        {
          question: "Describe the style or provide examples",
          type: "text",
          rationale: "Style guidance helps designers"
        }
      ];
    }
    
    // WRITING & CONTENT QUESTIONS
    if (type.includes('writing') || type.includes('content')) {
      return [
        {
          question: "What type of writing do you need?",
          type: "choice",
          options: ["Blog posts/articles", "Website copy", "Technical documentation", "Marketing copy", "Product descriptions", "Other writing"],
          rationale: "Writing type determines expertise needed"
        },
        {
          question: "Approximately how many words?",
          type: "choice",
          options: ["Under 500 words", "500-1500 words", "1500-3000 words", "3000+ words"],
          rationale: "Word count affects pricing"
        },
        {
          question: "Timeline?",
          type: "choice",
          options: ["ASAP (1-2 days)", "Within a week", "1-2 weeks", "Flexible"],
          rationale: "Timeline affects scheduling"
        },
        {
          question: "Please describe the topic and tone needed",
          type: "text",
          rationale: "Topic and tone guide the writing"
        }
      ];
    }
    
    // DIGITAL MARKETING QUESTIONS
    if (type.includes('marketing') || type.includes('seo')) {
      return [
        {
          question: "What type of marketing help do you need?",
          type: "choice",
          options: ["SEO optimization", "Social media management", "Paid ads (Google/Facebook)", "Email marketing", "Content marketing", "Overall strategy"],
          rationale: "Marketing type determines approach"
        },
        {
          question: "What's your monthly budget range?",
          type: "choice",
          options: ["Under $500", "$500-$1500", "$1500-$5000", "$5000+"],
          rationale: "Budget determines scope"
        },
        {
          question: "Are you looking for ongoing or one-time service?",
          type: "choice",
          options: ["One-time project", "Ongoing monthly service", "3-6 month campaign", "Not sure yet"],
          rationale: "Duration affects planning"
        },
        {
          question: "Describe your business and marketing goals",
          type: "text",
          rationale: "Goals guide strategy"
        }
      ];
    }
    
    // CONSULTING QUESTIONS
    if (type.includes('consulting') || type.includes('advisory')) {
      return [
        {
          question: "What area do you need consulting in?",
          type: "choice",
          options: ["Business strategy", "Marketing/growth", "Technology/IT", "Operations", "Finance", "Other consulting"],
          rationale: "Consulting area determines expertise"
        },
        {
          question: "What's the scope of engagement?",
          type: "choice",
          options: ["Single consultation (1-2 hours)", "Short project (few sessions)", "Ongoing advisory", "Not sure yet"],
          rationale: "Engagement scope affects structure"
        },
        {
          question: "Timeline?",
          type: "choice",
          options: ["ASAP", "Within 2 weeks", "Within a month", "Flexible"],
          rationale: "Timeline affects scheduling"
        },
        {
          question: "Describe the challenge or goal",
          type: "text",
          rationale: "Challenge description helps consultants prepare"
        }
      ];
    }
    
    // DATA & ANALYTICS QUESTIONS
    if (type.includes('data') || type.includes('analytics')) {
      return [
        {
          question: "What type of data work do you need?",
          type: "choice",
          options: ["Data analysis/reporting", "Dashboard creation", "Excel/spreadsheet work", "Database setup", "Data visualization", "Other data work"],
          rationale: "Data type determines tools and approach"
        },
        {
          question: "How complex is the data?",
          type: "choice",
          options: ["Simple (basic spreadsheets)", "Moderate (multiple data sources)", "Complex (large datasets, advanced analysis)", "Not sure"],
          rationale: "Complexity affects scope"
        },
        {
          question: "Timeline?",
          type: "choice",
          options: ["ASAP (1-3 days)", "Within a week", "1-2 weeks", "Flexible"],
          rationale: "Timeline affects scheduling"
        },
        {
          question: "Describe the data and what insights you need",
          type: "text",
          rationale: "Data description helps analysts scope work"
        }
      ];
    }
    
    // VIDEO PRODUCTION QUESTIONS
    if (type.includes('video')) {
      return [
        {
          question: "What type of video do you need?",
          type: "choice",
          options: ["Video editing (existing footage)", "Promotional/marketing video", "Tutorial/explainer video", "Animation/motion graphics", "Social media content", "Other video work"],
          rationale: "Video type determines approach"
        },
        {
          question: "What's the desired video length?",
          type: "choice",
          options: ["Under 1 minute", "1-3 minutes", "3-10 minutes", "10+ minutes"],
          rationale: "Length affects scope and pricing"
        },
        {
          question: "Timeline?",
          type: "choice",
          options: ["ASAP (under 1 week)", "1-2 weeks", "2-4 weeks", "Flexible"],
          rationale: "Timeline affects scheduling"
        },
        {
          question: "Describe the video concept or provide reference examples",
          type: "text",
          rationale: "Concept helps video creators plan"
        }
      ];
    }
    
    // ============ PHYSICAL/ON-SITE SERVICE QUESTIONS ============
    
    // PLUMBING-SPECIFIC QUESTIONS
    if (type.includes('plumb') || desc.includes('faucet') || desc.includes('leak') || 
        desc.includes('drain') || desc.includes('pipe') || desc.includes('toilet')) {
      return [
        {
          question: "Where exactly is the leak or issue located?",
          type: "choice",
          options: ["Kitchen sink/faucet", "Bathroom sink/faucet", "Toilet", "Shower/tub", "Under sink pipes", "Other location"],
          rationale: "Location determines access and parts needed"
        },
        {
          question: "How severe is the leak or issue?",
          type: "choice",
          options: ["Slow drip (annoying but not urgent)", "Steady leak (needs repair soon)", "Active leak (needs immediate attention)", "No water flow/completely broken"],
          rationale: "Severity affects urgency and repair approach"
        },
        {
          question: "When do you need this fixed?",
          type: "choice",
          options: ["Emergency (today if possible)", "Within a few days", "Within 1-2 weeks", "Flexible timing"],
          rationale: "Timeline affects scheduling and pricing"
        },
        {
          question: "Any additional details about the problem?",
          type: "text",
          rationale: "Additional context helps diagnosis"
        }
      ];
    }
    
    // ELECTRICAL-SPECIFIC QUESTIONS
    if (type.includes('electric') || desc.includes('outlet') || desc.includes('switch') || 
        desc.includes('light') || desc.includes('wiring')) {
      return [
        {
          question: "What type of electrical issue are you experiencing?",
          type: "choice",
          options: ["Outlet not working", "Light fixture issue", "Switch not working", "Circuit breaker tripping", "Need new installation", "Other electrical issue"],
          rationale: "Type determines approach and safety considerations"
        },
        {
          question: "Is this a safety concern?",
          type: "choice",
          options: ["No, just not working", "Sparking or burning smell (urgent)", "Frequent breaker trips", "Not sure"],
          rationale: "Safety issues require immediate attention"
        },
        {
          question: "Which room or area?",
          type: "text",
          rationale: "Location helps planning and access"
        },
        {
          question: "When do you need this completed?",
          type: "choice",
          options: ["Emergency (safety issue)", "Within a few days", "Within 1-2 weeks", "Flexible timing"],
          rationale: "Timeline affects scheduling"
        }
      ];
    }
    
    // HVAC-SPECIFIC QUESTIONS
    if (type.includes('hvac') || type.includes('heating') || type.includes('cooling') || 
        type.includes('air condition') || desc.includes('air condition') || desc.includes('a/c') || 
        desc.includes('furnace') || desc.includes('thermostat') || desc.includes('heater') ||
        desc.match(/\bac\b/) || desc.match(/\bac unit\b/)) {
      return [
        {
          question: "What type of HVAC system do you have?",
          type: "choice",
          options: ["Central air conditioning", "Furnace/heating system", "Heat pump", "Window AC unit", "Not sure"],
          rationale: "System type determines service approach"
        },
        {
          question: "What's the main issue?",
          type: "choice",
          options: ["Not cooling/heating at all", "Poor performance", "Strange noises", "High energy bills", "Routine maintenance needed"],
          rationale: "Issue type determines diagnosis"
        },
        {
          question: "How old is the system?",
          type: "choice",
          options: ["Less than 5 years", "5-10 years", "10-15 years", "15+ years", "Not sure"],
          rationale: "Age affects repair vs replace decision"
        },
        {
          question: "When do you need service?",
          type: "choice",
          options: ["Emergency (no heat/AC)", "Within a few days", "Within 1-2 weeks", "Flexible timing"],
          rationale: "Timeline affects scheduling"
        }
      ];
    }
    
    // LANDSCAPING/LAWN-SPECIFIC QUESTIONS
    if (type.includes('landscap') || type.includes('lawn') || type.includes('garden') || 
        type.includes('yard') || desc.includes('grass') || desc.includes('tree') || desc.includes('plant')) {
      return [
        {
          question: "What type of landscaping work do you need? (Select all that apply)",
          type: "multiple_choice",
          options: [
            "Lawn mowing/maintenance (regular upkeep)",
            "Mulch installation or refreshing",
            "Planting (flowers, shrubs, trees)",
            "Tree/shrub trimming or removal",
            "Hardscaping (pavers, walkways, retaining walls)",
            "Complete landscape design/installation",
            "Irrigation system work",
            "Other/not sure"
          ],
          rationale: "Work type determines approach, materials, and pricing"
        },
        {
          question: "What's the approximate size of the area?",
          type: "choice",
          options: ["Small (under 1000 sq ft)", "Medium (1000-3000 sq ft)", "Large (3000-7000 sq ft)", "Very large (over 7000 sq ft or 0.25+ acres)"],
          rationale: "Size determines labor and materials"
        },
        {
          question: "Current condition of the area?",
          type: "choice",
          options: ["Well-maintained, just needs upkeep", "Needs some work", "Overgrown/neglected", "Starting from scratch"],
          rationale: "Condition affects scope of work"
        },
        {
          question: "Timeline for completion?",
          type: "choice",
          options: ["ASAP", "Within 2 weeks", "Within a month", "Flexible timing"],
          rationale: "Timeline affects scheduling"
        }
      ];
    }
    
    // PAINTING-SPECIFIC QUESTIONS
    if (type.includes('paint') || desc.includes('paint')) {
      return [
        {
          question: "What needs to be painted?",
          type: "choice",
          options: ["Single room interior", "Multiple rooms interior", "Exterior of house", "Fence/deck", "Cabinets/trim", "Other"],
          rationale: "Scope determines materials and labor"
        },
        {
          question: "Approximate size?",
          type: "choice",
          options: ["Small (1 room)", "Medium (2-3 rooms)", "Large (whole house interior)", "Exterior"],
          rationale: "Size determines materials and time"
        },
        {
          question: "Paint quality preference?",
          type: "choice",
          options: ["Budget-friendly", "Standard quality", "Premium/designer", "No preference"],
          rationale: "Paint quality affects cost and durability"
        },
        {
          question: "Timeline?",
          type: "choice",
          options: ["ASAP", "Within 2 weeks", "Within a month", "Flexible"],
          rationale: "Timeline affects scheduling"
        }
      ];
    }
    
    // ROOFING-SPECIFIC QUESTIONS
    if (type.includes('roof') || desc.includes('roof') || desc.includes('shingle')) {
      return [
        {
          question: "What type of roof work is needed?",
          type: "choice",
          options: ["Leak repair", "Missing/damaged shingles", "Complete replacement", "Inspection", "Other"],
          rationale: "Work type determines approach"
        },
        {
          question: "Is there active leaking?",
          type: "choice",
          options: ["Yes, actively leaking now (urgent)", "Evidence of past leaks", "No leaks, preventative", "Not sure"],
          rationale: "Active leaks require immediate attention"
        },
        {
          question: "Approximate roof size?",
          type: "choice",
          options: ["Small (under 1500 sq ft)", "Medium (1500-2500 sq ft)", "Large (2500-4000 sq ft)", "Very large (over 4000 sq ft)"],
          rationale: "Size affects materials and labor"
        },
        {
          question: "Timeline?",
          type: "choice",
          options: ["Emergency (active leak)", "Within a week", "Within a month", "Flexible"],
          rationale: "Timeline affects scheduling"
        }
      ];
    }
    
    // GENERAL/DEFAULT QUESTIONS (for service types not specifically covered)
    // Keep these conversational and natural
    return [
      {
        question: "When do you need this done by?",
        type: "choice",
        options: ["ASAP", "Within 2 weeks", "Within a month", "I'm flexible"],
        rationale: "Timeline affects scheduling and pricing"
      },
      {
        question: "Can you tell me more about what you need?",
        type: "text",
        rationale: "Additional context improves estimate accuracy"
      },
      {
        question: "How big of a project is this?",
        type: "choice",
        options: ["Small job", "Medium project", "Large project", "Not sure"],
        rationale: "Scope determines resources needed"
      },
      {
        question: "What's your budget in mind?",
        type: "choice",
        options: ["Keep it affordable", "Standard quality", "Premium/best", "Not sure yet"],
        rationale: "Quality affects cost and approach"
      }
    ];
  }

  /**
   * Extract question patterns from RAG (similar completed jobs)
   * Returns array of intelligent questions learned from past projects
   */
  private async extractRagQuestions(serviceType: string, description: string, propertyType?: string): Promise<Array<{ question: string }>> {
    try {
      const similarJobs = await storage.findSimilarJobs(serviceType, description, 3, propertyType);
      
      if (similarJobs.length === 0) return [];
      
      // Filter for high-quality jobs (highly rated or reference guides)
      const goodJobs = similarJobs.filter(job => 
        job.customerRating === null || // Reference guides
        job.customerRating >= 4 // Highly-rated jobs
      );
      
      if (goodJobs.length === 0) return [];
      
      // Extract questions from the best matching job
      const bestJob = goodJobs[0];
      if (!bestJob.questionAnswers || !Array.isArray(bestJob.questionAnswers)) {
        return [];
      }
      
      const ragQuestions = (bestJob.questionAnswers as Array<{ question: string; answer: string }>)
        .map(qa => ({ question: qa.question }));
      
      console.log(`Extracted ${ragQuestions.length} RAG questions from similar jobs`);
      return ragQuestions;
    } catch (error) {
      console.error("Error extracting RAG questions:", error);
      return [];
    }
  }

  /**
   * Assess whether a task is simple or complex based on description and service type
   * Simple tasks: single repairs, minor fixes, straightforward work
   * Complex tasks: multi-step projects, major work, unclear scope
   */
  private assessTaskComplexity(description: string, serviceType: string): boolean {
    // Handle undefined/null inputs
    if (!description || !serviceType) return false; // Default to complex if unclear
    const desc = description.toLowerCase();
    const type = serviceType.toLowerCase();
    
    // Service types that are ALWAYS complex and need detailed questioning
    // These are multi-faceted services where vague requests need clarification
    const alwaysComplexServiceTypes = [
      'landscaping', 'landscape', 'lawn', 'yard work', 'garden',
      'painting', 'remodel', 'renovation', 'construction',
      'roofing', 'flooring', 'electrical', 'plumbing system',
      'hvac', 'deck', 'patio', 'fence'
    ];
    
    // Check if this is an inherently complex service type
    const isComplexServiceType = alwaysComplexServiceTypes.some(complexType => 
      type.includes(complexType)
    );
    
    if (isComplexServiceType) {
      return false; // Complex task - needs detailed questions
    }
    
    // Keywords indicating simple tasks
    const simpleKeywords = [
      'fix', 'repair', 'replace', 'patch', 'clean', 'install a', 'change',
      'leaky', 'dripping', 'broken', 'stuck', 'loose', 'small',
      'single', 'one', 'just', 'simple', 'minor', 'quick'
    ];
    
    // Keywords indicating complex tasks
    const complexKeywords = [
      'remodel', 'renovation', 'installation', 'system', 'complete',
      'entire', 'whole', 'multiple', 'upgrade', 'addition',
      'construction', 'build', 'new', 'custom', 'design', 'combination'
    ];
    
    // Check for complex indicators
    const hasComplexKeyword = complexKeywords.some(keyword => 
      desc.includes(keyword) || type.includes(keyword)
    );
    
    if (hasComplexKeyword) {
      return false; // Complex task
    }
    
    // Check for simple indicators
    const hasSimpleKeyword = simpleKeywords.some(keyword => 
      desc.includes(keyword)
    );
    
    // For simple keywords with very specific descriptions, it's likely simple
    // But only if the description is actually specific (not just short)
    if (hasSimpleKeyword && description.length > 20) {
      return true; // Simple task with specific description
    }
    
    // Default to complex for vague/ambiguous cases
    // Better to ask more questions than too few
    return false;
  }

  /**
   * Infer the most appropriate provider type based on service type
   */
  private inferProviderTypeFromServiceType(serviceType: string): string {
    const type = serviceType.toLowerCase();
    
    // REMOTE/DIGITAL SERVICE PROVIDERS
    if (type.includes('software') || type.includes('developer') || type.includes('app development')) {
      return 'Software Developer';
    }
    
    if (type.includes('web') && type.includes('design')) {
      return 'Web Designer';
    }
    
    if (type.includes('ui') || type.includes('ux')) {
      return 'UI/UX Designer';
    }
    
    if (type.includes('graphic') && type.includes('design')) {
      return 'Graphic Designer';
    }
    
    if (type.includes('writing') || type.includes('content')) {
      return 'Writer/Content Creator';
    }
    
    if (type.includes('video')) {
      return 'Video Editor/Producer';
    }
    
    if (type.includes('marketing') || type.includes('seo')) {
      return 'Digital Marketer';
    }
    
    if (type.includes('consulting') || type.includes('advisory')) {
      return 'Business Consultant';
    }
    
    if (type.includes('data') || type.includes('analytics')) {
      return 'Data Analyst';
    }
    
    // PHYSICAL/ON-SITE SERVICE PROVIDERS
    if (type.includes('plumb')) {
      return type.includes('minor') || type.includes('repair') || type.includes('faucet') || type.includes('fixture')
        ? 'Handyman'
        : 'Licensed Plumber';
    }
    
    if (type.includes('electric')) {
      return type.includes('minor') || type.includes('outlet') || type.includes('switch') || type.includes('fixture')
        ? 'Handyman'
        : 'Licensed Electrician';
    }
    
    if (type.includes('hvac') || type.includes('heating') || type.includes('cooling') || type.includes('air condition')) {
      return 'Licensed HVAC Technician';
    }
    
    if (type.includes('roof')) {
      return 'Roofer';
    }
    
    if (type.includes('landscap') || type.includes('lawn') || type.includes('garden')) {
      return 'Landscaper';
    }
    
    if (type.includes('paint')) {
      return 'Painter';
    }
    
    if (type.includes('fence') || type.includes('deck') || type.includes('carpentry')) {
      return 'Handyman';
    }
    
    if (type.includes('drywall') || type.includes('tile') || type.includes('flooring')) {
      return 'Handyman';
    }
    
    // Default to handyman for general service work
    return 'Handyman';
  }

  /**
   * Parse invoice document using GPT-4o Vision (for images/PDFs) or GPT-4 (for text-based documents)
   */
  async parseInvoice(fileBuffer: Buffer, mimeType: string, filename?: string): Promise<any> {
    try {
      // Check if this is an image or PDF (use Vision API)
      const isImageOrPdf = mimeType.startsWith('image/') || mimeType === 'application/pdf';
      
      if (isImageOrPdf) {
        // Use existing Vision API approach for images and PDFs
        const imageDataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        return await this.parseInvoiceWithVision(imageDataUri);
      } else {
        // Extract text from document and use regular GPT-4
        const textContent = await this.extractTextFromDocument(fileBuffer, mimeType, filename);
        return await this.parseInvoiceFromText(textContent, filename);
      }
    } catch (error) {
      console.error("Error parsing invoice with AI:", error);
      throw new Error("Failed to parse document. Please check the file and try again.");
    }
  }

  /**
   * Parse invoice image/PDF using GPT-4o Vision
   */
  private async parseInvoiceWithVision(imageDataUri: string): Promise<any> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert invoice data extraction AI. Analyze the provided invoice image and extract structured data.

Extract the following information:
- serviceType: The type of service performed (e.g., "Door Installation", "Plumbing Repair", "Window Replacement")
- serviceDescription: Brief description of what work was done
- originalScope: Detailed scope of work if visible on invoice
- providerType: Type of provider (e.g., "Licensed Plumber", "Handyman", "Contractor")
- actualManHours: Number of labor hours (look for hours, time, or labor line items)
- actualCost: Total cost in dollars (look for total, grand total, amount due)
- materialsUsed: List of materials or parts used with costs if available (e.g., "Moen Arbor faucet ($125), braided supply lines ($18), plumber's putty ($8)")
- customerRating: If there's a rating or review visible (1-5 stars), otherwise null
- notes: Additional cost breakdown information. IMPORTANT: If you can identify separate labor cost and material cost, include them here as "Labor: $X, Materials: $Y". Also include any other relevant details about pricing, line items, or job specifics.

Return your response as a JSON object with these exact fields. Use null for missing fields.
If you cannot determine a value with confidence, use null.

Example response:
{
  "serviceType": "Plumbing Repair",
  "serviceDescription": "Kitchen faucet replacement",
  "originalScope": "Replace old single-handle faucet with new Moen model, install new supply lines",
  "providerType": "Licensed Plumber",
  "actualManHours": 2.5,
  "actualCost": 285.00,
  "materialsUsed": "Moen Arbor faucet ($125), braided supply lines ($18), plumber's putty ($8)",
  "customerRating": null,
  "notes": "Labor: $134, Materials: $151. Customer requested specific faucet model."
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this invoice and extract the data as JSON:"
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUri
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    return this.parseAIResponse(response);
  }

  /**
   * Parse invoice from extracted text using GPT-4
   */
  private async parseInvoiceFromText(textContent: string, filename?: string): Promise<any> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert invoice data extraction AI. Analyze the provided document text and extract structured data.

Extract the following information:
- serviceType: The type of service performed (e.g., "Door Installation", "Plumbing Repair", "Window Replacement")
- serviceDescription: Brief description of what work was done
- originalScope: Detailed scope of work if visible
- providerType: Type of provider (e.g., "Licensed Plumber", "Handyman", "Contractor")
- actualManHours: Number of labor hours (look for hours, time, or labor line items)
- actualCost: Total cost in dollars (look for total, grand total, amount due)
- materialsUsed: List of materials or parts used with costs if available (e.g., "Moen Arbor faucet ($125), braided supply lines ($18), plumber's putty ($8)")
- customerRating: If there's a rating or review visible (1-5 stars), otherwise null
- notes: Additional cost breakdown information. IMPORTANT: If you can identify separate labor cost and material cost, include them here as "Labor: $X, Materials: $Y". Also include any other relevant details about pricing, line items, or job specifics.

Return your response as a JSON object with these exact fields. Use null for missing fields.
If you cannot determine a value with confidence, use null.

Example response:
{
  "serviceType": "Plumbing Repair",
  "serviceDescription": "Kitchen faucet replacement",
  "originalScope": "Replace old single-handle faucet with new Moen model, install new supply lines",
  "providerType": "Licensed Plumber",
  "actualManHours": 2.5,
  "actualCost": 285.00,
  "materialsUsed": "Moen Arbor faucet ($125), braided supply lines ($18), plumber's putty ($8)",
  "customerRating": null,
  "notes": "Labor: $134, Materials: $151. Customer requested specific faucet model."
}`
        },
        {
          role: "user",
          content: `Please analyze this ${filename ? `document (${filename})` : 'document'} and extract the data as JSON:\n\n${textContent}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    return this.parseAIResponse(response);
  }

  /**
   * Parse AI response and extract JSON data
   */
  /**
   * Get the options for the first question based on service type
   * This is used to properly detect multi-service selections
   */
  private getFirstQuestionOptions(questionText: string, serviceType: string): string[] {
    // Landscaping first question options
    if (questionText.toLowerCase().includes('landscaping work') || 
        questionText.toLowerCase().includes('select all that apply')) {
      return [
        "Lawn mowing/maintenance (regular upkeep)",
        "Mulch installation or refreshing",
        "Planting (flowers, shrubs, trees)",
        "Tree/shrub trimming or removal",
        "Hardscaping (pavers, walkways, retaining walls)",
        "Complete landscape design/installation",
        "Irrigation system work",
        "Other/not sure"
      ];
    }
    
    // Add other service types as needed
    // TODO: Extend this for other service types with multiple-choice first questions
    
    return [];
  }

  /**
   * Parse multiple services from answer by matching against actual checkbox options
   * This prevents false positives from commas within option labels like "Planting (flowers, shrubs, trees)"
   * 
   * Examples with options ["Lawn mowing", "Planting (flowers, shrubs, trees)", "Tree trimming"]:
   *  - Answer: "Lawn mowing, Planting (flowers, shrubs, trees), Tree trimming" → 3 services
   *  - Answer: "Planting (flowers, shrubs, trees)" → 1 service (not split on internal commas!)
   *  - Answer: "Lawn mowing" → 1 service
   */
  private parseMultipleServices(answer: string, knownOptions: string[]): string[] {
    if (!answer || typeof answer !== 'string') {
      return [];
    }

    // If we have known options, match against them (most reliable)
    if (knownOptions && knownOptions.length > 0) {
      const matchedServices = knownOptions.filter(option => 
        answer.includes(option)
      );
      
      if (matchedServices.length > 0) {
        return matchedServices;
      }
    }

    // Fallback: If no known options, try comma-separated parsing
    // but return as single service to avoid false positives
    console.warn("No known options for multi-service detection, treating as single service");
    return [answer];
  }

  private parseAIResponse(response: any): any {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response (handle markdown code blocks if present)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const extractedData = JSON.parse(jsonStr);
    console.log("Extracted invoice data:", extractedData);
    return extractedData;
  }

  /**
   * Extract text content from various document formats
   */
  private async extractTextFromDocument(fileBuffer: Buffer, mimeType: string, filename?: string): Promise<string> {
    // Handle PDF files
    if (mimeType === 'application/pdf') {
      // For PDFs, ask user to convert to image format instead
      // PDF text extraction is unreliable for troubleshooting guides with diagrams
      throw new Error('PDF files are not supported. Please convert your PDF to an image (PNG/JPG) or upload a Word/text document instead.');
    }

    // Handle Excel files (.xlsx, .xls, .ods)
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/vnd.oasis.opendocument.spreadsheet'
    ) {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      let text = '';
      
      workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        text += `Sheet: ${sheetName}\n`;
        text += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
      });
      
      return text;
    }

    // Handle Word documents (.docx)
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    }

    // Handle plain text and CSV
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      return fileBuffer.toString('utf-8');
    }

    throw new Error(`Unsupported document type: ${mimeType}`);
  }

  /**
   * Parse a troubleshooting guide or service manual to generate question flows
   * Extracts diagnostic decision trees and converts them into database-ready questions
   */
  async parseGuideToQuestions(fileBuffer: Buffer, mimeType: string, filename?: string): Promise<any> {
    try {
      // Only use Vision API for actual images (not PDFs)
      const isImage = mimeType.startsWith('image/');
      
      if (isImage) {
        const imageDataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        return await this.parseGuideWithVision(imageDataUri);
      } else {
        // Extract text from document (PDF, Word, Excel, text) and use regular GPT-4o
        const textContent = await this.extractTextFromDocument(fileBuffer, mimeType, filename);
        return await this.parseGuideFromText(textContent);
      }
    } catch (error) {
      console.error("Error parsing guide with AI:", error);
      throw new Error("Failed to parse troubleshooting guide. Please check the file and try again.");
    }
  }

  /**
   * Parse guide using GPT-4o Vision (for images and PDFs)
   */
  private async parseGuideWithVision(imageDataUri: string): Promise<any> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting diagnostic question flows from troubleshooting guides and service manuals.

Analyze the provided document and extract a diagnostic decision tree as structured questions.

EXTRACTION GUIDELINES:
1. Identify the service type (e.g., "HVAC", "Plumbing", "Electrical", "Appliance Repair")
2. Extract questions in the order they should be asked
3. For each question, determine:
   - The question text (clear, customer-friendly)
   - Response type: "choice" (multiple choice) or "text" (open-ended)
   - Options (for choice questions)
   - Whether it's required for scope generation (1 = yes, 0 = no)
   - Conditional logic (when this question should be asked)
   - Sequence/order

4. Look for diagnostic flows like:
   - "First, check if..."
   - "If yes, then..."
   - "Depending on the issue..."
   - Troubleshooting decision trees
   - Step-by-step diagnostic procedures

5. Convert technical jargon into customer-friendly language

RESPONSE FORMAT:
Return a JSON object with:
{
  "serviceType": "Service category (e.g., HVAC, Plumbing)",
  "subcategory": "Specific subcategory if mentioned (e.g., Air conditioner repair)",
  "questions": [
    {
      "questionText": "Clear question text",
      "responseType": "choice" or "text",
      "options": ["Option 1", "Option 2", ...] or null for text,
      "requiredForScope": 1 or 0,
      "conditionalTag": "if answer_contains('keyword')" or null,
      "sequence": 1
    }
  ]
}

CONDITIONAL LOGIC EXAMPLES:
- "if answer_contains('Not cooling')" - Ask this if previous answer contains "Not cooling"
- "if answer_contains('Exterior')" - Ask this if user selected "Exterior"
- null - Always ask this question

IMPORTANT:
- Extract 5-15 questions minimum
- Prioritize diagnostic questions over general ones
- Maintain logical flow from the guide
- Keep questions clear and actionable`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this troubleshooting guide and extract the diagnostic question flow as JSON:"
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUri
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    return this.parseAIResponse(response);
  }

  /**
   * Parse guide from text (for Word, Excel, text files)
   */
  private async parseGuideFromText(textContent: string): Promise<any> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting diagnostic question flows from troubleshooting guides and service manuals.

Analyze the provided text and extract a diagnostic decision tree as structured questions.

EXTRACTION GUIDELINES:
1. Identify the service type (e.g., "HVAC", "Plumbing", "Electrical", "Appliance Repair")
2. Extract questions in the order they should be asked
3. For each question, determine:
   - The question text (clear, customer-friendly)
   - Response type: "choice" (multiple choice) or "text" (open-ended)
   - Options (for choice questions)
   - Whether it's required for scope generation (1 = yes, 0 = no)
   - Conditional logic (when this question should be asked)
   - Sequence/order

4. Look for diagnostic flows like:
   - "First, check if..."
   - "If yes, then..."
   - "Depending on the issue..."
   - Troubleshooting decision trees
   - Step-by-step diagnostic procedures

5. Convert technical jargon into customer-friendly language

RESPONSE FORMAT:
Return a JSON object with:
{
  "serviceType": "Service category (e.g., HVAC, Plumbing)",
  "subcategory": "Specific subcategory if mentioned (e.g., Air conditioner repair)",
  "questions": [
    {
      "questionText": "Clear question text",
      "responseType": "choice" or "text",
      "options": ["Option 1", "Option 2", ...] or null for text,
      "requiredForScope": 1 or 0,
      "conditionalTag": "if answer_contains('keyword')" or null,
      "sequence": 1
    }
  ]
}

CONDITIONAL LOGIC EXAMPLES:
- "if answer_contains('Not cooling')" - Ask this if previous answer contains "Not cooling"
- "if answer_contains('Exterior')" - Ask this if user selected "Exterior"
- null - Always ask this question

IMPORTANT:
- Extract 5-15 questions minimum
- Prioritize diagnostic questions over general ones
- Maintain logical flow from the guide
- Keep questions clear and actionable`
        },
        {
          role: "user",
          content: `Please analyze this troubleshooting guide and extract the diagnostic question flow as JSON:\n\n${textContent}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    return this.parseAIResponse(response);
  }
}

export const scopeOrchestrator = new ScopeOrchestrator();
