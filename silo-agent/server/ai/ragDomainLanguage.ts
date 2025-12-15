/**
 * RAG Domain Language Extractor
 * 
 * This module extracts common terminology and patterns from completed jobs
 * to enhance role-based prompting with learned domain language.
 */

import { IStorage } from "../storage";

interface DomainLanguageResult {
  commonTerms: string[];
  questionPatterns: string[];
  contextSummary: string;
}

/**
 * Extract domain language from similar completed jobs
 * 
 * This analyzes similar jobs to find:
 * - Commonly used terminology
 * - Question patterns that worked well
 * - Material/specification terms
 * 
 * Example output for landscaping:
 * "Similar jobs used terms: 'bed prep', '3-inch mulch depth', 'brown hardwood vs red cedar', 
 *  'landscape fabric', 'edging installation'. Customers typically asked about square footage, 
 *  mulch color options, and weed barrier."
 */
export async function extractRagDomainLanguage(
  storage: IStorage,
  serviceType: string,
  propertyType?: string | null
): Promise<string> {
  try {
    // Query similar completed jobs (RAG retrieval)
    const similarJobs = await storage.findSimilarJobs(
      serviceType,
      "", // Empty description to get broad sample
      10, // Get more jobs for better language patterns
      propertyType || undefined
    );

    if (similarJobs.length === 0) {
      return ""; // No historical data yet
    }

    // Extract terminology from job descriptions and answers
    const allText: string[] = [];
    const materialTerms: Set<string> = new Set();
    const questionInsights: string[] = [];

    for (const job of similarJobs) {
      // Add service description
      if (job.serviceDescription) {
        allText.push(job.serviceDescription.toLowerCase());
      }

      // Add materials used
      if (job.materialsUsed) {
        allText.push(job.materialsUsed.toLowerCase());
        // Extract specific material terms (look for common patterns)
        extractMaterialTerms(job.materialsUsed, materialTerms);
      }

      // Extract question/answer patterns
      if (job.questionAnswers && Array.isArray(job.questionAnswers)) {
        const qaList = job.questionAnswers as Array<{question: string; answer: string}>;
        qaList.forEach(qa => {
          if (qa.answer) {
            allText.push(qa.answer.toLowerCase());
            // Look for specific quantity patterns (e.g., "3000 sq ft", "5 yards", "6 feet")
            extractQuantityPatterns(qa.answer, questionInsights);
          }
        });
      }
    }

    // Find frequently used terms (word frequency analysis)
    const frequentTerms = findFrequentTerms(allText.join(' '), serviceType);

    // Build contextual summary
    let summary = "";
    
    if (frequentTerms.length > 0 || materialTerms.size > 0) {
      const propertyContext = propertyType === "commercial" ? "commercial" : "residential";
      summary = `Similar ${propertyContext} ${serviceType.toLowerCase()} jobs used terms: `;
      
      const allTerms = Array.from(new Set([...frequentTerms, ...Array.from(materialTerms)]));
      summary += allTerms.slice(0, 8).map(term => `'${term}'`).join(', ');
      
      if (questionInsights.length > 0) {
        summary += `. Common specifications: ${questionInsights.slice(0, 3).join(', ')}`;
      }
      
      summary += ".";
    }

    return summary;
    
  } catch (error) {
    console.error("Error extracting RAG domain language:", error);
    return ""; // Fail gracefully - role prompt still works without this
  }
}

/**
 * Extract material-specific terms from materials_used field
 */
function extractMaterialTerms(materialsText: string, termSet: Set<string>): void {
  const materialPatterns = [
    // Landscaping materials
    /\b(brown hardwood|red cedar|black dyed|pine)\s+mulch\b/gi,
    /\b(\d+["\-]?inch|3"|2")\s+(depth|mulch)\b/gi,
    /\b(landscape fabric|weed barrier|edging)\b/gi,
    
    // Roofing materials
    /\b(architectural|3-tab|designer)\s+shingles?\b/gi,
    /\b(ice and water shield|drip edge|ridge vent)\b/gi,
    
    // Fence materials
    /\b(cedar|pressure-treated|vinyl|chain link)\s+(fence|posts?)\b/gi,
    /\b(\d+['\-]?ft|6ft|4ft)\s+(height|tall)\b/gi,
    
    // Paint materials
    /\b(flat|eggshell|satin|semi-gloss|high-gloss)\s+(finish|paint)\b/gi,
    /\b(interior|exterior)\s+paint\b/gi,
  ];

  materialPatterns.forEach(pattern => {
    const matches = Array.from(materialsText.matchAll(pattern));
    for (const match of matches) {
      if (match[0]) {
        termSet.add(match[0].toLowerCase().trim());
      }
    }
  });
}

/**
 * Extract quantity patterns from answers (e.g., "3000 sq ft", "5 cubic yards")
 */
function extractQuantityPatterns(answerText: string, insights: string[]): void {
  const quantityPatterns = [
    /\b(\d+,?\d*)\s+(sq\.?\s?ft|square feet|acres?)\b/gi,
    /\b(\d+\.?\d*)\s+(cubic yards?|yards?|cu\.?\s?yd)\b/gi,
    /\b(\d+)\s+(linear feet|lin\.?\s?ft|ft)\b/gi,
    /\b(\d+["\-]?inch)\s+(depth|thick)\b/gi,
  ];

  quantityPatterns.forEach(pattern => {
    const matches = Array.from(answerText.matchAll(pattern));
    for (const match of matches) {
      if (match[0] && insights.length < 5) {
        insights.push(match[0].toLowerCase().trim());
      }
    }
  });
}

/**
 * Find frequently used domain-specific terms
 */
function findFrequentTerms(text: string, serviceType: string): string[] {
  // Service-specific important terms to look for
  const serviceTerms: Record<string, string[]> = {
    "Landscaping": [
      "bed prep", "mulch", "edging", "weed barrier", "landscape fabric",
      "trimming", "pruning", "mowing", "blowing", "cleanup",
      "sod", "seeding", "aeration", "irrigation"
    ],
    "Roofing": [
      "tear-off", "overlay", "flashing", "ice and water shield",
      "drip edge", "ridge vent", "valley", "hip", "pitch", "slope"
    ],
    "Plumbing": [
      "shut-off valve", "supply line", "drain", "p-trap", "fixture",
      "tankless", "water heater", "copper", "pex", "pvc"
    ],
    "Painting": [
      "prep work", "primer", "finish coat", "trim", "ceiling",
      "caulking", "sanding", "drop cloths", "painter's tape"
    ],
    "Fencing": [
      "post", "panel", "concrete footer", "gate", "latch",
      "privacy fence", "picket", "chain link", "vinyl"
    ]
  };

  const relevantTerms = serviceTerms[serviceType] || [];
  const foundTerms: string[] = [];

  relevantTerms.forEach(term => {
    if (text.includes(term)) {
      foundTerms.push(term);
    }
  });

  return foundTerms.slice(0, 8); // Return top 8 found terms
}
