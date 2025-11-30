/**
 * Question Selection Service
 * Selects the next appropriate question based on service type, answers, and conditional logic
 */

import { db } from "../db";
import { serviceQuestions } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

export interface NextQuestionResult {
  id: string;
  text: string;
  responseType: string;
  options?: string[];
  resolvedSubcategory?: string; // Track the actual subcategory used after fallback
}

interface QuestionSelectionParams {
  serviceType: string;
  subcategory: string;
  serviceIntent?: string; // NEW: "service" or "installation" for generic fallback
  answers: Record<string, any>;
}

/**
 * Get the next question that should be asked
 * Returns null if all required questions are answered
 * Embeds resolvedSubcategory in result when question exists
 */
export async function nextQuestion(params: QuestionSelectionParams): Promise<NextQuestionResult | null> {
  const { serviceType, subcategory, serviceIntent, answers } = params;
  
  console.log(`[QuestionSelector] Querying for: serviceType="${serviceType}", subcategory="${subcategory}"`);
  
  // Try to fetch specific questions for this service type (EXACT match first)
  let questions = await db
    .select()
    .from(serviceQuestions)
    .where(
      and(
        eq(serviceQuestions.serviceType, serviceType),
        subcategory ? eq(serviceQuestions.subcategory, subcategory) : undefined
      )
    )
    .orderBy(serviceQuestions.sequence);
  
  console.log(`[QuestionSelector] Exact match found ${questions.length} questions`);
  
  // FALLBACK 1: Try flexible matching on subcategory (handle AI variability)
  let resolvedSubcategory = subcategory; // Track what subcategory we actually use
  if (questions.length === 0 && subcategory) {
    // Get all questions for this service type
    const allServiceQuestions = await db
      .select()
      .from(serviceQuestions)
      .where(eq(serviceQuestions.serviceType, serviceType))
      .orderBy(serviceQuestions.sequence);
    
    // Very generic words to exclude from matching
    const stopWords = ['work', 'new', 'system', 'general', 'repair', 'service', 'maintenance', 'installation'];
    
    // Normalize common HVAC abbreviations before matching
    const normalizedSubcategory = subcategory.toLowerCase()
      .replace(/\bac\b/g, 'air conditioner')
      .replace(/\ba\/c\b/g, 'air conditioner')
      .replace(/\bhvac\b/g, 'heating ventilation air conditioning');
    
    // Conflicting keywords that should prevent matches (heating vs cooling)
    const aiWordsSet = new Set(normalizedSubcategory.split(/\s+/));
    const heatingKeywords = ['furnace', 'heat', 'heating', 'warm', 'hot', 'boiler'];
    const coolingKeywords = ['air', 'conditioner', 'cool', 'cooling', 'cold', 'freeze'];
    
    // Find questions where subcategory keywords overlap
    const matches = allServiceQuestions.map((q: any) => {
      if (!q.subcategory) return { question: q, score: 0, subcategory: '' };
      
      // Use relaxed filter (> 2 chars) to include words like "AC" after normalization
      const aiWords = normalizedSubcategory.split(/\s+/).filter((w: string) => w.length > 2);
      const seedWords = q.subcategory.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      const seedWordsSet = new Set(seedWords);
      
      // Check for conflicting intent (heating vs cooling)
      const aiHasHeating = heatingKeywords.some(kw => aiWordsSet.has(kw));
      const aiHasCooling = coolingKeywords.some(kw => aiWordsSet.has(kw));
      const seedHasHeating = heatingKeywords.some(kw => seedWordsSet.has(kw));
      const seedHasCooling = coolingKeywords.some(kw => seedWordsSet.has(kw));
      
      // Prevent mismatches: don't match heating request to cooling subcategory or vice versa
      if ((aiHasHeating && seedHasCooling) || (aiHasCooling && seedHasHeating)) {
        return { question: q, score: -100, subcategory: q.subcategory }; // Severely penalize conflicting matches
      }
      
      // Count overlapping words, excluding stop words
      const specificOverlap = aiWords.filter(w => seedWords.includes(w) && !stopWords.includes(w));
      const genericOverlap = aiWords.filter(w => seedWords.includes(w) && stopWords.includes(w));
      
      // Score: specific words are worth 5 points, generic words are worth 1 point
      const score = (specificOverlap.length * 5) + genericOverlap.length;
      
      return { question: q, score, subcategory: q.subcategory };
    });
    
    // Accept matches with score >= 3 (need meaningful overlap, not just generic words)
    const bestMatch = matches
      .filter(m => m.score >= 3)
      .sort((a, b) => b.score - a.score)[0];
    
    if (bestMatch) {
      console.log(`Flexible match: "${subcategory}" → "${bestMatch.subcategory}" (score: ${bestMatch.score})`);
      questions = allServiceQuestions.filter((q: any) => q.subcategory === bestMatch.subcategory);
      resolvedSubcategory = bestMatch.subcategory; // Update to matched subcategory
    }
  }
  
  // FALLBACK 2: If still no match, prefer "General" subcategory for this service type
  if (questions.length === 0) {
    console.log(`No subcategory match for ${serviceType}/${subcategory}, trying "General" subcategory`);
    const generalQuestions = await db
      .select()
      .from(serviceQuestions)
      .where(
        and(
          eq(serviceQuestions.serviceType, serviceType),
          eq(serviceQuestions.subcategory, `General ${serviceType} troubleshooting`)
        )
      )
      .orderBy(serviceQuestions.sequence);
    
    if (generalQuestions.length > 0) {
      questions = generalQuestions;
      resolvedSubcategory = `General ${serviceType} troubleshooting`; // Update to General subcategory
      console.log(`Using General ${serviceType} troubleshooting questions (${questions.length} found)`);
    }
  }
  
  // FALLBACK 3: If STILL no match (no questions for service type at all), use generic baseline
  if (questions.length === 0 && serviceIntent) {
    console.log(`No specific questions for ${serviceType}, using generic ${serviceIntent} questions`);
    questions = await db
      .select()
      .from(serviceQuestions)
      .where(
        and(
          eq(serviceQuestions.serviceType, 'Generic'),
          eq(serviceQuestions.subcategory, serviceIntent)
        )
      )
      .orderBy(serviceQuestions.sequence);
    
    if (questions.length > 0) {
      resolvedSubcategory = serviceIntent; // Update to generic subcategory
    }
  }
  
  if (questions.length === 0) {
    return null; // No questions available at all
  }
  
  // Filter out already answered questions using database UUIDs
  // PROPER FIX: Use question IDs as the source of truth, not fragile text comparison
  // answers format: { [questionId]: { questionText: "What...", answer: "..." } }
  const answeredIds = new Set<string>(Object.keys(answers));
  
  console.log(`[Question Selector] Already answered ${answeredIds.size} question IDs:`, Array.from(answeredIds));
  
  // Filter out questions whose database ID is in the answered set
  const unansweredQuestions = questions.filter((q: any) => !answeredIds.has(q.id));
  
  // Filter by conditional logic
  const eligibleQuestions = unansweredQuestions.filter((q: any) => {
    // If no conditional tag, question is always eligible
    if (!q.conditionalTag) return true;
    
    // Evaluate conditional tag
    return evaluateConditional(q.conditionalTag, answers);
  });
  
  // Prioritize required questions first
  const requiredUnanswered = eligibleQuestions.filter((q: any) => q.requiredForScope === 1);
  
  if (requiredUnanswered.length > 0) {
    const next = requiredUnanswered[0];
    return {
      ...formatQuestion(next),
      resolvedSubcategory // Include resolved subcategory for completion tracking
    };
  }
  
  // If all required are answered but there are optional questions
  if (eligibleQuestions.length > 0) {
    const next = eligibleQuestions[0];
    return {
      ...formatQuestion(next),
      resolvedSubcategory // Include resolved subcategory for completion tracking
    };
  }
  
  // All questions answered
  return null;
}

/**
 * Check if enough questions are answered to complete the scope
 */
export async function isCompletionConditionMet(params: QuestionSelectionParams): Promise<boolean> {
  const { serviceType, subcategory, answers } = params;
  
  // Fetch required questions
  const requiredQuestions = await db
    .select()
    .from(serviceQuestions)
    .where(
      and(
        eq(serviceQuestions.serviceType, serviceType),
        subcategory ? eq(serviceQuestions.subcategory, subcategory) : undefined,
        eq(serviceQuestions.requiredForScope, 1)
      )
    );
  
  // Filter by conditional logic
  const applicableRequired = requiredQuestions.filter((q: any) => {
    if (!q.conditionalTag) return true;
    return evaluateConditional(q.conditionalTag, answers);
  });
  
  // Check how many required questions are answered
  const answeredRequired = applicableRequired.filter((q: any) => answers[q.id] !== undefined);
  
  // Completion condition: all applicable required questions answered
  return answeredRequired.length >= applicableRequired.length && applicableRequired.length >= 2;
}

/**
 * Get progress statistics
 */
export async function getProgress(params: QuestionSelectionParams) {
  const { serviceType, subcategory, answers } = params;
  
  const requiredQuestions = await db
    .select()
    .from(serviceQuestions)
    .where(
      and(
        eq(serviceQuestions.serviceType, serviceType),
        subcategory ? eq(serviceQuestions.subcategory, subcategory) : undefined,
        eq(serviceQuestions.requiredForScope, 1)
      )
    );
  
  const applicableRequired = requiredQuestions.filter((q: any) => {
    if (!q.conditionalTag) return true;
    return evaluateConditional(q.conditionalTag, answers);
  });
  
  const answeredRequired = applicableRequired.filter((q: any) => answers[q.id] !== undefined);
  
  return {
    requiredAnswered: answeredRequired.length,
    requiredTotal: applicableRequired.length
  };
}

/**
 * Evaluate a conditional tag against current answers
 * 
 * Examples:
 * - "if leak_point = 'Faucet head'"
 * - "if answer_contains('head')"
 * - "if answer_contains('cool') OR answer_contains('AC')"
 */
function evaluateConditional(conditionalTag: string, answers: Record<string, any>): boolean {
  try {
    // Handle OR logic: split by OR and evaluate each condition
    if (conditionalTag.includes(' OR ')) {
      const conditions = conditionalTag.split(' OR ').map(c => c.trim());
      return conditions.some(condition => {
        // Re-add "if" prefix if it was stripped during split
        const normalized = condition.startsWith('if ') ? condition : `if ${condition}`;
        return evaluateConditional(normalized, answers);
      });
    }
    
    // Handle AND logic: split by AND and evaluate each condition
    if (conditionalTag.includes(' AND ')) {
      const conditions = conditionalTag.split(' AND ').map(c => c.trim());
      return conditions.every(condition => {
        // Re-add "if" prefix if it was stripped during split
        const normalized = condition.startsWith('if ') ? condition : `if ${condition}`;
        return evaluateConditional(normalized, answers);
      });
    }
    
    // Handle new format: "if answer_contains('text')"
    const answerContainsMatch = conditionalTag.match(/if\s+answer_contains\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
    if (answerContainsMatch) {
      const searchText = answerContainsMatch[1].toLowerCase();
      // Check if any previous answer contains this text (case-insensitive)
      return Object.values(answers).some(answer => {
        // Handle both string answers and object answers { answer: "text", phase: 2 }
        const answerText = typeof answer === 'string' ? answer : (answer?.answer || '');
        return answerText && answerText.toLowerCase().includes(searchText);
      });
    }
    
    // Handle old format: "if field = 'value'"
    const oldMatch = conditionalTag.match(/if\s+(\w+)\s*=\s*['"]([^'"]+)['"]/i);
    if (oldMatch) {
      const [, key, value] = oldMatch;
      
      // Check if any answer contains this value
      for (const [answerKey, answerValue] of Object.entries(answers)) {
        // Handle both string answers and object answers { answer: "text", phase: 2 }
        const answerText = typeof answerValue === 'string' ? answerValue : (answerValue?.answer || '');
        if (answerText && answerText.toLowerCase().includes(value.toLowerCase())) {
          return true;
        }
      }
      return false;
    }
    
    // If we can't parse the conditional, FAIL CLOSED for security
    console.warn(`Could not parse conditional tag: ${conditionalTag} - failing closed`);
    return false;
  } catch (error) {
    console.error(`Error evaluating conditional: ${conditionalTag}`, error);
    return false; // FAIL CLOSED for security
  }
}

/**
 * Format question for API response
 */
function formatQuestion(question: any): NextQuestionResult {
  return {
    id: question.id,
    text: question.questionText,
    responseType: question.responseType,
    options: question.options ? (question.options as string[]) : undefined
  };
}
