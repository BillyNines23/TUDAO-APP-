/**
 * Intent Classification Service - AI Master Router
 * Uses GPT-4o to classify user's description into service vs installation
 * This is service-agnostic and works across ANY trade/service type
 */

import OpenAI from "openai";

// OpenAI client - supports both Replit AI Integrations and direct OpenAI API
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
});

export interface IntentClassification {
  serviceType: string;
  subcategory: string;
  serviceIntent: "service" | "installation"; // NEW: Master Router classification
  confidence: number; // 0.0 - 1.0
  clarifier?: string; // question to ask if confidence is low
  reasoning?: string; // AI's explanation
}

interface ServicePattern {
  keywords: string[];
  serviceType: string;
  subcategory: string;
  confidence: number;
}

const servicePatterns: ServicePattern[] = [
  // PLUMBING
  {
    keywords: ['faucet', 'tap', 'dripping', 'drip'],
    serviceType: 'Plumbing',
    subcategory: 'Faucet Repair',
    confidence: 0.9
  },
  {
    keywords: ['leak', 'leaking', 'pipe', 'water damage'],
    serviceType: 'Plumbing',
    subcategory: 'Leak Detection',
    confidence: 0.85
  },
  {
    keywords: ['drain', 'clog', 'blocked', 'slow drain'],
    serviceType: 'Plumbing',
    subcategory: 'Drain Cleaning',
    confidence: 0.9
  },
  {
    keywords: ['toilet', 'running', 'flush'],
    serviceType: 'Plumbing',
    subcategory: 'Toilet Repair',
    confidence: 0.9
  },
  
  // HVAC
  {
    keywords: ['ac', 'air conditioning', 'cooling', 'cold'],
    serviceType: 'HVAC',
    subcategory: 'AC Repair',
    confidence: 0.9
  },
  {
    keywords: ['heat', 'heating', 'furnace', 'warm'],
    serviceType: 'HVAC',
    subcategory: 'Heating Repair',
    confidence: 0.9
  },
  {
    keywords: ['thermostat', 'temperature control'],
    serviceType: 'HVAC',
    subcategory: 'Thermostat Installation',
    confidence: 0.85
  },
  
  // ELECTRICAL
  {
    keywords: ['outlet', 'socket', 'plug', 'power'],
    serviceType: 'Electrical',
    subcategory: 'Outlet Repair',
    confidence: 0.9
  },
  {
    keywords: ['light', 'lighting', 'fixture', 'bulb'],
    serviceType: 'Electrical',
    subcategory: 'Light Fixture',
    confidence: 0.85
  },
  {
    keywords: ['switch', 'light switch'],
    serviceType: 'Electrical',
    subcategory: 'Switch Replacement',
    confidence: 0.9
  },
  {
    keywords: ['panel', 'breaker', 'circuit'],
    serviceType: 'Electrical',
    subcategory: 'Panel Upgrade',
    confidence: 0.9
  },
  
  // LANDSCAPING
  {
    keywords: ['lawn', 'grass', 'mow', 'mowing', 'yard', 'cut grass', 'cutting grass', 'lawn care', 'yard work', 'grass cutting', 'trim lawn', 'lawn service'],
    serviceType: 'Landscaping',
    subcategory: 'Lawn Maintenance',
    confidence: 0.9
  },
  {
    keywords: ['tree', 'trim', 'pruning', 'branch'],
    serviceType: 'Landscaping',
    subcategory: 'Tree Trimming',
    confidence: 0.9
  },
  {
    keywords: ['fence', 'fencing'],
    serviceType: 'Landscaping',
    subcategory: 'Fence Installation',
    confidence: 0.9
  },
  {
    keywords: ['garden', 'plant', 'mulch', 'bed'],
    serviceType: 'Landscaping',
    subcategory: 'Garden Maintenance',
    confidence: 0.85
  },
  
  // DECK BUILDING (distinct from general carpentry due to material calculation system)
  {
    keywords: ['deck', 'deck building', 'build deck', 'new deck', 'wood deck', 'composite deck', 'patio deck'],
    serviceType: 'Deck Building',
    subcategory: 'Deck Construction',
    confidence: 0.95
  },
  {
    keywords: ['deck repair', 'deck refinish', 'deck stain', 'deck seal'],
    serviceType: 'Deck Building',
    subcategory: 'Deck Maintenance',
    confidence: 0.9
  },
  
  // CARPENTRY
  {
    keywords: ['door', 'door frame', 'hinge'],
    serviceType: 'Carpentry',
    subcategory: 'Door Repair',
    confidence: 0.85
  },
  {
    keywords: ['cabinet', 'drawer'],
    serviceType: 'Carpentry',
    subcategory: 'Cabinet Repair',
    confidence: 0.85
  },
  
  // PAINTING
  {
    keywords: ['paint', 'painting', 'wall color', 'interior paint'],
    serviceType: 'Painting',
    subcategory: 'Interior Painting',
    confidence: 0.9
  },
  {
    keywords: ['exterior paint', 'house paint', 'outside paint'],
    serviceType: 'Painting',
    subcategory: 'Exterior Painting',
    confidence: 0.9
  },
  
  // DIGITAL SERVICES
  {
    keywords: ['website', 'web app', 'web development', 'software'],
    serviceType: 'Digital Services',
    subcategory: 'Software Development',
    confidence: 0.9
  },
  {
    keywords: ['logo', 'design', 'graphic', 'branding'],
    serviceType: 'Digital Services',
    subcategory: 'Graphic Design',
    confidence: 0.9
  },
  {
    keywords: ['ui', 'ux', 'interface', 'user experience'],
    serviceType: 'Digital Services',
    subcategory: 'UI/UX Design',
    confidence: 0.9
  },
];

/**
 * AI Master Router - Classify intent from user's initial message
 * Returns service vs installation for ANY trade/service type
 */
export async function classifyIntent(text: string): Promise<IntentClassification> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI Master Router for a service marketplace used by everyday homeowners. Understand casual, everyday language and classify requests into TWO categories:

1. SERVICE INTENT (critical for pricing):
   - "service" = Fix/maintain/repair what already exists (labor-focused, minimal materials)
     Examples: "mow my lawn", "cut the grass", "clean my gutters", "fix my faucet", "tune-up HVAC"
   - "installation" = Build/install/replace something new (materials + labor)
     Examples: "build me a deck", "put in a new door", "landscape my backyard", "replace HVAC"

2. SERVICE TYPE (what trade/category):
   Examples: Deck Building, Landscaping, Carpentry, Plumbing, HVAC, Electrical, etc.

IMPORTANT: Understand variations in everyday language:
- "cut my grass" = "mow lawn" = "lawn service" = "yard work" → Landscaping/Lawn Maintenance
- "fix my sink" = "leaky faucet" = "dripping tap" → Plumbing/Faucet Repair
- "build a deck" = "add a deck" = "deck construction" → Carpentry/Deck Building

Return JSON with:
{
  "serviceIntent": "service" | "installation",
  "serviceType": "Category name",
  "subcategory": "Specific task",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}`
        },
        {
          role: "user",
          content: `Customer request: "${text}"`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 300,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    console.log(`AI Master Router: "${text}" → ${result.serviceIntent} (${result.serviceType}/${result.subcategory})`);
    console.log(`Confidence: ${result.confidence}, Reasoning: ${result.reasoning}`);

    return {
      serviceIntent: result.serviceIntent || "service",
      serviceType: result.serviceType || "General",
      subcategory: result.subcategory || "General Service",
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning,
      clarifier: result.confidence < 0.7 ? "Can you provide more details about what you need?" : undefined
    };
  } catch (error) {
    console.error("AI classification failed, falling back to default:", error);
    return {
      serviceIntent: "service",
      serviceType: "General",
      subcategory: "General Service",
      confidence: 0.5,
      clarifier: "Could you describe in more detail what kind of work you need done?"
    };
  }
}

/**
 * Calculate confidence score based on keyword matches
 */
export function calculateConfidence(text: string, serviceType: string): number {
  const pattern = servicePatterns.find(p => p.serviceType === serviceType);
  if (!pattern) return 0.5;
  
  const lowerText = text.toLowerCase();
  const matchCount = pattern.keywords.filter(kw => lowerText.includes(kw)).length;
  const matchScore = matchCount / pattern.keywords.length;
  
  return pattern.confidence * matchScore;
}
